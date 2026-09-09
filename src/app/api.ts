export const DEFAULT_API_BASE = 'http://localhost:5291';

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
      // Evitar peticiones residuales al puerto 7050 o HTTPS desactualizado que provocan ERR_CONNECTION_REFUSED
      if (clean.includes(':7050')) {
        const corregido = clean.replace(':7050', ':5291').replace('https://', 'http://');
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

    // Valor predeterminado de la API en .NET: http://localhost:5291 (HTTP sin SSL)
    return DEFAULT_API_BASE;
  }

  return DEFAULT_API_BASE;
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

