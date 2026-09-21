import { PLAYABLE_CELLS, type BoardCell, type Month } from '../core/board.ts';
import { pieceById } from '../core/pieces.ts';
import type { Solution } from '../core/solver.ts';
import { useI18n } from '../i18n/context.tsx';
import { cellLabel, type Dictionary } from '../i18n/dictionary.ts';
import { Balloon } from './Balloon.tsx';
import { WoodDefs } from './WoodDefs.tsx';
import {
  BOARD_HEIGHT,
  BOARD_RADIUS,
  BOARD_WIDTH,
  CELL,
  COLS_TOTAL,
  FRAME,
  PANEL_PATH,
  ROWS_TOTAL,
  centerX,
  centerY,
  pathForCells,
  x,
  y,
} from './layout.ts';

/** Widest a three-letter engraving may be, so month names stay inside their cell. */
const LABEL_WIDTH = 78;

export interface BoardViewProps {
  readonly solution: Solution | null;
  /** Board cell indices that must stay open for the chosen date. */
  readonly answerCells: readonly number[];
  readonly month: Month;
  readonly day: number;
  /** Last day the chosen month actually has; later day cells are not selectable. */
  readonly maxDay: number;
  readonly showPieces: boolean;
  /** Show the engraving faintly through the pieces, so the calendar stays readable. */
  readonly showLabels: boolean;
  /** Bumped whenever a new solution should re-play the drop-in animation. */
  readonly animationKey: number;
  readonly onPickMonth: (month: Month) => void;
  readonly onPickDay: (day: number) => void;
}

export function BoardView(props: BoardViewProps): preact.JSX.Element {
  const { d } = useI18n();
  const answer = new Set(props.answerCells);
  const piecesVisible = props.showPieces && props.solution !== null;
  const covered = new Set(
    piecesVisible ? (props.solution ?? []).flatMap((placed) => placed.cells) : [],
  );
  // Days the chosen month never reaches are engraved faintly, like 31 in September.
  const faded = new Set(
    PLAYABLE_CELLS.filter((cell) => cell.kind === 'day' && cell.value > props.maxDay).map(
      (cell) => cell.index,
    ),
  );

  return (
    <svg
      class="board"
      viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
      role="img"
      aria-label={d.app.boardAria}
    >
      <WoodDefs />

      <g filter="url(#board-shadow)">
        <rect
          x={0}
          y={0}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          rx={BOARD_RADIUS}
          fill="url(#walnut)"
          filter="url(#grain)"
        />
      </g>
      <rect
        x={1.5}
        y={1.5}
        width={BOARD_WIDTH - 3}
        height={BOARD_HEIGHT - 3}
        rx={BOARD_RADIUS - 1}
        fill="none"
        stroke="#3d1f0a"
        stroke-opacity="0.55"
        stroke-width={3}
      />

      <g transform={`translate(${FRAME} ${FRAME})`}>
        {/* Seam around the birch insert, then the insert itself. */}
        <path d={PANEL_PATH} fill="#3a1e0a" opacity={0.55} transform="translate(0 3)" />
        <path d={PANEL_PATH} fill="url(#birch)" filter="url(#grain-fine)" />
        <path d={PANEL_PATH} fill="url(#panel-sheen)" style={{ mixBlendMode: 'soft-light' }} />
        <path
          d={PANEL_PATH}
          fill="none"
          stroke="#6d4520"
          stroke-opacity="0.45"
          stroke-width={2.5}
        />

        <Engravings cells={PLAYABLE_CELLS} variant="panel" faded={faded} />
        <AnswerHighlights answer={answer} />

        {piecesVisible ? (
          <g key={props.animationKey} class="pieces">
            {(props.solution ?? []).map((placed, index) => (
              <PieceShape key={placed.pieceId} placed={placed} order={index} />
            ))}
          </g>
        ) : null}

        {piecesVisible && props.showLabels ? (
          <Engravings
            cells={PLAYABLE_CELLS.filter((cell) => covered.has(cell.index))}
            variant="ghost"
            faded={faded}
          />
        ) : null}

        <HitAreas
          month={props.month}
          day={props.day}
          maxDay={props.maxDay}
          onPickMonth={props.onPickMonth}
          onPickDay={props.onPickDay}
        />
      </g>

      {/* Balloon inlay, top-right. */}
      <g transform={`translate(${FRAME + x(6) + CELL / 2 - 33} ${FRAME + y(0) + 46})`}>
        <Balloon size={118} />
      </g>

      {/* Motto inlay, bottom-left. */}
      <g
        class="motto"
        transform={`translate(${FRAME + 200} ${FRAME + y(7) + 40})`}
        filter="url(#engraved-light)"
      >
        {d.mottoLines.map((line, index) => (
          <text key={line} x={0} y={index * 36} text-anchor="middle" fill="#e3bd87">
            {line}
          </text>
        ))}
      </g>

      <rect
        x={0}
        y={0}
        width={BOARD_WIDTH}
        height={BOARD_HEIGHT}
        rx={BOARD_RADIUS}
        fill="url(#vignette)"
        pointer-events="none"
      />
    </svg>
  );
}

