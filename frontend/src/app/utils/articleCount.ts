import { useState, useEffect } from 'react';
import { apiFetch } from './api';

let cached: string | null = null;
let pending: Promise<string> | null = null;

function fetchCount(): Promise<string> {
  if (!pending) {
    pending = apiFetch('/api/articles/stats')
      .then(r => r.json())
      .then(d => {
        cached = Number(d.total_articles).toLocaleString('ko-KR');
        return cached;
      })
      .catch(() => {
        pending = null;
        return '—';
      });
  }
  return pending;
}

export function useArticleCount(): string {
  const [count, setCount] = useState<string>(cached ?? '');

  useEffect(() => {
    if (cached) { setCount(cached); return; }
    fetchCount().then(setCount);
  }, []);

  return count;
}
