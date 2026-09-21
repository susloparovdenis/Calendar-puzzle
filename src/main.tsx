import { render } from 'preact';
import { LanguageProvider } from './i18n/context.tsx';
import { App } from './ui/App.tsx';
import './styles.css';

const root = document.getElementById('root');
if (root === null) throw new Error('#root is missing from the document');
render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
  root,
);
