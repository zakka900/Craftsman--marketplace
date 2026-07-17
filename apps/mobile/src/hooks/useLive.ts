import { useEffect, useReducer } from 'react';
import { subscribe } from '../services/api';

/** Re-render del componente a ogni cambiamento del db mock (simula realtime). */
export function useLive() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => subscribe(force), []);
}
