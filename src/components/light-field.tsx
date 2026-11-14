"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useMood } from "@/components/mood-provider";
import { useMediaQuery } from "@/lib/use-client";
import { FIELD_STYLES, NIGHT_STYLES, type FieldStyle, type RGB } from "@/lib/mood";

/**
 * The light field: a slow lava-lamp background (DESIGN.md → Motion).
 * WebGL metaballs over domain-warped noise. Palette/speed cross-fade on mood change.
 * Falls back to blurred CSS blobs without WebGL.
 *
 * `levelRef` (0..1) lets the voice check-in make the field swell with the voice.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_level;
uniform float u_bright;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

vec2 path(float i, float t, float aspect) {
  vec2 c = vec2(
    0.5 + 0.36 * sin(t * (0.11 + i * 0.023) + i * 1.7),
    0.5 + 0.40 * cos(t * (0.09 + i * 0.019) + i * 2.3)
  );
  c.x *= aspect;
  return c;
}

void blob(vec2 q, vec2 c, float r, vec3 col, inout vec3 acc, inout float w) {
  float d = length(q - c);
  float f = exp(-(d * d) / (r * r));
  acc += col * f;
  w += f;
}

void main() {
  float aspect = u_res.x / u_res.y;
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time;

  // organic, wobbly edges
  vec2 q = p + 0.18 * vec2(fbm(p * 1.4 + t * 0.04), fbm(p * 1.4 - t * 0.035 + 3.1)) - 0.09;

  float r = 0.24 + 0.06 * u_level;
  vec3 acc = vec3(0.0);
  float w = 0.0;
  blob(q, path(0.0, t, aspect), r * 1.10, u_c1, acc, w);
  blob(q, path(1.0, t, aspect), r * 0.95, u_c2, acc, w);
  blob(q, path(2.0, t, aspect), r * 1.20, u_c3, acc, w);
  blob(q, path(3.0, t, aspect), r * 0.85, u_c1, acc, w);
  blob(q, path(4.0, t, aspect), r * 1.00, u_c2, acc, w);
  blob(q, path(5.0, t, aspect), r * 0.90, u_c3, acc, w);

  vec3 blobCol = acc / max(w, 1e-4);
  // metaball threshold → blobs merge and split; wide band keeps it soft
  float m = smoothstep(0.22, 1.15, w);
  vec3 col = mix(u_c0, blobCol, m * 0.85);
  col *= u_bright;

  // fine grain to avoid banding
  col += (hash(gl_FragCoord.xy + fract(t * 7.0)) - 0.5) * 0.022;
  gl_FragColor = vec4(col, 1.0);
}
`;

const RESOLUTION_SCALE = 0.5; // blur hides it; saves battery
const FRAME_MS = 1000 / 30;
const FADE_SECONDS = 3.5;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) ?? "shader compile failed");
  }
  return s;
}

let webglSupport: boolean | null = null;
function supportsWebGL() {
  if (webglSupport !== null) return webglSupport;
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return (webglSupport = false);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    webglSupport = !!gl.getProgramParameter(prog, gl.LINK_STATUS);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch (e) {
    console.warn("LightField: WebGL unavailable, using CSS fallback", e);
    webglSupport = false;
  }
  return webglSupport;
}

const toCss = ([r, g, b]: RGB) =>
  `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`;

export function LightField({
  levelRef,
}: {
  levelRef?: React.RefObject<number>;
}) {
  const { mood } = useMood();
  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  const target: FieldStyle = (dark ? NIGHT_STYLES : FIELD_STYLES)[mood];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(target);
  const webgl = useSyncExternalStore(
    () => () => {},
    supportsWebGL,
    () => true,
  );

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("u_res"), uTime = u("u_time"), uLevel = u("u_level"), uBright = u("u_bright");
    const uC = [u("u_c0"), u("u_c1"), u("u_c2"), u("u_c3")];

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    // current (animated) style starts at target
    const cur = {
      palette: targetRef.current.palette.map((c) => [...c]) as RGB[],
      speed: targetRef.current.speed,
      bright: targetRef.current.brightness,
      level: 0,
    };

    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * RESOLUTION_SCALE));
      const h = Math.max(1, Math.round(canvas.clientHeight * RESOLUTION_SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    let time = Math.random() * 100; // different start each load

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) {
        last = now;
        return;
      }
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;

      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      // ease toward target (exponential, ~FADE_SECONDS to settle)
      const k = 1 - Math.exp((-dt * 4) / FADE_SECONDS);
      const tgt = targetRef.current;
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 3; j++) cur.palette[i][j] += (tgt.palette[i][j] - cur.palette[i][j]) * k;
      cur.speed += (tgt.speed - cur.speed) * k;
      cur.bright += (tgt.brightness - cur.bright) * k;
      const lvl = levelRef?.current ?? 0;
      cur.level += (lvl - cur.level) * Math.min(1, dt * 6);

      const motionScale = reduced.matches ? 0 : 1;
      time += dt * cur.speed * motionScale;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uLevel, cur.level * motionScale);
      gl.uniform1f(uBright, cur.bright);
      for (let i = 0; i < 4; i++) gl.uniform3fv(uC[i], cur.palette[i]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [levelRef, webgl]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: toCss(target.palette[0]) }}>
      {webgl ? (
        <canvas ref={canvasRef} className="h-full w-full" />
      ) : (
        <CssField style={target} />
      )}
    </div>
  );
}

function CssField({ style }: { style: FieldStyle }) {
  const [, a, b, c] = style.palette;
  const dur = (s: number) => `${s / Math.max(style.speed, 0.2)}s`;
  return (
    <>
      <div className="field-blob" style={{ width: "70vmax", height: "70vmax", left: "-15vmax", top: "-10vmax", backgroundColor: toCss(a), animation: `drift-a ${dur(38)} var(--ease-breathe) infinite` }} />
      <div className="field-blob" style={{ width: "60vmax", height: "60vmax", right: "-20vmax", top: "20vh", backgroundColor: toCss(b), animation: `drift-b ${dur(46)} var(--ease-breathe) infinite` }} />
      <div className="field-blob" style={{ width: "65vmax", height: "65vmax", left: "5vmax", bottom: "-25vmax", backgroundColor: toCss(c), animation: `drift-c ${dur(52)} var(--ease-breathe) infinite` }} />
    </>
  );
}
