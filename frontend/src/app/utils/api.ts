/**
 * 공통 API 유틸리티
 * - Authorization: Bearer token 자동 첨부
 * - 401 응답 시 refresh_token 재시도
 * - refresh 실패 시 자동 로그아웃
 */

const BASE_URL = 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('userName');
  localStorage.removeItem('subscription_type');
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();

    if (!data.token) {
      return false;
    }

    localStorage.setItem('token', data.token);

    return true;
  } catch (err) {
    console.error('토큰 재발급 실패:', err);
    return false;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  _isRetry?: boolean;
}

export async function apiFetch(
  path: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { skipAuth = false, _isRetry = false, headers, ...fetchOptions } = options;

  const token = getToken();

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers: requestHeaders,
  });

  if (res.status === 401 && !skipAuth && !_isRetry) {
    const refreshed = await tryRefresh();

    if (refreshed) {
      return apiFetch(path, {
        ...options,
        _isRetry: true,
      });
    }

    clearAuth();
    window.location.href = '/';

    return res;
  }

  return res;
}

export async function apiFetchJson(
  path: string,
  options: RequestOptions = {}
) {
  const res = await apiFetch(path, options);

  let data: any = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      'API 요청 실패'
    );
  }

  return data;
}