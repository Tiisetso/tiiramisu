"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceFeatures } from "@/lib/demo/persona";
import { computeFeatures, detectPitch, rmsDb, type Frame } from "@/lib/voice/features";

export const MAX_SECONDS = 30;
export const MIN_SECONDS = 3;

export interface Recording {
  blob: Blob;
  filename: string;
  duration: number;
  features: VoiceFeatures | null;
}

type Status = "idle" | "starting" | "recording" | "denied" | "unsupported";

function pickMime() {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  return options.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) ?? "";
}

/**
 * Mic recording + live feature extraction.
 * `levelRef` (0..1) is updated every frame for the orb and light field.
 * Must be started from a user gesture (iOS).
 */
export function useVoiceRecorder(levelRef: React.RefObject<number>) {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);

  const live = useRef<{
    stream: MediaStream;
    ctx: AudioContext;
    rec: MediaRecorder;
    chunks: Blob[];
    frames: Frame[];
    raf: number;
    t0: number;
    mime: string;
    resolve?: (r: Recording | null) => void;
  } | null>(null);

  const teardown = useCallback(() => {
    const l = live.current;
    if (!l) return;
    cancelAnimationFrame(l.raf);
    l.stream.getTracks().forEach((t) => t.stop());
    void l.ctx.close().catch(() => {});
    live.current = null;
    levelRef.current = 0;
  }, [levelRef]);

  useEffect(() => teardown, [teardown]);

  const stop = useCallback((): Promise<Recording | null> => {
    const l = live.current;
    if (!l) return Promise.resolve(null);
    return new Promise((resolve) => {
      l.resolve = resolve;
      if (l.rec.state !== "inactive") l.rec.stop();
      else resolve(null);
    });
  }, []);

  const start = useCallback(async (): Promise<Status> => {
    if (live.current) return "recording";
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("unsupported");
      return "unsupported";
    }
    setStatus("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      });
    } catch {
      setStatus("denied");
      return "denied";
    }

    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    await ctx.resume().catch(() => {});
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    const mime = pickMime();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

    const t0 = performance.now();
    const state = { stream, ctx, rec, chunks, frames: [] as Frame[], raf: 0, t0, mime: rec.mimeType || mime };
    live.current = state;

    rec.onstop = () => {
      const l = live.current;
      const duration = (performance.now() - t0) / 1000;
      const type = state.mime || "audio/webm";
      const ext = type.includes("mp4") || type.includes("aac") ? "m4a" : "webm";
      const recording: Recording = {
        blob: new Blob(chunks, { type }),
        filename: `checkin.${ext}`,
        duration,
        features: computeFeatures(state.frames),
      };
      const resolve = l?.resolve;
      teardown();
      setStatus("idle");
      resolve?.(recording);
    };

    let lastTick = 0;
    const tick = () => {
      state.raf = requestAnimationFrame(tick);
      analyser.getFloatTimeDomainData(buf);
      const t = (performance.now() - t0) / 1000;
      const db = rmsDb(buf);
      state.frames.push({ t, db, f0: db > -60 ? detectPitch(buf, ctx.sampleRate) : null });
      // map roughly -60..-15 dB → 0..1 for visuals
      levelRef.current = Math.min(1, Math.max(0, (db + 60) / 45));
      if (t - lastTick >= 0.25) {
        lastTick = t;
        setElapsed(t);
      }
      if (t >= MAX_SECONDS && rec.state === "recording") rec.stop();
    };

    rec.start(250);
    setElapsed(0);
    setStatus("recording");
    tick();
    return "recording";
  }, [levelRef, teardown]);

  const cancel = useCallback(() => {
    const l = live.current;
    if (!l) return;
    l.resolve = undefined;
    l.rec.onstop = null;
    if (l.rec.state !== "inactive") l.rec.stop();
    teardown();
    setStatus("idle");
  }, [teardown]);

  return { status, elapsed, start, stop, cancel };
}
