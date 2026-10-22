// 学部→入試単位→学科→コースの木構造。REQUIREMENTS.md「属性と分岐の構造」から。
// weight を書かない入試単位は均等に抽選する（仮置き：入試単位ごとの募集人員の比が分かるまで）。
// MVPのデータ方針：確認できた層だけ分ける。【要確認】の層（文学部の専修名、農学部の学科・コース名、薬学部の学科分け）はまだ分けない。

import type { Campus } from '../core/types';
import type { StatId } from './stats';

/** 分属の選択肢。dept と course を同時に決めることもある */
export type AssignOption = { name: string; dept?: string; course?: string };

/** 入学後に分かれる層。sem のターンで選択イベントとして出す */
export type Assign = {
  sem: number;
  /** 画面に出す名前（「コース」「学科」など） */
  label: string;
  options: AssignOption[];
};

/** 研究室・ゼミが決まる時期。探究ゲージの解放と研究テーマカードもこのとき */
export type Lab = { sem: number; kind: '研究室' | 'ゼミ' | '研究グループ' | 'セミナー' };

export type Unit = {
  id: string;
  name: string;
  /** 6年制なら 6 */
  years?: 4 | 6;
  /** 入試の時点で決まる学科（入試単位がそのまま学科なら自分の id） */
  dept?: string;
  shingaku?: StatId;
  master?: string | null;
  assigns?: Assign[];
  lab?: Lab;
  /** 工学部のセメスターバリア（このセメの終わりに判定する） */
  barriers?: number[];
};

export type Faculty = {
  id: string;
  name: string;
  short: string;
  capacity: StatId;
  shingaku: StatId | null;
  master: string | null;
  units: Unit[];
  /** from セメから通うキャンパス。要確認：全学教育の期間を川内としている */
  campus: { from: number; campus: Campus }[];
  field: 'rikei' | 'bunkei';
  /** 研究テーマカードの分野（data/research.ts のキー） */
  themes: 'eng' | 'sci' | 'agr' | 'med' | 'bunkei';
  lab: Lab;
};

// 工学部のコース（各学科の履修過程の説明より）
const course = (dept: string, names: string[]): AssignOption[] => names.map((n) => ({ name: `${n}コース`, dept, course: `${dept}:${n}` }));

/** 建築・社会環境工学科のうち、クロス情報プログラムに申し込める土木系3コース */
export const CROSS_COURSES = ['eng.arch:社会基盤デザイン', 'eng.arch:水環境デザイン', 'eng.arch:都市システム計画'];

