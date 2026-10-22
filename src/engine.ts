// ゲームエンジン。DOMに触らない純関数だけを置く（scripts/simulate.ts から同じものを回す）。
// 使い方：createGame → advance を繰り返す。beat が choice なら choose（または autoChoice）を挟む。

import { SHARE_URL } from './config';
import { BALANCE } from './data/balance';
import { EVENTS } from './data/events';
import { HOUSING, optionName } from './data/gacha';
import { tenYearsLater, titleFor } from './data/endings';
import { LADDER, themeById } from './data/research';
import { stat } from './data/stats';
import { faculty, unit } from './data/structure';
import { applyEffect } from './core/effects';
import { canGoMaster, drawUndergradPath, masterKey, pathInfo, settlePath, shingakuStat } from './core/ending';
import { drawProfile } from './core/profile';
import { computeRarity, type Rarity } from './core/rarity';
import { drawChoice, drawRandom, matches } from './core/select';
import { shareText } from './core/share';
import {
  assignFor, assignPending, assignText, canCross, climb, crossPending, crossText, growTankyu, judge, labDue, labPending, labTag, labText, resolveAssign, unlockTankyu,
} from './core/stages';
import { fill, fillStatLine } from './core/template';
import { currentTurn, masterTurns, planTurns, semLabel, startsYear, turnLabel } from './core/turns';
import type { Beat, Choice, Deltas, GameEvent, HistoryEntry, Pending, ShownEvent, State, Step, SynthChoice } from './core/types';
import { Rng, seedState } from './rng';

export type { Beat, State } from './core/types';
export { gachaCards } from './core/profile';

export type StepResult = { state: State; beat: Beat };

const clone = (s: State): State => structuredClone(s);
const eventById = (id: string): GameEvent | undefined => EVENTS.find((e) => e.id === id);

export function createGame(seed: number): State {
  const rng = new Rng(seedState(seed));
  const profile = drawProfile(rng);
  return {
    seed,
    rng: rng.st,
    profile,
    stats: { ...BALANCE.initial, saifu: BALANCE.saifuByWallet[profile.wallet] },
    tankyuUnlocked: false,
    flags: {},
    age: BALANCE.entryAge + (profile.ronin ? 1 : 0),
    fails: 0,
    rareLog: [],
    turns: planTurns(profile),
    turnIndex: -1,
    queue: [],
    history: [],
    seen: [],
    pending: null,
    path: null,
    ladder: -1,
    done: false,
  };
}

export function advance(state: State): StepResult {
  if (state.pending) throw new Error('choice is pending');
  const s = clone(state);
  const rng = new Rng(s.rng);
  for (;;) {
    if (s.done) return { state: s, beat: { type: 'end' } };
    if (s.queue.length === 0) {
      if (s.turnIndex + 1 >= s.turns.length) {
        if (!s.flags.final) {
          // 在学の終わり：進路を決めてから、卒業式・修了式を出す
          settlePath(s, rng);
          s.flags.final = true;
          s.queue = EVENTS.filter((e) => e.kind === 'fixed' && matches(e, s, currentTurn(s)!)).map((e): Step => ({ t: 'event', id: e.id }));
          continue;
        }
        s.done = true;
        return { state: s, beat: { type: 'end' } };
      }
      startTurn(s);
    }
    const beat = runStep(s, s.queue.shift()!, rng);
    if (beat) return { state: s, beat };
  }
}

/** ターンの順番：固定 → 分属 → 研究室配属 → 日記（ランダム） → 選択 → 研究の階段 → 学期末の判定 */
function startTurn(s: State) {
  s.turnIndex++;
  const t = currentTurn(s)!;
  if (s.turnIndex > 0 && startsYear(t)) s.age++;
  s.history.push({ turn: t, highlight: null, scene: null, stats: { ...s.stats } });
  const fixed = EVENTS.filter((e) => e.kind === 'fixed' && matches(e, s, t));
  const slots = t.kind === 'sem' && !t.extra ? BALANCE.choiceSlots[t.sems[0]] ?? 1 : 1;
  s.queue = [
    { t: 'turnStart' },
    ...fixed.map((e): Step => ({ t: 'event', id: e.id })),
    { t: 'assign' },
    { t: 'lab' },
    { t: 'choice' },
    { t: 'diary' },
    ...Array.from({ length: slots - 1 }, (): Step => ({ t: 'choice' })),
    { t: 'ladder' },
    { t: 'judge' },
  ];
}

