import { ENTRY, HOMETOWN, HOUSING, KOUKI_FACULTIES, PASSION, PERSONALITY, WALLET, housingWeight, optionName, type Option } from '../data/gacha';
import { stat, type StatId } from '../data/stats';
import { FACULTIES, faculty, unit } from '../data/structure';
import type { Rng } from '../rng';
import type { Profile } from './types';

const w = (o: Option) => (o.weight ? stat(o.weight) : 1);

const entryOptions = (facultyId: string) =>
  ENTRY.filter((e) => e.id !== 'kouki' || KOUKI_FACULTIES.includes(facultyId));

export function drawProfile(rng: Rng): Profile {
  const f = rng.weighted(FACULTIES, (x) => stat(x.capacity));
  const u = rng.pick(f.units); // 仮置き：募集人員の比が分かるまで均等
  const hometown = rng.weighted(HOMETOWN, w).id;
  return {
    faculty: f.id,
    unit: u.id,
    dept: u.dept ?? null,
    course: null,
    entry: rng.weighted(entryOptions(f.id), w).id,
    ronin: rng.chance(stat('game.ronin')),
    hometown,
    housing: rng.weighted(HOUSING, (h) => housingWeight(h, hometown)).id,
    wallet: rng.weighted(WALLET, w).id,
    personality: rng.pick(PERSONALITY).id,
    passion: rng.pick(PASSION).id,
  };
}

/** 住まいの周辺確率（出身で重みが変わるので、出身について足し合わせる） */
export function housingProbability(housing: string): number {
  const hTotal = HOMETOWN.reduce((a, h) => a + w(h), 0);
  let p = 0;
  for (const h of HOMETOWN) {
    const total = HOUSING.reduce((a, x) => a + housingWeight(x, h.id), 0);
    const mine = housingWeight(HOUSING.find((x) => x.id === housing)!, h.id);
    p += (w(h) / hTotal) * (mine / total);
  }
  return p;
}

export type GachaCard = {
  key: string;
  label: string;
  value: string;
  /** その結果が出る確率。null なら出さない */
  p: number | null;
  /** 確率の根拠（例：「850/2,406人」） */
  basis?: string;
  source?: StatId;
  provisional?: boolean;
};

const share = <T extends Option>(list: T[], id: string) => {
  const total = list.reduce((a, o) => a + w(o), 0);
  return w(list.find((o) => o.id === id)!) / total;
};

export function gachaCards(p: Profile): GachaCard[] {
  const f = faculty(p.faculty);
  const u = unit(p.unit);
  const entries = entryOptions(f.id);
  return [
    {
      key: 'faculty', label: '学部', value: f.name,
      p: stat(f.capacity) / stat('capacity.total'),
      basis: `入学定員 ${stat(f.capacity).toLocaleString()}/${stat('capacity.total').toLocaleString()}人`,
      source: f.capacity,
    },
    { key: 'unit', label: f.units.length > 1 ? '学科・系' : '学科', value: u.name, p: 1 / f.units.length, provisional: f.units.length > 1 },
    {
      key: 'entry', label: '入学方式', value: `${optionName(ENTRY, p.entry)}／${p.ronin ? '浪人' : '現役'}`,
      p: share(entries, p.entry), source: ENTRY.find((e) => e.id === p.entry)!.weight,
    },
    { key: 'hometown', label: '出身', value: optionName(HOMETOWN, p.hometown), p: share(HOMETOWN, p.hometown), provisional: true },
    { key: 'housing', label: '住まい', value: optionName(HOUSING, p.housing), p: housingProbability(p.housing), provisional: true },
    { key: 'wallet', label: '仕送りとバイトのバランス', value: optionName(WALLET, p.wallet), p: share(WALLET, p.wallet), source: WALLET.find((x) => x.id === p.wallet)!.weight },
    { key: 'personality', label: '性格', value: optionName(PERSONALITY, p.personality), p: null },
    { key: 'passion', label: '偏愛', value: optionName(PASSION, p.passion), p: null },
  ];
}
