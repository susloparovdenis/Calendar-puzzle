import type { BoardCell, Month } from '../core/board.ts';
import type { PieceId } from '../core/pieces.ts';

/**
 * Every string the interface shows, in each language the app offers.
 *
 * Phrases that depend on a number or a name are functions rather than
 * templates: Russian needs three plural forms and a genitive month, English
 * needs neither, and a function lets each language spell its own rule out.
 */

export const LANGS = ['ru', 'en'] as const;

export type Lang = (typeof LANGS)[number];

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export interface Dictionary {
  /** BCP 47 tag, used for number grouping and the document's `lang`. */
  readonly locale: string;
  /** Name of this language, written in itself. */
  readonly endonym: string;

  /** Three-letter engravings on the board, January first. */
  readonly monthLabels: readonly string[];
  readonly monthNames: readonly string[];
  /** Two- or three-letter weekday engravings, Monday first. */
  readonly weekdayLabels: readonly string[];
  readonly weekdayNames: readonly string[];
  /** The two lines inlaid along the bottom-left edge. */
  readonly mottoLines: readonly string[];
  readonly pieceNames: Readonly<Record<PieceId, string>>;

  /** "7 июня" / "June 7" — a day with its month, as that language writes it. */
  dayWithMonth(day: number, month: Month): string;
  /** "решения" / "solutions", agreeing with `count`. */
  solutionsWord(count: number): string;
  /** "раскладок" / "tilings", agreeing with `count`. */
  tilingsWord(count: number): string;
  /** "5 клеток" / "5 cells". */
  cellsWord(count: number): string;

  readonly app: {
    readonly title: string;
    readonly tagline: string;
    readonly boardAria: string;
    readonly boardHint: string;
    readonly colophon: string;
    readonly languageAria: string;
  };

  readonly answer: {
    readonly heading: string;
    readonly month: string;
    readonly day: string;
    readonly weekday: string;
  };

  readonly solutions: {
    readonly heading: string;
    readonly none: string;
    readonly searching: string;
    readonly back: string;
    readonly forward: string;
    readonly random: string;
    readonly showPieces: string;
    readonly showLabels: string;
    outOf(total: number, exact: boolean): string;
    capped(limit: number): string;
  };

  readonly controls: {
    readonly aria: string;
    readonly year: string;
    readonly prevYear: string;
    readonly nextYear: string;
    readonly month: string;
    readonly day: string;
    readonly yesterday: string;
    readonly today: string;
    readonly tomorrow: string;
    readonly weekday: string;
  };

  readonly legend: {
    readonly aria: string;
    readonly heading: string;
  };

  readonly board: {
    monthAria(label: string): string;
    dayAria(label: string): string;
    weekdayFixed(label: string): string;
    dayMissing(monthName: string): string;
  };

  readonly chart: {
    readonly title: string;
    readonly navAria: string;
    readonly yearBack: string;
    readonly monthBack: string;
    readonly monthForward: string;
    readonly yearForward: string;
    readonly hoverHint: string;
    readonly colDay: string;
    readonly colWeekday: string;
    readonly colSolutions: string;
    subtitle(monthName: string, year: number, total: string): string;
    tableCaption(monthName: string, year: number): string;
    footnote(parts: {
      readonly maxDay: string;
      readonly maxCount: string;
      readonly minDay: string;
      readonly minCount: string;
    }): string;
  };

  readonly howto: {
    readonly heading: string;
    intro(placements: string): string;
    readonly steps: readonly { readonly heading: string; readonly body: readonly string[] }[];
    readonly sizesAria: string;
    readonly pieces: readonly { readonly id: PieceId; readonly note: string }[];
    readonly closing: string;
  };
}

/**
 * What is engraved in a board cell in the current language. The cell's own
 * `label` records the Russian original burned into the physical panel; on
 * screen the board is re-engraved so an English reader can use it.
 */
export function cellLabel(cell: BoardCell, d: Dictionary): string {
  if (cell.kind === 'month') return d.monthLabels[cell.value - 1] ?? '';
  if (cell.kind === 'weekday') return d.weekdayLabels[cell.value - 1] ?? '';
  return String(cell.value);
}
