// ゲーム内の数値はこのファイルだけに書く。値は REQUIREMENTS.md の「統計データ表」からの書き起こし。
// checked: 作者が出典と照合した日付。照合が済むまで null のままにする。
// provisional: 実データではない「仮置き」の値。公開前に作者が確認する。

export type Stat = {
  value: number;
  label: string;
  source: SourceKey;
  checked: string | null;
  provisional?: true;
  note?: string;
};

export const SOURCES = {
  niad: { title: '大学基本情報 東北大学（在学生数）', url: 'https://www.niad.ac.jp/support/media-download/9843/c07e78e130d4cc68' },
  yokoku2027: { title: '東北大学 2027年度入試の予告', url: 'https://admissions.tohoku.ac.jp/ja/adcms/wp-content/uploads/2025/10/20251022_2yokoku.pdf' },
  keinetCareer: { title: 'Kei-Net 東北大学 進学・就職実績', url: 'https://search.keinet.ne.jp/1050/outline/admission_employment' },
  keinetDept: { title: 'Kei-Net 東北大学 学部・学科', url: 'https://search.keinet.ne.jp/1050/outline/department' },
  life2025: { title: '2025年度 東北大学学生生活調査', url: 'https://www.tohoku.ac.jp/japanese/studentinfo/studentlife/09/studentlife0901/studentlife0901_r7.pdf' },
  osaka: { title: '大阪大学 修業年限内卒業率（参考）', url: 'https://www.osaka-u.ac.jp/ja/education/announcement/files/term.pdf/@@download/file' },
  physGuide: { title: '東北大 理学部物理系 新入生資料', url: 'https://www.phys.tohoku.ac.jp/physicssys/wp-content/uploads/2015/06/2017_gakusei-seikatsu.pdf' },
  mextTakuetsu: { title: '文部科学省 国際卓越研究大学の認定', url: 'https://www.mext.go.jp/b_menu/houdou/mext_01442.html' },
  mextNanoterasu: { title: '文部科学省 NanoTerasu', url: 'https://www.mext.go.jp/b_menu/activity/detail/2024/20240518.html' },
  game: { title: 'ゲーム内の仮の値（実データではありません）', url: '' },
} as const;

export type SourceKey = keyof typeof SOURCES;

const s = (value: number, label: string, source: SourceKey, extra: Partial<Stat> = {}): Stat => ({
  value,
  label,
  source,
  checked: null,
  ...extra,
});
const game = (value: number, label: string, note?: string): Stat =>
  s(value, label, 'game', { provisional: true, ...(note ? { note } : {}) });