export const FACULTIES: Faculty[] = [
  {
    id: 'lit', name: '文学部', short: '文', capacity: 'capacity.lit', shingaku: 'grad.lit.shingaku', master: 'lit', field: 'bunkei', themes: 'bunkei',
    // 専修（26）は2セメ終了時に決まるが、専修名が未確認なのでMVPでは分けない（要確認）
    units: [{ id: 'lit.jinbun', name: '人文社会学科', dept: 'lit.jinbun' }],
    campus: [{ from: 1, campus: 'kawauchi' }],
    lab: { sem: 7, kind: 'ゼミ' }, // 要確認
  },
  {
    id: 'edu', name: '教育学部', short: '教育', capacity: 'capacity.edu', shingaku: 'grad.edu.shingaku', master: 'edu', field: 'bunkei', themes: 'bunkei',
    units: [
      {
        id: 'edu.kagaku', name: '教育科学科', dept: 'edu.kagaku',
        assigns: [{ sem: 3, label: 'コース', options: [{ name: '教育学コース', course: 'edu:教育学' }, { name: '教育心理学コース', course: 'edu:教育心理学' }] }],
      },
    ],
    campus: [{ from: 1, campus: 'kawauchi' }],
    lab: { sem: 7, kind: 'ゼミ' }, // 要確認
  },
  {
    id: 'law', name: '法学部', short: '法', capacity: 'capacity.law', shingaku: 'grad.law.shingaku', master: 'law', field: 'bunkei', themes: 'bunkei',
    units: [{ id: 'law.hou', name: '法学科', dept: 'law.hou' }],
    campus: [{ from: 1, campus: 'kawauchi' }],
    lab: { sem: 7, kind: 'ゼミ' }, // 要確認
  },
  {
    id: 'econ', name: '経済学部', short: '経済', capacity: 'capacity.econ', shingaku: 'grad.econ.shingaku', master: 'econ', field: 'bunkei', themes: 'bunkei',
    units: ['bun', 'ri'].map((k) => ({
      id: `econ.${k}`,
      name: k === 'bun' ? '文系' : '理系',
      assigns: [{ sem: 5, label: '学科', options: [{ name: '経済学科', dept: 'econ.keizai' }, { name: '経営学科', dept: 'econ.keiei' }] }],
    })),
    campus: [{ from: 1, campus: 'kawauchi' }],
    lab: { sem: 7, kind: 'ゼミ' }, // 要確認
  },
  {
    id: 'sci', name: '理学部', short: '理', capacity: 'capacity.sci', shingaku: 'grad.sci.shingaku', master: 'sci', field: 'rikei', themes: 'sci',
    units: [
      { id: 'sci.math', name: '数学系', dept: 'sci.math', lab: { sem: 7, kind: 'セミナー' } },
      {
        id: 'sci.phys', name: '物理系', lab: { sem: 7, kind: '研究グループ' },
        assigns: [
          {
            sem: 4, label: '学科',
            options: [
              { name: '物理学科', dept: 'sci.phys.phys' },
              { name: '宇宙地球物理学科 天文学コース', dept: 'sci.phys.geo', course: 'sci:天文学' },
              { name: '宇宙地球物理学科 地球物理学コース', dept: 'sci.phys.geo', course: 'sci:地球物理学' },
            ],
          },
        ],
      },
      { id: 'sci.chem', name: '化学系', dept: 'sci.chem', lab: { sem: 6, kind: '研究室' } },
      {
        id: 'sci.earth', name: '地球科学系', lab: { sem: 7, kind: '研究グループ' }, // 要確認：地球惑星物質科学科の時期
        // 要確認：資料により2年の夏とも
        assigns: [{ sem: 4, label: '学科', options: [{ name: '地圏環境科学科', dept: 'sci.earth.chiken' }, { name: '地球惑星物質科学科', dept: 'sci.earth.wakusei' }] }],
      },
      { id: 'sci.bio', name: '生物系', dept: 'sci.bio', lab: { sem: 6, kind: '研究室' } },
    ],
    campus: [
      { from: 1, campus: 'kawauchi' },
      { from: 4, campus: 'aobayama' },
    ],
    lab: { sem: 7, kind: '研究室' },
  },
  {
    id: 'eng', name: '工学部', short: '工', capacity: 'capacity.eng', shingaku: 'grad.eng.shingaku', master: 'eng', field: 'rikei', themes: 'eng',
    // 学科名は要確認
    units: [
      {
        id: 'eng.mech', name: '機械知能・航空工学科', dept: 'eng.mech', lab: { sem: 5, kind: '研究室' }, barriers: [3, 6],
        assigns: [{ sem: 3, label: 'コース', options: course('eng.mech', ['機械システム', 'ファインメカニクス', 'ロボティクス', '航空宇宙', '機械・医工学', '量子サイエンス', 'エネルギー環境']) }],
      },
      {
        id: 'eng.ecei', name: '電気情報物理工学科', dept: 'eng.ecei', lab: { sem: 6, kind: '研究室' }, barriers: [3, 6], // 要確認：バリアの時期
        assigns: [{ sem: 3, label: 'コース', options: course('eng.ecei', ['電気工学', '通信工学', '電子工学', '応用物理学', '情報工学', 'バイオ・医工学']) }],
      },
      {
        // 所属コースは7セメに研究室と同時に決まる
        id: 'eng.chem', name: '化学・バイオ工学科', dept: 'eng.chem', lab: { sem: 7, kind: '研究室' }, barriers: [4, 6],
        assigns: [{ sem: 7, label: 'コース', options: course('eng.chem', ['応用化学', '化学工学', 'バイオ工学']) }],
      },
      {
        // 配属された研究室が属するコースが所属コース
        id: 'eng.mat', name: '材料科学総合学科', dept: 'eng.mat', lab: { sem: 7, kind: '研究室' }, barriers: [4, 6],
        assigns: [{ sem: 7, label: 'コース', options: course('eng.mat', ['金属フロンティア工学', '知能デバイス材料学', '材料システム工学', '材料環境学']) }],
      },
      {
        id: 'eng.arch', name: '建築・社会環境工学科', dept: 'eng.arch', lab: { sem: 6, kind: '研究室' }, barriers: [3, 6],
        assigns: [{ sem: 3, label: 'コース', options: course('eng.arch', ['社会基盤デザイン', '水環境デザイン', '都市システム計画', '都市・建築デザイン', '都市・建築学']) }],
      },
    ],
    campus: [
      { from: 1, campus: 'kawauchi' },
      { from: 5, campus: 'aobayama' }, // 要確認
    ],
    lab: { sem: 7, kind: '研究室' },
  },
  {
    id: 'agr', name: '農学部', short: '農', capacity: 'capacity.agr', shingaku: 'grad.agr.shingaku', master: 'agr', field: 'rikei', themes: 'agr',
    // 2学科6コースは3セメに選ぶが、学科・コース名が未確認なのでMVPでは分けない（要確認）
    units: [{ id: 'agr.all', name: '学部一括' }],
    campus: [
      { from: 1, campus: 'kawauchi' }, // 要確認
      { from: 3, campus: 'aobayama' }, // 要確認：青葉山新キャンパス
    ],
    lab: { sem: 7, kind: '研究室' }, // 要確認
  },
  {
    id: 'med', name: '医学部', short: '医', capacity: 'capacity.med', shingaku: null, master: null, field: 'rikei', themes: 'med',
    units: [
      { id: 'med.ig', name: '医学科', dept: 'med.ig', years: 6, master: null, lab: { sem: 9, kind: '研究室' } }, // 要確認
      { id: 'med.kango', name: '保健学科 看護学専攻', dept: 'med.kango', shingaku: 'grad.medHoken.shingaku', master: 'hoken' },
      { id: 'med.housha', name: '保健学科 放射線技術科学専攻', dept: 'med.housha', shingaku: 'grad.medHoken.shingaku', master: 'hoken' },
      { id: 'med.kensa', name: '保健学科 検査技術科学専攻', dept: 'med.kensa', shingaku: 'grad.medHoken.shingaku', master: 'hoken' },
    ],
    campus: [
      { from: 1, campus: 'kawauchi' }, // 要確認
      { from: 3, campus: 'seiryo' }, // 要確認
    ],
    lab: { sem: 7, kind: '研究室' }, // 要確認
  },
  {
    id: 'dent', name: '歯学部', short: '歯', capacity: 'capacity.dent', shingaku: null, master: null, field: 'rikei', themes: 'med',
    units: [{ id: 'dent.shi', name: '歯学科', dept: 'dent.shi', years: 6 }],
    campus: [
      { from: 1, campus: 'kawauchi' }, // 要確認
      { from: 3, campus: 'seiryo' }, // 要確認
    ],
    lab: { sem: 9, kind: '研究室' }, // 要確認
  },
  {
    // 学科分け（創薬科学4年制／薬学6年制）は時期が要確認なので、MVPでは学部単位・4年で扱う
    id: 'pharm', name: '薬学部', short: '薬', capacity: 'capacity.pharm', shingaku: 'grad.pharmSouyaku.shingaku', master: 'pharm', field: 'rikei', themes: 'med',
    units: [{ id: 'pharm.all', name: '学部一括' }],
    campus: [
      { from: 1, campus: 'kawauchi' }, // 要確認
      { from: 3, campus: 'aobayama' }, // 要確認
    ],
    lab: { sem: 6, kind: '研究室' },
  },
];

