import type { Month, Weekday } from '../core/board.ts';
import { daysInMonth, isMonth } from '../core/date.ts';
import { useI18n } from '../i18n/context.tsx';

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
  const { d } = useI18n();
  const { year, month, day, weekday } = props;
  const lastDay = daysInMonth(year, month);

  const setYear = (value: number): void => {
    props.onChange({ year: value, month, day: Math.min(day, daysInMonth(value, month)) });
  };
  const setMonth = (value: Month): void => {
    props.onChange({ year, month: value, day: Math.min(day, daysInMonth(year, value)) });
  };

  return (
    <section class="controls" aria-label={d.controls.aria}>
      <div class="control-row">
        <div class="field field-year">
          <span class="field-label" id="year-label" aria-hidden="true">{d.controls.year}</span>
          <div class="stepper">
            <button type="button" aria-label={d.controls.prevYear} onClick={() => setYear(year - 1)}>
              −
            </button>
            <input
              type="number"
              value={year}
              min={1900}
              max={2999}
              aria-label={d.controls.year}
              onInput={(event) => {
                const value = Number((event.currentTarget as HTMLInputElement).value);
                if (Number.isInteger(value) && value >= 1900 && value <= 2999) setYear(value);
              }}
            />
            <button type="button" aria-label={d.controls.nextYear} onClick={() => setYear(year + 1)}>
              +
            </button>
          </div>
        </div>

        <label class="field field-month">
          <span class="field-label">{d.controls.month}</span>
          <select
            value={String(month)}
            onChange={(event) => {
              const value = Number((event.currentTarget as HTMLSelectElement).value);
              if (isMonth(value)) setMonth(value);
            }}
          >
            {d.monthNames.map((name, index) => (
              <option key={name} value={String(index + 1)}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label class="field field-day">
          <span class="field-label">{d.controls.day}</span>
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
          {d.controls.yesterday}
        </button>
        <button type="button" class="primary" onClick={props.onToday}>
          {d.controls.today}
        </button>
        <button type="button" class="ghost" onClick={() => props.onStepDay(1)}>
          {d.controls.tomorrow}
        </button>
      </div>

      <p class="weekday-chip">
        <span>{d.controls.weekday}</span>
        <strong>{d.weekdayNames[weekday - 1] ?? '—'}</strong>
      </p>
    </section>
  );
}
