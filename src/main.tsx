import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress font preload warning from AppKit
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('preloaded using link preload')) {
    return;
  }
  originalWarn.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
