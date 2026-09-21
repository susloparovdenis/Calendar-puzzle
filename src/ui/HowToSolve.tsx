import { Fragment } from 'preact';
import type { PieceId } from '../core/pieces.ts';
import { pieceById } from '../core/pieces.ts';
import { PLACEMENT_COUNT } from '../core/solver.ts';
import { useI18n } from '../i18n/context.tsx';
import { pathForShape, shapeExtent } from './layout.ts';

/**
 * The hand-solving guide under the board. The rules are the same ones the
 * solver uses — corner-first ordering, least-flexible pieces early, and the
 * region-size arithmetic — written out for a person moving real wood.
 *
 * Two steps carry more than prose: the third is followed by the pieces worth
 * placing early, and the fifth by the row of region sizes.
 */

const UNIT = 13;

const PIECES_STEP = 2;
const SIZES_STEP = 4;

function Thumb({ id }: { readonly id: PieceId }): preact.JSX.Element {
  const piece = pieceById(id);
  const { rows, cols } = shapeExtent(piece.shape);
  return (
    <svg
      class="howto-thumb"
      viewBox={`-1 -1 ${cols * UNIT + 2} ${rows * UNIT + 2}`}
      width={cols * UNIT + 2}
      height={rows * UNIT + 2}
      aria-hidden="true"
    >
      <path d={pathForShape(piece.shape, UNIT)} fill={piece.color} stroke={piece.edge} stroke-width={1.2} />
    </svg>
  );
}

export function HowToSolve(): preact.JSX.Element {
  const { d, n } = useI18n();

  return (
    <section class="howto" aria-labelledby="howto-title">
      <header class="howto-head">
        <h2 id="howto-title">{d.howto.heading}</h2>
        <p>{d.howto.intro(n(PLACEMENT_COUNT))}</p>
      </header>

      <ol class="howto-steps">
        {d.howto.steps.map((step, index) => (
          <li key={step.heading}>
            <span class="howto-num">{index + 1}</span>
            <div>
              <h3>{step.heading}</h3>
              {step.body.map((paragraph, position) => (
                <Fragment key={paragraph}>
                  <p>{paragraph}</p>
                  {index === SIZES_STEP && position === 0 ? <RegionSizes /> : null}
                </Fragment>
              ))}
              {index === PIECES_STEP ? (
                <ul class="howto-pieces">
                  {d.howto.pieces.map((piece) => (
                    <li key={piece.id}>
                      <Thumb id={piece.id} />
                      <div>
                        <strong>{d.pieceNames[piece.id]}</strong>
                        <span>{piece.note}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <p class="howto-close">{d.howto.closing}</p>
    </section>
  );
}

/** Which sizes of an enclosed empty region the 4- and 5-cell pieces can fill. */
function RegionSizes(): preact.JSX.Element {
  const { d } = useI18n();
  return (
    <p class="howto-sizes" aria-label={d.howto.sizesAria}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((size) => (
        <span key={size} class={REACHABLE_SIZES.has(size) ? 'ok' : 'dead'}>
          {size}
        </span>
      ))}
    </p>
  );
}

/** Areas that 4- and 5-cell pieces can tile between them. */
const REACHABLE_SIZES: ReadonlySet<number> = new Set([4, 5, 8, 9, 10, 12, 13]);
