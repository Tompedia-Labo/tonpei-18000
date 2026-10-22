import { describe, expect, it } from 'vitest';
import { semLabel } from '../src/core/turns';
import type { Beat, State } from '../src/core/types';
import { labOf, unit } from '../src/data/structure';
import { advance, autoChoice, choose, createGame, result } from '../src/engine';

/** 入試単位が unitId になるシードを探す */
function gameFor(unitId: string): State {
  for (let seed = 1; seed < 20000; seed++) {
    const s = createGame(seed);
    if (s.profile.unit === unitId) return s;
  }
  throw new Error(`no seed for ${unitId}`);
}

/** おまかせで進めながら、各 beat の直後に hook を呼ぶ */
function run(s: State, hook?: (beat: Beat, s: State) => State | void): { s: State; beats: Beat[] } {
  const beats: Beat[] = [];
  for (let i = 0; i < 1000; i++) {
    const r = s.pending ? choose(s, autoChoice(s)) : advance(s);
    s = r.state;
    beats.push(r.beat);
    s = hook?.(r.beat, s) ?? s;
    if (r.beat.type === 'end') break;
  }
  return { s, beats };
}

describe('分属', () => {
  it('機械知能・航空工学科は3セメでコースが決まる', () => {
    const { s, beats } = run(gameFor('eng.mech'));
    const i = beats.findIndex((b) => b.type === 'choice' && b.variant === 'assign');
    expect(i).toBeGreaterThan(-1);
    expect(s.profile.course).toMatch(/^eng\.mech:/);
  });

  it('物理系は4セメで学科（とコース）が決まる', () => {
    const { s } = run(gameFor('sci.phys'));
    expect(['sci.phys.phys', 'sci.phys.geo']).toContain(s.profile.dept);
  });
});

describe('研究室配属と探究', () => {
  it('配属のセメに研究テーマを選び、探究が解放される', () => {
    let unlockedAt: string | null = null;
    const start = gameFor('eng.mech');
    const { s } = run(start, (beat, st) => {
      if (beat.type === 'unlock') unlockedAt = semLabel(st.turns[st.turnIndex]);
    });
    expect(s.tankyuUnlocked).toBe(true);
    expect(unlockedAt).toBe(`${labOf(start.profile).sem}セメ`);
    expect(typeof s.flags.theme).toBe('string');
    expect(s.ladder).toBeGreaterThanOrEqual(0);
  });

  it('研究テーマカードは3枚', () => {
    const { beats } = run(gameFor('sci.chem'));
    const theme = beats.find((b) => b.type === 'choice' && b.variant === 'theme');
    expect(theme && theme.type === 'choice' && theme.choices.length).toBe(3);
  });
});

describe('判定', () => {
  it('工学部はセメスターバリアに届かないと5年目が足される', () => {
    const { s, beats } = run(gameFor('eng.arch'), (beat, st) => {
      if (beat.type === 'turnStart' && st.turns[st.turnIndex].kind === 'sem') st.stats.tani = 10;
    });
    expect(beats.some((b) => b.type === 'judge' && b.barrier && !b.barrier.passed)).toBe(true);
    expect(s.turns.map(semLabel)).toContain('5年目');
    expect(beats.some((b) => b.type === 'roadExtend' && b.why === 'ryunen')).toBe(true);
  });

  it('留年は1回まで', () => {
    const { s } = run(gameFor('eng.mech'), (beat, st) => {
      if (beat.type === 'turnStart') st.stats.tani = 0;
    });
    expect(s.turns.filter((t) => t.kind === 'sem' && t.extra).length).toBe(1);
  });

  it('文系は8セメで「落単2回以上かつ単位50未満」なら留年', () => {
    const { s } = run(gameFor('law.hou'), (beat, st) => {
      if (beat.type === 'turnStart') st.stats.tani = 20;
    });
    expect(s.flags.ryunen).toBe(1);
    expect(unit('law.hou').barriers).toBeUndefined();
  });
});

describe('こころ', () => {
  it('こころが30未満なら立て直しイベントが出て、10未満にはならない', () => {
    let rescued = false;
    run(gameFor('lit.jinbun'), (beat, st) => {
      if (beat.type === 'turnStart') st.stats.kokoro = 12;
      if (beat.type === 'choice' && beat.variant === 'rescue') rescued = true;
      expect(st.stats.kokoro).toBeGreaterThanOrEqual(10);
    });
    expect(rescued).toBe(true);
  });
});

describe('在学の終わり', () => {
  it('中退は前向きな選択のときだけで、そのターンで在学を終える', () => {
    let s = gameFor('law.hou');
    const beats: Beat[] = [];
    for (let i = 0; i < 1000; i++) {
      // 「別の道」が出たら必ず挑戦する。それ以外はおまかせ
      let idx = s.pending ? autoChoice(s) : -1;
      const last = beats[beats.length - 1];
      if (s.pending && last?.type === 'choice' && last.id === 'betsu-no-michi') idx = 0;
      const r = s.pending ? choose(s, idx) : advance(s);
      s = r.state;
      beats.push(r.beat);
      if (r.beat.type === 'end') break;
    }
    if (s.path !== 'dropout') return; // このシードでは出なかった
    expect(beats.some((b) => b.type === 'event' && b.event.id === 'saraba')).toBe(true);
    expect(beats.some((b) => b.type === 'event' && b.event.id === 'sotsugyo')).toBe(false);
  });

  it('卒業式・修了式は在学のターンがすべて終わってから出る（8セメで留年が決まっても先に出ない）', () => {
    const { s, beats } = run(gameFor('law.hou'), (beat, st) => {
      if (beat.type === 'turnStart') st.stats.tani = 20;
    });
    const sotsu = beats.findIndex((b) => b.type === 'event' && ['sotsugyo', 'shuryo'].includes(b.event.id));
    const lastTurn = beats.map((b) => b.type).lastIndexOf('turnStart');
    expect(s.flags.ryunen).toBe(1);
    expect(sotsu).toBeGreaterThan(lastTurn);
  });

  it('称号と10年後の一文がつく', () => {
    for (let seed = 1; seed < 60; seed++) {
      const r = result(run(createGame(seed)).s);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.tenYears).toMatch(/^10年後、/);
    }
  });
});

describe('院進', () => {
  it('院進すると道が伸びる演出が出て、修士2年で最終進路を選ぶ', () => {
    for (let seed = 1; seed < 500; seed++) {
      const { s, beats } = run(createGame(seed));
      if (!s.turns.some((t) => t.kind === 'master')) continue;
      expect(beats.some((b) => b.type === 'roadExtend' && b.why === 'master')).toBe(true);
      expect(['masterJob', 'doctor', 'startup']).toContain(s.path);
      return;
    }
    throw new Error('no master run');
  });
});
