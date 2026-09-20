/** Shared SVG gradients and filters that give the board its wooden look. */
export function WoodDefs(): preact.JSX.Element {
  return (
    <defs>
      <linearGradient id="walnut" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0%" stop-color="#8a5227" />
        <stop offset="45%" stop-color="#75401d" />
        <stop offset="100%" stop-color="#5d3116" />
      </linearGradient>

      <linearGradient id="birch" x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0%" stop-color="#f4e3c0" />
        <stop offset="40%" stop-color="#ecd7ad" />
        <stop offset="100%" stop-color="#ddc294" />
      </linearGradient>

      <linearGradient id="panel-sheen" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
        <stop offset="55%" stop-color="#ffffff" stop-opacity="0.05" />
        <stop offset="100%" stop-color="#7a5324" stop-opacity="0.16" />
      </linearGradient>

      <radialGradient id="vignette" cx="0.5" cy="0.42" r="0.78">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="70%" stop-color="#000000" stop-opacity="0" />
        <stop offset="100%" stop-color="#2a1608" stop-opacity="0.32" />
      </radialGradient>

      {/* Long, fine streaks along the grain of the plywood. */}
      <filter id="grain" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9 0.012"
          numOctaves={4}
          seed={7}
          result="noise"
        />
        <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
        <feComponentTransfer in="mono" result="soft">
          <feFuncA type="linear" slope="0.22" intercept="0" />
        </feComponentTransfer>
        <feComposite in="soft" in2="SourceAlpha" operator="in" result="clipped" />
        <feBlend in="SourceGraphic" in2="clipped" mode="multiply" />
      </filter>

      <filter id="grain-fine" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="1.4 0.02"
          numOctaves={3}
          seed={19}
          result="noise"
        />
        <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
        <feComponentTransfer in="mono" result="soft">
          <feFuncA type="linear" slope="0.16" intercept="0" />
        </feComponentTransfer>
        <feComposite in="soft" in2="SourceAlpha" operator="in" result="clipped" />
        <feBlend in="SourceGraphic" in2="clipped" mode="multiply" />
      </filter>

      {/* Drop shadow under the loose pieces. */}
      <filter id="piece-shadow" x="-20%" y="-20%" width="145%" height="155%">
        <feDropShadow dx="1.5" dy="5" stdDeviation="4.5" flood-color="#2b1607" flood-opacity="0.45" />
      </filter>

      <filter id="board-shadow" x="-15%" y="-15%" width="130%" height="135%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#160a02" flood-opacity="0.55" />
      </filter>

      {/* Laser engraving: a burnt groove with a lit lower edge. */}
      <filter id="engraved" x="-25%" y="-25%" width="150%" height="160%">
        <feDropShadow dx="0" dy="1.6" stdDeviation="0.4" flood-color="#fff6e0" flood-opacity="0.65" />
        <feDropShadow dx="0" dy="-0.9" stdDeviation="0.6" flood-color="#4a2c10" flood-opacity="0.45" />
      </filter>

      <filter id="engraved-light" x="-25%" y="-25%" width="150%" height="160%">
        <feDropShadow dx="0" dy="1.3" stdDeviation="0.5" flood-color="#d9a86c" flood-opacity="0.4" />
      </filter>

      <filter id="answer-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="9" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
