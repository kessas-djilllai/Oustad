import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initGlobalButtonProgress } from './lib/buttonProgress.ts';

// Prevent "Failed to fetch" errors from triggering the Vite error overlay
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('Failed to fetch')) {
    event.preventDefault();
    console.warn('Suppressed unhandled fetch error:', event.reason);
  }
});
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('Failed to fetch')) {
    event.preventDefault();
  }
});

initGlobalButtonProgress();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
