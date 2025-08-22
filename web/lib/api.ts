// Minimal API wrapper for frontend
// Provides: request(), getHealth(), login(), setAuthToken()

export type HealthResponse = {
  status: string;
  uptime?: number;
  version?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token?: string;
  user?: { id: string | number; email?: string; name?: string } | null;
  message?: string;
};

export class ApiError<T = unknown> extends Error {
  status: number;
  data?: T;
  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

const DEFAULT_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 10000);

function getBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (env && typeof env === 'string') return env.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'http://localhost:3000';
}

function buildUrl(path: string, query?: Record<string, any>): string {
  const base = getBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(p, base);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, String(item));
      } else if (v instanceof Date) {
        url.searchParams.set(k, v.toISOString());
      } else if (typeof v === 'object') {
        url.searchParams.set(k, JSON.stringify(v));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

export async function request<T = unknown>(args: {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  timeoutMs?: number;
  credentials?: RequestCredentials; // default: include (supports cookie-based auth)
}): Promise<T> {
  const { path, method = 'GET', query, body, headers, timeoutMs = DEFAULT_TIMEOUT_MS, credentials = 'include' } = args;
  const url = buildUrl(path, query);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const init: RequestInit = {
    method,
    headers: { ...(headers || {}) },
    signal: controller.signal,
    credentials,
  };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;

  if (body !== undefined && body !== null) {
    if (!isFormData && !isBlob && typeof body !== 'string') {
      (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    } else {
      init.body = body as any;
    }
  }

  if (authToken) {
    (init.headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';

    let data: any = null;
    if (res.status !== 204) {
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        data = await res.text().catch(() => null);
      }
    }

    if (!res.ok) {
      const message = (data && (data.message || data.error)) || `Request failed with status ${res.status}`;
      throw new ApiError(message, res.status, data);
    }

    return data as T;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError('Request timed out', 408);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || 'Network error', 0);
  } finally {
    clearTimeout(timer);
  }
}

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>({ path: '/health', method: 'GET' });
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>({ path: '/auth/login', method: 'POST', body: payload });
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}
