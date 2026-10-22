// 研究テーマカード、偏愛との相性、進む業界、研究の階段。REQUIREMENTS.md「東北大らしさの設計」から。
// 研究室名は出さない。業界の比率は公開データが無いので使わない（テーマから1つに決める）。企業名は出さない。
// 仮置き：要件の例に無い業界（食品・水産、出版・文化、金融・コンサル、教育）とテーマ⇔偏愛の相性は、作者に確認する。

import type { Faculty } from './structure';
import type { StatId } from './stats';

export type Theme = {
  id: string;
  name: string;
  /** 進む業界（就職エンド用） */
  industry: string;
  /** 相性のいい偏愛（data/gacha.ts の PASSION の id） */
  passions: string[];
};

const t = (id: string, name: string, industry: string, passions: string[]): Theme => ({ id, name, industry, passions });

export const THEMES: Record<Faculty['themes'], Theme[]> = {
  eng: [
    t('metal', '金属・新素材', '素材・鉄鋼・化学', ['metal']),
    t('semi', '半導体・スピントロニクス', '半導体・電子部品', ['ai', 'metal']),
    t('robot', 'ロボット', '自動車・重工・機械', ['robot']),
    t('aero', '航空宇宙・超小型衛星', '宇宙・重工', ['space', 'robot']),
    t('energy', 'エネルギー・原子力', '電力・エネルギー', ['energy']),
    t('comm', '通信・電波', '通信・IT', ['ai']),
    t('arch', '建築・防災', '建設・インフラ・官公庁', ['earth']),
    t('chembio', '化学・バイオ', '素材・鉄鋼・化学', ['sea', 'care']),
  ],
  sci: [
    t('cond', '物性物理', '半導体・電子部品', ['metal', 'math']),
    t('astro', '宇宙・天文', '宇宙・重工', ['space']),
    t('quake', '地震・火山', '建設・インフラ・官公庁', ['earth']),
    t('math', '数学', '通信・IT', ['math', 'philo']),
    t('synth', '化学合成', '素材・鉄鋼・化学', ['metal', 'energy']),
    t('evo', '生物の進化', '製薬・医療', ['sea']),
  ],
  agr: [
    t('ocean', '海洋・水産', '食品・水産', ['sea']),
    t('food', '食と健康', '食品・水産', ['care']),
    t('crop', '作物・植物', '食品・水産', ['energy', 'earth']),
  ],
  med: [
    t('drug', '創薬', '製薬・医療', ['care']),
    t('device', '医療機器・医工学', '製薬・医療', ['robot', 'ai']),
    t('ph', '公衆衛生', '製薬・医療', ['care', 'socio']),
  ],
  bunkei: [
    t('history', '歴史・古文書', '出版・文化', ['history', 'words']),
    t('lang', '言語', '出版・文化', ['words']),
    t('disaster', '災害と地域社会', '建設・インフラ・官公庁', ['earth', 'socio']),
    t('lawtech', '法と先端技術', '通信・IT', ['philo', 'ai']),
    t('local', '地域経済・スタートアップ', '金融・コンサル', ['startup', 'socio']),
    t('edtech', '教育とテクノロジー', '教育', ['teach', 'pedagogy', 'ai']),
  ],
};

/** 研究を続ける人の行き先 */
export const RESEARCH_INDUSTRY = '大学・研究機関';

export const allThemes = (): Theme[] => Object.values(THEMES).flat();
export const themeById = (id: string): Theme | undefined => allThemes().find((x) => x.id === id);

/** 研究の階段。確率は実データではないので画面に統計として出さない（ゲーム内確率） */
export type Step = {
  id: 'lab' | 'domestic' | 'intl' | 'paper' | 'world';
  name: string;
  /** 挑戦できるターン */
  when: 'undergrad' | 'master' | 'master2';
  /** 必要な探究 */
  need: number;
  chance: StatId | null;
  rare: boolean;
  text: string;
};

export const LADDER: Step[] = [
  { id: 'lab', name: '研究室内の発表', when: 'undergrad', need: 0, chance: null, rare: false, text: '初めての研究室内の発表。\nスライドの1枚目で、もう手が震えた。' },
  { id: 'domestic', name: '国内学会で発表', when: 'undergrad', need: 55, chance: 'game.ladder.domestic', rare: false, text: '国内学会で発表した。\n知らない大学の人が、うなずきながら聞いてくれた。' },
  { id: 'intl', name: '国際学会で英語発表', when: 'master', need: 65, chance: 'game.ladder.intl', rare: true, text: '国際学会で英語発表。\n質問の英語が速すぎて、一瞬固まった。' },
  { id: 'paper', name: '論文が採択される', when: 'master', need: 75, chance: 'game.ladder.paper', rare: true, text: '論文が採択された。\nメールの件名を、3回読み直した。' },
  // 例：共同研究でNanoTerasuを使った測定に立ち会う（要確認）
  { id: 'world', name: '世界的な成果', when: 'master2', need: 85, chance: 'game.ladder.world', rare: true, text: '共同研究の測定に立ち会った夜。\n誰も見たことのないデータが、画面に出た。' },
];
