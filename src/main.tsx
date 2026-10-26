import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initLanguage } from './i18n/language';
import { applyLastKnownTheme } from './theme/applyTheme';

// Thème de couleur (D84) : dernier thème connu sur l'appareil, avant de
// connaître l'école (écran de connexion, rechargement sans flash bleu).
applyLastKnownTheme();

const render = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

// Langue de l'interface (D93) : dernière langue choisie sur l'appareil. La
// couche de traduction (chunk séparé) n'est chargée que si c'est le français.
initLanguage().catch((e) => console.error('[i18n]', e)).finally(render);
