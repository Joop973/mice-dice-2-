// Kleiner Hinweis-Toast für die PWA: meldet „offline spielbereit" und – falls ein
// neuer Service-Worker bereitsteht – „neue Version verfügbar" mit Neu-laden-Knopf.
// Wird in main.tsx neben <App/> gerendert (global, außerhalb der Screen-Logik).

import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaToast() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="pwa-toast" role="status" aria-live="polite">
      <span>{needRefresh ? '🧀 Neue Version verfügbar.' : '🧀 Offline spielbereit.'}</span>
      {needRefresh && <button onClick={() => updateServiceWorker(true)}>Neu laden</button>}
      <button className="ghost pwa-toast__close" onClick={close} aria-label="Schließen">
        ✕
      </button>
    </div>
  );
}
