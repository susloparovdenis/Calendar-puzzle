// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { Controls } from './Controls.tsx';

afterEach(cleanup);

function renderControls(overrides: Partial<Parameters<typeof Controls>[0]> = {}) {
  const onChange = vi.fn();
  const onToday = vi.fn();
  const onStepDay = vi.fn();
  const utils = render(
    <Controls
      year={2026}
      month={9}
      day={20}
      weekday={7}
      onChange={onChange}
      onToday={onToday}
      onStepDay={onStepDay}
      {...overrides}
    />,
  );
  return { ...utils, onChange, onToday, onStepDay };
}

describe('Controls', () => {
  it('shows the current date and its weekday', () => {
    renderControls();
    expect(screen.getByLabelText('Год')).toHaveValue(2026);
    expect(screen.getByText('Воскресенье')).toBeInTheDocument();
  });

  it('steps the year', () => {
    const { onChange } = renderControls();
    fireEvent.click(screen.getByLabelText('Следующий год'));
    expect(onChange).toHaveBeenCalledWith({ year: 2027, month: 9, day: 20 });
    fireEvent.click(screen.getByLabelText('Предыдущий год'));
    expect(onChange).toHaveBeenCalledWith({ year: 2025, month: 9, day: 20 });
  });

  it('lists only the days the month really has', () => {
    renderControls({ year: 2026, month: 2, day: 1 });
    const options = [...screen.getByLabelText('Число').querySelectorAll('option')];
    expect(options).toHaveLength(28);
    cleanup();
    renderControls({ year: 2024, month: 2, day: 1 });
    expect([...screen.getByLabelText('Число').querySelectorAll('option')]).toHaveLength(29);
  });

  it('keeps the day inside the new month when the month changes', () => {
    const { onChange } = renderControls({ year: 2026, month: 1, day: 31 });
    fireEvent.change(screen.getByLabelText('Месяц'), { target: { value: '4' } });
    expect(onChange).toHaveBeenCalledWith({ year: 2026, month: 4, day: 30 });
  });

  it('keeps the day inside the month when the year changes', () => {
    const { onChange } = renderControls({ year: 2024, month: 2, day: 29 });
    fireEvent.click(screen.getByLabelText('Следующий год'));
    expect(onChange).toHaveBeenCalledWith({ year: 2025, month: 2, day: 28 });
  });

  it('changes the day', () => {
    const { onChange } = renderControls();
    fireEvent.change(screen.getByLabelText('Число'), { target: { value: '7' } });
    expect(onChange).toHaveBeenCalledWith({ year: 2026, month: 9, day: 7 });
  });

  it('ignores an out-of-range year typed into the field', () => {
    const { onChange } = renderControls();
    fireEvent.input(screen.getByLabelText('Год'), { target: { value: '12' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.input(screen.getByLabelText('Год'), { target: { value: '1999' } });
    expect(onChange).toHaveBeenCalledWith({ year: 1999, month: 9, day: 20 });
  });

  it('steps a day back and forth, and jumps to today', () => {
    const { onStepDay, onToday } = renderControls();
    fireEvent.click(screen.getByText('← Вчера'));
    expect(onStepDay).toHaveBeenCalledWith(-1);
    fireEvent.click(screen.getByText('Завтра →'));
    expect(onStepDay).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByText('Сегодня'));
    expect(onToday).toHaveBeenCalledOnce();
  });
});
