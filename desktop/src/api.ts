import { getLang } from './i18n';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5002/api';
const TOKEN_KEY = 'mechanicia.token';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string, public details?: { field: string; message: string }[]) {
    super(message);
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = tokenStore.get();
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': getLang(),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(getLang() === 'en' ? 'Could not reach the server. Make sure it is running.' : 'No se pudo conectar con el servidor. Verifica que esté en ejecución.', 0, 'NETWORK');
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.();
    const detail = data.details?.[0]?.message as string | undefined;
    throw new ApiError(detail ?? data.error ?? getLang() === 'en' ? 'An unexpected error occurred.' : 'Ocurrió un error inesperado.', response.status, data.code ?? 'ERROR', data.details);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};
