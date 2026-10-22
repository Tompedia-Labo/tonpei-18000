// 称号（MVPで15個）と「10年後の一文」。どの進路も肯定的に描く。家計は使わない。
// 称号は上から順に条件を見て、最初に当てはまったものにする（最後は必ず当てはまる）。

import { campusAt } from '../core/turns';
import type { State } from '../core/types';
import { PASSION, optionName } from './gacha';
import { themeById } from './research';

export type Title = { id: string; name: string; desc: string; when: (s: State) => boolean };

const finalCampus = (s: State) => campusAt(s, s.turns[s.turns.length - 1]);
const seen = (s: State, id: string) => s.seen.includes(id);

export const TITLES: Title[] = [
  { id: 'sekai', name: '世界の顔', desc: '誰も見たことのないデータを、世界でいちばん最初に見た人。', when: (s) => s.ladder >= 4 },
  { id: 'kigyou', name: '杜の都の起業家', desc: '東北大発スタートアップのCEOとして、仙台から世界をねらう。', when: (s) => s.path === 'startup' },
  { id: 'betsu', name: '自分の道をひらく人', desc: '東北大で見つけた夢を、大学の外で育てていく。', when: (s) => s.path === 'dropout' },
  { id: 'futari', name: 'ふたりのとんぺー生', desc: '学生のうちに、人生の相棒を見つけた。', when: (s) => !!s.flags.kekkon },
  { id: 'hakase', name: '博士の卵', desc: '研究者として、世界と戦う道を選んだ。', when: (s) => s.path === 'doctor' },
  { id: 'satoku', name: '査読を越えた人', desc: '自分の研究が、論文として世界に残った。', when: (s) => s.ladder >= 3 },
  { id: 'kenichi', name: '研一の友', desc: 'あの日のツーショットは、スマホの待ち受けのまま。', when: (s) => seen(s, 'kenichi-shot') },
  { id: 'umi', name: '海を越えた人', desc: '海の向こうで学んだ日々が、ものの見方を広げた。', when: (s) => !!s.flags.ryugaku },
  { id: 'hakui', name: '白衣の新人', desc: '6年間の学びを胸に、現場に立つ。', when: (s) => s.path === 'kokushi' && !!s.flags.kokushiPass },
  { id: 'saichousen', name: '再挑戦の人', desc: 'もう一度、国家試験に向かう。その1年は、きっと力になる。', when: (s) => s.path === 'kokushi' && !s.flags.kokushiPass },
  { id: 'aoba', name: '青葉山の住人', desc: '坂の上の研究室が、いちばん落ち着く場所だった。', when: (s) => finalCampus(s) === 'aobayama' && !s.flags.circle && s.stats.tankyu >= 80 },
  { id: 'kawauchi', name: '川内の主', desc: '5年目の川内で、後輩たちに道を教えた。', when: (s) => !!s.flags.ryunen },
  { id: 'imoni', name: '芋煮奉行', desc: '河川敷の鍋のまわりには、いつも人が集まった。', when: (s) => !!s.flags.imoni && s.stats.tsunagari >= 70 },
  { id: 'circle', name: 'サークルの柱', desc: 'サークルの真ん中には、いつもあなたがいた。', when: (s) => s.flags.circle === 'gachi' && s.stats.tsunagari >= 70 },
  { id: 'tonpei', name: 'とんぺー生', desc: '自分のペースで、東北大の日々を歩ききった。', when: () => true },
];

export const titleFor = (s: State): Title => TITLES.find((t) => t.when(s))!;

// ── 10年後の一文（フィクション）。研究テーマごとに1つ
const FUTURE: Record<string, string> = {
  metal: 'あなたが研究した素材は、どこかの街の橋を支えている',
  semi: 'あなたが関わったチップが、誰かのスマホの中で動いている',
  robot: 'あなたが設計したロボットが、どこかの工場で黙々と働いている',
  aero: 'あなたが関わった衛星が、今夜も東北の空の上を回っている',
  energy: 'あなたが考えた仕組みで、どこかの街の明かりがともっている',
  comm: 'あなたが整えた電波に乗って、誰かの「ただいま」が届いている',
  arch: 'あなたが関わった街づくりが、いざという日に人を守っている',
  chembio: 'あなたが見つけた反応が、新しいものづくりの方法を変えている',
  cond: 'あなたが測った物性が、次の新素材のヒントになっている',
  astro: 'あなたが観測した星の光が、教科書の1ページになっている',
  quake: 'あなたの研究が、いざという日の備えに生きている',
  math: 'あなたが証明した定理を、世界のどこかで誰かが使っている',
  synth: 'あなたが作った分子が、どこかの研究室の棚に並んでいる',
  evo: 'あなたが追いかけた生き物の物語が、図鑑の1行になっている',
  ocean: 'あなたが研究した海の幸が、三陸の食卓に並んでいる',
  food: 'あなたが考えた食べ方で、誰かが少し元気になっている',
  crop: 'あなたが育てた品種が、どこかの畑で実っている',
  drug: 'あなたが関わった薬が、誰かの毎日を少し楽にしている',
  device: 'あなたが作った機器が、病院で誰かの命を支えている',
  ph: 'あなたが調べた数字が、街の健康を守っている',
  history: 'あなたが読み解いた古文書が、街の歴史を書きかえている',
  lang: 'あなたが向き合った言葉が、誰かと誰かをつないでいる',
  disaster: 'あなたの研究が、地域の備えの仕組みになっている',
  lawtech: 'あなたが考えたルールで、新しい技術が安心して使われている',
  local: 'あなたが関わったお店が、仙台の街でにぎわっている',
  edtech: 'あなたが作った授業で、どこかの子どもが目を輝かせている',
};

export function tenYearsLater(s: State): string {
  const theme = typeof s.flags.theme === 'string' ? themeById(s.flags.theme) : undefined;
  const passion = optionName(PASSION, s.profile.passion);
  switch (s.path) {
    case 'kokushi':
      return s.flags.kokushiPass
        ? `10年後、あなたはどこかの${s.profile.faculty === 'dent' ? '歯科医院' : '病院'}で、誰かの「ありがとう」を聞いている。`
        : '10年後、あの1年の回り道が、誰かに寄りそう力になっている。';
    case 'startup':
      return '10年後、あなたの会社の名前を、仙台の街角で見かける。';
    case 'dropout':
      return `10年後、大学の外で育てた夢が、ちゃんと形になっている。いまも${passion}が好きなまま。`;
    case 'doctor':
      if (theme) return `10年後、研究者になったあなたの${theme.name}の論文が、世界のどこかで読まれている。`;
  }
  if (theme && FUTURE[theme.id]) return `10年後、${FUTURE[theme.id]}。`;
  return `10年後、あなたは今も${passion}が好きで、それを毎日の真ん中に置いている。`;
}
