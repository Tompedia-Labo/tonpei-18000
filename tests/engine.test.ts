import { describe, expect, it } from 'vitest';
import { autoplay } from '../src/core/autoplay';
import { planTurns, semLabel } from '../src/core/turns';
import { X_LIMIT, xLength } from '../src/core/share';
import { createGame, result } from '../src/engine';

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);

describe('engine', () => {
  it('同じシードなら同じ結果になる', () => {
    const a = autoplay(42);
    const b = autoplay(42);
    expect(b.beats).toEqual(a.beats);
    expect(result(b.state)).toEqual(result(a.state));
  });

  it('どのシードでも最後まで遊べて、ゲージが範囲内に収まる', () => {
    for (const seed of SEEDS) {
      const { state } = autoplay(seed);
      expect(state.done).toBe(true);
      for (const h of [...state.history.map((x) => x.stats), state.stats]) {
        for (const v of Object.values(h)) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(100);
        }
        expect(h.kokoro).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it('6年制は10ターン、4年制は8ターンから始まる', () => {
    expect(planTurns({ ...createGame(1).profile, unit: 'med.ig' }).length).toBe(10);
    expect(planTurns({ ...createGame(1).profile, unit: 'eng.mech' }).length).toBe(8);
    expect(planTurns({ ...createGame(1).profile, unit: 'dent.shi' }).map(semLabel).slice(-2)).toEqual(['9〜10セメ', '11〜12セメ']);
  });

  it('院進すると修士2ターンが足される', () => {
    const found = SEEDS.map((seed) => autoplay(seed)).find((r) => r.state.turns.some((t) => t.kind === 'master'));
    expect(found).toBeDefined();
    const labels = found!.state.turns.map(semLabel);
    expect(labels.slice(-2)).toEqual(['修士1年', '修士2年']);
  });

  it('シェア文はXの文字数に収まり、家計の言葉を含まない', () => {
    for (const seed of SEEDS) {
      const r = result(autoplay(seed).state);
      expect(xLength(r.share)).toBeLessThanOrEqual(X_LIMIT);
      expect(r.share).not.toMatch(/仕送り|バイト|奨学金|余裕|苦しい/);
      expect(r.rarity.factors.map((f) => f.id)).not.toContain('wallet');
    }
  });

  it('学部の学期表記に「前期・後期」を使わない', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const { beats } = autoplay(seed);
      expect(JSON.stringify(beats)).not.toMatch(/前期|後期/);
    }
  });
});
