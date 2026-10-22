// LPの仙台のドット地図（イメージ図。実際の地図とは異なる）。
// 要確認：キャンパスと川・地下鉄の位置関係は大まかなイメージ

import type { Campus } from '../../core/types';
import { PX } from './palette';
import { hashRng, pixelCanvas } from './sprite';

export const MAP_W = 120;
export const MAP_H = 72;

export const CAMPUS_POS: Record<Campus, { x: number; y: number }> = {
  aobayama: { x: 20, y: 40 },
  kawauchi: { x: 44, y: 30 },
  katahira: { x: 78, y: 52 },
  seiryo: { x: 74, y: 14 },
};

const RIVER: [number, number][] = [
  [30, 0], [36, 12], [52, 18], [56, 30], [60, 42], [72, 48], [90, 60], [104, 66], [120, 70],
];
const SUBWAY: [number, number][] = [
  [20, 44], [44, 36], [64, 36], [84, 38], [104, 38], [120, 40],
];

type Ctx = CanvasRenderingContext2D;
const px = (ctx: Ctx, c: string, x: number, y: number, w = 1, h = 1) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};

function along(path: [number, number][], each: (x: number, y: number, i: number) => void, step = 1) {
  let n = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [x0, y0] = path[i];
    const [x1, y1] = path[i + 1];
    const len = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k < len; k += step) each(x0 + ((x1 - x0) * k) / len, y0 + ((y1 - y0) * k) / len, n++);
  }
}

function drawBase(ctx: Ctx) {
  px(ctx, '#9fdc7c', 0, 0, MAP_W, MAP_H);
  const r = hashRng(7);
  // 西の山並み（青葉山のあたり）
  for (let i = 0; i < 70; i++) {
    const x = r() * 34;
    const y = r() * MAP_H;
    px(ctx, i % 3 ? '#5fae5a' : '#478f4a', x, y, 3, 2);
  }
  // 街並み（東側）
  for (let y = 4; y < MAP_H - 4; y += 6)
    for (let x = 62; x < MAP_W - 2; x += 7) {
      if (r() < 0.25) continue;
      px(ctx, r() < 0.5 ? '#f3ead8' : '#e6dcf6', x, y, 5, 4);
      px(ctx, '#c9bfa6', x, y + 3, 5, 1);
    }
  // 道
  for (let x = 58; x < MAP_W; x++) px(ctx, '#e9e4f2', x, 26, 1, 1);
  for (let y = 0; y < MAP_H; y++) px(ctx, '#e9e4f2', 96, y, 1, 1);
  // 広瀬川
  along(RIVER, (x, y) => {
    px(ctx, PX.water, x - 2, y - 1, 5, 3);
  });
  along(RIVER, (x, y, i) => {
    if (i % 5 === 0) px(ctx, PX.waterLight, x, y, 2, 1);
  });
  // 地下鉄（東西線のイメージ）
  along(SUBWAY, (x, y, i) => {
    if (i % 3 !== 2) px(ctx, '#7c4dff', x, y, 1, 1);
  });
  // キャンパスの建物
  for (const [key, p] of Object.entries(CAMPUS_POS) as [Campus, { x: number; y: number }][]) {
    const wall = key === 'katahira' ? PX.brick : key === 'seiryo' ? '#f4f4f8' : key === 'aobayama' ? '#cfd8e6' : PX.beige;
    px(ctx, '#2a1660', p.x - 6, p.y - 5, 13, 9);
    px(ctx, wall, p.x - 5, p.y - 4, 11, 7);
    for (let i = 0; i < 3; i++) px(ctx, '#5d7ea8', p.x - 4 + i * 4, p.y - 2, 2, 2);
    px(ctx, '#ff4f8b', p.x - 1, p.y + 1, 2, 2);
  }
}

export type MapView = { canvas: HTMLCanvasElement; setPeople(c: Partial<Record<Campus, number>>): void; start(): void; stop(): void };

/** walkers：キャンパスの周りを歩く小さな人（実際にプレイ中の人数。最大30） */
export function mapView(): MapView {
  const [canvas, ctx] = pixelCanvas(MAP_W, MAP_H, 'px map');
  const [base, bctx] = pixelCanvas(MAP_W, MAP_H);
  drawBase(bctx);
  let walkers: { campus: Campus; a: number; r: number; c: string }[] = [];
  let tick = 0;
  let raf = 0;
  let last = 0;
  const colors = ['#ff4f8b', '#22b7ea', '#ffd23f', '#7c4dff', '#ff8a3d'];
  const draw = () => {
    ctx.drawImage(base, 0, 0);
    // 雲の影
    const cx = (tick * 0.3) % (MAP_W + 30) - 30;
    ctx.fillStyle = 'rgba(42,22,96,0.08)';
    ctx.fillRect(Math.round(cx), 8, 18, 4);
    ctx.fillRect(Math.round(cx) + 4, 6, 10, 2);
    // 電車
    const total = SUBWAY.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - SUBWAY[i - 1][0], p[1] - SUBWAY[i - 1][1]) : 0), 0);
    let d = (tick * 0.8) % total;
    for (let i = 1; i < SUBWAY.length; i++) {
      const [x0, y0] = SUBWAY[i - 1];
      const [x1, y1] = SUBWAY[i];
      const seg = Math.hypot(x1 - x0, y1 - y0);
      if (d <= seg) {
        px(ctx, '#2a1660', x0 + ((x1 - x0) * d) / seg - 3, y0 + ((y1 - y0) * d) / seg - 2, 7, 4);
        px(ctx, PX.yellow, x0 + ((x1 - x0) * d) / seg - 2, y0 + ((y1 - y0) * d) / seg - 1, 5, 2);
        break;
      }
      d -= seg;
    }
    for (const w of walkers) {
      const p = CAMPUS_POS[w.campus];
      const x = p.x + Math.cos(w.a) * w.r;
      const y = p.y + 6 + Math.sin(w.a) * w.r * 0.45;
      px(ctx, '#2a1660', x, y - 1, 1, 1);
      px(ctx, w.c, x, y, 1, 2);
    }
  };
  draw();
  return {
    canvas,
    setPeople(counts) {
      const next: typeof walkers = [];
      let budget = 30;
      for (const [campus, n] of Object.entries(counts) as [Campus, number][]) {
        for (let i = 0; i < Math.min(n, budget); i++) next.push(walkers.find((w) => w.campus === campus && !next.includes(w)) ?? { campus, a: Math.random() * 6.28, r: 7 + Math.random() * 5, c: colors[next.length % colors.length] });
        budget -= Math.min(n, budget);
      }
      walkers = next;
      draw();
    },
    start() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const loop = (t: number) => {
        raf = requestAnimationFrame(loop);
        if (t - last < 90) return;
        last = t;
        tick++;
        for (const w of walkers) w.a += 0.05 + (w.r % 2) * 0.02;
        draw();
      };
      raf = requestAnimationFrame(loop);
    },
    stop() {
      cancelAnimationFrame(raf);
    },
  };
}
