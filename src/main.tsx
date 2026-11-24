import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration skipped in unsupported environments
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
