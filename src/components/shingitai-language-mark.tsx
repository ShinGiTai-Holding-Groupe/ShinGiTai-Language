import type { SVGProps } from "react";

export function ShinGiTaiLanguageMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 96 96"
      role="img"
      aria-label="ShinGiTai Language"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="sgt-mark" x1="14" y1="10" x2="82" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="0.52" stopColor="#6366F1" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
        <filter id="sgt-glow" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g stroke="url(#sgt-mark)" strokeWidth="7" strokeLinejoin="round" filter="url(#sgt-glow)">
        <path d="M48 10 83 72H69L48 35 27 72H13L48 10Z" />
        <path d="M48 35 69 72H56L48 58 40 72H27L48 35Z" />
        <path d="M13 72h27l8 14 8-14h27" />
      </g>
    </svg>
  );
}
