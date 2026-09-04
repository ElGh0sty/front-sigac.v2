export const DEFAULT_API_BASE = 'http://localhost:5291';

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('API_BASE');
    if (custom) {
      const clean = custom.trim().replace(/\/+$/, '');
      // Evitar peticiones residuales al puerto 7050 o HTTPS desactualizado que provocan ERR_CONNECTION_REFUSED
      if (clean.includes(':7050')) {
        const corregido = clean.replace(':7050', ':5291').replace('https://', 'http://');
        localStorage.setItem('API_BASE', corregido);
        return corregido;
      }
      return clean;
    }

    const env = (window as any).__env__;
    if (env && env.API_BASE) return env.API_BASE.trim().replace(/\/+$/, '');

    // Valor predeterminado de la API en .NET: http://localhost:5291 (HTTP sin SSL)
    return DEFAULT_API_BASE;
  }

  return DEFAULT_API_BASE;
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

