interface AppleSvgProps {
  size?: number;
  className?: string;
}

export function AppleSvg({ size = 120, className }: AppleSvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="nv-body" cx="34%" cy="26%" r="82%">
          <stop offset="0%" stopColor="#F4FFD6" />
          <stop offset="22%" stopColor="#E0FF7A" />
          <stop offset="55%" stopColor="#CFFF3F" />
          <stop offset="82%" stopColor="#7AB405" />
          <stop offset="100%" stopColor="#3A5800" />
        </radialGradient>
        <radialGradient id="nv-spec" cx="30%" cy="22%" r="22%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nv-spec2" cx="70%" cy="78%" r="18%">
          <stop offset="0%" stopColor="#F4FFD6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F4FFD6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nv-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C9F567" />
          <stop offset="60%" stopColor="#7AB405" />
          <stop offset="100%" stopColor="#3A5800" />
        </linearGradient>
        <radialGradient id="nv-bite" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFFCEB" />
          <stop offset="55%" stopColor="#F4D88C" />
          <stop offset="100%" stopColor="#8A6A1B" />
        </radialGradient>
        <filter id="nv-shadow" x="-25%" y="-20%" width="150%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" />
          <feOffset dx="0" dy="4" result="off" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.35" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="nv-clip">
          <path d="M 120 58 C 84 42, 48 60, 44 104 C 40 158, 84 206, 120 210 C 156 206, 200 158, 196 104 C 192 60, 156 42, 120 58 Z" />
        </clipPath>
        <mask id="nv-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240">
          <rect width="240" height="240" fill="white" />
          <circle cx="44" cy="132" r="26" fill="black" />
        </mask>
      </defs>

      {/* Shadow under apple */}
      <ellipse cx="120" cy="222" rx="78" ry="8" fill="#0E1207" opacity="0.18" />

      {/* Stem */}
      <path d="M124 44 C 124 32, 130 24, 138 20" stroke="#4A2F1B" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* Leaf 1 */}
      <g transform="translate(138 20) rotate(-30)">
        <path d="M0 0 C 20 -10, 44 -4, 52 14 C 30 18, 8 12, 0 0 Z" fill="url(#nv-leaf)" />
      </g>

      {/* Leaf 2 */}
      <g transform="translate(126 38) rotate(20)">
        <path d="M0 0 C -14 -10, -32 -6, -40 10 C -22 14, -6 10, 0 0 Z" fill="url(#nv-leaf)" opacity="0.95" />
      </g>

      {/* Apple body with bite */}
      <g filter="url(#nv-shadow)">
        <g clipPath="url(#nv-clip)">
          <circle cx="44" cy="132" r="27.04" fill="url(#nv-bite)" />
          <circle cx="44" cy="132" r="24.7" fill="none" stroke="#8A6A1B" strokeWidth="1.2" opacity="0.4" />
        </g>
        <path
          d="M 120 58 C 84 42, 48 60, 44 104 C 40 158, 84 206, 120 210 C 156 206, 200 158, 196 104 C 192 60, 156 42, 120 58 Z"
          fill="url(#nv-body)"
          mask="url(#nv-mask)"
        />
      </g>

      {/* Specular highlights */}
      <g clipPath="url(#nv-clip)">
        <ellipse cx="102" cy="86" rx="22" ry="32" transform="rotate(-15 102 86)" fill="url(#nv-spec)" />
        <ellipse cx="150" cy="184" rx="22" ry="10" fill="url(#nv-spec2)" />
      </g>
    </svg>
  );
}
