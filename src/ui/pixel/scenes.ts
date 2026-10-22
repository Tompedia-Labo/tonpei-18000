// イベント欄のシーン（96×72のドット絵）。キャンパス×季節×時間で背景を変え、自分のキャラを入れる。
// 実在の建物の写しにはしない（イメージ）。校章・ロゴ・公式キャラクターは描かない。

import { drawCharacter, type Look } from './character';
import { PX } from './palette';
import { hashRng, pixelCanvas } from './sprite';

export const SCENE_W = 96;
export const SCENE_H = 72;

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type SceneKey =
  | 'kawauchi' | 'aobayama' | 'seiryo' | 'katahira' | 'hirosegawa' | 'nishikoen' | 'matsushima'
  | 'lab' | 'gakushoku' | 'room' | 'ceremony' | 'conference' | 'rain';

export const SCENE_KEYS: SceneKey[] = ['kawauchi', 'aobayama', 'seiryo', 'katahira', 'hirosegawa', 'nishikoen', 'matsushima', 'lab', 'gakushoku', 'room', 'ceremony', 'conference', 'rain'];

export type SceneOpts = { season: Season; seed: number; look?: Look | null };

type Ctx = CanvasRenderingContext2D;
const rect = (ctx: Ctx, c: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
};

/** 2色の帯をドットのディザでつなぐ空 */
function sky(ctx: Ctx, top: string, bottom: string, h = SCENE_H) {
  const band = Math.ceil(h / 6);
  for (let i = 0; i < 6; i++) rect(ctx, i < 3 ? top : bottom, 0, i * band, SCENE_W, band);
  for (let x = 0; x < SCENE_W; x += 2) {
    rect(ctx, bottom, x + ((x / 2) % 2), band * 3 - 2, 1, 1);
    rect(ctx, top, x, band * 3 + 1, 1, 1);
  }
}

const SKY: Record<Season, [string, string]> = {
  spring: ['#9fd3f7', '#dcefff'],
  summer: ['#4aa7ee', '#b9e1fb'],
  autumn: ['#86b9e8', '#f3dcc0'],
  winter: ['#aebdd3', '#e4ebf4'],
};
const GROUND: Record<Season, [string, string]> = {
  spring: ['#8fd07a', '#68b45e'],
  summer: ['#5fb45a', '#3f9450'],
  autumn: ['#c8b26a', '#a8904e'],
  winter: ['#f4f7fb', '#d6deea'],
};

function tree(ctx: Ctx, x: number, y: number, season: Season, size = 1) {
  const r = 5 * size;
  rect(ctx, PX.woodDark, x - 1, y - 2, 2, 8 * size);
  if (season === 'winter') {
    rect(ctx, PX.woodDark, x - 4 * size, y - 4 * size, 1, 3);
    rect(ctx, PX.woodDark, x + 3 * size, y - 5 * size, 1, 4);
    rect(ctx, PX.snow, x - 4 * size, y - 5 * size, 2, 1);
    rect(ctx, PX.snow, x + 2 * size, y - 6 * size, 3, 1);
    return;
  }
  const [main, dark, light] =
    season === 'spring' ? [PX.sakura, PX.sakuraDeep, '#fde3ee'] : season === 'autumn' ? [PX.leafYellow, PX.leafAutumn, '#f8d878'] : ['#4fa860', '#2f7d48', '#7cc77a'];
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const c = dy > r / 3 || dx > r / 2 ? dark : dx < -r / 3 && dy < -r / 3 ? light : main;
      rect(ctx, c, x + dx, y - r + dy, 1, 1);
    }
}

function building(ctx: Ctx, x: number, y: number, w: number, h: number, wall: string, shade: string, win: string, cols = 0, rows = 0) {
  rect(ctx, wall, x, y, w, h);
  rect(ctx, shade, x, y, w, 1);
  rect(ctx, shade, x + w - 1, y, 1, h);
  const cw = cols || Math.floor((w - 2) / 4);
  const rw = rows || Math.floor((h - 3) / 5);
  for (let r = 0; r < rw; r++) for (let c = 0; c < cw; c++) rect(ctx, win, x + 2 + c * 4, y + 3 + r * 5, 2, 3);
}

function person(ctx: Ctx, x: number, y: number, color: string) {
  rect(ctx, PX.ink, x, y, 3, 2);
  rect(ctx, color, x, y + 2, 3, 3);
  rect(ctx, PX.inkSoft, x, y + 5, 1, 2);
  rect(ctx, PX.inkSoft, x + 2, y + 5, 1, 2);
}

