// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from './App.tsx';
import { PIECES } from '../core/pieces.ts';

// A fixed "now" keeps the first render deterministic: 20 September 2026, a Sunday.
const FROZEN_NOW = new Date(2026, 8, 20, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, now: FROZEN_NOW });
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('App', () => {
  it("opens on today's date with its weekday worked out", () => {
    render(<App />);
    expect(screen.getByLabelText('Год')).toHaveValue(2026);
    expect(screen.getByLabelText('Месяц')).toHaveValue('9');
    expect(screen.getByLabelText('Число')).toHaveValue('20');
    expect(screen.getAllByText('Воскресенье').length).toBeGreaterThan(0);
  });

  it('shows a full tiling straight away', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('.piece')).toHaveLength(PIECES.length);
    expect(container.querySelectorAll('.answers rect')).toHaveLength(3);
  });

  it('lists the three cells that stay open', () => {
    render(<App />);
    const card = screen.getByText('Открытые клетки').closest('section');
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain('Сентябрь');
    expect(card?.textContent).toContain('20');
    expect(card?.textContent).toContain('Воскресенье');
  });

  it('re-solves when a month is picked on the board', async () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByLabelText('Месяц МАР'));
    await waitFor(() => {
      expect(screen.getByLabelText('Месяц')).toHaveValue('3');
    });
    expect(container.querySelectorAll('.piece')).toHaveLength(PIECES.length);
    const card = screen.getByText('Открытые клетки').closest('section');
    expect(card?.textContent).toContain('Март');
  });

  it('re-solves when a day is picked on the board', async () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByLabelText('Число 7'));
    await waitFor(() => {
      expect(screen.getByLabelText('Число')).toHaveValue('7');
    });
    expect(container.querySelectorAll('.piece')).toHaveLength(PIECES.length);
  });

  it('does not offer a 31st in a month that has none', () => {
    render(<App />); // September
    expect(screen.queryByLabelText('Число 31')).toBeNull();
    fireEvent.change(screen.getByLabelText('Месяц'), { target: { value: '1' } });
    expect(screen.getByLabelText('Число 31')).toBeInTheDocument();
  });

  it('clamps the day when the chosen month is shorter', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Месяц'), { target: { value: '1' } });
    fireEvent.click(screen.getByLabelText('Число 31'));
    await waitFor(() => expect(screen.getByLabelText('Число')).toHaveValue('31'));
    fireEvent.change(screen.getByLabelText('Месяц'), { target: { value: '4' } });
    await waitFor(() => expect(screen.getByLabelText('Число')).toHaveValue('30'));
  });

  it('steps to the next day, crossing the end of the month', async () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Число 30'));
    await waitFor(() => expect(screen.getByLabelText('Число')).toHaveValue('30'));
    fireEvent.click(screen.getByText('Завтра →'));
    await waitFor(() => {
      expect(screen.getByLabelText('Месяц')).toHaveValue('10');
      expect(screen.getByLabelText('Число')).toHaveValue('1');
    });
  });

  it('comes back to today', async () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Месяц ЯНВ'));
    await waitFor(() => expect(screen.getByLabelText('Месяц')).toHaveValue('1'));
    fireEvent.click(screen.getByText('Сегодня'));
    await waitFor(() => expect(screen.getByLabelText('Месяц')).toHaveValue('9'));
  });

  it('walks through the alternative tilings', async () => {
    const { container } = render(<App />);
    const shapes = (): string =>
      [...container.querySelectorAll('.piece path')].map((n) => n.getAttribute('d')).join('|');

    const first = shapes();
    expect(screen.getByText('← Назад').closest('button')).toBeDisabled();

    await waitFor(() => expect(screen.getByText('Вперёд →').closest('button')).toBeEnabled());
    fireEvent.click(screen.getByText('Вперёд →'));
    await waitFor(() => expect(shapes()).not.toBe(first));
    expect(screen.getByText('← Назад').closest('button')).toBeEnabled();

    fireEvent.click(screen.getByText('← Назад'));
    await waitFor(() => expect(shapes()).toBe(first));
  });

  it('hides and restores the pieces', async () => {
    const { container } = render(<App />);
    const toggle = screen.getByLabelText('Показывать фигуры');
    fireEvent.click(toggle);
    await waitFor(() => expect(container.querySelectorAll('.piece')).toHaveLength(0));
    expect(screen.getByLabelText('Надписи сквозь фигуры')).toBeDisabled();
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(container.querySelectorAll('.piece')).toHaveLength(PIECES.length),
    );
  });

  it('turns the see-through engraving off', async () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('.engraving-ghost text').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByLabelText('Надписи сквозь фигуры'));
    await waitFor(() => expect(container.querySelectorAll('.engraving-ghost')).toHaveLength(0));
  });

  it('counts the tilings it has found so far', async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      const readout = container.querySelector('.solution-count');
      expect(readout?.textContent ?? '').toMatch(/^\d[\d\s\u00a0]*из [\d\s\u00a0]+\+?$/u);
    });
  });
});
