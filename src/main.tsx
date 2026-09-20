import { render } from 'preact';
import { App } from './ui/App.tsx';
import './styles.css';

const root = document.getElementById('root');
if (root === null) throw new Error('#root is missing from the document');
render(<App />, root);
