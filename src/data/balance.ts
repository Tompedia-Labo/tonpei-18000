// ゲームの調整値（統計ではない）。画面に統計として出さない。調整は scripts/simulate.ts の結果で行う。
// 判定の線（30・2回・50）とこころの下限10は REQUIREMENTS.md「ルール」の値。

export const BALANCE = {
  initial: { tani: 41, tsunagari: 30, kokoro: 60, tankyu: 0 },
  /** 家計で変わるのはサイフの初期値だけ。サイフは進路・判定に使わない */
  saifuByWallet: { yoyu: 60, yayaYoyu: 55, yayaKurushii: 45, kurushii: 40 } as Record<string, number>,
  kokoroFloor: 10,
  /** これを下回ったら、次のターンで立て直しイベントを必ず出す */
  kokoroRescue: 30,
  failLine: 30,
  ryunenFails: 2,
  ryunenTani: 50,
  /** セメスターバリアを越える単位の線（工学部）。学部ごとの留年率がそろうように決めた */
  barrierLine: 30,
  diaryLines: 3,
  /** 条件が細かいイベントほど重くする */
  specificity: { faculty: 2, dept: 3, course: 4 },
  /** 現役の入学年齢。浪人は+1 */
  entryAge: 18,
  drinkingAge: 20,
  /** 分属で第一希望が通る確率：base + (単位 - 50) × perTani を [min, max] に収める */
  assign: { base: 0.7, perTani: 0.006, min: 0.4, max: 0.95 },
  /** 探究：解放時の値、偏愛と合うときの上乗せ、ターンごとの伸び */
  tankyu: { start: 30, passionBonus: 15, perTurn: 6, passionPerTurn: 3 },
  /** 学期ごとに単位が自然に動く量（勉強した分）。性格で差をつけない */
  taniPerTurn: 0,
  /** セメごとの選択の回数（既定1）。出来事の多い1セメだけ2回 */
  choiceSlots: { 1: 2 } as Record<number, number>,
  /** ふだんの選択（進路・分属・配属・立て直し以外）を1周で何回まで出すか */
  regularChoices: 3,
  /** おまかせで、起業できるときに起業を選ぶ割合 */
  autoStartup: 0.3,
};
