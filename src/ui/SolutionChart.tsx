import { useMemo, useState } from 'preact/hooks';
import { MONTH_NAMES, WEEKDAY_NAMES, type Month } from '../core/board.ts';
import { monthSolutionCounts, summarise, type DayCount } from '../core/solutionCounts.ts';

/**
 * How many tilings each day of a month admits.
 *
 * One series, so one colour for every bar; the chosen day is a lighter step of
 * the same hue and also carries a direct label, so selection never rests on
 * colour alone. Bars are plain elements rather than SVG, which keeps the axis
 * type at its real size on a narrow screen instead of scaling it into nothing.
 */

export interface SolutionChartProps {
  readonly year: number;
  readonly month: Month;
  readonly day: number;
  readonly onPickDate: (year: number, month: Month, day: number) => void;
}

/**
 * Gridline values: a round step that covers the tallest bar. Aiming a little
 * above four intervals keeps three or four lines on the plot rather than one.
 */
export function ticksFor(maximum: number): readonly number[] {
  if (!Number.isFinite(maximum) || maximum <= 0) return [0];
  const rough = maximum / 4.5;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= rough) ??
    magnitude * 10;
  const ticks: number[] = [];
  for (let value = 0; value <= maximum + step * 0.001; value += step) ticks.push(value);
  return ticks;
}

const ru = (value: number): string => value.toLocaleString('ru-RU');

function shiftMonth(year: number, month: Month, delta: number): { year: number; month: Month } {
  const zeroBased = (month - 1) + delta;
  return {
    year: year + Math.floor(zeroBased / 12),
    month: (((zeroBased % 12) + 12) % 12 + 1) as Month,
  };
}