/** 年表のハイライト：節目 > 選択 > 固定 > ランダム */
const RANK = { milestone: 4, choice: 3, fixed: 2, random: 1 } as const;
function noteHighlight(s: State, text: string | undefined, rank: number, scene?: string) {
  const h = s.history[s.history.length - 1] as HistoryEntry & { rank?: number };
  if (text && (h.rank ?? 0) < rank) {
    h.highlight = fill(text, s);
    h.scene = scene ?? h.scene;
    h.rank = rank;
  }
}

function show(s: State, ev: GameEvent, deltas: Deltas): ShownEvent {
  const source = typeof ev.source === 'function' ? ev.source(s) : ev.source ?? null;
  return {
    id: ev.id,
    text: fill(ev.text, s),
    statLine: ev.statLine ? fillStatLine(ev.statLine, source, s) : undefined,
    source: source ?? undefined,
    caution: ev.caution,
    scene: ev.scene,
    season: ev.season,
    image: ev.image,
    deltas,
  };
}

function happen(s: State, ev: GameEvent): ShownEvent {
  s.seen.push(ev.id);
  const deltas = applyEffect(s, ev.effects);
  if (ev.rare) logRare(s, ev.id, ev.rare, ev.prob ? stat(ev.prob) : undefined);
  noteHighlight(s, ev.highlight, RANK[ev.kind], ev.scene);
  return show(s, ev, deltas);
}

function logRare(s: State, id: string, r: NonNullable<GameEvent['rare']>, prob?: number) {
  const p = r.stat ? stat(r.stat) : r.p ?? prob;
  // 同じ出来事は1回だけ掛ける
  if (p === undefined || s.rareLog.some((x) => x.id === id)) return;
  s.rareLog.push({ id, label: r.label, p, kind: r.stat && !r.stat.startsWith('game.') ? 'real' : 'game' });
}

/** 分属・研究テーマなど、engine が作る選択を出す */
function synthChoice(s: State, pending: Pending, text: string, tag?: string): Beat {
  s.pending = pending;
  s.flags.synthTurn = s.turnIndex;
  return {
    type: 'choice',
    id: pending.eventId,
    variant: pending.variant,
    tag,
    text,
    choices: pending.options!.map((o) => ({ label: o.label, sub: o.sub, badge: o.badge })),
  };
}

