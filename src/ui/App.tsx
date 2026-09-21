import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import type { Month } from '../core/board.ts';
import { clampDay, daysInMonth, isMonth, puzzleDateFor, type PuzzleDate } from '../core/date.ts';
import { targetCells } from '../core/solver.ts';
import { useI18n } from '../i18n/context.tsx';
import { BoardView } from './BoardView.tsx';
import { Controls } from './Controls.tsx';
import { HowToSolve } from './HowToSolve.tsx';
import { LanguageSwitch } from './LanguageSwitch.tsx';
import { PieceLegend } from './PieceLegend.tsx';
import { SolutionChart } from './SolutionChart.tsx';
import { MAX_SOLUTIONS, useSolutions } from './useSolutions.ts';

interface Selection {
  readonly year: number;
  readonly month: Month;
  readonly day: number;
}

function today(): Selection {
  const now = new Date();
  const month = now.getMonth() + 1;
  return {
    year: now.getFullYear(),
    month: isMonth(month) ? month : 1,
    day: now.getDate(),
  };
}

export function App(): preact.JSX.Element {
  const { d } = useI18n();
  const [selection, setSelection] = useState<Selection>(today);
  const [variant, setVariant] = useState(0);
  const [showPieces, setShowPieces] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const date: PuzzleDate = useMemo(
    () => puzzleDateFor(selection.year, selection.month, selection.day),
    [selection.year, selection.month, selection.day],
  );

  const { list, enumerating, complete, error } = useSolutions(date);

  // A new date restarts the enumeration, so go back to the first tiling.
  useEffect(() => {
    setVariant(0);
  }, [date.month, date.day, date.weekday]);

  const index = list.length === 0 ? 0 : Math.min(variant, list.length - 1);
  const solution = list[index] ?? null;
  const answerCells = useMemo(() => targetCells(date), [date]);

  const change = useCallback((next: Selection) => {
    setSelection({ ...next, day: clampDay(next.year, next.month, next.day) });
  }, []);

  const stepDay = useCallback((delta: number) => {
    setSelection((current) => {
      const shifted = new Date(current.year, current.month - 1, current.day + delta);
      const month = shifted.getMonth() + 1;
      return {
        year: shifted.getFullYear(),
        month: isMonth(month) ? month : current.month,
        day: shifted.getDate(),
      };
    });
  }, []);

  const pickMonth = useCallback(
    (month: Month) => change({ ...selection, month }),
    [change, selection],
  );
  const pickDay = useCallback((day: number) => change({ ...selection, day }), [change, selection]);

  const total = complete ? list.length : null;
  const reachedCap = !complete && !enumerating && list.length >= MAX_SOLUTIONS;

  return (
    <div class="app">
      <header class="masthead">
        <LanguageSwitch />
        <h1>{d.app.title}</h1>
        <p>{d.app.tagline}</p>
      </header>

      <main>
        <div class="layout">
          <div class="board-stage">
          <BoardView
            solution={solution}
            answerCells={answerCells}
            month={selection.month}
            day={selection.day}
            maxDay={daysInMonth(selection.year, selection.month)}
            showPieces={showPieces}
            showLabels={showLabels}
            animationKey={index}
            onPickMonth={pickMonth}
            onPickDay={pickDay}
          />
          <p class="board-hint">{d.app.boardHint}</p>
        </div>

          <aside class="sidebar">
          <Controls
            year={selection.year}
            month={selection.month}
            day={selection.day}
            weekday={date.weekday}
            onChange={change}
            onToday={() => setSelection(today())}
            onStepDay={stepDay}
          />

          <section class="answer-card" aria-live="polite">
            <h2>{d.answer.heading}</h2>
            <ul>
              <li>
                <span>{d.answer.month}</span>
                <strong>{d.monthNames[date.month - 1] ?? '—'}</strong>
              </li>
              <li>
                <span>{d.answer.day}</span>
                <strong>{date.day}</strong>
              </li>
              <li>
                <span>{d.answer.weekday}</span>
                <strong>{d.weekdayNames[date.weekday - 1] ?? '—'}</strong>
              </li>
            </ul>
          </section>

          <section class="solutions-card" aria-live="polite">
            <h2>{d.solutions.heading}</h2>
            {error !== null ? (
              <p class="error">{error}</p>
            ) : solution === null ? (
              <p class="muted">{d.solutions.none}</p>
            ) : (
              <>
                <p class="solution-count">
                  <strong>{index + 1}</strong>
                  <span>
                    {total !== null
                      ? d.solutions.outOf(total, true)
                      : d.solutions.outOf(list.length, false)}
                  </span>
                </p>
                <div class="solution-nav">
                  <button
                    type="button"
                    class="ghost"
                    disabled={index === 0}
                    onClick={() => setVariant(index - 1)}
                  >
                    {d.solutions.back}
                  </button>
                  <button
                    type="button"
                    class="ghost"
                    disabled={index >= list.length - 1}
                    onClick={() => setVariant(index + 1)}
                  >
                    {d.solutions.forward}
                  </button>
                  <button
                    type="button"
                    class="primary"
                    disabled={list.length < 2}
                    onClick={() => setVariant(randomOther(list.length, index))}
                  >
                    {d.solutions.random}
                  </button>
                </div>
                <div class="toggles">
                  <label class="toggle">
                    <input
                      type="checkbox"
                      checked={showPieces}
                      onChange={(event) =>
                        setShowPieces((event.currentTarget as HTMLInputElement).checked)
                      }
                    />
                    <span>{d.solutions.showPieces}</span>
                  </label>
                  <label class="toggle">
                    <input
                      type="checkbox"
                      checked={showLabels}
                      disabled={!showPieces}
                      onChange={(event) =>
                        setShowLabels((event.currentTarget as HTMLInputElement).checked)
                      }
                    />
                    <span>{d.solutions.showLabels}</span>
                  </label>
                </div>
                {enumerating ? <p class="muted">{d.solutions.searching}</p> : null}
                {reachedCap ? <p class="muted">{d.solutions.capped(MAX_SOLUTIONS)}</p> : null}
              </>
            )}
          </section>

          <PieceLegend />
          </aside>
        </div>

        <SolutionChart
          year={selection.year}
          month={selection.month}
          day={selection.day}
          onPickDate={(year, month, day) => change({ year, month, day })}
        />

        <HowToSolve />
      </main>

      <footer class="colophon">
        <p>{d.app.colophon}</p>
      </footer>
    </div>
  );
}

function randomOther(length: number, current: number): number {
  if (length < 2) return current;
  let next = current;
  while (next === current) next = Math.floor(Math.random() * length);
  return next;
}
