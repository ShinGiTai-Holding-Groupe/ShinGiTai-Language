import { cn } from "@/lib/utils";

export type AvatarVariant = "nova" | "hoot" | "bao" | "kit" | "milo" | "sage";

type AvatarConfig = {
  id: AvatarVariant;
  name: string;
  tagline: string;
  /** background gradient stops */
  bg: [string, string];
  face: string;
  accent: string;
  kind: "robot" | "owl" | "panda" | "fox" | "cat" | "sage";
};

export const TEACHER_AVATARS: AvatarConfig[] = [
  {
    id: "nova",
    name: "Nova",
    tagline: "Friendly study robot",
    bg: ["#2dd4bf", "#0ea5b7"],
    face: "#f2fbfa",
    accent: "#f97362",
    kind: "robot",
  },
  {
    id: "hoot",
    name: "Hoot",
    tagline: "Wise night owl",
    bg: ["#6366f1", "#8b5cf6"],
    face: "#efeafd",
    accent: "#fbbf24",
    kind: "owl",
  },
  {
    id: "bao",
    name: "Bao",
    tagline: "Calm & patient panda",
    bg: ["#94a3b8", "#64748b"],
    face: "#ffffff",
    accent: "#f97362",
    kind: "panda",
  },
  {
    id: "kit",
    name: "Kit",
    tagline: "Quick & clever fox",
    bg: ["#fb923c", "#f97316"],
    face: "#fff4ec",
    accent: "#ffffff",
    kind: "fox",
  },
  {
    id: "milo",
    name: "Milo",
    tagline: "Playful curious cat",
    bg: ["#f472b6", "#ec4899"],
    face: "#fdeef6",
    accent: "#c026d3",
    kind: "cat",
  },
  {
    id: "sage",
    name: "Sage",
    tagline: "Encouraging mentor",
    bg: ["#34d399", "#10b981"],
    face: "#f0fdf4",
    accent: "#f59e0b",
    kind: "sage",
  },
];

export function getAvatarConfig(variant?: string | null): AvatarConfig {
  return TEACHER_AVATARS.find((a) => a.id === variant) ?? TEACHER_AVATARS[0];
}

/** Ears / top decorations that make each character distinctive. */
function Ears({
  kind,
  accent,
  face,
}: {
  kind: AvatarConfig["kind"];
  accent: string;
  face: string;
}) {
  switch (kind) {
    case "owl":
      return (
        <>
          <path d="M30 30 L24 12 L40 24 Z" fill={accent} />
          <path d="M70 30 L76 12 L60 24 Z" fill={accent} />
        </>
      );
    case "panda":
      return (
        <>
          <circle cx="28" cy="26" r="11" fill="#1f2937" />
          <circle cx="72" cy="26" r="11" fill="#1f2937" />
        </>
      );
    case "fox":
      return (
        <>
          <path d="M26 34 L18 10 L42 26 Z" fill={accent} />
          <path d="M74 34 L82 10 L58 26 Z" fill={accent} />
          <path d="M28 32 L24 18 L38 28 Z" fill="#f97316" opacity="0.5" />
          <path d="M72 32 L76 18 L62 28 Z" fill="#f97316" opacity="0.5" />
        </>
      );
    case "cat":
      return (
        <>
          <path d="M26 32 L20 12 L42 26 Z" fill={face} />
          <path d="M74 32 L80 12 L58 26 Z" fill={face} />
          <path d="M28 30 L25 18 L38 28 Z" fill={accent} />
          <path d="M72 30 L75 18 L62 28 Z" fill={accent} />
        </>
      );
    case "robot":
      return (
        <>
          <rect x="47" y="6" width="6" height="12" rx="3" fill={face} />
          <circle cx="50" cy="6" r="5" fill={accent} />
        </>
      );
    case "sage":
      return (
        <path d="M22 30 Q50 6 78 30 Q66 20 50 20 Q34 20 22 30 Z" fill={accent} opacity="0.85" />
      );
    default:
      return null;
  }
}

export function TeacherAvatar({
  variant,
  speaking = false,
  animated = true,
  className,
}: {
  variant?: string | null;
  speaking?: boolean;
  animated?: boolean;
  className?: string;
}) {
  const c = getAvatarConfig(variant);
  const gradId = `av-grad-${c.id}`;

  return (
    <div
      className={cn(
        "relative aspect-square select-none",
        animated && "animate-avatar-bob",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-md">
        <defs>
          <radialGradient id={gradId} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor={c.bg[0]} />
            <stop offset="100%" stopColor={c.bg[1]} />
          </radialGradient>
        </defs>

        <Ears kind={c.kind} accent={c.accent} face={c.face} />

        {/* head */}
        <circle cx="50" cy="52" r="34" fill={`url(#${gradId})`} />

        {/* face plate */}
        <ellipse cx="50" cy="55" rx="24" ry="22" fill={c.face} />

        {/* cheeks */}
        <circle cx="33" cy="60" r="5" fill={c.accent} opacity="0.35" />
        <circle cx="67" cy="60" r="5" fill={c.accent} opacity="0.35" />

        {/* eyes (blink) */}
        <g
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          className={animated ? "animate-avatar-blink" : undefined}
        >
          <circle cx="41" cy="50" r="4.6" fill="#1f2937" />
          <circle cx="59" cy="50" r="4.6" fill="#1f2937" />
          <circle cx="42.6" cy="48.4" r="1.5" fill="#ffffff" />
          <circle cx="60.6" cy="48.4" r="1.5" fill="#ffffff" />
        </g>

        {/* mouth */}
        {speaking ? (
          <ellipse
            cx="50"
            cy="66"
            rx="7"
            ry="5.5"
            fill={c.accent}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            className="animate-avatar-talk"
          />
        ) : (
          <path
            d="M42 65 Q50 72 58 65"
            fill="none"
            stroke="#1f2937"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* speaking sound waves */}
      {speaking && (
        <span className="pointer-events-none absolute -right-1 top-1 flex gap-0.5">
          <span className="h-2 w-1 animate-avatar-talk rounded-full bg-primary" />
          <span className="h-3 w-1 animate-avatar-talk rounded-full bg-primary [animation-delay:120ms]" />
          <span className="h-2 w-1 animate-avatar-talk rounded-full bg-primary [animation-delay:240ms]" />
        </span>
      )}
    </div>
  );
}