function runStep(s: State, step: Step, rng: Rng): Beat | null {
  const t = currentTurn(s)!;
  switch (step.t) {
    case 'turnStart': {
      const deltas = { ...growTankyu(s), ...applyEffect(s, { stats: { tani: BALANCE.taniPerTurn } }) };
      return { type: 'turnStart', turn: t, label: turnLabel(t, s.profile), deltas };
    }
    case 'event': {
      const ev = eventById(step.id);
      return ev ? { type: 'event', event: happen(s, ev) } : null;
    }
    case 'assign': {
      const a = assignFor(s, t);
      return a ? synthChoice(s, assignPending(a), assignText(a), `${a.label}分属`) : null;
    }
    case 'cross':
      return canCross(s) ? synthChoice(s, crossPending(), crossText, 'クロス情報プログラム') : null;
    case 'lab':
      return labDue(s, t) ? synthChoice(s, labPending(s, rng), labText(s), labTag(s)) : null;
    case 'unlock': {
      const theme = themeById(String(s.flags.theme));
      return { type: 'unlock', theme: theme?.name ?? '研究', value: s.stats.tankyu, text: `探究ゲージが解放された！\n${theme?.name ?? '研究'}の日々が始まる。` };
    }
    case 'diary': {
      const lines = drawRandom(s, t, BALANCE.diaryLines, rng).map((ev) => happen(s, ev));
      return lines.length ? { type: 'diary', lines } : null;
    }
    case 'choice': {
      const rescue = s.stats.kokoro < BALANCE.kokoroRescue;
      // 1周の選択を6〜8回に収める：分属・配属があったターンと、ふだんの選択の枠を使い切ったあとは、
      // 進路などの必ず出す選択と立て直しだけにする。枠は残りのターンに散らす
      const used = Number(s.flags.regularChoices ?? 0);
      const left = BALANCE.regularChoices - used;
      const turnsLeft = s.turns.length - s.turnIndex;
      const spread = left > 0 && rng.chance(Math.min(1, left / turnsLeft));
      const ev = drawChoice(s, t, rng, { rescue, priorityOnly: s.flags.synthTurn === s.turnIndex || !spread });
      if (!ev) return null;
      if (!ev.priority && !ev.rescue) s.flags.regularChoices = used + 1;
      // 進路の選択と立て直しが重なったら、続けて立て直しも出す
      if (ev.priority && rescue) s.queue.unshift({ t: 'choice' });
      s.pending = { eventId: ev.id, variant: ev.rescue ? 'rescue' : 'normal' };
      s.seen.push(ev.id);
      const shown = show(s, ev, {});
      return {
        type: 'choice',
        id: ev.id,
        variant: s.pending.variant,
        text: shown.text,
        statLine: shown.statLine,
        source: shown.source,
        caution: shown.caution,
        scene: shown.scene,
        season: shown.season,
        image: shown.image,
        choices: availableChoices(s, ev).map((c) => ({ label: c.label })),
      };
    }
    case 'ladder': {
      const beat = climb(s, rng);
      if (beat) {
        s.queue.unshift({ t: 'ladder' }); // 同じターンにもう1段登れるか
        noteHighlight(s, beat.type === 'ladder' ? beat.name : undefined, RANK.milestone);
      }
      return beat;
    }
    case 'judge':
      return judge(s);
    case 'roadExtend':
      return { type: 'roadExtend', labels: step.labels, why: step.why };
  }
}

const availableChoices = (s: State, ev: GameEvent): Choice[] => (ev.choices ?? []).filter((c) => !c.cond || c.cond(s));

function pendingChoices(s: State): (Choice | SynthChoice)[] {
  const p = s.pending!;
  if (p.options) return p.options;
  const ev = eventById(p.eventId);
  return ev ? availableChoices(s, ev) : [];
}

export function choose(state: State, index: number): StepResult {
  if (!state.pending) throw new Error('no pending choice');
  const s = clone(state);
  const rng = new Rng(s.rng);
  const pending = s.pending!;
  const c = pendingChoices(s)[index];
  if (!c) throw new Error(`bad choice index: ${index}`);
  s.pending = null;
  const deltas = applyEffect(s, c.effects);
  if (c.rare) logRare(s, pending.eventId, c.rare);
  let text = c.result;
  let tone: 'good' | 'twist' | undefined;
  const a = c.action;
  if (a?.type === 'path') {
    s.path = a.path === 'master' && !canGoMaster(s.profile) ? 'job' : a.path;
    if (s.path === 'dropout') {
      // 前向きな理由で大学を離れる。このターンで在学を終える
      s.turns = s.turns.slice(0, s.turnIndex + 1);
      s.queue = [];
    }
    if (s.path === 'master') {
      const added = masterTurns();
      s.turns.push(...added);
      s.queue.unshift({ t: 'roadExtend', labels: added.map(semLabel), why: 'master' });
    }
  } else if (a?.type === 'finalPath') {
    s.path = a.path;
  } else if (a?.type === 'assign') {
    const assign = assignFor(s, currentTurn(s)!)!;
    ({ text, tone } = resolveAssign(s, assign, a.index, rng));
    noteHighlight(s, `${assign.label}が決まった`, RANK.milestone);
    if (canCross(s)) s.queue.unshift({ t: 'cross' });
  } else if (a?.type === 'theme') {
    unlockTankyu(s, a.theme);
    noteHighlight(s, `研究テーマ「${themeById(a.theme)?.name}」を選んだ`, RANK.milestone, 'lab');
    s.queue.unshift({ t: 'unlock' });
  } else if (a?.type === 'cross') {
    s.flags.cross = a.join;
  }
  const ev = eventById(pending.eventId);
  if (ev) noteHighlight(s, ev.highlight, RANK.choice, ev.scene);
  return { state: s, beat: { type: 'choiceResult', id: pending.eventId, text: fill(text, s), deltas, tone } };
}