function ground(ctx: Ctx, season: Season, y: number) {
  const [g, d] = GROUND[season];
  rect(ctx, g, 0, y, SCENE_W, SCENE_H - y);
  const r = hashRng(y * 31);
  for (let i = 0; i < 40; i++) rect(ctx, d, Math.floor(r() * SCENE_W), y + 1 + Math.floor(r() * (SCENE_H - y - 1)), 2, 1);
}

function cloud(ctx: Ctx, x: number, y: number) {
  rect(ctx, PX.white, x + 2, y, 8, 2);
  rect(ctx, PX.white, x, y + 2, 13, 2);
  rect(ctx, '#e3ecf7', x + 1, y + 4, 11, 1);
}

function indoorWall(ctx: Ctx, wall: string, floor: string, floorY: number) {
  rect(ctx, wall, 0, 0, SCENE_W, floorY);
  rect(ctx, floor, 0, floorY, SCENE_W, SCENE_H - floorY);
  for (let x = 0; x < SCENE_W; x += 8) rect(ctx, 'rgba(0,0,0,0.08)', x, floorY, 1, SCENE_H - floorY);
}

function windowFrame(ctx: Ctx, x: number, y: number, w: number, h: number, season: Season, night: boolean) {
  rect(ctx, PX.woodDark, x - 1, y - 1, w + 2, h + 2);
  if (night) {
    rect(ctx, PX.night, x, y, w, h);
    rect(ctx, PX.nightBlue, x, y + h / 2, w, h / 2);
    rect(ctx, PX.yellow, x + w - 6, y + 3, 3, 3);
    rect(ctx, PX.white, x + 3, y + 4, 1, 1);
    rect(ctx, PX.white, x + 8, y + 2, 1, 1);
  } else {
    const [t, b] = SKY[season];
    rect(ctx, t, x, y, w, h / 2);
    rect(ctx, b, x, y + h / 2, w, h / 2);
    if (season === 'winter') rect(ctx, PX.snow, x, y + h - 2, w, 2);
  }
  rect(ctx, PX.woodDark, x + w / 2, y, 1, h);
  rect(ctx, PX.woodDark, x, y + h / 2, w, 1);
}