/** 分属で決まる学科の名前 */
export const DEPT_NAME: Record<string, string> = {
  'econ.keizai': '経済学科',
  'econ.keiei': '経営学科',
  'sci.math': '数学科',
  'sci.chem': '化学科',
  'sci.bio': '生物学科',
  'sci.phys.phys': '物理学科',
  'sci.phys.geo': '宇宙地球物理学科',
  'sci.earth.chiken': '地圏環境科学科',
  'sci.earth.wakusei': '地球惑星物質科学科',
};

export const CAMPUS_NAME: Record<Campus, string> = {
  kawauchi: '川内',
  aobayama: '青葉山',
  katahira: '片平',
  seiryo: '星陵',
};

export const faculty = (id: string): Faculty => {
  const f = FACULTIES.find((x) => x.id === id);
  if (!f) throw new Error(`unknown faculty: ${id}`);
  return f;
};

export const unit = (id: string): Unit => {
  for (const f of FACULTIES) {
    const u = f.units.find((x) => x.id === id);
    if (u) return u;
  }
  throw new Error(`unknown unit: ${id}`);
};

/** 学科の表示名。入試単位が学科なら入試単位の名前 */
export const deptName = (id: string): string => DEPT_NAME[id] ?? (FACULTIES.flatMap((f) => f.units).find((u) => u.id === id)?.name ?? id);

/** コースの表示名（「eng.mech:ロボティクス」→「ロボティクスコース」） */
export const courseName = (id: string): string => `${id.split(':')[1] ?? id}コース`;

/** 分属で決まる学科ごとの研究室の時期 */
const DEPT_LAB: Record<string, Lab> = {
  'sci.earth.chiken': { sem: 5, kind: '研究グループ' }, // 3年の夏から
};

/** 研究室・ゼミが決まる時期。学科→入試単位→学部の既定（要確認）の順に探す */
export const labOf = (p: { faculty: string; unit: string; dept: string | null }): Lab =>
  (p.dept && DEPT_LAB[p.dept]) || unit(p.unit).lab || faculty(p.faculty).lab;
