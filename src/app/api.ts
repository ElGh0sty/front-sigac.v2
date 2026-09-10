import { environment } from '../environments/environment';

export const DEFAULT_API_BASE = (environment.apiUrl || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

export function isModoAutonomo(): boolean {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('API_BASE');
    return custom === 'OFFLINE' || custom === 'MOCK' || custom === 'SIN_BACKEND';
  }
  return false;
}

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('API_BASE');
    if (custom) {
      const clean = custom.trim().replace(/\/+$/, '');
      if (clean === 'OFFLINE' || clean === 'MOCK' || clean === 'SIN_BACKEND') {
        return '';
      }
      // Si existía configuración residual anterior a puertos 7050 o 5291, migrar al backend activo (puerto 3000)
      if (clean.includes(':7050') || clean.includes(':5291')) {
        const corregido = clean.replace(/:[0-9]+/, ':3000').replace('https://', 'http://');
        localStorage.setItem('API_BASE', corregido);
        return corregido;
      }
      return clean;
    }

    const env = (window as any).__env__;
    if (env && env.API_BASE) {
      if (env.API_BASE === 'OFFLINE') return '';
      return env.API_BASE.trim().replace(/\/+$/, '');
    }

    // Valor predeterminado del backend Kestrel en puerto 3000
    return DEFAULT_API_BASE;
  }

  return DEFAULT_API_BASE;
}

export function getApiUrl(): string {
  const base = getApiBase();
  return base ? `${base}/api` : environment.apiUrl;
}

export function setApiBase(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim() || url.toUpperCase() === 'OFFLINE' || url.toUpperCase() === 'SIN_BACKEND') {
      localStorage.setItem('API_BASE', 'OFFLINE');
    } else {
      localStorage.setItem('API_BASE', url.trim().replace(/\/+$/, ''));
    }
  }
}

export const API_BASE = getApiBase();