export const STATS = {
  // ── 大学全体（2025年度）
  'enrolled.total': s(17975, '在学生', 'niad'),
  'enrolled.undergrad': s(10733, '学部生', 'niad'),
  'enrolled.master': s(4273, '修士・専門職', 'niad'),
  'enrolled.doctor': s(2969, '博士', 'niad'),

  // ── 学部の入学定員（2027年度入試の予告）
  'capacity.total': s(2406, '学部の入学定員', 'yokoku2027'),
  'capacity.eng': s(850, '工学部の入学定員', 'yokoku2027'),
  'capacity.sci': s(324, '理学部の入学定員', 'yokoku2027'),
  'capacity.med': s(249, '医学部の入学定員', 'yokoku2027'),
  'capacity.econ': s(260, '経済学部の入学定員', 'yokoku2027'),
  'capacity.lit': s(210, '文学部の入学定員', 'yokoku2027'),
  'capacity.law': s(160, '法学部の入学定員', 'yokoku2027'),
  'capacity.agr': s(150, '農学部の入学定員', 'yokoku2027'),
  'capacity.pharm': s(80, '薬学部の入学定員', 'yokoku2027'),
  'capacity.edu': s(70, '教育学部の入学定員', 'yokoku2027'),
  'capacity.dent': s(53, '歯学部の入学定員', 'yokoku2027'),

  // ── 入学方式ごとの募集人員（全学）
  'entry.zenki': s(1511, '一般選抜 前期日程', 'yokoku2027'),
  'entry.kouki': s(80, '一般選抜 後期日程（経済・理のみ）', 'yokoku2027'),
  'entry.ao2': s(290, '総合型選抜（AO入試）Ⅱ期', 'yokoku2027'),
  'entry.ao3': s(344, '総合型選抜（AO入試）Ⅲ期', 'yokoku2027'),

  // ── 学生生活調査（2025年度、学部生）
  'wallet.yoyu': s(0.172, '経済的に余裕がある', 'life2025'),
  'wallet.yayaYoyu': s(0.41, '経済的にやや余裕がある', 'life2025'),
  'wallet.yayaKurushii': s(0.282, '経済的にやや苦しい', 'life2025'),
  'wallet.kurushii': s(0.129, '経済的に苦しい', 'life2025'),
  'life.circle': s(0.76, 'サークル・団体に加入中', 'life2025', { note: 'グラフ読み取り' }),
  'life.abroad': s(0.15, '海外留学・研修の経験がある', 'life2025', { note: '「経験なし8割強」からの読み取り' }),
  'worry.career': s(0.204, '悩み：将来の進路', 'life2025', { note: '複数回答の延べ比率' }),
  'worry.study': s(0.194, '悩み：学業', 'life2025', { note: '複数回答の延べ比率' }),
  'worry.self': s(0.107, '悩み：自分の性格・能力', 'life2025', { note: '複数回答の延べ比率' }),
  'life.satisfied': s(0.9, '学生生活全般に満足', 'life2025', { note: '満足＋どちらかと言えば満足' }),

  // ── 学部別：2024年度卒業者と進学率
  'grad.total': s(2439, '学部卒業者（2024年度）', 'keinetCareer'),
  'grad.eng.count': s(840, '工学部の卒業者', 'keinetCareer'),
  'grad.eng.shingaku': s(0.902, '工学部の進学率', 'keinetCareer'),
  'grad.sci.count': s(312, '理学部の卒業者', 'keinetCareer'),
  'grad.sci.shingaku': s(0.872, '理学部の進学率', 'keinetCareer'),
  'grad.econ.count': s(260, '経済学部の卒業者', 'keinetCareer'),
  'grad.econ.shingaku': s(0.112, '経済学部の進学率', 'keinetCareer'),
  'grad.lit.count': s(204, '文学部の卒業者', 'keinetCareer'),
  'grad.lit.shingaku': s(0.167, '文学部の進学率', 'keinetCareer'),
  'grad.law.count': s(168, '法学部の卒業者', 'keinetCareer'),
  'grad.law.shingaku': s(0.226, '法学部の進学率', 'keinetCareer'),
  'grad.agr.count': s(155, '農学部の卒業者', 'keinetCareer'),
  'grad.agr.shingaku': s(0.819, '農学部の進学率', 'keinetCareer'),
  'grad.edu.count': s(73, '教育学部の卒業者', 'keinetCareer'),
  'grad.edu.shingaku': s(0.233, '教育学部の進学率', 'keinetCareer'),
  'grad.medDoctor.count': s(149, '医学部医学科の卒業者', 'keinetCareer'),
  'grad.medDoctor.other': s(0.98, '医学科の「その他」（研修医）', 'keinetCareer'),
  'grad.medHoken.count': s(145, '医学部保健学科の卒業者', 'keinetCareer'),
  'grad.medHoken.shingaku': s(0.4, '保健学科の進学率', 'keinetCareer'),
  'grad.pharmSouyaku.count': s(66, '薬学部創薬科学科の卒業者', 'keinetCareer'),
  'grad.pharmSouyaku.shingaku': s(0.985, '創薬科学科の進学率', 'keinetCareer'),
  'grad.pharmYaku.count': s(20, '薬学部薬学科の卒業者', 'keinetCareer'),
  'grad.pharmYaku.shushoku': s(0.85, '薬学科の就職率', 'keinetCareer'),
  'grad.dent.count': s(47, '歯学部の卒業者', 'keinetCareer'),
  'grad.dent.other': s(1, '歯学部の「その他」（研修歯科医）', 'keinetCareer'),

  // ── 修士課程：2024年度修了者の進路
  'master.eng.count': s(708, '工学研究科の修了者', 'keinetCareer'),
  'master.eng.doctor': s(0.155, '工学研究科の博士進学率', 'keinetCareer'),
  'master.eng.job': s(0.821, '工学研究科の就職率', 'keinetCareer'),
  'master.eng.other': s(0.024, '工学研究科の「その他」', 'keinetCareer'),
  'master.sci.count': s(239, '理学研究科の修了者', 'keinetCareer'),
  'master.sci.doctor': s(0.377, '理学研究科の博士進学率', 'keinetCareer'),
  'master.sci.job': s(0.536, '理学研究科の就職率', 'keinetCareer'),
  'master.sci.other': s(0.088, '理学研究科の「その他」', 'keinetCareer'),
  'master.info.count': s(141, '情報科学研究科の修了者', 'keinetCareer'),
  'master.info.doctor': s(0.298, '情報科学研究科の博士進学率', 'keinetCareer'),
  'master.info.job': s(0.667, '情報科学研究科の就職率', 'keinetCareer'),
  'master.info.other': s(0.035, '情報科学研究科の「その他」', 'keinetCareer'),
  'master.pharm.count': s(66, '薬学研究科の修了者', 'keinetCareer'),
  'master.pharm.doctor': s(0.394, '薬学研究科の博士進学率', 'keinetCareer'),
  'master.pharm.job': s(0.591, '薬学研究科の就職率', 'keinetCareer'),
  'master.pharm.other': s(0.015, '薬学研究科の「その他」', 'keinetCareer'),
  'master.agr.count': s(124, '農学研究科の修了者', 'keinetCareer'),
  'master.agr.doctor': s(0.218, '農学研究科の博士進学率', 'keinetCareer'),
  'master.agr.job': s(0.718, '農学研究科の就職率', 'keinetCareer'),
  'master.agr.other': s(0.065, '農学研究科の「その他」', 'keinetCareer'),
  'master.hoken.count': s(43, '医学系研究科 保健学の修了者', 'keinetCareer'),
  'master.hoken.doctor': s(0.233, '医学系研究科 保健学の博士進学率', 'keinetCareer'),
  'master.hoken.job': s(0.767, '医学系研究科 保健学の就職率', 'keinetCareer'),
  'master.hoken.other': s(0, '医学系研究科 保健学の「その他」', 'keinetCareer'),
  'master.lit.count': s(93, '文学研究科の修了者', 'keinetCareer'),
  'master.lit.doctor': s(0.366, '文学研究科の博士進学率', 'keinetCareer'),
  'master.lit.job': s(0.473, '文学研究科の就職率', 'keinetCareer'),
  'master.lit.other': s(0.161, '文学研究科の「その他」', 'keinetCareer'),
  'master.edu.count': s(45, '教育学研究科の修了者', 'keinetCareer'),
  'master.edu.doctor': s(0.244, '教育学研究科の博士進学率', 'keinetCareer'),
  'master.edu.job': s(0.667, '教育学研究科の就職率', 'keinetCareer'),
  'master.edu.other': s(0.089, '教育学研究科の「その他」', 'keinetCareer'),
  'master.econ.count': s(61, '経済学研究科の修了者', 'keinetCareer'),
  'master.econ.doctor': s(0.131, '経済学研究科の博士進学率', 'keinetCareer'),
  'master.econ.job': s(0.525, '経済学研究科の就職率', 'keinetCareer'),
  'master.econ.other': s(0.344, '経済学研究科の「その他」', 'keinetCareer'),
  'master.law.count': s(7, '法学研究科 法制理論の修了者', 'keinetCareer', { note: '人数が少ないので参考値' }),
  'master.law.doctor': s(0.286, '法学研究科 法制理論の博士進学率', 'keinetCareer', { note: '参考値' }),
  'master.law.job': s(0.428, '法学研究科 法制理論の就職率', 'keinetCareer', { note: '参考値' }),
  'master.law.other': s(0.286, '法学研究科 法制理論の「その他」', 'keinetCareer', { note: '参考値' }),

  // ── 国家試験 新卒合格率
  'exam.ishi': s(0.947, '医師国家試験 新卒合格率', 'keinetCareer'),
  'exam.shika': s(0.851, '歯科医師国家試験 新卒合格率', 'keinetCareer'),
  'exam.yakuzaishi': s(1, '薬剤師国家試験 新卒合格率', 'keinetCareer'),

  // ── 仮置き（実データではない。公開前に作者が確認する）
  'game.ryunen': game(0.12, '留年率（仮置き）', '東北大の公表値は未確認。参考：大阪大学工学部の標準年限内卒業率83.9%'),
  'game.dc1': game(0.11, '学振DC1の採用（仮置き）', '要件定義書に「約11%」とあるが出典が未記載'),
  'game.ronin': game(0.3, '浪人して入学（仮置き）', '入試データで確定するまで仮置き'),
  'game.hometown.miyagi': game(0.25, '出身：宮城（仮置き）'),
  'game.hometown.tohoku': game(0.25, '出身：東北他県（仮置き）'),
  'game.hometown.kanto': game(0.25, '出身：関東（仮置き）'),
  'game.hometown.other': game(0.25, '出身：その他（仮置き）'),
  'game.housing.jikka': game(1 / 3, '住まい：実家（仮置き）'),
  'game.housing.hitori': game(1 / 3, '住まい：一人暮らし（仮置き）'),
  'game.housing.ryo': game(1 / 3, '住まい：寮（仮置き）'),
  'game.housing.miyagiJikkaBoost': game(3, '宮城出身なら実家の重みを何倍にするか（仮置き）'),
  'game.ladder.domestic': game(0.5, '国内学会で発表する（仮置き）'),
  'game.ladder.intl': game(0.4, '国際学会で英語発表する（仮置き）'),
  'game.ladder.paper': game(0.25, '論文が採択される（仮置き・レア）'),
  'game.ladder.world': game(0.1, '世界的な成果が出る（仮置き・超レア）'),
  'game.startup': game(0.03, '在学の終わりに起業する（仮置き）'),
  'game.dropout': game(0.02, '在学中に別の道へ進む（仮置き）'),
  // イベントの発生確率（実データではない。レア度には「ゲーム内確率」として入る）
  'game.ev.kenichi': game(0.15, '研一とツーショット（仮置き）'),
  'game.ev.koibito': game(0.3, 'サークルで恋人ができる（仮置き）'),
  'game.ev.kekkon': game(0.08, '学生結婚する（仮置き・激レア）'),
  'game.ev.startupInvite': game(0.35, '起業イベントに出る（仮置き）'),
  'game.ev.aiBare': game(0.3, 'AIで書いたレポートで呼び出される（仮置き）'),
  'game.ev.pond': game(0.25, '大雨の日に生協前の池で泳ぐ（仮置き）'),
  'game.ev.nebou': game(0.3, 'テストに寝坊する（仮置き）'),
  'game.ev.gentsuki': game(0.3, '卒業する先輩から原付をもらう（仮置き）'),
  'game.ev.abroadSick': game(0.3, '留学先で体調を崩す（仮置き）'),
  'game.ev.betsu': game(0.15, '別の道に出会う（仮置き）'),
  'game.ev.tongari': game(0.6, '尖った同期・先輩に出会う（仮置き）'),
  'game.ev.aruaru': game(0.5,'東北大あるあるが起きる（仮置き。出来事ごとに分けてもよい）'),
} satisfies Record<string, Stat>;

export type StatId = keyof typeof STATS;

export const stat = (id: StatId): number => STATS[id].value;