// ── シーンごとの絵
const DRAW: Record<SceneKey, (ctx: Ctx, o: SceneOpts) => void> = {
  kawauchi(ctx, { season }) {
    sky(ctx, ...SKY[season]);
    cloud(ctx, 60, 6);
    // 背後の山並み（イメージ）
    for (let x = 0; x < SCENE_W; x++) rect(ctx, '#5c8f6a', x, 26 + Math.round(3 * Math.sin(x / 9)), 1, 10);
    building(ctx, 8, 28, 80, 18, PX.beige, PX.beigeDark, '#7d8fb0', 19, 3);
    ground(ctx, season, 46);
    rect(ctx, '#d8cdb5', 0, 56, SCENE_W, 6);
    [16, 40, 64, 86].forEach((x) => tree(ctx, x, 48, season));
    person(ctx, 50, 52, PX.blue);
    person(ctx, 56, 53, '#b5476f');
  },
  aobayama(ctx, { season }) {
    sky(ctx, ...SKY[season]);
    cloud(ctx, 8, 8);
    // 坂（左下から右上へ）
    const [g, d] = GROUND[season];
    for (let x = 0; x < SCENE_W; x++) {
      const top = 62 - Math.floor(x * 0.42);
      rect(ctx, g, x, top, 1, SCENE_H - top);
      if (x % 5 === 0) rect(ctx, d, x, top + 3, 2, 1);
    }
    building(ctx, 58, 12, 30, 22, '#c9d3e0', '#9aa8bd', '#5d7ea8', 7, 4);
    building(ctx, 44, 22, 16, 14, '#e2e6ee', '#aab3c4', '#5d7ea8', 3, 2);
    // 坂道
    for (let x = 0; x < 70; x++) rect(ctx, '#bdb7a6', x, 66 - Math.floor(x * 0.42), 1, 2);
    tree(ctx, 20, 56, season);
    tree(ctx, 34, 50, season);
  },
  seiryo(ctx, { season }) {
    sky(ctx, ...SKY[season]);
    building(ctx, 30, 6, 40, 42, '#f2f2f5', '#c8c8d4', '#7aa0c8', 9, 8);
    building(ctx, 70, 24, 20, 24, '#e6e3ee', '#bdb8cc', '#7aa0c8', 4, 4);
    ground(ctx, season, 48);
    rect(ctx, '#d8cdb5', 0, 58, SCENE_W, 5);
    tree(ctx, 14, 50, season, 1.2);
    tree(ctx, 84, 52, season);
  },
  katahira(ctx, { season }) {
    sky(ctx, ...SKY[season]);
    // レンガ造りの建物（イメージ）
    rect(ctx, PX.brick, 18, 20, 60, 28);
    rect(ctx, PX.brickDark, 18, 20, 60, 2);
    rect(ctx, PX.brick, 42, 10, 12, 12);
    rect(ctx, PX.brickDark, 42, 10, 12, 2);
    for (let i = 0; i < 7; i++) {
      rect(ctx, PX.paper, 22 + i * 8, 26, 4, 7);
      rect(ctx, PX.paper, 22 + i * 8, 37, 4, 7);
      rect(ctx, PX.brickDark, 22 + i * 8, 25, 4, 1);
    }
    ground(ctx, season, 48);
    tree(ctx, 10, 52, season);
    tree(ctx, 86, 52, season);
  },
  hirosegawa(ctx, { season }) {
    sky(ctx, ...SKY[season]);
    for (let x = 0; x < SCENE_W; x++) rect(ctx, '#5c8f6a', x, 28 + Math.round(2 * Math.sin(x / 7)), 1, 8);
    rect(ctx, PX.water, 0, 36, SCENE_W, 12);
    for (let x = 2; x < SCENE_W; x += 9) rect(ctx, PX.waterLight, x, 39 + (x % 3) * 2, 4, 1);
    ground(ctx, season, 48);
    // 芋煮の鍋
    rect(ctx, PX.ink, 58, 52, 16, 8);
    rect(ctx, PX.grayDark, 59, 53, 14, 1);
    rect(ctx, PX.fire, 61, 60, 3, 2);
    rect(ctx, PX.yellow, 65, 60, 2, 2);
    rect(ctx, PX.fire, 68, 60, 3, 2);
    person(ctx, 50, 52, PX.blue);
    person(ctx, 78, 52, '#3c8a6e');
    person(ctx, 84, 53, '#b5476f');
  },
  nishikoen(ctx, { season }) {
    sky(ctx, ...SKY[season]);
    ground(ctx, season, 44);
    [12, 34, 60, 84].forEach((x, i) => tree(ctx, x, 42 + (i % 2) * 2, season, 1.4));
    rect(ctx, '#4f86d0', 40, 56, 28, 8);
    rect(ctx, '#3b6db3', 40, 63, 28, 1);
    person(ctx, 46, 52, PX.violet);
    person(ctx, 58, 52, '#c7c0d8');
  },
  matsushima(ctx, { season }) {
    sky(ctx, ...SKY[season]);
    cloud(ctx, 66, 8);
    rect(ctx, PX.water, 0, 34, SCENE_W, 38);
    for (let y = 38; y < SCENE_H; y += 5) for (let x = (y * 3) % 11; x < SCENE_W; x += 13) rect(ctx, PX.waterLight, x, y, 5, 1);
    // 島と松
    const island = (x: number, w: number) => {
      rect(ctx, '#8a7a5a', x, 30, w, 6);
      rect(ctx, '#6b5c40', x, 35, w, 1);
      for (let i = 2; i < w - 1; i += 4) {
        rect(ctx, '#2f6b44', i + x - 1, 24, 4, 3);
        rect(ctx, '#2f6b44', i + x, 22, 2, 2);
        rect(ctx, PX.woodDark, i + x, 27, 1, 3);
      }
    };
    island(30, 14);
    island(60, 22);
    // 遊覧船
    rect(ctx, PX.white, 14, 46, 14, 4);
    rect(ctx, '#3f5fa8', 14, 49, 14, 2);
    rect(ctx, PX.white, 18, 43, 6, 3);
    rect(ctx, '#d6c7a5', 0, 62, SCENE_W, 10);
  },
  lab(ctx, { season }) {
    indoorWall(ctx, '#dfe7f3', '#a9b4c8', 50);
    windowFrame(ctx, 6, 8, 24, 20, season, false);
    // 棚とファイル
    rect(ctx, PX.woodDark, 62, 6, 30, 2);
    rect(ctx, PX.woodDark, 62, 20, 30, 2);
    ['#3f5fa8', '#b5476f', PX.violet, '#3c8a6e', '#c7c0d8', '#3f5fa8'].forEach((c, i) => rect(ctx, c, 64 + i * 4, 9 + (i % 2), 3, 11 - (i % 2)));
    // 机とモニター
    rect(ctx, PX.wood, 30, 46, 60, 4);
    rect(ctx, PX.ink, 48, 28, 26, 18);
    rect(ctx, '#203b55', 50, 30, 22, 13);
    for (let i = 0; i < 6; i++) rect(ctx, PX.waterLight, 52 + i * 3, 40 - [2, 4, 3, 6, 5, 8][i], 2, [2, 4, 3, 6, 5, 8][i]);
    rect(ctx, PX.ink, 59, 44, 4, 2);
    rect(ctx, PX.white, 80, 41, 4, 5);
    rect(ctx, PX.grayLight, 84, 42, 1, 2);
  },
  gakushoku(ctx) {
    indoorWall(ctx, '#f1e6d2', '#c9b48d', 40);
    rect(ctx, PX.woodDark, 8, 6, 34, 18);
    for (let i = 0; i < 4; i++) rect(ctx, PX.paper, 11, 9 + i * 4, 16 + (i % 2) * 8, 2);
    rect(ctx, PX.grayLight, 52, 14, 40, 24);
    rect(ctx, PX.gray, 52, 34, 40, 4);
    // カレー皿（手前）
    rect(ctx, PX.white, 50, 52, 34, 12);
    rect(ctx, '#e8e4dc', 50, 63, 34, 2);
    rect(ctx, '#f8f4e8', 54, 54, 12, 8);
    rect(ctx, '#b8782a', 64, 54, 16, 8);
    rect(ctx, '#d39a40', 66, 55, 6, 2);
    rect(ctx, '#8f5a1e', 70, 59, 3, 2);
  },
  room(ctx, { season }) {
    indoorWall(ctx, '#e7dff2', '#b9a98c', 48);
    windowFrame(ctx, 54, 8, 30, 22, season, false);
    rect(ctx, PX.wood, 40, 42, 50, 4);
    rect(ctx, PX.woodDark, 42, 46, 3, 12);
    rect(ctx, PX.woodDark, 85, 46, 3, 12);
    rect(ctx, PX.yellow, 78, 34, 6, 3);
    rect(ctx, PX.grayDark, 80, 37, 2, 5);
    rect(ctx, PX.paper, 50, 39, 12, 3);
    rect(ctx, '#c7c0d8', 4, 52, 30, 14);
    rect(ctx, PX.white, 4, 50, 10, 4);
  },
  ceremony(ctx) {
    indoorWall(ctx, '#efe7ff', '#c9b8ec', 40);
    rect(ctx, '#8c5cff', 0, 30, SCENE_W, 10);
    rect(ctx, '#5d35c4', 0, 39, SCENE_W, 1);
    rect(ctx, PX.white, 20, 6, 56, 10);
    rect(ctx, '#ff4f8b', 20, 15, 56, 1);
    // 花
    [10, 80].forEach((x) => {
      rect(ctx, '#3c8a6e', x, 22, 8, 8);
      rect(ctx, PX.sakura, x + 1, 20, 3, 3);
      rect(ctx, PX.yellow, x + 4, 21, 3, 3);
      rect(ctx, PX.white, x + 2, 24, 3, 2);
    });
    // 客席の頭
    for (let row = 0; row < 3; row++) for (let x = 2 + row * 3; x < SCENE_W; x += 7) rect(ctx, row % 2 ? PX.inkSoft : PX.ink, x, 50 + row * 7, 5, 4);
  },
  conference(ctx) {
    indoorWall(ctx, '#dcd3f2', '#a99bc9', 46);
    rect(ctx, '#7c4dff', 20, 4, 56, 34);
    rect(ctx, PX.white, 22, 6, 52, 30);
    rect(ctx, PX.grayLight, 22, 35, 52, 1);
    [6, 10, 8, 16, 13, 20].forEach((h, i) => rect(ctx, i === 5 ? PX.violet : '#7f9cc8', 28 + i * 7, 32 - h, 4, h));
    rect(ctx, PX.wood, 78, 30, 12, 16);
    for (let x = 2; x < SCENE_W; x += 7) rect(ctx, PX.ink, x, 60, 5, 4);
  },
  rain(ctx) {
    sky(ctx, '#7d8496', '#a6adbd');
    building(ctx, 6, 18, 84, 26, '#c9c4bb', '#a39d93', '#6f7a8c', 20, 4);
    rect(ctx, '#8d9a8a', 0, 44, SCENE_W, 28);
    // 池になった広場
    rect(ctx, '#6c8fb3', 8, 50, 80, 16);
    rect(ctx, '#89a9c8', 12, 52, 70, 1);
    rect(ctx, '#89a9c8', 20, 58, 54, 1);
  },
};

