import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import './styles.css';
import { MotionConfig } from 'motion/react';
import App from './App';
import { AuthProvider } from './auth';
import { I18nProvider } from './i18n';

document.documentElement.dataset.theme = localStorage.getItem('mechanicia.theme') === 'light' ? 'light' : 'dark';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </MotionConfig>
  </StrictMode>
);
