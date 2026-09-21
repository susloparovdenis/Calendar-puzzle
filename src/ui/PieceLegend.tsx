import { PIECES } from '../core/pieces.ts';
import { useI18n } from '../i18n/context.tsx';
import { pathForShape, shapeExtent } from './layout.ts';

const UNIT = 18;

/** Thumbnails of the ten wooden pieces, at the size ratio of the real set. */
export function PieceLegend(): preact.JSX.Element {
  const { d } = useI18n();
  return (
    <section class="legend" aria-label={d.legend.aria}>
      <h2>{d.legend.heading}</h2>
      <ul>
        {PIECES.map((piece) => {
          const { rows, cols } = shapeExtent(piece.shape);
          return (
            <li key={piece.id}>
              <svg
                class="legend-shape"
                viewBox={`-1 -1 ${cols * UNIT + 2} ${rows * UNIT + 2}`}
                width={cols * UNIT + 2}
                height={rows * UNIT + 2}
                aria-hidden="true"
              >
                <path
                  d={pathForShape(piece.shape, UNIT)}
                  fill={piece.color}
                  stroke={piece.edge}
                  stroke-width={1.4}
                />
              </svg>
              <span class="legend-name">{d.pieceNames[piece.id]}</span>
              <span class="legend-size">{piece.shape.length}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
