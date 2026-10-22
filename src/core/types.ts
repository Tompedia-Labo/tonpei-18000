import type { StatId } from '../data/stats';

export type StatKey = 'tani' | 'tsunagari' | 'saifu' | 'kokoro' | 'tankyu';
export type Stats = Record<StatKey, number>;

export type Campus = 'kawauchi' | 'aobayama' | 'katahira' | 'seiryo';

export type Effect = {
  stats?: Partial<Stats>;
  flags?: Record<string, FlagValue>;
};
export type FlagValue = string | number | boolean | null;

/** 書かない項目は「どれでも可」 */
export type When = {
  sem?: number[];
  master?: (1 | 2)[];
  extra?: boolean; // 留年で足された「5年目」だけ
  /** 在学のターンがすべて終わったあと（卒業式・修了式） */
  final?: boolean;
  entry?: string[];
  faculty?: string[];
  dept?: string[];
  course?: string[];
};

/** 確率イベント・選択がレア度ログに残すもの */
export type RareSpec = { label: string; p?: number; stat?: StatId };

export type ChoiceAction =
  | { type: 'path'; path: 'master' | 'job' | 'startup' | 'dropout' }
  | { type: 'finalPath'; path: 'masterJob' | 'doctor' | 'startup' }
  | { type: 'assign'; index: number }
  | { type: 'theme'; theme: string }
  | { type: 'cross'; join: boolean };

export type Choice = {
  label: string;
  result: string;
  effects?: Effect;
  rare?: RareSpec;
  /** 選んだときに起きる副作用（進路の決定など）。engine が解釈する */
  action?: ChoiceAction;
  cond?: (s: State) => boolean;
};

/** engine が作る選択肢（分属・研究テーマ）。State に入るので関数を持たない */
export type SynthChoice = Omit<Choice, 'cond'> & { sub?: string; badge?: string };

export type GameEvent = {
  id: string;
  kind: 'fixed' | 'random' | 'choice';
  when: When;
  cond?: (s: State) => boolean;
  weight?: number;
  /** 発生確率（stats.ts のキー）。抽選で選ばれたあとに判定し、rare ならレア度に入る */
  prob?: StatId;
  /** シーンの季節を指定する（大雨は夏、ページェントは冬など） */
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  rare?: RareSpec;
  statLine?: string; // {value} に stats の値を差し込む
  source?: StatId | ((s: State) => StatId | null);
  text: string;
  caution?: string;
  /** 飲酒・危ない実話。lint とシミュレーションで条件を確かめる */
  tags?: ('drinking' | 'danger')[];
  /** こころが下がったときの立て直しイベント */
  rescue?: boolean;
  /** 必ず出す選択（進路など）。分属・配属と同じターンでも出す */
  priority?: boolean;
  effects?: Effect;
  choices?: Choice[];
  once?: boolean;
  scene?: string;
  image?: string;
  /** 年表に載せる一言 */
  highlight?: string;
};

export type Turn =
  | { kind: 'sem'; sems: number[]; extra?: boolean }
  | { kind: 'master'; year: 1 | 2 };

export type Profile = {
  faculty: string;
  unit: string; // 入試単位
  dept: string | null; // 学科・系（未分属なら null）
  course: string | null;
  entry: string;
  ronin: boolean;
  hometown: string;
  housing: string;
  wallet: string; // 家計。イベントの出し分けにだけ使う
  personality: string;
  passion: string;
};

export type RareEntry = { id: string; label: string; p: number; kind: 'real' | 'game' };

export type HistoryEntry = { turn: Turn; highlight: string | null; scene: string | null; stats: Stats };

export type Path =
  | 'job' // 学部卒業→就職
  | 'master' // 院進（修士の途中）
  | 'masterJob'
  | 'doctor'
  | 'masterOther'
  | 'kokushi'
  | 'startup'
  | 'dropout';

export type Step =
  | { t: 'turnStart' }
  | { t: 'event'; id: string }
  | { t: 'assign' }
  | { t: 'cross' }
  | { t: 'lab' }
  | { t: 'unlock' }
  | { t: 'diary' }
  | { t: 'choice' }
  | { t: 'ladder' }
  | { t: 'judge' }
  | { t: 'roadExtend'; labels: string[]; why: 'master' | 'ryunen' };

export type ChoiceVariant = 'normal' | 'assign' | 'theme' | 'rescue';

export type Pending = { eventId: string; options?: SynthChoice[]; variant: ChoiceVariant };

export type State = {
  seed: number;
  rng: [number, number, number, number];
  profile: Profile;
  stats: Stats;
  tankyuUnlocked: boolean;
  flags: Record<string, FlagValue>;
  age: number;
  fails: number;
  rareLog: RareEntry[];
  turns: Turn[];
  turnIndex: number;
  queue: Step[];
  history: HistoryEntry[];
  seen: string[];
  pending: Pending | null;
  path: Path | null;
  /** 研究の階段で届いた段（LADDER の添字。-1 はまだ） */
  ladder: number;
  done: boolean;
};

export type Deltas = Partial<Stats>;

export type ShownEvent = {
  id: string;
  text: string;
  season?: GameEvent['season'];
  statLine?: string;
  source?: StatId;
  caution?: string;
  scene?: string;
  image?: string;
  deltas: Deltas;
};

export type ShownChoice = { label: string; sub?: string; badge?: string };

export type Beat =
  | { type: 'turnStart'; turn: Turn; label: string; deltas: Deltas }
  | { type: 'event'; event: ShownEvent }
  | { type: 'diary'; lines: ShownEvent[] }
  | {
      type: 'choice';
      id: string;
      variant: ChoiceVariant;
      /** 分属・研究テーマのときの見出し（「コースの希望を出す」など） */
      tag?: string;
      text: string;
      statLine?: string;
      source?: StatId;
      caution?: string;
      scene?: string;
      season?: GameEvent['season'];
      image?: string;
      choices: ShownChoice[];
    }
  | { type: 'choiceResult'; id: string; text: string; deltas: Deltas; tone?: 'good' | 'twist' }
  | { type: 'unlock'; theme: string; value: number; text: string }
  | { type: 'ladder'; step: number; name: string; text: string }
  | { type: 'judge'; text: string; deltas: Deltas; barrier?: { sem: number; passed: boolean } }
  | { type: 'roadExtend'; labels: string[]; why: 'master' | 'ryunen' }
  | { type: 'end' };
