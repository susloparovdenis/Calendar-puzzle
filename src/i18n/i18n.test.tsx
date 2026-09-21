// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { App } from '../ui/App.tsx';
import { PIECES } from '../core/pieces.ts';
import { DEFAULT_LANG, DICTIONARIES, LanguageProvider, storedLang } from './context.tsx';
import { LANGS, cellLabel, isLang, type Lang } from './dictionary.ts';
import { monthCell, weekdayCell } from '../core/board.ts';

afterEach(cleanup);
beforeEach(() => {
  window.localStorage.clear();
});

function renderApp(initial?: Lang) {
  return render(
    <LanguageProvider initial={initial}>
      <App />
    </LanguageProvider>,
  );
}

describe('the two dictionaries', () => {
  it('cover the same ground', () => {
    for (const lang of LANGS) {
      const d = DICTIONARIES[lang];
      expect(d.monthLabels).toHaveLength(12);
      expect(d.monthNames).toHaveLength(12);
      expect(d.weekdayLabels).toHaveLength(7);
      expect(d.weekdayNames).toHaveLength(7);
      expect(d.mottoLines).toHaveLength(2);
      expect(d.howto.steps).toHaveLength(6);
      for (const piece of PIECES) {
        expect(d.pieceNames[piece.id]).toBeTruthy();
      }
      for (const { id } of d.howto.pieces) {
        expect(PIECES.some((piece) => piece.id === id)).toBe(true);
      }
    }
  });

  it('keeps every engraving short enough for its cell', () => {
    for (const lang of LANGS) {
      const d = DICTIONARIES[lang];
      for (const label of [...d.monthLabels, ...d.weekdayLabels]) {
        expect(label.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it('counts in each language', () => {
    const { ru, en } = DICTIONARIES;
    expect(ru.solutionsWord(1)).toBe('решение');
    expect(ru.solutionsWord(3)).toBe('решения');
    expect(ru.solutionsWord(11)).toBe('решений');
    expect(en.solutionsWord(1)).toBe('solution');
    expect(en.solutionsWord(11)).toBe('solutions');
  });

  it('writes a date the way each language does', () => {
    expect(DICTIONARIES.ru.dayWithMonth(7, 6)).toBe('7 июня');
    expect(DICTIONARIES.en.dayWithMonth(7, 6)).toBe('June 7');
  });

  it('groups digits by locale', () => {
    expect((10374).toLocaleString(DICTIONARIES.en.locale)).toBe('10,374');
    expect((10374).toLocaleString(DICTIONARIES.ru.locale)).not.toBe('10374');
  });

  it('re-engraves the board cells', () => {
    expect(cellLabel(monthCell(1), DICTIONARIES.ru)).toBe('ЯНВ');
    expect(cellLabel(monthCell(1), DICTIONARIES.en)).toBe('JAN');
    expect(cellLabel(weekdayCell(7), DICTIONARIES.ru)).toBe('ВС');
    expect(cellLabel(weekdayCell(7), DICTIONARIES.en)).toBe('SUN');
  });
});

describe('isLang', () => {
  it('accepts the two codes and nothing else', () => {
    expect(isLang('ru')).toBe(true);
    expect(isLang('en')).toBe(true);
    expect(isLang('de')).toBe(false);
    expect(isLang(null)).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
});

describe('the language switch', () => {
  it('opens in Russian', () => {
    expect(DEFAULT_LANG).toBe('ru');
    renderApp();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Календарь');
    expect(screen.getByText('Открытые клетки')).toBeTruthy();
  });

  it('turns the whole page over to English', () => {
    const { container } = renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Calendar Puzzle');
    expect(screen.getByText('Open cells')).toBeTruthy();
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('How to solve it by hand')).toBeTruthy();
    expect(screen.getByText('How many solutions each day has')).toBeTruthy();
    expect(screen.getByText('The ten pieces')).toBeTruthy();

    // The engraving on the panel is re-cut, not left in Russian.
    const engraved = [...container.querySelectorAll('.engraving-month')].map(
      (node) => node.textContent,
    );
    expect(engraved).toContain('JAN');
    expect(engraved).not.toContain('ЯНВ');
    expect(container.textContent).toContain('A NEW DAY.');
  });

  it('comes back to Russian', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    fireEvent.click(screen.getByRole('button', { name: 'Русский' }));
    expect(screen.getByText('Открытые клетки')).toBeTruthy();
  });

  it('marks the active language for assistive tech', () => {
    renderApp();
    expect(screen.getByRole('button', { name: 'Русский' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('follows the choice with the document language', () => {
    renderApp();
    expect(document.documentElement.lang).toBe('ru');
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(document.documentElement.lang).toBe('en');
  });

  it('remembers the choice for the next visit', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(storedLang()).toBe('en');

    cleanup();
    renderApp(storedLang());
    expect(screen.getByText('Open cells')).toBeTruthy();
  });

  it('falls back to Russian when storage holds nonsense', () => {
    window.localStorage.setItem('calendar-puzzle:lang', 'klingon');
    expect(storedLang()).toBe('ru');
  });
});
