import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Anti-copy protection: block copy and cut, but allow paste
if (typeof document !== 'undefined') {
  document.addEventListener('copy', (e) => {
    // Allow copy in inputs/textareas
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return; // allow copy from form fields
    }
    e.preventDefault();
  });

  document.addEventListener('cut', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    e.preventDefault();
  });
  // paste is NOT blocked — users can paste freely
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
