// シード付き乱数（sfc32）。状態は State に配列で持ち、シミュレーションで同じ結果を再現できるようにする。

export type RngState = [number, number, number, number];

export function seedState(seed: number): RngState {
  // splitmix32 で初期状態を散らす
  let x = seed >>> 0;
  const next = () => {
    x = (x + 0x9e3779b9) >>> 0;
    let z = x;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
  const st: RngState = [next(), next(), next(), next()];
  const rng = new Rng(st);
  for (let i = 0; i < 12; i++) rng.next();
  return st;
}

/** st を直接書き換える。State を複製してから渡すこと */
export class Rng {
  constructor(public st: RngState) {}

  next(): number {
    let [a, b, c, d] = this.st;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    this.st[0] = a;
    this.st[1] = b;
    this.st[2] = c;
    this.st[3] = d;
    return (t >>> 0) / 4294967296;
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  int(lo: number, hi: number): number {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  weighted<T>(items: readonly T[], weight: (t: T) => number): T {
    const total = items.reduce((sum, t) => sum + Math.max(0, weight(t)), 0);
    if (total <= 0) return this.pick(items);
    let r = this.next() * total;
    for (const t of items) {
      r -= Math.max(0, weight(t));
      if (r < 0) return t;
    }
    return items[items.length - 1];
  }
}
