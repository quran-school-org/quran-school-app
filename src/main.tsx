import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { frTestEnabled } from './config/env';
import { applyPalette, readPalette } from './ui/palette';

// Couleur choisie par la personne (D85), appliquée avant le premier rendu.
applyPalette(readPalette());

const render = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

// Traduction française de TEST (D79) : module chargé seulement si le drapeau
// de build est vrai ; absent du bundle de production. Retrait : supprimer ce
// bloc (garder `render()`), le dossier src/i18n-test et le drapeau.
if (frTestEnabled) {
  import('./i18n-test').then((m) => m.installFrTest(), (e) => console.error('[i18n-test]', e)).finally(render);
} else {
  render();
}