function Engravings({
  cells,
  variant,
  faded,
}: {
  readonly cells: readonly BoardCell[];
  readonly variant: 'panel' | 'ghost';
  readonly faded: ReadonlySet<number>;
}): preact.JSX.Element {
  const { d } = useI18n();
  const ghost = variant === 'ghost';
  const baseOpacity = ghost ? 0.3 : 1;
  return (
    <g
      class={`engraving ${ghost ? 'engraving-ghost' : ''}`}
      filter={ghost ? undefined : 'url(#engraved)'}
      pointer-events="none"
    >
      {cells.map((cell) => {
        const label = cellLabel(cell, d);
        return (
        <text
          key={cell.index}
          class={`engraving-${cell.kind} ${faded.has(cell.index) ? 'engraving-faded' : ''}`}
          x={centerX(cell.col)}
          y={centerY(cell.row)}
          text-anchor="middle"
          dominant-baseline="central"
          fill={ghost ? '#42230b' : '#7b4c22'}
          fill-opacity={faded.has(cell.index) ? baseOpacity * 0.35 : baseOpacity}
          // Long labels are squeezed to the cell so they fit whatever font loads.
          textLength={label.length >= 3 ? LABEL_WIDTH : undefined}
          lengthAdjust={label.length >= 3 ? 'spacingAndGlyphs' : undefined}
        >
          {label}
        </text>
        );
      })}
    </g>
  );
}

function AnswerHighlights({ answer }: { readonly answer: ReadonlySet<number> }): preact.JSX.Element {
  const cells = PLAYABLE_CELLS.filter((cell) => answer.has(cell.index));
  return (
    <g class="answers" pointer-events="none">
      {cells.map((cell) => (
        <rect
          key={cell.index}
          x={x(cell.col) + 7}
          y={y(cell.row) + 7}
          width={CELL - 14}
          height={CELL - 14}
          rx={14}
          fill="#ffd27d"
          fill-opacity="0.28"
          stroke="#c2721f"
          stroke-opacity="0.75"
          stroke-width={3}
          filter="url(#answer-glow)"
        />
      ))}
    </g>
  );
}

function PieceShape({
  placed,
  order,
}: {
  readonly placed: Solution[number];
  readonly order: number;
}): preact.JSX.Element {
  const { d } = useI18n();
  const piece = pieceById(placed.pieceId);
  const path = pathForCells(placed.cells);
  return (
    <g
      class="piece"
      style={{ animationDelay: `${order * 55}ms` }}
      filter="url(#piece-shadow)"
    >
      <path d={path} fill={piece.color} filter="url(#grain-fine)" />
      <path d={path} fill="none" stroke={piece.edge} stroke-width={3} stroke-opacity="0.9" />
      <path
        d={path}
        fill="none"
        stroke="#ffffff"
        stroke-opacity="0.3"
        stroke-width={2}
        transform="translate(0 -1.5)"
        clip-path="none"
      />
      <title>{`${d.pieceNames[piece.id]} (${d.cellsWord(piece.shape.length)})`}</title>
    </g>
  );
}

function HitAreas({
  month,
  day,
  maxDay,
  onPickMonth,
  onPickDay,
}: {
  readonly month: Month;
  readonly day: number;
  /** Last day the chosen month actually has; later day cells are not selectable. */
  readonly maxDay: number;
  readonly onPickMonth: (month: Month) => void;
  readonly onPickDay: (day: number) => void;
}): preact.JSX.Element {
  const { d } = useI18n();
  return (
    <g class="hit-areas">
      {PLAYABLE_CELLS.map((cell) => {
        // Weekday cells follow from the date, and day cells past the end of the
        // month (31 September, 30 February) have nothing to select.
        const disabled = cell.kind === 'weekday' || (cell.kind === 'day' && cell.value > maxDay);
        const classes = ['hit', disabled ? 'hit-disabled' : '', isSelected(cell, month, day) ? 'hit-selected' : '']
          .filter((name) => name !== '')
          .join(' ');

        return (
          <rect
            key={cell.index}
            class={classes}
            x={x(cell.col)}
            y={y(cell.row)}
            width={CELL}
            height={CELL}
            rx={12}
            tabIndex={disabled ? undefined : 0}
            role={disabled ? undefined : 'button'}
            aria-label={disabled ? undefined : ariaLabel(cell, d)}
            onClick={disabled ? undefined : () => activate(cell, onPickMonth, onPickDay)}
            onKeyDown={
              disabled
                ? undefined
                : (event: KeyboardEvent) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      activate(cell, onPickMonth, onPickDay);
                    }
                  }
            }
          >
            {disabled ? <title>{disabledReason(cell, month, d)}</title> : null}
          </rect>
        );
      })}
    </g>
  );
}

function disabledReason(cell: BoardCell, month: Month, d: Dictionary): string {
  if (cell.kind === 'weekday') return d.board.weekdayFixed(cellLabel(cell, d));
  return d.board.dayMissing(d.monthNames[month - 1] ?? '');
}

function isSelected(cell: BoardCell, month: Month, day: number): boolean {
  if (cell.kind === 'month') return cell.value === month;
  if (cell.kind === 'day') return cell.value === day;
  return false;
}

function ariaLabel(cell: BoardCell, d: Dictionary): string {
  const label = cellLabel(cell, d);
  return cell.kind === 'month' ? d.board.monthAria(label) : d.board.dayAria(label);
}

function activate(
  cell: BoardCell,
  onPickMonth: (month: Month) => void,
  onPickDay: (day: number) => void,
): void {
  if (cell.kind === 'month') onPickMonth(cell.value as Month);
  else if (cell.kind === 'day') onPickDay(cell.value);
}

export const BOARD_ASPECT = BOARD_WIDTH / BOARD_HEIGHT;
export const BOARD_GRID = { cols: COLS_TOTAL, rows: ROWS_TOTAL } as const;
