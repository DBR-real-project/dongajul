/**
 * 공통 API 유틸리티
 * - Authorization 헤더 자동 첨부
 * - 401 응답 시 localStorage 클리어 + 자동 로그아웃
 */

const BASE_URL = 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userName');
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });

  if (res.status === 401 && !skipAuth) {
    clearAuth();
    window.location.reload();
    return res;
  }

  return res;
}

export async function apiPost<T>(path: string, body: unknown): Promise<{ res: Response; data: T }> {
  const res = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data: T = await res.json();
  return { res, data };
}
