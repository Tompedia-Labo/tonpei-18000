// 入学ガチャの選択肢と重み。数値は stats.ts を参照し、ここには書かない。
// weight を持たない選択肢は均等に抽選する（ゲーム用）。

import { stat, type StatId } from './stats';

export type Option = { id: string; name: string; weight?: StatId };

export const ENTRY: Option[] = [
  { id: 'zenki', name: '一般選抜 前期日程', weight: 'entry.zenki' },
  { id: 'kouki', name: '一般選抜 後期日程', weight: 'entry.kouki' },
  { id: 'ao2', name: '総合型選抜（AO入試）Ⅱ期', weight: 'entry.ao2' },
  { id: 'ao3', name: '総合型選抜（AO入試）Ⅲ期', weight: 'entry.ao3' },
];
/** 後期日程があるのは経済・理だけ。学部ごとの内訳は未確認なので全学の比率で引く（仮置き） */
export const KOUKI_FACULTIES = ['econ', 'sci'];

export const HOMETOWN: Option[] = [
  { id: 'miyagi', name: '宮城', weight: 'game.hometown.miyagi' },
  { id: 'tohoku', name: '東北他県', weight: 'game.hometown.tohoku' },
  { id: 'kanto', name: '関東', weight: 'game.hometown.kanto' },
  { id: 'other', name: 'その他', weight: 'game.hometown.other' },
];

export const HOUSING: Option[] = [
  { id: 'jikka', name: '実家', weight: 'game.housing.jikka' },
  { id: 'hitori', name: '一人暮らし', weight: 'game.housing.hitori' },
  { id: 'ryo', name: '寮', weight: 'game.housing.ryo' },
];

export const housingWeight = (housing: Option, hometown: string): number =>
  stat(housing.weight!) * (hometown === 'miyagi' && housing.id === 'jikka' ? stat('game.housing.miyagiJikkaBoost') : 1);

// カードには「仕送りとバイトのバランス」として出す。優劣を感じさせる言葉は使わない
export const WALLET: Option[] = [
  { id: 'yoyu', name: '仕送りでやりくり', weight: 'wallet.yoyu' },
  { id: 'yayaYoyu', name: '仕送り＋ときどきバイト', weight: 'wallet.yayaYoyu' },
  { id: 'yayaKurushii', name: 'バイトもしっかり', weight: 'wallet.yayaKurushii' },
  { id: 'kurushii', name: 'バイトと奨学金でやりくり', weight: 'wallet.kurushii' },
];

export const PERSONALITY: Option[] = [
  { id: 'keikaku', name: '計画型' },
  { id: 'nori', name: 'ノリ型' },
  { id: 'naikou', name: '内向型' },
  { id: 'kori', name: '凝り性' },
  { id: 'rakkan', name: '楽観型' },
];

export const PASSION: Option[] = [
  { id: 'metal', name: '金属・鉱物' },
  { id: 'space', name: '宇宙' },
  { id: 'robot', name: 'ロボット・機械' },
  { id: 'ai', name: 'AI・プログラミング' },
  { id: 'sea', name: '生き物・海' },
  { id: 'math', name: '数学' },
  { id: 'earth', name: '地球・災害' },
  { id: 'history', name: '歴史・古文書' },
  { id: 'words', name: '言葉' },
  { id: 'startup', name: '起業' },
  { id: 'energy', name: 'エネルギー・環境' },
  { id: 'philo', name: '哲学' },
  { id: 'teach', name: '教職' },
  { id: 'socio', name: '社会学・経済学' },
  { id: 'pedagogy', name: '教育学' },
  { id: 'care', name: '医療・福祉' },
];

export const optionName = (list: Option[], id: string): string => list.find((o) => o.id === id)?.name ?? id;
