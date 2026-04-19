import { useSyncExternalStore } from 'react';

type FallbackDomains = Record<string, boolean>;

const fallbackDomains: FallbackDomains = {};
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => Object.values(fallbackDomains).some(Boolean);

export const setBackendFallbackActive = (domain: string, active: boolean) => {
  const previous = Boolean(fallbackDomains[domain]);
  if (previous === active) return;
  fallbackDomains[domain] = active;
  listeners.forEach((listener) => listener());
};

export function useFallbackMode() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
