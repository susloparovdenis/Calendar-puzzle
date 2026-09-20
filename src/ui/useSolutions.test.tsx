// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render } from '@testing-library/preact';
import { MAX_SOLUTIONS, useSolutions, type SolutionsState } from './useSolutions.ts';
import type { PuzzleDate } from '../core/date.ts';
import { countSolutions, type Solution } from '../core/solver.ts';

afterEach(cleanup);

/** A scheduler the test drives by hand, so enumeration advances one slice at a time. */
class ManualScheduler {
  private readonly queued = new Map<number, () => void>();
  private nextHandle = 1;
  private clock = 0;
  /** Milliseconds `now()` advances per call, i.e. the length of one enumerated step. */
  public tickSize = 0;

  readonly schedule = (callback: () => void): number => {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.queued.set(handle, callback);
    return handle;
  };

  readonly cancel = (handle: number): void => {
    this.queued.delete(handle);
  };

  readonly now = (): number => {
    this.clock += this.tickSize;
    return this.clock;
  };

  get pending(): number {
    return this.queued.size;
  }

  /** Runs every queued slice; returns false once nothing is left to run. */
  flushOnce(): boolean {
    const callbacks = [...this.queued.values()];
    this.queued.clear();
    act(() => {
      for (const callback of callbacks) callback();
    });
    return callbacks.length > 0;
  }

  flushAll(limit = 20_000): void {
    for (let i = 0; i < limit; i += 1) {
      if (!this.flushOnce()) return;
    }
    throw new Error('enumeration did not finish');
  }
}

function harness(date: PuzzleDate, scheduler: ManualScheduler) {
  const states: SolutionsState[] = [];
  function Probe({ target }: { readonly target: PuzzleDate }): null {
    states.push(useSolutions(target, scheduler));
    return null;
  }
  let utils!: ReturnType<typeof render>;
  act(() => {
    utils = render(<Probe target={date} />);
  });
  return { states, latest: () => states[states.length - 1], ...utils };
}

const date = (month: number, day: number, weekday: number): PuzzleDate =>
  ({ month, day, weekday }) as PuzzleDate;

describe('useSolutions', () => {
  it('has the first tiling ready on the very first render', () => {
    const scheduler = new ManualScheduler();
    const { latest } = harness(date(9, 20, 7), scheduler);
    const state = latest();
    expect(state?.list).toHaveLength(1);
    expect(state?.enumerating).toBe(true);
    expect(state?.complete).toBe(false);
    expect(state?.error).toBeNull();
  });

  it('does not block: it leaves more work scheduled', () => {
    const scheduler = new ManualScheduler();
    harness(date(9, 20, 7), scheduler);
    expect(scheduler.pending).toBe(1);
  });

  it('finds every tiling once the slices have all run', () => {
    const scheduler = new ManualScheduler();
    const target = date(9, 20, 7);
    const { latest } = harness(target, scheduler);
    scheduler.flushAll();
    const state = latest();
    expect(state?.complete).toBe(true);
    expect(state?.enumerating).toBe(false);
    expect(state?.list).toHaveLength(countSolutions(target));
  });

  it('adds tilings a slice at a time when each slice is short', () => {
    const scheduler = new ManualScheduler();
    scheduler.tickSize = 100; // every slice blows the 8ms budget immediately
    const { latest } = harness(date(9, 20, 7), scheduler);
    const before = latest()?.list.length ?? 0;
    scheduler.flushOnce();
    const after = latest()?.list.length ?? 0;
    expect(after).toBeGreaterThan(before);
    expect(latest()?.complete).toBe(false);
  });

  it('stops scheduling work once the component goes away', () => {
    const scheduler = new ManualScheduler();
    const { unmount } = harness(date(9, 20, 7), scheduler);
    unmount();
    scheduler.flushOnce();
    expect(scheduler.pending).toBe(0);
  });

  it('keeps every tiling distinct', () => {
    const scheduler = new ManualScheduler();
    const { latest } = harness(date(2, 29, 4), scheduler);
    scheduler.flushAll();
    const list: readonly Solution[] = latest()?.list ?? [];
    expect(list.length).toBeGreaterThan(0);
    const keys = list.map((solution) =>
      JSON.stringify([...solution].sort((a, b) => a.pieceId.localeCompare(b.pieceId))),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps at most MAX_SOLUTIONS tilings in memory', () => {
    const scheduler = new ManualScheduler();
    const { latest } = harness(date(1, 1, 1), scheduler);
    scheduler.flushAll();
    expect(latest()?.list.length).toBeLessThanOrEqual(MAX_SOLUTIONS);
  });
});