export function SolutionChart(props: SolutionChartProps): preact.JSX.Element {
  const { year, month, day } = props;
  const [hovered, setHovered] = useState<number | null>(null);

  const counts = useMemo(() => monthSolutionCounts(year, month), [year, month]);
  const { total, min, max } = useMemo(() => summarise(counts), [counts]);

  const ceiling = Math.max(max?.count ?? 0, 1);
  const ticks = useMemo(() => ticksFor(ceiling), [ceiling]);
  const top = Math.max(ticks[ticks.length - 1] ?? ceiling, ceiling);

  const active = counts.find((entry) => entry.day === (hovered ?? day)) ?? null;

  const go = (delta: number): void => {
    const next = shiftMonth(year, month, delta);
    const lastDay = monthSolutionCounts(next.year, next.month).length;
    props.onPickDate(next.year, next.month, Math.min(day, lastDay));
  };

  const monthName = MONTH_NAMES[month - 1] ?? '';

  return (
    <section class="chart-card" aria-labelledby="chart-title">
      <header class="chart-head">
        <div class="chart-titles">
          <h2 id="chart-title">Сколько решений у каждого дня</h2>
          <p class="chart-sub">
            {`${monthName} ${year} · всего ${ru(total)} ${total === 1 ? 'раскладка' : 'раскладок'}`}
          </p>
        </div>

        <div class="chart-nav" role="group" aria-label="Перемотка по месяцам">
          <button type="button" onClick={() => go(-12)} aria-label="На год назад" title="На год назад">
            «
          </button>
          <button type="button" onClick={() => go(-1)} aria-label="Предыдущий месяц">
            ‹
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Следующий месяц">
            ›
          </button>
          <button type="button" onClick={() => go(12)} aria-label="На год вперёд" title="На год вперёд">
            »
          </button>
        </div>
      </header>

      <p class="chart-readout" aria-live="polite">
        {active === null ? (
          <span class="chart-readout-empty">Наведите на столбец</span>
        ) : (
          <>
            <strong>{ru(active.count)}</strong>
            <span>{`${plural(active.count)} · ${active.day} ${genitive(month)}, ${(WEEKDAY_NAMES[active.weekday - 1] ?? '').toLowerCase()}`}</span>
          </>
        )}
      </p>

      <div class="chart-body">
        <div class="chart-yaxis" aria-hidden="true">
          {[...ticks].reverse().map((value) => (
            <span key={value} style={{ bottom: `${(value / top) * 100}%` }}>
              {ru(value)}
            </span>
          ))}
        </div>

        <div class="chart-plot">
          <div class="chart-gridlines" aria-hidden="true">
            {ticks.map((value) => (
              <span key={value} style={{ bottom: `${(value / top) * 100}%` }} />
            ))}
          </div>

          <ol class="chart-bands">
            {counts.map((entry) => (
              <Band
                key={entry.day}
                entry={entry}
                top={top}
                selected={entry.day === day}
                hovered={entry.day === hovered}
                labelled={entry.day === day || (entry.day === max?.day && entry.day !== day)}
                onHover={setHovered}
                onPick={() => props.onPickDate(year, month, entry.day)}
                monthName={genitive(month)}
              />
            ))}
          </ol>
        </div>
      </div>

      <p class="chart-footnote">
        Столбец — число раскладок для этой даты. Самый щедрый день: {max?.day ?? '—'}{' '}
        {genitive(month)} ({ru(max?.count ?? 0)}); самый скупой: {min?.day ?? '—'}{' '}
        {genitive(month)} ({ru(min?.count ?? 0)}).
      </p>

      <table class="visually-hidden">
        <caption>{`Число решений по дням, ${monthName} ${year}`}</caption>
        <thead>
          <tr>
            <th scope="col">Число</th>
            <th scope="col">День недели</th>
            <th scope="col">Решений</th>
          </tr>
        </thead>
        <tbody>
          {counts.map((entry) => (
            <tr key={entry.day}>
              <th scope="row">{entry.day}</th>
              <td>{WEEKDAY_NAMES[entry.weekday - 1] ?? ''}</td>
              <td>{ru(entry.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Band({
  entry,
  top,
  selected,
  hovered,
  labelled,
  monthName,
  onHover,
  onPick,
}: {
  readonly entry: DayCount;
  readonly top: number;
  readonly selected: boolean;
  readonly hovered: boolean;
  readonly labelled: boolean;
  readonly monthName: string;
  readonly onHover: (day: number | null) => void;
  readonly onPick: () => void;
}): preact.JSX.Element {
  const height = `${Math.max((entry.count / top) * 100, entry.count > 0 ? 1.5 : 0)}%`;
  const classes = ['chart-band', selected ? 'is-selected' : '', hovered ? 'is-hovered' : '']
    .filter((name) => name !== '')
    .join(' ');

  return (
    <li class={classes}>
      <button
        type="button"
        aria-label={`${entry.day} ${monthName}, ${(WEEKDAY_NAMES[entry.weekday - 1] ?? '').toLowerCase()}: ${ru(entry.count)} ${plural(entry.count)}`}
        aria-pressed={selected}
        onMouseEnter={() => onHover(entry.day)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(entry.day)}
        onBlur={() => onHover(null)}
        onClick={onPick}
      >
        <span class="chart-bar" style={{ height }}>
          {labelled ? <span class="chart-value">{ru(entry.count)}</span> : null}
        </span>
        <span class="chart-tick">{entry.day % 5 === 0 || entry.day === 1 ? entry.day : ''}</span>
      </button>
      {hovered ? (
        <span class="chart-tip" role="presentation">
          <strong>{ru(entry.count)}</strong>
          <span>
            {entry.day} {monthName}, {(WEEKDAY_NAMES[entry.weekday - 1] ?? '').toLowerCase()}
          </span>
        </span>
      ) : null}
    </li>
  );
}

/** «решение / решения / решений», picked by Russian plural rules. */
export function plural(count: number): string {
  const mod100 = Math.abs(count) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'решений';
  if (mod10 === 1) return 'решение';
  if (mod10 >= 2 && mod10 <= 4) return 'решения';
  return 'решений';
}

const GENITIVE: readonly string[] = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export function genitive(month: Month): string {
  return GENITIVE[month - 1] ?? '';
}
