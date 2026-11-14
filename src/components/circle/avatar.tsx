import { PEOPLE, type PersonId } from "@/lib/chat";

/** Friends: initials on a warm disc. Anonymous peers: a soft abstract blob, never a photo. */
export function Avatar({ who, size = 44 }: { who: PersonId; size?: number }) {
  const p = PEOPLE[who];
  if (p.anon) {
    const seed = p.name.length;
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden className="shrink-0">
        <defs>
          <radialGradient id={`g-${who}`} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#fbf7f1" />
            <stop offset="100%" stopColor={p.tint} />
          </radialGradient>
        </defs>
        <path
          fill={`url(#g-${who})`}
          d={`M22 ${4 + (seed % 3)}c9 0 ${17 - (seed % 4)} 7 ${17 - (seed % 4)} 16s-6 ${19 + (seed % 3)}-17 ${19 + (seed % 3)}S4 33 5 23 13 4 22 4z`}
        />
      </svg>
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-serif text-[18px] text-ink"
      style={{ width: size, height: size, background: p.tint }}
    >
      {p.name[0]}
    </span>
  );
}
