import {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  type Month,
  type Weekday,
} from '../core/board.ts';
import { daysInMonth, isMonth } from '../core/date.ts';

export interface ControlsProps {
  readonly year: number;
  readonly month: Month;
  readonly day: number;
  readonly weekday: Weekday;
  readonly onChange: (next: { readonly year: number; readonly month: Month; readonly day: number }) => void;
  readonly onToday: () => void;
  readonly onStepDay: (delta: number) => void;
}

export function Controls(props: ControlsProps): preact.JSX.Element {
  const { year, month, day, weekday } = props;
  const lastDay = daysInMonth(year, month);

  const setYear = (value: number): void => {
    props.onChange({ year: value, month, day: Math.min(day, daysInMonth(value, month)) });
  };
  const setMonth = (value: Month): void => {
    props.onChange({ year, month: value, day: Math.min(day, daysInMonth(year, value)) });
  };

  return (
    <section class="controls" aria-label="Выбор даты">
      <div class="control-row">
        <div class="field field-year">
          <span class="field-label" id="year-label" aria-hidden="true">Год</span>
          <div class="stepper">
            <button type="button" aria-label="Предыдущий год" onClick={() => setYear(year - 1)}>
              −
            </button>
            <input
              type="number"
              value={year}
              min={1900}
              max={2999}
              aria-label="Год"
              onInput={(event) => {
                const value = Number((event.currentTarget as HTMLInputElement).value);
                if (Number.isInteger(value) && value >= 1900 && value <= 2999) setYear(value);
              }}
            />
            <button type="button" aria-label="Следующий год" onClick={() => setYear(year + 1)}>
              +
            </button>
          </div>
        </div>

        <label class="field field-month">
          <span class="field-label">Месяц</span>
          <select
            value={String(month)}
            onChange={(event) => {
              const value = Number((event.currentTarget as HTMLSelectElement).value);
              if (isMonth(value)) setMonth(value);
            }}
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={String(index + 1)}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label class="field field-day">
          <span class="field-label">Число</span>
          <select
            value={String(day)}
            onChange={(event) => {
              const value = Number((event.currentTarget as HTMLSelectElement).value);
              props.onChange({ year, month, day: value });
            }}
          >
            {Array.from({ length: lastDay }, (_unused, index) => index + 1).map((value) => (
              <option key={value} value={String(value)}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div class="control-row control-row-actions">
        <button type="button" class="ghost" onClick={() => props.onStepDay(-1)}>
          ← Вчера
        </button>
        <button type="button" class="primary" onClick={props.onToday}>
          Сегодня
        </button>
        <button type="button" class="ghost" onClick={() => props.onStepDay(1)}>
          Завтра →
        </button>
      </div>

      <p class="weekday-chip">
        <span>День недели</span>
        <strong>{WEEKDAY_NAMES[weekday - 1] ?? '—'}</strong>
      </p>
    </section>
  );
}
