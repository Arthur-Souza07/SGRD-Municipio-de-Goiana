import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA/offline support
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      // Optional: show a toast to user that a new version is available
      if (confirm('Nova versão disponível. Atualizar agora?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('[PWA] Aplicação pronta para uso offline');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
