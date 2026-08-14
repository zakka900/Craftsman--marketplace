import { useEffect, useReducer } from 'react';
import { subscribe } from '../services/api';

/** Re-renders the component on every change to the mock db (simulates realtime). */
export function useLive() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => subscribe(force), []);
}
