// React-Anbindung an den Settings-Store. useSyncExternalStore sorgt dafür, dass
// JEDE Komponente (auch tief liegende wie Die/DraftTable) bei einer Änderung
// neu rendert – ohne Provider/Prop-Drilling.

import { useSyncExternalStore } from 'react';
import { getSettings, subscribe, type Settings } from './settings';

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}
