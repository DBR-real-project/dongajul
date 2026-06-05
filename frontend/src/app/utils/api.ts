/**
 * 공통 API 유틸리티
 * - Authorization 헤더 자동 첨부
 * - 401 응답 시 자동 로그아웃 (localStorage 클리어 + 리로드)
 */

const BASE_URL = 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function handleUnauthorized() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
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
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 401 && !skipAuth) {
    handleUnauthorized();
    // 아래 코드는 실행되지 않지만 TypeScript 타입을 위해 반환
    return res;
  }

  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<{ res: Response; data: T }> {
  const res = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data: T = await res.json();
  return { res, data };
}
