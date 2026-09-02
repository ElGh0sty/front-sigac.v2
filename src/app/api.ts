export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('API_BASE');
    if (custom) return custom.trim().replace(/\/+$/, '');

    const env = (window as any).__env__;
    if (env && env.API_BASE) return env.API_BASE.trim().replace(/\/+$/, '');

    // En desarrollo, el Angular proxy expone /api en el mismo origen (localhost:3000),
    // así evitamos CORS y redirects en preflight. Si se usa un backend externo, la
    // URL se puede guardar manualmente en localStorage.
    return '';
  }

  return '';
}

export function setApiBase(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('API_BASE');
    } else {
      localStorage.setItem('API_BASE', url.trim().replace(/\/+$/, ''));
    }
  }
}

export const API_BASE = getApiBase();