/** おまかせ。進路は実データで引き、それ以外は均等に選ぶ */
export function autoChoice(state: State): number {
  if (!state.pending) throw new Error('no pending choice');
  const s = clone(state);
  // 選択に使う乱数は State に戻さない（UIで同じ選択肢を選んだ場合と結果を揃えるため）
  const rng = new Rng(s.rng);
  const list = pendingChoices(s);
  const find = (pred: (c: Choice | SynthChoice) => boolean) => list.findIndex(pred);
  const startup = find((c) => (c.action?.type === 'path' || c.action?.type === 'finalPath') && c.action.path === 'startup');
  if (startup >= 0 && rng.chance(BALANCE.autoStartup)) return startup;
  if (find((c) => c.action?.type === 'path' && c.action.path !== 'dropout') >= 0) {
    const want = drawUndergradPath(s, rng);
    const i = find((c) => c.action?.type === 'path' && c.action.path === want);
    if (i >= 0) return i;
  }
  if (find((c) => c.action?.type === 'finalPath') >= 0 && masterKey(s.profile)) {
    // 博士進学は研究科別の実データの割合そのまま。「その他」は就職の側に含める
    const want = rng.chance(stat(`master.${masterKey(s.profile)}.doctor` as never)) ? 'doctor' : 'masterJob';
    const i = find((c) => c.action?.type === 'finalPath' && c.action.path === want);
    if (i >= 0) return i;
  }
  return Math.floor(rng.next() * list.length);
}

// ── 結果

export type GameResult = {
  rarity: Rarity;
  path: string;
  pathDetail: string;
  title: string;
  titleId: string;
  titleDesc: string;
  /** 10年後の一文（フィクション） */
  tenYears: string;
  /** シェアに載せる属性（学部／住まい／サークル／留年）。家計は入れない */
  attributes: string[];
  research: string | null;
  share: string;
};

export function researchLine(s: State): string | null {
  const theme = typeof s.flags.theme === 'string' ? themeById(s.flags.theme) : undefined;
  if (!theme) return null;
  const step = LADDER[s.ladder];
  return step ? `${theme.name}／${step.name}` : theme.name;
}

export function result(s: State): GameResult {
  if (!s.done) throw new Error('game is not finished');
  const rarity = computeRarity(s);
  const p = pathInfo(s);
  const f = faculty(s.profile.faculty);
  const t = titleFor(s);
  const title = t.name;
  const circle = s.flags.circle ? 'サークル' : 'サークルなし';
  const attributes = [f.name, optionName(HOUSING, s.profile.housing), circle];
  if (s.flags.ryunen) attributes.push(`留年${s.flags.ryunen}回`);
  const research = researchLine(s);
  return {
    rarity,
    path: p.label,
    pathDetail: p.detail,
    title,
    titleId: t.id,
    titleDesc: t.desc,
    tenYears: tenYearsLater(s),
    attributes,
    research,
    share: shareText({ n: rarity.n, attributes, path: p.label, research, title, url: SHARE_URL }),
  };
}

/** 学部・研究科の情報（UIの表示用） */
export const facultyInfo = (s: State) => ({ faculty: faculty(s.profile.faculty), unit: unit(s.profile.unit), shingaku: shingakuStat(s.profile) });
