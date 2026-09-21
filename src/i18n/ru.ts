import {
  MONTH_LABELS,
  MONTH_NAMES,
  MOTTO_LINES,
  WEEKDAY_LABELS,
  WEEKDAY_NAMES,
  type Month,
} from '../core/board.ts';
import { PIECES } from '../core/pieces.ts';
import type { PieceId } from '../core/pieces.ts';
import type { Dictionary } from './dictionary.ts';

/** Один из трёх вариантов по правилам русского счёта. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(count) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

const GENITIVE: readonly string[] = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export const RU: Dictionary = {
  locale: 'ru-RU',
  endonym: 'Русский',

  // The Russian side is the board itself, so it reads its words from the model
  // of the physical set rather than keeping a second copy that could drift.
  monthLabels: MONTH_LABELS,
  monthNames: MONTH_NAMES,
  weekdayLabels: WEEKDAY_LABELS,
  weekdayNames: WEEKDAY_NAMES,
  mottoLines: MOTTO_LINES,

  pieceNames: Object.fromEntries(
    PIECES.map((piece) => [piece.id, piece.name]),
  ) as Record<PieceId, string>,

  dayWithMonth: (day: number, month: Month): string => `${day} ${GENITIVE[month - 1] ?? ''}`,
  solutionsWord: (count: number): string => plural(count, 'решение', 'решения', 'решений'),
  tilingsWord: (count: number): string => plural(count, 'раскладка', 'раскладки', 'раскладок'),
  cellsWord: (count: number): string =>
    `${count} ${plural(count, 'клетка', 'клетки', 'клеток')}`,

  app: {
    title: 'Календарь‑пазл',
    tagline:
      'Выберите дату — и десять деревянных фигур сложатся так, чтобы открытыми остались ' +
      'только месяц, число и день недели.',
    boardAria: 'Деревянный календарь-пазл',
    boardHint: 'Месяц и число можно выбрать прямо на доске',
    colophon:
      'Доска 7×8: шесть клеток закрыты накладками, остаётся 50. Десять фигур занимают 47 — ' +
      'ровно столько, чтобы три клетки ответа остались открытыми.',
    languageAria: 'Язык интерфейса',
  },

  answer: {
    heading: 'Открытые клетки',
    month: 'Месяц',
    day: 'Число',
    weekday: 'День недели',
  },

  solutions: {
    heading: 'Решение',
    none: 'Решение не найдено.',
    searching: 'Ищем остальные варианты…',
    back: '← Назад',
    forward: 'Вперёд →',
    random: 'Случайное',
    showPieces: 'Показывать фигуры',
    showLabels: 'Надписи сквозь фигуры',
    outOf: (total: number, exact: boolean): string =>
      ` из ${total.toLocaleString('ru-RU')}${exact ? '' : '+'}`,
    capped: (limit: number): string =>
      `Показаны первые ${limit.toLocaleString('ru-RU')} вариантов.`,
  },

  controls: {
    aria: 'Выбор даты',
    year: 'Год',
    prevYear: 'Предыдущий год',
    nextYear: 'Следующий год',
    month: 'Месяц',
    day: 'Число',
    yesterday: '← Вчера',
    today: 'Сегодня',
    tomorrow: 'Завтра →',
    weekday: 'День недели',
  },

  legend: {
    aria: 'Фигуры набора',
    heading: 'Десять фигур',
  },

  board: {
    monthAria: (label: string): string => `Месяц ${label}`,
    dayAria: (label: string): string => `Число ${label}`,
    weekdayFixed: (label: string): string => `${label} — определяется датой`,
    dayMissing: (monthName: string): string => `В месяце «${monthName}» нет такого числа`,
  },

  chart: {
    title: 'Сколько решений у каждого дня',
    navAria: 'Перемотка по месяцам',
    yearBack: 'На год назад',
    monthBack: 'Предыдущий месяц',
    monthForward: 'Следующий месяц',
    yearForward: 'На год вперёд',
    hoverHint: 'Наведите на столбец',
    colDay: 'Число',
    colWeekday: 'День недели',
    colSolutions: 'Решений',
    subtitle: (monthName: string, year: number, total: string): string =>
      `${monthName} ${year} · всего ${total}`,
    tableCaption: (monthName: string, year: number): string =>
      `Число решений по дням, ${monthName} ${year}`,
    footnote: (parts): string =>
      `Столбец — число раскладок для этой даты. Самый щедрый день: ${parts.maxDay} ` +
      `(${parts.maxCount}); самый скупой: ${parts.minDay} (${parts.minCount}).`,
  },

  howto: {
    heading: 'Как сложить его руками',
    intro: (placements: string): string =>
      `Положить одну фигуру на доску можно ${placements} способами — с учётом поворотов и ` +
      'переворотов. Перебирать их сочетания наугад бессмысленно, но правильный порядок ходов ' +
      'сводит задачу к нескольким минутам. Ниже тот же порядок, по которому идёт решатель.',
    steps: [
      {
        heading: 'Закройте пальцем три клетки ответа',
        body: [
          'Месяц, число и день недели должны остаться открытыми. Всё остальное — 47 клеток, ' +
            'и фигуры занимают ровно 47. Значит, свободного места нет совсем: любая ошибка ' +
            'вылезет дыркой в конце.',
        ],
      },
      {
        heading: 'Начинайте с углов и вырезов, а не с середины',
        body: [
          'Угол принимает куда меньше фигур, чем центр, поэтому там выбор почти очевиден. ' +
            'Самые тесные места — левый верхний угол, ступенька под накладкой с шаром справа ' +
            'и уголок у «ПТ СБ ВС» внизу. Заполните их первыми, пока есть из чего выбирать.',
        ],
      },
      {
        heading: 'Неудобные фигуры — в начало, покладистые — в конец',
        body: [
          'Ставьте сначала те, что почти не гнутся, а самые сговорчивые держите в резерве: ' +
            'в конце останутся случайные по форме дырки, и закрыть их сможет только гибкая ' +
            'фигура.',
        ],
      },
      {
        heading: 'Всегда закрывайте самую верхнюю левую пустую клетку',
        body: [
          'Не прыгайте по доске. Возьмите самую верхнюю (а среди равных — самую левую) ' +
            'свободную клетку и решайте только одно: какая фигура накроет именно её. ' +
            'Вариантов обычно два-три. Так позади вас не остаётся забытых хвостов, а каждый ' +
            'ход — маленький и проверяемый.',
        ],
      },
      {
        heading: 'Считайте дырки: 1, 2, 3, 6, 7 и 11 — это тупик',
        body: [
          'Главное правило, экономящее больше всего времени. В наборе только фигуры по 4 и 5 ' +
            'клеток, поэтому любой замкнутый кусок пустоты должен собираться из четвёрок и ' +
            'пятёрок: 4, 5, 8, 9, 10, 12, 13 и так далее.',
          'Отрезали от доски уголок в три клетки — снимайте последнюю фигуру, не доигрывая. ' +
            'Проверять это нужно после каждого хода: взгляд на пустоту занимает секунду и ' +
            'отменяет десятки бесполезных попыток.',
        ],
      },
      {
        heading: 'Застряли — снимайте одну фигуру, не всю доску',
        body: [
          'Разбирать всё заново почти никогда не нужно. Снимите последнюю поставленную ' +
            'фигуру и попробуйте для той же клетки другой вариант; если они кончились — ' +
            'снимите предыдущую. Это и есть перебор с возвратом, и вручную он сходится ' +
            'быстро, потому что шаги мелкие.',
        ],
      },
    ],
    sizesAria: 'Возможные и невозможные размеры пустой области',
    pieces: [
      { id: 'i-tet', note: 'требует четыре клетки подряд — таких мест мало' },
      { id: 'u-pent', note: 'её вырез обязан попасть на чужую фигуру или на клетку ответа' },
      { id: 't-pent', note: 'ножка торчит и оставляет по бокам щели в одну клетку' },
      { id: 'p-pent', note: 'почти прямоугольник — влезает куда угодно, оставьте напоследок' },
    ],
    closing:
      'Решение есть всегда: все 2562 сочетания месяца, числа и дня недели просчитаны, вместе ' +
      'они дают 4 864 096 раскладок. Но разброс огромный — у 7 июня в среду их 10 374, ' +
      'а у 6 апреля во вторник всего 97. В «скупой» день наугад можно тыкаться очень долго, ' +
      'и порядок ходов решает всё. Если не сходится — дело не в дате, а в одной неудачно ' +
      'положенной фигуре.',
  },
};