type Particle = { x: number; y: number; vx: number; vy: number; c: string; w: number; h: number };

/** モニターが点滅するシーン */
const BLINK_SCENES: SceneKey[] = ['lab'];
const OUTDOOR: SceneKey[] = ['kawauchi', 'aobayama', 'seiryo', 'katahira', 'hirosegawa', 'nishikoen', 'matsushima'];

function makeParticles(key: SceneKey, season: Season, rnd: () => number): Particle[] {
  const n = key === 'rain' ? 40 : OUTDOOR.includes(key) ? (season === 'summer' ? 0 : 14) : 0;
  return Array.from({ length: n }, () => {
    if (key === 'rain') return { x: rnd() * SCENE_W, y: rnd() * SCENE_H, vx: -0.6, vy: 3.2, c: '#dfe6f2', w: 1, h: 3 };
    if (season === 'winter') return { x: rnd() * SCENE_W, y: rnd() * SCENE_H, vx: 0.15, vy: 0.45, c: PX.snow, w: 1, h: 1 };
    const c = season === 'spring' ? PX.sakura : rnd() < 0.5 ? PX.leafAutumn : PX.leafYellow;
    return { x: rnd() * SCENE_W, y: rnd() * SCENE_H, vx: 0.4, vy: 0.5, c, w: 2, h: 1 };
  });
}

