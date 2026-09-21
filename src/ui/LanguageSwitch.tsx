import { LANGS } from '../i18n/dictionary.ts';
import { DICTIONARIES, useI18n } from '../i18n/context.tsx';

/** Two buttons in the masthead: the language is a one-click switch, not a menu. */
export function LanguageSwitch(): preact.JSX.Element {
  const { lang, d, setLang } = useI18n();
  return (
    <div class="lang-switch" role="group" aria-label={d.app.languageAria}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          class={code === lang ? 'is-active' : ''}
          lang={code}
          aria-pressed={code === lang}
          onClick={() => setLang(code)}
        >
          {DICTIONARIES[code].endonym}
        </button>
      ))}
    </div>
  );
}
