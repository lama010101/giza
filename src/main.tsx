import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { debugOverlay } from '@/scene/debugOverlay';
import './index.css';

if (import.meta.env.DEV) {
  (window as unknown as { __GIZA_DEBUG__: typeof debugOverlay }).__GIZA_DEBUG__ = debugOverlay;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