/** 動くシーン。止めるときは stop() */
export class SceneView {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private base: HTMLCanvasElement;
  private parts: Particle[];
  private raf = 0;
  private last = 0;
  private tick = 0;

  constructor(private key: SceneKey, opts: SceneOpts, className = 'px scene') {
    [this.canvas, this.ctx] = pixelCanvas(SCENE_W, SCENE_H, className);
    const [b, bctx] = pixelCanvas(SCENE_W, SCENE_H);
    this.base = b;
    DRAW[key](bctx, opts);
    if (opts.look) {
      const indoor = !OUTDOOR.includes(key) && key !== 'rain';
      drawCharacter(bctx, opts.look, indoor ? 8 : 4, SCENE_H - 24 - (indoor ? 6 : 3));
    }
    this.parts = makeParticles(key, opts.season, hashRng(opts.seed + key.length));
    this.draw();
  }

  private draw() {
    const ctx = this.ctx;
    ctx.drawImage(this.base, 0, 0);
    for (const p of this.parts) rect(ctx, p.c, Math.floor(p.x), Math.floor(p.y), p.w, p.h);
    if (BLINK_SCENES.includes(this.key) && this.tick % 20 < 10) rect(ctx, PX.waterLight, 72, 31, 1, 1);
    if (this.key === 'hirosegawa') {
      const f = this.tick % 12;
      rect(ctx, 'rgba(255,255,255,0.75)', 63 + (f % 3), 47 - Math.floor(f / 3), 2, 2);
      rect(ctx, 'rgba(255,255,255,0.6)', 68 - (f % 2), 45 - Math.floor(f / 4), 2, 2);
    }
  }

  start() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const loop = (t: number) => {
      this.raf = requestAnimationFrame(loop);
      if (t - this.last < 100) return; // 10fps でドットらしく動かす
      this.last = t;
      this.tick++;
      for (const p of this.parts) {
        p.x += p.vx + (this.key === 'rain' ? 0 : Math.sin((this.tick + p.y) / 6) * 0.3);
        p.y += p.vy;
        if (p.y > SCENE_H) p.y = -2;
        if (p.x > SCENE_W) p.x = 0;
        if (p.x < 0) p.x = SCENE_W;
      }
      this.draw();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }
}

/** イベントに scene が無いときの既定：いま通っているキャンパス */
export const seasonOf = (sem: number | null, master: boolean): Season => (master ? 'spring' : sem === null ? 'spring' : sem % 2 === 1 ? 'spring' : 'autumn');
