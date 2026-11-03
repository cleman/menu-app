import { render } from 'preact';
import { App } from './ui/App';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
render(<App />, document.getElementById('app')!);
