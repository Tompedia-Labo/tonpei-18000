// 文字列のグリッドで描くドット絵。'.' は透明、それ以外の1文字がパレットの色

export type Sprite = string[];
export type Palette = Record<string, string>;

export function drawSprite(ctx: CanvasRenderingContext2D, sprite: Sprite, pal: Palette, x: number, y: number, scale = 1, flip = false) {
  const w = sprite[0]?.length ?? 0;
  for (let r = 0; r < sprite.length; r++) {
    const row = sprite[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.' || ch === ' ') continue;
      const color = pal[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      const cx = flip ? w - 1 - c : c;
      ctx.fillRect(x + cx * scale, y + r * scale, scale, scale);
    }
  }
}

/** パッチ（行・列からの上書き）を当てた新しいスプライトを返す */
export function patch(base: Sprite, patches: { r: number; c: number; s: string }[]): Sprite {
  const out = base.map((row) => row.split(''));
  for (const p of patches) {
    for (let i = 0; i < p.s.length; i++) {
      const ch = p.s[i];
      if (ch === '_') continue; // '_' はそのまま残す
      if (out[p.r] && p.c + i < out[p.r].length) out[p.r][p.c + i] = ch;
    }
  }
  return out.map((row) => row.join(''));
}

/** 下のスプライトに上のスプライトを重ねる（'.' は透過） */
export function layer(...sprites: Sprite[]): Sprite {
  const h = Math.max(...sprites.map((s) => s.length));
  const w = Math.max(...sprites.map((s) => s[0]?.length ?? 0));
  const out: string[][] = Array.from({ length: h }, () => Array(w).fill('.'));
  for (const s of sprites)
    s.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) if (row[c] !== '.') out[r][c] = row[c];
    });
  return out.map((r) => r.join(''));
}

/** スプライトを描いた canvas。CSS で拡大するときは image-rendering: pixelated にする */
export function spriteCanvas(sprite: Sprite, pal: Palette, scale = 1, className = 'px'): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = (sprite[0]?.length ?? 0) * scale;
  c.height = sprite.length * scale;
  c.className = className;
  drawSprite(c.getContext('2d')!, sprite, pal, 0, 0, scale);
  return c;
}

export function pixelCanvas(w: number, h: number, className = 'px'): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.className = className;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

/** シードから決まる軽い乱数（見た目用。エンジンの乱数は使わない） */
export function hashRng(seed: number) {
  let x = (seed ^ 0x2545f491) >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}
