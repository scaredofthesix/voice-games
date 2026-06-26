import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UiLanguageProvider } from './uiLanguage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiLanguageProvider>
      <App />
    </UiLanguageProvider>
  </StrictMode>,
);
