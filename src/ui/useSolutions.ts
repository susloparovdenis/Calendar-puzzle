import { useEffect, useRef, useState } from 'preact/hooks';
import { SearchLimitExceeded, solutions, type Solution } from '../core/solver.ts';
import type { PuzzleDate } from '../core/date.ts';

/** Upper bound on how many tilings are kept in memory for one date. */
export const MAX_SOLUTIONS = 20_000;

/** Time slice, in milliseconds, spent enumerating per animation frame. */
const FRAME_BUDGET_MS = 8;

export interface SolutionsState {
  /** Tilings found so far, in the solver's stable order. */
  readonly list: readonly Solution[];
  /** `true` while more tilings are still being enumerated in the background. */
  readonly enumerating: boolean;
  /** `true` once every tiling for this date has been found. */
  readonly complete: boolean;
  readonly error: string | null;
}

const EMPTY: SolutionsState = { list: [], enumerating: false, complete: false, error: null };

interface Scheduler {
  readonly schedule: (callback: () => void) => number;
  readonly cancel: (handle: number) => void;
  readonly now: () => number;
}

const defaultScheduler: Scheduler =
  typeof requestAnimationFrame === 'function'
    ? {
        schedule: (callback) => requestAnimationFrame(() => callback()),
        cancel: (handle) => cancelAnimationFrame(handle),
        now: () => performance.now(),
      }
    : {
        schedule: (callback) => setTimeout(callback, 0) as unknown as number,
        cancel: (handle) => clearTimeout(handle),
        now: () => Date.now(),
      };

/**
 * Enumerates every tiling for a date without blocking the page.
 *
 * The first tiling is produced synchronously so the board never flashes empty;
 * the rest are pulled from the generator in short slices between frames.
 */
export function useSolutions(date: PuzzleDate, scheduler: Scheduler = defaultScheduler): SolutionsState {
  const [state, setState] = useState<SolutionsState>(EMPTY);
  const handle = useRef<number | null>(null);

  const { month, day, weekday } = date;

  useEffect(() => {
    const target: PuzzleDate = { month, day, weekday };
    const iterator = solutions(target);
    const found: Solution[] = [];
    let cancelled = false;

    const publish = (enumerating: boolean, complete: boolean, error: string | null): void => {
      if (!cancelled) setState({ list: [...found], enumerating, complete, error });
    };

    const pump = (): void => {
      if (cancelled) return;
      const deadline = scheduler.now() + FRAME_BUDGET_MS;
      try {
        // At least one tiling per slice, so a slow host still makes progress
        // instead of rescheduling an empty slice forever.
        do {
          if (found.length >= MAX_SOLUTIONS) {
            publish(false, false, null);
            return;
          }
          const next = iterator.next();
          if (next.done === true) {
            publish(false, true, null);
            return;
          }
          found.push(next.value);
        } while (scheduler.now() < deadline);
      } catch (error: unknown) {
        publish(false, false, describe(error));
        return;
      }
      publish(true, false, null);
      handle.current = scheduler.schedule(pump);
    };

    try {
      const first = iterator.next();
      if (first.done === true) {
        publish(false, true, null);
        return () => {
          cancelled = true;
        };
      }
      found.push(first.value);
      publish(true, false, null);
    } catch (error: unknown) {
      publish(false, false, describe(error));
      return () => {
        cancelled = true;
      };
    }

    handle.current = scheduler.schedule(pump);

    return () => {
      cancelled = true;
      if (handle.current !== null) {
        scheduler.cancel(handle.current);
        handle.current = null;
      }
      iterator.return(undefined);
    };
  }, [month, day, weekday, scheduler]);

  return state;
}

function describe(error: unknown): string {
  if (error instanceof SearchLimitExceeded) return 'Поиск прерван: слишком много вариантов.';
  if (error instanceof Error) return error.message;
  return 'Неизвестная ошибка решателя.';
}
