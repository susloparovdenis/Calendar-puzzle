import type { Month } from '../core/board.ts';
import type { Dictionary } from './dictionary.ts';

const MONTH_NAMES: readonly string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const EN: Dictionary = {
  locale: 'en-US',
  endonym: 'English',

  monthLabels: [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ],
  monthNames: MONTH_NAMES,
  weekdayLabels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  weekdayNames: [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ],
  mottoLines: ['A NEW DAY.', 'NEW POSSIBILITIES!'],

  pieceNames: {
    'v-pent': 'Corner',
    'l-pent': 'Hook',
    'u-pent': 'Staple',
    'z-pent': 'Zigzag',
    'n-pent': 'Step',
    'p-pent': 'Slab',
    't-pent': 'Hammer',
    'j-tet': 'Ledge',
    's-tet': 'Snake',
    'i-tet': 'Bar',
  },

  dayWithMonth: (day: number, month: Month): string => `${MONTH_NAMES[month - 1] ?? ''} ${day}`,
  solutionsWord: (count: number): string => (count === 1 ? 'solution' : 'solutions'),
  tilingsWord: (count: number): string => (count === 1 ? 'tiling' : 'tilings'),
  cellsWord: (count: number): string => `${count} ${count === 1 ? 'cell' : 'cells'}`,

  app: {
    title: 'Calendar Puzzle',
    tagline:
      'Pick a date and the ten wooden pieces fall into place, leaving only the month, ' +
      'the day of the month and the weekday uncovered.',
    boardAria: 'Wooden calendar puzzle',
    boardHint: 'You can pick the month and the day right on the board',
    colophon:
      'A 7×8 board: six cells sit under the inlays, leaving 50. The ten pieces cover 47 — ' +
      'exactly enough for the three answer cells to stay open.',
    languageAria: 'Interface language',
  },

  answer: {
    heading: 'Open cells',
    month: 'Month',
    day: 'Day',
    weekday: 'Weekday',
  },

  solutions: {
    heading: 'Solution',
    none: 'No solution found.',
    searching: 'Looking for the remaining tilings…',
    back: '← Back',
    forward: 'Next →',
    random: 'Random',
    showPieces: 'Show the pieces',
    showLabels: 'Engraving through the pieces',
    outOf: (total: number, exact: boolean): string =>
      ` of ${total.toLocaleString('en-US')}${exact ? '' : '+'}`,
    capped: (limit: number): string =>
      `Showing the first ${limit.toLocaleString('en-US')} tilings.`,
  },

  controls: {
    aria: 'Date picker',
    year: 'Year',
    prevYear: 'Previous year',
    nextYear: 'Next year',
    month: 'Month',
    day: 'Day',
    yesterday: '← Yesterday',
    today: 'Today',
    tomorrow: 'Tomorrow →',
    weekday: 'Weekday',
  },

  legend: {
    aria: 'Pieces in the set',
    heading: 'The ten pieces',
  },

  board: {
    monthAria: (label: string): string => `Month ${label}`,
    dayAria: (label: string): string => `Day ${label}`,
    weekdayFixed: (label: string): string => `${label} — follows from the date`,
    dayMissing: (monthName: string): string => `${monthName} has no such day`,
  },

  chart: {
    title: 'How many solutions each day has',
    navAria: 'Move between months',
    yearBack: 'A year back',
    monthBack: 'Previous month',
    monthForward: 'Next month',
    yearForward: 'A year forward',
    hoverHint: 'Hover over a bar',
    colDay: 'Day',
    colWeekday: 'Weekday',
    colSolutions: 'Solutions',
    subtitle: (monthName: string, year: number, total: string): string =>
      `${monthName} ${year} · ${total} in total`,
    tableCaption: (monthName: string, year: number): string =>
      `Solutions per day, ${monthName} ${year}`,
    footnote: (parts): string =>
      `Each bar is the number of tilings for that date. The most generous day: ${parts.maxDay} ` +
      `(${parts.maxCount}); the stingiest: ${parts.minDay} (${parts.minCount}).`,
  },

  howto: {
    heading: 'How to solve it by hand',
    intro: (placements: string): string =>
      `A single piece can go onto the board in ${placements} ways once you count rotations ` +
      'and flips. Trying their combinations at random is hopeless, but the right order of ' +
      'moves cuts the job down to a few minutes. Below is the same order the solver follows.',
    steps: [
      {
        heading: 'Cover the three answer cells with a finger',
        body: [
          'The month, the day and the weekday have to stay open. Everything else is 47 cells, ' +
            'and the pieces cover exactly 47. So there is no slack at all: any mistake shows ' +
            'up as a hole at the end.',
        ],
      },
      {
        heading: 'Start from the corners and notches, not the middle',
        body: [
          'A corner accepts far fewer pieces than the centre, so the choice there is almost ' +
            'made for you. The tightest spots are the top-left corner, the step under the ' +
            'balloon inlay on the right, and the notch by "FRI SAT SUN" at the bottom. Fill ' +
            'those first, while you still have something to choose from.',
        ],
      },
      {
        heading: 'Awkward pieces first, accommodating ones last',
        body: [
          'Place the ones that barely bend first and keep the agreeable ones in reserve: what ' +
            'is left at the end are holes of arbitrary shape, and only a flexible piece will ' +
            'close them.',
        ],
      },
      {
        heading: 'Always cover the topmost, leftmost empty cell',
        body: [
          'Do not hop around the board. Take the highest free cell — the leftmost among ties — ' +
            'and decide one thing only: which piece covers that cell. There are usually two or ' +
            'three candidates. Nothing forgotten is left behind you, and every move stays ' +
            'small and checkable.',
        ],
      },
      {
        heading: 'Count the holes: 1, 2, 3, 6, 7 and 11 are dead ends',
        body: [
          'The rule that saves the most time. The set holds only 4- and 5-cell pieces, so any ' +
            'enclosed patch of emptiness has to be built out of fours and fives: 4, 5, 8, 9, ' +
            '10, 12, 13 and onwards.',
          'Cut a three-cell corner off the board and take the last piece back without playing ' +
            'on. Check after every move: a glance at the empty space takes a second and saves ' +
            'dozens of pointless attempts.',
        ],
      },
      {
        heading: 'Stuck? Lift one piece, not the whole board',
        body: [
          'Taking it all apart is almost never necessary. Lift the piece you placed last and ' +
            'try another option for the same cell; when those run out, lift the one before it. ' +
            'That is backtracking, and by hand it converges quickly because the steps are tiny.',
        ],
      },
    ],
    sizesAria: 'Possible and impossible sizes of an empty region',
    pieces: [
      { id: 'i-tet', note: 'needs four cells in a row — there are few such places' },
      { id: 'u-pent', note: 'its notch must land on another piece or on an answer cell' },
      { id: 't-pent', note: 'the stem sticks out and leaves one-cell gaps on either side' },
      { id: 'p-pent', note: 'nearly a rectangle — it fits anywhere, so save it for last' },
    ],
    closing:
      'There is always a solution: all 2,562 combinations of month, day and weekday have been ' +
      'computed, and together they yield 4,864,096 tilings. But the spread is enormous — ' +
      'June 7 on a Wednesday has 10,374 of them, while April 6 on a Tuesday has just 97. ' +
      'On a stingy day you can poke around at random for a very long time, and the order of ' +
      'moves decides everything. If it will not come together, the date is not to blame — ' +
      'one badly placed piece is.',
  },
};
