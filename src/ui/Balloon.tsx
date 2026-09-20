/** The hot-air balloon engraved into the top-right inlay of the board. */
export function Balloon({ size }: { readonly size: number }): preact.JSX.Element {
  // Drawn in a 100 x 130 box, then scaled to `size`.
  const s = size / 130;
  return (
    <g transform={`scale(${s})`} fill="none" stroke="#e7c391" stroke-opacity="0.85">
      <g stroke-width={4.5} stroke-linecap="round" stroke-linejoin="round">
        <path d="M50 4 C76 4 94 24 94 47 C94 66 78 82 66 93 L34 93 C22 82 6 66 6 47 C6 24 24 4 50 4 Z" />
        <path d="M50 4 C62 18 68 32 68 47 C68 66 60 82 52 93" />
        <path d="M50 4 C38 18 32 32 32 47 C32 66 40 82 48 93" />
        <path d="M34 93 L41 105 M66 93 L59 105" />
        <rect x={38} y={104} width={24} height={18} rx={3} />
        <path d="M38 112 L62 112" stroke-width={3} />
      </g>
    </g>
  );
}
