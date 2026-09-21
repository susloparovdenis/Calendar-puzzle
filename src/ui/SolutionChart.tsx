import { useMemo, useState } from 'preact/hooks';
import type { Month } from '../core/board.ts';
import { monthSolutionCounts, summarise, type DayCount } from '../core/solutionCounts.ts';
import { useI18n } from '../i18n/context.tsx';
import type { Dictionary } from '../i18n/dictionary.ts';

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

function shiftMonth(year: number, month: Month, delta: number): { year: number; month: Month } {
  const zeroBased = (month - 1) + delta;
  return {
    year: year + Math.floor(zeroBased / 12),
    month: (((zeroBased % 12) + 12) % 12 + 1) as Month,
  };
}

export function SolutionChart(props: SolutionChartProps): preact.JSX.Element {
  const { d, n } = useI18n();
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

  const monthName = d.monthNames[month - 1] ?? '';

  return (
    <section class="chart-card" aria-labelledby="chart-title">
      <header class="chart-head">
        <div class="chart-titles">
          <h2 id="chart-title">{d.chart.title}</h2>
          <p class="chart-sub">
            {d.chart.subtitle(monthName, year, `${n(total)} ${d.tilingsWord(total)}`)}
          </p>
        </div>

        <div class="chart-nav" role="group" aria-label={d.chart.navAria}>
          <button type="button" onClick={() => go(-12)} aria-label={d.chart.yearBack} title={d.chart.yearBack}>
            «
          </button>
          <button type="button" onClick={() => go(-1)} aria-label={d.chart.monthBack}>
            ‹
          </button>
          <button type="button" onClick={() => go(1)} aria-label={d.chart.monthForward}>
            ›
          </button>
          <button type="button" onClick={() => go(12)} aria-label={d.chart.yearForward} title={d.chart.yearForward}>
            »
          </button>
        </div>
      </header>

      <p class="chart-readout" aria-live="polite">
        {active === null ? (
          <span class="chart-readout-empty">{d.chart.hoverHint}</span>
        ) : (
          <>
            <strong>{n(active.count)}</strong>
            <span>
              {`${d.solutionsWord(active.count)} · ${d.dayWithMonth(active.day, month)}, ` +
                `${weekdayWord(active.weekday, d)}`}
            </span>
          </>
        )}
      </p>

      <div class="chart-body">
        <div class="chart-yaxis" aria-hidden="true">
          {[...ticks].reverse().map((value) => (
            <span key={value} style={{ bottom: `${(value / top) * 100}%` }}>
              {n(value)}
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
                month={month}
              />
            ))}
          </ol>
        </div>
      </div>

      <p class="chart-footnote">
        {d.chart.footnote({
          maxDay: max === null ? '—' : d.dayWithMonth(max.day, month),
          maxCount: n(max?.count ?? 0),
          minDay: min === null ? '—' : d.dayWithMonth(min.day, month),
          minCount: n(min?.count ?? 0),
        })}
      </p>

      <table class="visually-hidden">
        <caption>{d.chart.tableCaption(monthName, year)}</caption>
        <thead>
          <tr>
            <th scope="col">{d.chart.colDay}</th>
            <th scope="col">{d.chart.colWeekday}</th>
            <th scope="col">{d.chart.colSolutions}</th>
          </tr>
        </thead>
        <tbody>
          {counts.map((entry) => (
            <tr key={entry.day}>
              <th scope="row">{entry.day}</th>
              <td>{d.weekdayNames[entry.weekday - 1] ?? ''}</td>
              <td>{n(entry.count)}</td>
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
  month,
  onHover,
  onPick,
}: {
  readonly entry: DayCount;
  readonly top: number;
  readonly selected: boolean;
  readonly hovered: boolean;
  readonly labelled: boolean;
  readonly month: Month;
  readonly onHover: (day: number | null) => void;
  readonly onPick: () => void;
}): preact.JSX.Element {
  const { d, n } = useI18n();
  const date = d.dayWithMonth(entry.day, month);
  const weekday = weekdayWord(entry.weekday, d);
  const height = `${Math.max((entry.count / top) * 100, entry.count > 0 ? 1.5 : 0)}%`;
  const classes = ['chart-band', selected ? 'is-selected' : '', hovered ? 'is-hovered' : '']
    .filter((name) => name !== '')
    .join(' ');

  return (
    <li class={classes}>
      <button
        type="button"
        aria-label={`${date}, ${weekday}: ${n(entry.count)} ${d.solutionsWord(entry.count)}`}
        aria-pressed={selected}
        onMouseEnter={() => onHover(entry.day)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(entry.day)}
        onBlur={() => onHover(null)}
        onClick={onPick}
      >
        <span class="chart-bar" style={{ height }}>
          {labelled ? <span class="chart-value">{n(entry.count)}</span> : null}
        </span>
        <span class="chart-tick">{entry.day % 5 === 0 || entry.day === 1 ? entry.day : ''}</span>
      </button>
      {hovered ? (
        <span class="chart-tip" role="presentation">
          <strong>{n(entry.count)}</strong>
          <span>
            {date}, {weekday}
          </span>
        </span>
      ) : null}
    </li>
  );
}

/** The weekday, lowercased where the language writes it that way. */
function weekdayWord(weekday: number, d: Dictionary): string {
  const name = d.weekdayNames[weekday - 1] ?? '';
  return d.locale.startsWith('en') ? name : name.toLowerCase();
}
