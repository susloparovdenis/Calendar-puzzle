// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { SolutionChart, ticksFor } from './SolutionChart.tsx';
import { RU } from '../i18n/ru.ts';
import { monthSolutionCounts, summarise } from '../core/solutionCounts.ts';
import type { Month } from '../core/board.ts';

afterEach(cleanup);

function renderChart(overrides: Partial<Parameters<typeof SolutionChart>[0]> = {}) {
  const onPickDate = vi.fn();
  const utils = render(
    <SolutionChart year={2026} month={9} day={20} onPickDate={onPickDate} {...overrides} />,
  );
  return { ...utils, onPickDate };
}

const readout = (container: ParentNode): string =>
  container.querySelector('.chart-readout')?.textContent ?? '';

const barHeight = (node: Element): number =>
  Number.parseFloat((node.getAttribute('style') ?? '').match(/height:\s*([\d.]+)%/)?.[1] ?? '0');

describe('SolutionChart', () => {
  it('draws one bar per day of the month', () => {
    const { container } = renderChart();
    expect(container.querySelectorAll('.chart-band')).toHaveLength(30);
    cleanup();
    const leap = renderChart({ year: 2024, month: 2 });
    expect(leap.container.querySelectorAll('.chart-band')).toHaveLength(29);
    cleanup();
    const common = renderChart({ year: 2025, month: 2 });
    expect(common.container.querySelectorAll('.chart-band')).toHaveLength(28);
  });

  it('scales bar heights to the real counts', () => {
    const { container } = renderChart();
    const counts = monthSolutionCounts(2026, 9);
    const { max } = summarise(counts);
    const bars = [...container.querySelectorAll('.chart-bar')];

    const tallest = bars.reduce((best, bar) => (barHeight(bar) > barHeight(best) ? bar : best));
    expect(barHeight(tallest)).toBeCloseTo(100, 0);
    expect(bars.indexOf(tallest)).toBe((max?.day ?? 1) - 1);

    // Heights must be proportional to the values, not to their rank.
    const first = counts[0];
    const second = counts[1];
    const firstBar = bars[0];
    const secondBar = bars[1];
    if (first && second && firstBar && secondBar) {
      expect(barHeight(firstBar) / barHeight(secondBar)).toBeCloseTo(first.count / second.count, 1);
    }
  });

  it('does not let the value label steal height from its bar', () => {
    // The label is nested inside the bar, so a labelled bar is as tall as its value.
    const { container } = renderChart();
    const labelled = container.querySelector('.chart-value');
    expect(labelled).not.toBeNull();
    expect(labelled?.closest('.chart-bar')).not.toBeNull();
  });

  it('labels only the selected day and the month maximum', () => {
    const { container } = renderChart();
    const { max } = summarise(monthSolutionCounts(2026, 9));
    const labels = container.querySelectorAll('.chart-value');
    expect(labels.length).toBe(max?.day === 20 ? 1 : 2);
  });

  it('marks the selected day', () => {
    const { container } = renderChart();
    const selected = container.querySelectorAll('.chart-band.is-selected');
    expect(selected).toHaveLength(1);
    expect(selected[0]?.querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows the selected day in the readout until something is hovered', () => {
    const { container } = renderChart();
    expect(readout(container)).toContain('20 сентября, воскресенье');
  });

  it('shows the hovered day, then goes back to the selected one', async () => {
    const { container } = renderChart();
    const third = container.querySelectorAll('.chart-band button')[2];
    expect(third).not.toBeUndefined();
    if (third === undefined) return;

    fireEvent.mouseEnter(third);
    expect(readout(container)).toContain('3 сентября, четверг');
    expect(container.querySelector('.chart-tip')).not.toBeNull();

    fireEvent.mouseLeave(third);
    expect(readout(container)).toContain('20 сентября, воскресенье');
    expect(container.querySelector('.chart-tip')).toBeNull();
  });

  it('gives keyboard focus the same readout as hover', () => {
    const { container } = renderChart();
    const fifth = container.querySelectorAll('.chart-band button')[4];
    if (fifth === undefined) throw new Error('missing bar');
    fireEvent.focus(fifth);
    expect(readout(container)).toContain('5 сентября, суббота');
  });

  it('picks a date when a bar is clicked', () => {
    const { container, onPickDate } = renderChart();
    const seventh = container.querySelectorAll('.chart-band button')[6];
    if (seventh === undefined) throw new Error('missing bar');
    fireEvent.click(seventh);
    expect(onPickDate).toHaveBeenCalledWith(2026, 9, 7);
  });

  it('reaches every value without hovering, through labels on the bars', () => {
    const { container } = renderChart();
    const counts = monthSolutionCounts(2026, 9);
    const labels = [...container.querySelectorAll('.chart-band button')].map((node) =>
      node.getAttribute('aria-label'),
    );
    expect(labels).toHaveLength(counts.length);
    for (const entry of counts) {
      expect(labels.some((label) => label?.includes(entry.count.toLocaleString('ru-RU')))).toBe(true);
    }
  });

  it('carries a table view with every value', () => {
    const { container } = renderChart();
    const rows = container.querySelectorAll('table tbody tr');
    expect(rows).toHaveLength(30);
    expect(container.querySelector('table caption')?.textContent).toContain('Сентябрь 2026');
  });

  it('rewinds a month at a time', () => {
    const { onPickDate } = renderChart();
    fireEvent.click(screen.getByLabelText('Предыдущий месяц'));
    expect(onPickDate).toHaveBeenCalledWith(2026, 8, 20);
    fireEvent.click(screen.getByLabelText('Следующий месяц'));
    expect(onPickDate).toHaveBeenCalledWith(2026, 10, 20);
  });

  it('rewinds a year at a time', () => {
    const { onPickDate } = renderChart();
    fireEvent.click(screen.getByLabelText('На год назад'));
    expect(onPickDate).toHaveBeenCalledWith(2025, 9, 20);
    fireEvent.click(screen.getByLabelText('На год вперёд'));
    expect(onPickDate).toHaveBeenCalledWith(2027, 9, 20);
  });

  it('rolls the year over at the ends', () => {
    const december = renderChart({ month: 12 });
    fireEvent.click(screen.getByLabelText('Следующий месяц'));
    expect(december.onPickDate).toHaveBeenCalledWith(2027, 1, 20);
    cleanup();
    const january = renderChart({ month: 1 });
    fireEvent.click(screen.getByLabelText('Предыдущий месяц'));
    expect(january.onPickDate).toHaveBeenCalledWith(2025, 12, 20);
  });

  it('shortens the day when rewinding into a shorter month', () => {
    const { onPickDate } = renderChart({ month: 1, day: 31 });
    fireEvent.click(screen.getByLabelText('Следующий месяц'));
    expect(onPickDate).toHaveBeenCalledWith(2026, 2, 28);
  });

  it('names the month total and its extremes', () => {
    const { container } = renderChart();
    const { total, min, max } = summarise(monthSolutionCounts(2026, 9));
    expect(container.querySelector('.chart-sub')?.textContent).toContain(
      total.toLocaleString('ru-RU'),
    );
    const note = container.querySelector('.chart-footnote')?.textContent ?? '';
    expect(note).toContain((max?.count ?? 0).toLocaleString('ru-RU'));
    expect(note).toContain((min?.count ?? 0).toLocaleString('ru-RU'));
  });

  it('renders every month of a year without failing', () => {
    for (let month = 1 as Month; month <= 12; month = (month + 1) as Month) {
      const { container, unmount } = renderChart({ month, day: 1 });
      expect(container.querySelectorAll('.chart-band').length).toBeGreaterThanOrEqual(28);
      expect(container.textContent).not.toContain('NaN');
      unmount();
    }
  });
});

describe('Russian plural of «решение»', () => {
  it('follows the 1 / 2-4 / rest rule', () => {
    expect(RU.solutionsWord(1)).toBe('решение');
    expect(RU.solutionsWord(21)).toBe('решение');
    expect(RU.solutionsWord(2)).toBe('решения');
    expect(RU.solutionsWord(34)).toBe('решения');
    expect(RU.solutionsWord(5)).toBe('решений');
    expect(RU.solutionsWord(100)).toBe('решений');
  });

  it('handles the 11–14 exception', () => {
    expect(RU.solutionsWord(11)).toBe('решений');
    expect(RU.solutionsWord(12)).toBe('решений');
    expect(RU.solutionsWord(14)).toBe('решений');
    expect(RU.solutionsWord(111)).toBe('решений');
    expect(RU.solutionsWord(1011)).toBe('решений');
  });
});

describe('genitive month names', () => {
  it('reads as a date would', () => {
    expect(RU.dayWithMonth(1, 1)).toBe('1 января');
    expect(RU.dayWithMonth(9, 5)).toBe('9 мая');
    expect(RU.dayWithMonth(31, 12)).toBe('31 декабря');
  });
});

describe('ticksFor', () => {
  it('starts at zero and covers the maximum', () => {
    for (const maximum of [97, 540, 2270, 3451, 10374, 1, 7]) {
      const ticks = ticksFor(maximum);
      expect(ticks[0]).toBe(0);
      expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(maximum);
      expect((ticks[ticks.length - 1] ?? 0) + (ticks[1] ?? 1)).toBeGreaterThan(maximum);
    }
  });

  it('keeps three to six gridlines, so the plot is never left with one', () => {
    for (let maximum = 20; maximum < 20000; maximum = Math.round(maximum * 1.17)) {
      const ticks = ticksFor(maximum);
      expect(ticks.length, `max ${maximum}`).toBeGreaterThanOrEqual(3);
      expect(ticks.length, `max ${maximum}`).toBeLessThanOrEqual(6);
    }
  });

  it('uses round steps', () => {
    expect(ticksFor(3451)).toEqual([0, 1000, 2000, 3000]);
    expect(ticksFor(10374)).toEqual([0, 2500, 5000, 7500, 10000]);
  });

  it('is evenly spaced', () => {
    const ticks = ticksFor(2270);
    const step = (ticks[1] ?? 0) - (ticks[0] ?? 0);
    for (let i = 1; i < ticks.length; i += 1) {
      expect((ticks[i] ?? 0) - (ticks[i - 1] ?? 0)).toBeCloseTo(step, 6);
    }
  });

  it('degrades safely on empty or invalid input', () => {
    expect(ticksFor(0)).toEqual([0]);
    expect(ticksFor(-5)).toEqual([0]);
    expect(ticksFor(Number.NaN)).toEqual([0]);
  });
});
