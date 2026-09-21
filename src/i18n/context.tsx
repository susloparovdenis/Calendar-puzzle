import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { EN } from './en.ts';
import { RU } from './ru.ts';
import { isLang, type Dictionary, type Lang } from './dictionary.ts';

/**
 * The chosen language, kept in a context so every component reads the same
 * dictionary, and remembered per browser. Russian is the default: the board is
 * a replica of a Russian set, and a first visit should look like one.
 */

export const DICTIONARIES: Readonly<Record<Lang, Dictionary>> = { ru: RU, en: EN };

export const DEFAULT_LANG: Lang = 'ru';

const STORAGE_KEY = 'calendar-puzzle:lang';

export interface I18n {
  readonly lang: Lang;
  readonly d: Dictionary;
  readonly setLang: (next: Lang) => void;
  /** Groups digits the way the current language does. */
  readonly n: (value: number) => string;
}

const I18nContext = createContext<I18n>({
  lang: DEFAULT_LANG,
  d: DICTIONARIES[DEFAULT_LANG],
  setLang: () => undefined,
  n: (value: number) => value.toLocaleString(DICTIONARIES[DEFAULT_LANG].locale),
});

/** The remembered choice, or the default when storage is empty or unavailable. */
export function storedLang(): Lang {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Private mode or blocked storage: fall back to the default.
  }
  return DEFAULT_LANG;
}

export function LanguageProvider({
  children,
  initial,
}: {
  readonly children: ComponentChildren;
  /** Overrides the remembered choice; used by tests. */
  readonly initial?: Lang | undefined;
}): preact.JSX.Element {
  const [lang, setLangState] = useState<Lang>(() => initial ?? storedLang());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not being able to remember the choice must not break switching it.
    }
  }, []);

  // Screen readers and hyphenation follow the document's language, not ours.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = DICTIONARIES[lang].app.title;
  }, [lang]);

  const value = useMemo<I18n>(() => {
    const d = DICTIONARIES[lang];
    return { lang, d, setLang, n: (value: number) => value.toLocaleString(d.locale) };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  return useContext(I18nContext);
}
