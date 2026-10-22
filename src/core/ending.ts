// 在学の終わりの進路を決める。「おまかせ」と未選択のときは学部・研究科別の実データで抽選する。

import { stat, type StatId } from '../data/stats';
import { faculty, unit } from '../data/structure';
import type { Rng } from '../rng';
import { yearsOf } from './turns';
import type { Path, Profile, State } from './types';

export const shingakuStat = (p: Profile): StatId | null => unit(p.unit).shingaku ?? faculty(p.faculty).shingaku;
export const masterKey = (p: Profile): string | null => {
  const u = unit(p.unit);
  return u.master !== undefined ? u.master : faculty(p.faculty).master;
};
export const canGoMaster = (p: Profile) => yearsOf(p) === 4 && !!masterKey(p) && !!shingakuStat(p);

const masterStat = (p: Profile, kind: 'doctor' | 'job' | 'other') => `master.${masterKey(p)}.${kind}` as StatId;

/** 学部4年での院進を実データで引く（おまかせ用） */
export const drawUndergradPath = (s: State, rng: Rng): 'master' | 'job' =>
  canGoMaster(s.profile) && rng.chance(stat(shingakuStat(s.profile)!)) ? 'master' : 'job';

export function drawMasterPath(s: State, rng: Rng): 'masterJob' | 'doctor' | 'masterOther' {
  const p = s.profile;
  return rng.weighted(['masterJob', 'doctor', 'masterOther'] as const, (x) =>
    stat(masterStat(p, x === 'masterJob' ? 'job' : x === 'doctor' ? 'doctor' : 'other')),
  );
}

/** 最後のターンが終わったときに呼ぶ */
export function settlePath(s: State, rng: Rng): void {
  const p = s.profile;
  if (s.path === 'dropout' || s.path === 'startup') return;
  if (yearsOf(p) === 6) {
    s.path = 'kokushi';
    s.flags.kokushiPass = rng.chance(stat(examStat(p)));
    return;
  }
  if (s.path === null) s.path = drawUndergradPath(s, rng);
  if (s.path === 'master') s.path = drawMasterPath(s, rng);
}

const examStat = (p: Profile): StatId => (p.faculty === 'dent' ? 'exam.shika' : 'exam.ishi');

export type Comparison = { label: string; p: number; source: StatId; fact: string; you: string };

/** 「約9割」「約2割」。1割未満は「1割未満」 */
export const wari = (p: number) => (p >= 0.995 ? 'ほぼ全員' : p < 0.1 ? '1割未満' : `約${Math.round(p * 10)}割`);

const YOU: Partial<Record<Path, string>> = {
  job: 'あなたは学部で社会に出た。',
  masterJob: 'あなたも院へ進み、修了して社会に出た。',
  doctor: 'あなたは院へ進み、さらに博士課程へ。',
  masterOther: 'あなたは院へ進み、自分の道を選んだ。',
  startup: 'あなたは、自分で会社をつくった。',
  dropout: 'あなたは、在学中に別の道へ踏み出した。',
};

/** 振り返りの「統計との比較」。同じ学部の人の実データと、あなたの進路を並べる（どちらも肯定的に） */
export function comparison(s: State): Comparison | null {
  const p = s.profile;
  const f = faculty(p.faculty);
  if (yearsOf(p) === 6) {
    const source = examStat(p);
    const v = stat(source);
    const exam = p.faculty === 'dent' ? '歯科医師' : '医師';
    const you = s.path === 'dropout' ? YOU.dropout! : s.flags.kokushiPass ? 'あなたも新卒で合格した。' : 'あなたは、翌年にもう一度挑む。';
    return { label: `${exam}国家試験に新卒で合格する人`, p: v, source, fact: `${exam}国家試験は、新卒の${wari(v)}が合格する。`, you };
  }
  const sh = shingakuStat(p);
  if (!sh) return null;
  const v = stat(sh);
  return { label: `${f.name}の卒業生のうち、大学院などへ進む人`, p: v, source: sh, fact: `${f.name}生の${wari(v)}は院へ進む。`, you: YOU[s.path as Path] ?? '' };
}

export type PathInfo = { label: string; p: number; detail: string };

export function pathInfo(s: State): PathInfo {
  const p = s.profile;
  const f = faculty(p.faculty);
  const sh = shingakuStat(p);
  const shingaku = sh ? stat(sh) : 0;
  switch (s.path as Path) {
    case 'job':
      return { label: '学部卒業→就職', p: 1 - shingaku, detail: `${f.name}で学部卒業後に進学しない人` };
    case 'masterJob':
      return { label: '修士修了→就職', p: shingaku * stat(masterStat(p, 'job')), detail: '院へ進み、修了して就職する人' };
    case 'doctor':
      return { label: '修士修了→博士進学', p: shingaku * stat(masterStat(p, 'doctor')), detail: '院へ進み、博士課程へ進む人' };
    case 'masterOther':
      return { label: '修士修了→自分の道へ', p: shingaku * stat(masterStat(p, 'other')), detail: '院へ進み、修了後に起業や別の道を選ぶ人' };
    case 'kokushi': {
      const other = stat(p.faculty === 'dent' ? 'grad.dent.other' : 'grad.medDoctor.other');
      const pass = stat(examStat(p));
      const job = p.faculty === 'dent' ? '研修歯科医' : '研修医';
      return s.flags.kokushiPass
        ? { label: `学部卒業→国家試験合格→${job}`, p: other * pass, detail: `国家試験に新卒で合格し${job}になる人` }
        : { label: '学部卒業→国家試験は翌年に再挑戦', p: other * (1 - pass), detail: '国家試験に翌年もう一度挑む人' };
    }
    case 'startup':
      return { label: s.turns.some((t) => t.kind === 'master') ? '修士修了→起業' : '学部卒業→起業', p: stat('game.startup'), detail: '在学中の挑戦を、そのまま会社にした人' };
    case 'dropout':
      return { label: '在学中に別の道へ', p: stat('game.dropout'), detail: '東北大で見つけた夢を、大学の外で育てる人' };
    default:
      return { label: '在学を終えた', p: 1, detail: '' };
  }
}
