/**
 * 공통 API 유틸리티
 * - Authorization 헤더 자동 첨부
 * - 401 응답 시 Refresh Token으로 재시도 → 실패 시 자동 로그아웃
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
}

/** refresh_token으로 새 access token 발급. 성공 시 true 반환 */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  _isRetry?: boolean;
}

export async function apiFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  const { skipAuth = false, _isRetry = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 401 && !skipAuth && !_isRetry) {
    // refresh token으로 재발급 시도
    const refreshed = await tryRefresh();
    if (refreshed) {
      // 새 토큰으로 원래 요청 재시도
      return apiFetch(path, { ...options, _isRetry: true });
    }
    // refresh도 실패 → 로그아웃
    clearAuth();
    window.location.reload();
  }

  return res; // ✅ 그대로 유지
}

export async function apiFetchJson(path: string, options: RequestOptions = {}) {
  const res = await apiFetch(path, options);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'API 요청 실패');
  }

  return data;
}
