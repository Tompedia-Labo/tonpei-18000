// プレイ数のAPI（Cloudflare Pages Functions）。失敗してもゲームは動き、カウンターの欄だけ隠す。
// 送るのは匿名のプレイIDとキャンパスだけ。学部や家計は送らない。

import type { Campus } from '../core/types';

export type PlayStats = {
  entered: number;
  finished: number;
  campus: Partial<Record<Campus, number>>;
  /** 開発用のダミー値なら true */
  mock?: boolean;
};

const TIMEOUT = 3000;

export async function fetchStats(): Promise<PlayStats | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    const res = await fetch('/api/stats', { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) throw new Error(String(res.status));
    return (await res.json()) as PlayStats;
  } catch {
    return import.meta.env.DEV ? mockStats() : null;
  }
}

/** 開発中だけ使うダミー。画面にも「開発用のダミー値」と出す */
let mockBase = 0;
function mockStats(): PlayStats {
  mockBase += 1 + Math.floor(Math.random() * 3);
  return { entered: 120 + mockBase, finished: 80 + Math.floor(mockBase * 0.7), campus: { kawauchi: 14, aobayama: 9, seiryo: 3 }, mock: true };
}

export function newPlayId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function sendPlay(type: 'start' | 'campus' | 'finish', id: string, campus?: Campus) {
  try {
    const body = JSON.stringify({ type, id, campus });
    if (!navigator.sendBeacon?.('/api/play', new Blob([body], { type: 'application/json' })))
      fetch('/api/play', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {});
  } catch {
    // 数えられなくても遊べる
  }
}
