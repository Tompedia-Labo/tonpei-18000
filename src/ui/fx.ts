// 演出の部品：文字送り、数え上げ、紙吹雪、トースト

import { lines } from './dom';
import { pixelCanvas } from './pixel/sprite';

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export type Typing = { done: Promise<void>; finish(): void; typing(): boolean };

/** 1文字ずつ出す。読み上げには全文を渡し、見た目の文字は aria-hidden にする */
export function typewriter(el: HTMLElement, text: string, opts: { speed?: number; instant?: boolean } = {}): Typing {
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  const vis = document.createElement('span');
  vis.setAttribute('aria-hidden', 'true');
  el.replaceChildren(sr, vis);
  const chars = [...text];
  let i = 0;
  let timer = 0;
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  const render = () => vis.replaceChildren(lines(chars.slice(0, i).join('')));
  const finish = () => {
    clearInterval(timer);
    i = chars.length;
    render();
    resolve();
  };
  if (opts.instant || reducedMotion()) finish();
  else
    timer = window.setInterval(() => {
      i = Math.min(chars.length, i + 1);
      render();
      if (i >= chars.length) finish();
    }, opts.speed ?? 26);
  return { done, finish, typing: () => i < chars.length };
}

/** 数え上げ。桁が大きいほど長くする */
export function countUp(el: HTMLElement, to: number, format: (n: number) => string, onDone?: () => void) {
  const digits = String(Math.round(to)).length;
  const duration = reducedMotion() ? 0 : 500 + digits * 260;
  const start = performance.now();
  const step = (t: number) => {
    const k = duration ? Math.min(1, (t - start) / duration) : 1;
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = format(k >= 1 ? to : Math.round(to * eased));
    if (k < 1) requestAnimationFrame(step);
    else onDone?.();
  };
  requestAnimationFrame(step);
}

const CONFETTI = ['#ff4f8b', '#ffd23f', '#22b7ea', '#6fcf3a', '#7c4dff', '#ff8a3d', '#ffffff'];

/** ドットの紙吹雪。stars なら星も混ぜる */
export function confetti(host: HTMLElement, opts: { count?: number; stars?: boolean; duration?: number } = {}) {
  if (reducedMotion()) return;
  const scale = 3;
  const w = Math.ceil(host.clientWidth / scale);
  const h = Math.ceil(host.clientHeight / scale);
  const [c, ctx] = pixelCanvas(w, h, 'px fx');
  host.append(c);
  const parts = Array.from({ length: opts.count ?? 70 }, () => ({
    x: Math.random() * w,
    y: -Math.random() * h * 0.6,
    vx: (Math.random() - 0.5) * 0.8,
    vy: 0.6 + Math.random() * 1.1,
    c: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
    star: !!opts.stars && Math.random() < 0.3,
    t: Math.random() * 10,
  }));
  const end = performance.now() + (opts.duration ?? 3200);
  let last = 0;
  const loop = (t: number) => {
    if (t > end) return c.remove();
    requestAnimationFrame(loop);
    if (t - last < 50) return;
    last = t;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.t++;
      p.x += p.vx + Math.sin(p.t / 4) * 0.4;
      p.y += p.vy;
      ctx.fillStyle = p.c;
      if (p.star) {
        const on = p.t % 6 < 4;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y) - 1, 1, 3);
        ctx.fillRect(Math.floor(p.x) - 1, Math.floor(p.y), 3, 1);
        if (on) ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
      } else ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.t % 4 < 2 ? 2 : 1, 1);
    }
  };
  requestAnimationFrame(loop);
}

export function flash() {
  if (reducedMotion()) return;
  const f = document.createElement('div');
  f.className = 'flash';
  document.body.append(f);
  setTimeout(() => f.remove(), 700);
}

export function toast(message: string) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = message;
  document.body.append(t);
  setTimeout(() => t.remove(), 3200);
}
