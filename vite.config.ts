import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import {e2eCsp} from './scripts/dev/csp';
import {productionBuildProblems} from './scripts/dev/buildGuards';

/**
 * Tests de bout en bout (E2E_CSP=1, `npm run test:e2e`) : la CSP de production
 * (firebase.json) est appliquée par une balise <meta> au serveur de
 * développement, pour vérifier que l'application et ses fenêtres d'impression
 * fonctionnent sous cette politique (D49). Sans effet sur les builds.
 */
function e2eCspMeta(): Plugin {
  return {
    name: 'e2e-csp-meta',
    apply: 'serve',
    transformIndexHtml(html) {
      if (process.env.E2E_CSP !== '1') return html;
      const policy = e2eCsp().replace(/"/g, '&quot;');
      return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
    },
  };
}

export default defineConfig(({mode}) => {
  // Garde-fous du build de production (D70) : pas de jeton de débogage App Check
  // ni d'émulateurs venus de .env.local dans le bundle publié.
  const problems = productionBuildProblems(mode, loadEnv(mode, process.cwd(), 'VITE_'), process.env);
  if (problems.length) throw new Error(`Build de production refusé :\n- ${problems.join('\n- ')}`);
  return {
    plugins: [e2eCspMeta(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
