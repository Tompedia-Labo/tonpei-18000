// イベント本体（下書き。作者が東北大生の目で赤を入れる）。
// 本文は短文・口語・1画面3行まで（改行は \n）。ランダムイベントは日記に3本並ぶので1行にする。
// 数値は本文に書かず、statLine の {value} と source（stats.ts のキー）で出す。確率も stats.ts のキー（prob）で参照する。
// 東北大の事実に関わる文には「要確認」を付ける。飲酒・危ない実話には tags と caution を付ける。
// 住まい・性格・入学方式・学部のイベントは単位を動かさないか、＋と−を同じ大きさにする（進路に差を出さない）。
// 差し込み：{faculty} {unit} {dept} {course} {circle} {theme}

import { masterKey, shingakuStat } from '../core/ending';
import { campusAt } from '../core/turns';
import type { Campus, GameEvent, State } from '../core/types';
import type { StatId } from './stats';

const RIKEI = ['sci', 'eng', 'agr', 'med', 'dent', 'pharm'];
const ODD = [1, 3, 5, 7, 9, 11];
const EVEN = [2, 4, 6, 8, 10, 12];
/** 学部・学科のイベントの時期。1〜2セメは全学教育が中心なので、専門の場面は2年・3年から（要確認） */
const ANY_SEM = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const FROM_2NEN = ANY_SEM.slice(2);
const FROM_3NEN = ANY_SEM.slice(4);
const at = (c: Campus) => (s: State) => campusAt(s, s.turns[s.turnIndex]) === c;
const isMaster = (s: State) => s.turns.some((t) => t.kind === 'master');
const DRINK = '※お酒は20歳になってから。飲みすぎに注意。';

/** 東北大あるある：起きるかどうかを確率で決め、起きたらレア度に入れる（ゲーム内確率） */
const ARUARU = [
  'stamina-ramen', 'gyutan', 'kenichi-nuigurumi', 'matsushima', 'hanami', 'tanabata', 'imoni', 'pageant', 'karaoke',
  'kintore', 'jisui', 'koukan-ryugakusei', 'yuki-zaka', 'chikatetsu', 'jimoto-talk', 'kyoutsu-test', 'nebou-ok',
  'lab-tomari', 'lab-boardgame', 'lab-umakuitta', 'gakkai-tomodachi', 'kouhai-ronbun', 'ryugaku-tomodachi',
];

const BASE_EVENTS: GameEvent[] = [
  // ════════ 固定イベント
  {
    id: 'nyugakushiki',
    kind: 'fixed',
    when: { sem: [1] },
    // 要確認：学生歌の題名。歌詞は画面に出さない
    text: '入学式。\n学生歌「青葉もゆるこのみちのく」を、なんとなく口ずさむ。\n今日から{faculty}生だ。',
    effects: { stats: { kokoro: 5 } },
    scene: 'ceremony',
    highlight: '入学式で学生歌を口ずさんだ',
  },
  {
    id: 'gonenme',
    kind: 'fixed',
    when: { extra: true },
    text: '5年目の春。\n同期の多くは、もう社会人。\n後輩に混じって受ける授業も、案外悪くない。',
    effects: { stats: { kokoro: 3 } },
    scene: 'kawauchi',
    highlight: '5年目のキャンパスを歩いた',
  },
  {
    id: 'rinsho',
    kind: 'fixed',
    when: { sem: [9, 10], dept: ['med.ig', 'dent.shi'] },
    // 要確認：臨床実習が始まる時期
    text: '臨床実習が始まった。\n白衣のポケットに、小さなメモ帳を入れる。',
    effects: { stats: { tani: 3, kokoro: -2 } },
    scene: 'seiryo',
    highlight: '臨床実習が始まった',
  },
  {
    id: 'kokushi',
    kind: 'fixed',
    when: { sem: [11, 12] },
    text: '国家試験の日。\n6年分のノートを、かばんに詰めた。',
    effects: { stats: { kokoro: -3 } },
    scene: 'room',
    highlight: '国家試験を受けた',
  },
  {
    id: 'shuron',
    kind: 'fixed',
    when: { master: [2] },
    text: '修論の締切まで、あと一週間。\n後輩に、実験ノートの書き方を教えた。\nこの研究は、次の誰かが引き継ぐ。',
    effects: { stats: { tankyu: 5, kokoro: -4 } },
    scene: 'lab',
    highlight: '修論を書き上げ、後輩に引き継いだ',
  },
  {
    id: 'sotsugyo',
    kind: 'fixed',
    when: { final: true },
    cond: (s) => !isMaster(s) && s.path !== 'dropout',
    text: '卒業式。\nスーツや袴の人波の中で、見慣れた顔を探す。\n{faculty}での日々が、今日で終わる。',
    effects: { stats: { kokoro: 5 } },
    scene: 'ceremony',
    highlight: '卒業式',
  },
  {
    id: 'shuryo',
    kind: 'fixed',
    when: { final: true },
    cond: (s) => isMaster(s),
    text: '修了式。\n研究室のみんなと、最後の写真を撮った。\n見慣れた景色も、今日で見納め。',
    effects: { stats: { kokoro: 5 } },
    scene: 'ceremony',
    highlight: '修了式',
  },
  {
    id: 'saraba',
    kind: 'fixed',
    when: { final: true },
    cond: (s) => s.path === 'dropout',
    text: '学生証を、そっと財布から出した。\nキャンパスの並木道を、最後にもう一度歩く。',
    scene: 'kawauchi',
    highlight: '別の道へ踏み出した',
  },

  // ════════ 選択イベント
  {
    id: 'shinkan',
    kind: 'choice',
    when: { sem: [1] },
    priority: true,
    // 要確認
    text: '川内を歩くだけで、新歓のビラが両手いっぱいに。\nさて、どうする？',
    statLine: '統計：東北大生の約{value}がサークル・団体に入っている',
    source: 'life.circle',
    scene: 'kawauchi',
    choices: [
      { label: '本気で打ち込むサークルへ', result: '週4で活動。\n同期の顔と名前が一気に覚えられた。', effects: { stats: { tsunagari: 15, tani: -5 }, flags: { circle: 'gachi' } } },
      { label: 'のんびり楽しむサークルへ', result: '行ける日に行く。\nそれでも誰かが「おつかれ」と言ってくれる。', effects: { stats: { tsunagari: 8 }, flags: { circle: 'yuru' } } },
      { label: 'どこにも入らない', result: '自分の時間はたっぷり。\nビラは机の引き出しにしまった。', effects: { stats: { tani: 6, kokoro: -4 }, flags: { circle: null } } },
    ],
    highlight: '新歓でビラを両手いっぱいにもらった',
  },
  {
    id: 'natsuyasumi',
    kind: 'choice',
    when: { sem: [1, 3] },
    text: '長い夏休みが来る。\nどう過ごす？',
    statLine: '統計：海外留学・研修を経験する東北大生は約{value}',
    source: 'life.abroad',
    scene: 'room',
    season: 'summer',
    choices: [
      { label: '地元に帰省する', result: '駅に着いたら、空気が懐かしかった。\n家族の顔を見て、ほっとする。', effects: { stats: { kokoro: 10, saifu: -3 } }, cond: (s) => s.profile.housing !== 'jikka' },
      { label: '家でのんびりする', result: '昼まで寝て、夜は家族とごはん。\nこういう夏も、ありだ。', effects: { stats: { kokoro: 8 } }, cond: (s) => s.profile.housing === 'jikka' },
      { label: '免許合宿に行く', result: '合宿で2週間。\n教習所の同期とは、今でも連絡をとる。', effects: { stats: { saifu: -15, tsunagari: 4 }, flags: { license: true } } },
      { label: '友達と旅行する', result: '夜行バスで、知らない街へ。\n写真フォルダが、思い出でいっぱい。', effects: { stats: { tsunagari: 8, saifu: -10 } } },
      {
        label: '短期留学に行く',
        result: '海の向こうへ。\n最初の3日は、英語が耳を素通りした。',
        effects: { stats: { saifu: -12, tsunagari: 4, kokoro: 4 }, flags: { ryugaku: true } },
        rare: { label: '海外留学', stat: 'life.abroad' },
        cond: (s) => !s.flags.ryugaku,
      },
    ],
    highlight: '夏休みの過ごし方を決めた',
  },
  {
    id: 'jikasou',
    kind: 'choice',
    when: { sem: [1, 2], faculty: RIKEI },
    // 要確認：じかそう（自然科学総合実験）
    text: 'じかそうのレポート、締切は明日。\nまだ白紙。',
    scene: 'room',
    choices: [
      { label: '徹夜で仕上げる', result: '朝日といっしょに提出した。\n眠いけど、ちょっと誇らしい。', effects: { stats: { tani: 6, kokoro: -8 } } },
      { label: '先輩の過去レポを参考にする', result: '先輩が、考察のコツを教えてくれた。\n持つべきものは、先輩。', effects: { stats: { tani: 4, tsunagari: 5 } } },
      { label: '明日の自分に任せる', result: '朝、出し忘れに気づいた。\nこの必修は、来年もう一度とることになる。', effects: { stats: { tani: -10, kokoro: 4 }, flags: { saiRishu: true } } },
    ],
    highlight: 'じかそうのレポートと格闘した',
  },
  {
    id: 'ai-report',
    kind: 'choice',
    when: { sem: [2, 3, 4] },
    text: 'レポートの締切が、3つ重なった。\nAIに書かせちゃう？',
    scene: 'room',
    choices: [
      { label: '自分で書く', result: '自分の言葉で書き切った。\n時間はかかったけど、頭に残る。', effects: { stats: { tani: 5, kokoro: -5 } } },
      { label: 'AIに下書きさせる', result: 'あっという間に3本できた。\n……ほんとに大丈夫かな。', effects: { stats: { tani: 3, kokoro: 3 }, flags: { aiReport: true } } },
    ],
    highlight: 'レポートの締切が重なった',
  },
  {
    id: 'aoba-tsugaku',
    kind: 'choice',
    when: { sem: [3, 4, 5], faculty: ['sci', 'eng', 'agr', 'pharm'] },
    cond: (s) => s.turnIndex > 0 && at('aobayama')(s) && campusAt(s, s.turns[s.turnIndex - 1]) !== 'aobayama',
    // 要確認：通い方
    text: '専門の授業が始まり、通うキャンパスが変わる。\n青葉山へ、どう通う？',
    scene: 'aobayama',
    choices: [
      { label: '近くに引っ越す', result: '坂の上の部屋に引っ越した。\n朝の時間に、少し余裕ができた。', effects: { stats: { saifu: -10, tani: 4 } } },
      { label: 'ママチャリで登る', result: 'ママチャリで坂を登る毎日。\n脚が、目に見えてたくましくなった。', effects: { stats: { kokoro: 6, tani: -2 }, flags: { mamachari: true } } },
      { label: '地下鉄で通う', result: '地下鉄で、座って本を読む。\n通学の時間が、読書の時間になった。', effects: { stats: { saifu: -5, tani: 2 } } },
    ],
    highlight: '青葉山への通い方を決めた',
  },
  {
    id: 'ryugaku-boshu',
    kind: 'choice',
    when: { sem: [4, 5, 6] },
    cond: (s) => !s.flags.ryugaku,
    text: '交換留学の募集が出た。\n半年、海の向こうで学ぶチャンス。',
    statLine: '統計：海外留学・研修を経験する東北大生は約{value}',
    source: 'life.abroad',
    scene: 'kawauchi',
    choices: [
      {
        label: '応募する',
        result: '面接を通って、出発が決まった。\nスーツケースを、初めて買った。',
        effects: { stats: { tani: -3, tsunagari: 6, saifu: -10 }, flags: { ryugaku: true } },
        rare: { label: '交換留学', stat: 'life.abroad' },
      },
      { label: '今回は見送る', result: '今は、ここでやることがある。\n募集の紙は、手帳にはさんでおいた。', effects: { stats: { kokoro: 3 } } },
    ],
    highlight: '交換留学の募集を見た',
  },
  {
    id: 'kigyou-sasoi',
    kind: 'choice',
    when: { sem: [3, 4, 5, 6] },
    prob: 'game.ev.startupInvite',
    text: '在学中に起業した先輩から、\n起業イベントに誘われた。',
    scene: 'katahira',
    choices: [
      {
        label: '出てみる',
        result: '一晩で、アイデアを形にした。\n「いつか自分も」が、少しだけ本気になる。',
        effects: { stats: { tsunagari: 6, tani: -3 }, flags: { startup: true } },
        rare: { label: '起業イベントに出た', stat: 'game.ev.startupInvite' },
      },
      { label: '今回は断る', result: '気にはなるけど、今は授業に集中。\n先輩は「また今度」と笑った。', effects: { stats: { tani: 3 } } },
    ],
    highlight: '起業イベントに誘われた',
  },

  // ── 尖った同期・先輩（架空の人物。1周に1人まで。能力や生き方を揶揄しない）
  ...(
    [
      { id: 'tongari-app', sem: [1, 2, 3], text: '入学前から自作アプリを公開している同期がいる。\n話してみたら、気さくな人だった。' },
      { id: 'tongari-gakkai', sem: [2, 3], text: '1年の夏に、もう学会で発表した同期がいる。\nすごいな、と素直に思った。' },
      { id: 'tongari-eisei', sem: [3, 4, 5, 6], faculty: ['eng', 'sci'], text: '超小型衛星を作っている先輩に、\n研究室を見せてもらった。目が輝いていた。' },
      { id: 'tongari-gogaku', sem: [4, 5, 6, 7, 8], text: '5か国語で論文を読む留学生と、同じ授業になった。\n休み時間の話が、いちばん面白い。' },
      { id: 'tongari-suushiki', sem: [5, 6, 7, 8], text: '黒板いっぱいの数式に、何時間も向き合う院生がいる。\n声をかけたら、楽しそうに説明してくれた。' },
      { id: 'tongari-gakuseishou', sem: [6, 7, 8], text: '研究室配属半年で、学会の学生賞を獲った先輩がいる。\n実験ノートが、ぎっしりだった。' },
      { id: 'tongari-hakase', master: [1, 2] as (1 | 2)[], text: '卒業の1か月前に、博士進学を決めた先輩がいる。\n「面白いほうを選んだ」と言っていた。' },
      { id: 'tongari-souki', master: [1, 2] as (1 | 2)[], text: '大学院を早期修了した先輩が、研究室に顔を出した。\n話の速さに、ついていくのがやっと。' },
    ] as { id: string; sem?: number[]; master?: (1 | 2)[]; faculty?: string[]; text: string }[]
  ).map(
    (x): GameEvent => ({
      id: x.id,
      kind: 'choice',
      when: { sem: x.sem, master: x.master, faculty: x.faculty },
      prob: 'game.ev.tongari',
      cond: (s) => !s.flags.tongari,
      text: x.text,
      scene: x.master ? 'lab' : 'kawauchi',
      choices: [
        { label: '刺激を受けて、探究に寄せる', result: 'その日から、ちょっとだけ本気を出した。\n知らない論文を、1本読んでみた。', effects: { stats: { tankyu: 10, tani: 3, kokoro: -4 }, flags: { tongari: true } } },
        { label: '自分のペースを守る', result: 'すごい人は、すごい。\n自分は、自分のペースで行く。', effects: { stats: { kokoro: 6 }, flags: { tongari: true } } },
      ],
      highlight: '尖った人に出会った',
    }),
  ),

  {
    id: 'baito-hajimeru',
    kind: 'choice',
    when: { sem: [2, 3, 4] },
    cond: (s) => !s.flags.baito,
    text: 'バイトの面接に受かった、と連絡が来た。\nどうする？',
    scene: 'room',
    choices: [
      { label: '飲食店で働く', result: 'まかないがおいしい。\nシフト仲間とも、すぐ打ち解けた。', effects: { stats: { saifu: 10, tsunagari: 4, tani: -3 }, flags: { baito: 'inshoku' } } },
      { label: '塾講師をやる', result: '教えるのは、思ったより難しい。\n生徒の「わかった！」が、うれしい。', effects: { stats: { saifu: 12, tani: -2, kokoro: 2 }, flags: { baito: 'juku' } } },
      { label: '今はやめておく', result: '今は、授業とサークルで手いっぱい。\nまた落ち着いたら考えよう。', effects: { stats: { tani: 3 } } },
    ],
    highlight: 'バイトを決めた',
  },
  {
    id: 'fuyuyasumi',
    kind: 'choice',
    when: { sem: [2, 4, 6, 8] },
    text: '冬休みが来る。\nどう過ごす？',
    scene: 'room',
    season: 'winter',
    choices: [
      { label: '地元に帰省する', result: '雪の少ない地元が、少し新鮮。\n家族と年を越した。', effects: { stats: { kokoro: 8, saifu: -4 } }, cond: (s) => s.profile.housing !== 'jikka' },
      // 要確認：蔵王へ日帰りでスキーに行けるか
      { label: 'スキーに行く', result: '蔵王まで日帰りで。\n帰りのバスで、全員寝ていた。', effects: { stats: { tsunagari: 6, saifu: -8 } } },
      { label: '課題を片づける', result: 'こたつで、たまった課題を片づけた。\n年明けが、ちょっと楽になる。', effects: { stats: { tani: 5, kokoro: -2 } } },
    ],
    highlight: '冬休みの過ごし方を決めた',
  },
  {
    id: 'kokushi-benkyou',
    kind: 'choice',
    when: { sem: [11, 12], faculty: ['med', 'dent'] },
    priority: true,
    text: '国家試験まで、あと半年。\n勉強のやり方を決めよう。',
    statLine: '統計：新卒の合格率は約{value}',
    source: (s) => (s.profile.faculty === 'dent' ? 'exam.shika' : 'exam.ishi'),
    scene: 'room',
    choices: [
      { label: 'ひとりで黙々と進める', result: '図書館の同じ席で、毎日同じ時間。\nリズムができると、強い。', effects: { stats: { tani: 6, kokoro: -4 } } },
      { label: '仲間と勉強会をする', result: '問題を出し合って、教え合う。\nわからないところが、みんなで埋まっていく。', effects: { stats: { tani: 4, tsunagari: 6 } } },
      { label: '過去問をひたすら解く', result: '何周したか、もう数えていない。\n問題の形が、見えてきた。', effects: { stats: { tani: 5 } } },
    ],
    highlight: '国家試験の勉強を始めた',
  },
  {
    id: 'betsu-no-michi',
    kind: 'choice',
    when: { sem: [5, 6, 7] },
    prob: 'game.ev.betsu',
    text: '授業の外で、夢中になれることを見つけた。\nこのまま、それに賭けてみる？',
    scene: 'room',
    choices: [
      { label: '大学を離れて挑戦する', result: '大学を離れて、その道へ。\n東北大で見つけた夢を、外で育てる。', action: { type: 'path', path: 'dropout' } },
      { label: '卒業まで両立する', result: '授業と夢を、両方抱えていく。\n手帳が、ちょっと忙しくなった。', effects: { stats: { kokoro: 4, tani: -2 } } },
    ],
    highlight: '夢中になれることを見つけた',
  },
  {
    id: 'shinro',
    kind: 'choice',
    when: { sem: [7] },
    text: '進路に悩む夜。\n{faculty}の先輩たちは、どうしてたっけ。',
    statLine: '統計：{faculty}の卒業生のうち約{value}が大学院などへ進学',
    source: (s) => shingakuStat(s.profile),
    cond: (s) => !!shingakuStat(s.profile),
    priority: true,
    scene: 'room',
    choices: [
      { label: '大学院に進む', result: '研究室にもう2年。\n修士1年の自分は、まだ想像がつかない。', action: { type: 'path', path: 'master' } },
      { label: '就職する', result: '就活を始める。\nスーツが少しだけ似合ってきた。', action: { type: 'path', path: 'job' } },
      { label: '起業する', result: '会社を立ち上げる。\n名刺の肩書きは、まだ慣れない。', action: { type: 'path', path: 'startup' }, cond: (s) => !!s.flags.startup },
    ],
    highlight: '進路を決めた',
  },
  {
    id: 'gonenme-sugoshikata',
    kind: 'choice',
    when: { extra: true },
    text: '5年目。\n時間割には、だいぶ余裕がある。どう使う？',
    scene: 'kawauchi',
    choices: [
      { label: '研究や勉強に打ち込む', result: '空いた時間を、全部机に向けた。\n去年わからなかったことが、わかる。', effects: { stats: { tani: 8, tankyu: 6 } } },
      { label: 'バイトで貯める', result: 'シフトを増やした。\n通帳の数字が、じわじわ増える。', effects: { stats: { saifu: 12, tani: 3 } } },
      { label: '後輩と過ごす', result: 'サークルに顔を出したら、頼られた。\n先輩って、悪くない。', effects: { stats: { tsunagari: 8, tani: 3 } } },
    ],
    highlight: '5年目の時間の使い方を決めた',
  },
  {
    id: 'gakkai-m1',
    kind: 'choice',
    when: { master: [1] },
    text: '初めての学会発表。\nどこまで攻める？',
    scene: 'conference',
    choices: [
      { label: '攻めた結果を出す', result: '質問が5つも来た。\n冷や汗と、手ごたえ。', effects: { stats: { tankyu: 10, kokoro: -6 } } },
      { label: '無難にまとめる', result: 'きれいにまとまった発表。\n先生が、小さくうなずいた。', effects: { stats: { tankyu: 3, kokoro: 6 } } },
    ],
    highlight: '初めての学会発表',
  },
  {
    id: 'shukatsu-m1',
    kind: 'choice',
    when: { master: [1] },
    text: '就活が始まって、研究が回らない。\nどっちを優先する？',
    scene: 'lab',
    choices: [
      { label: '就活を優先する', result: '面接の合間に、データだけは取る。\n両立って、こういうことか。', effects: { stats: { tankyu: -3, tsunagari: 4 }, flags: { jobFirst: true } } },
      { label: '研究を優先する', result: 'エントリーは最小限にした。\n実験の手は、止めない。', effects: { stats: { tankyu: 8, kokoro: -3 }, flags: { researchFirst: true } } },
    ],
    highlight: '就活と研究の間で悩んだ',
  },
  {
    id: 'final-path',
    kind: 'choice',
    when: { master: [2] },
    text: '修論の目処が立った夜。\nこの先、どっちへ進もう。',
    statLine: '統計：同じ研究科の修了者のうち約{value}が博士課程へ進む',
    source: (s) => (masterKey(s.profile) ? (`master.${masterKey(s.profile)}.doctor` as StatId) : null),
    priority: true,
    scene: 'lab',
    choices: [
      { label: '就職する', result: '就職を決めた。\n研究で鍛えた粘り強さは、どこでも効く。', action: { type: 'finalPath', path: 'masterJob' } },
      { label: '博士課程へ進む', result: '博士課程へ。\n研究者として、世界と戦う道を選んだ。', action: { type: 'finalPath', path: 'doctor' } },
      { label: '起業する', result: '会社を立ち上げる。\n研究室の机が、最初のオフィスになった。', action: { type: 'finalPath', path: 'startup' }, cond: (s) => !!s.flags.startup },
    ],
    highlight: '修了後の進路を決めた',
  },

  // ── 立て直し（こころが下がったら必ず出す。REQUIREMENTS.md「センシティブな題材」）
  {
    id: 'rescue',
    kind: 'choice',
    when: {},
    rescue: true,
    once: false,
    text: '最近、なんだか眠りが浅い。\n誰かに話してみようかな。',
    scene: 'room',
    choices: [
      { label: '学生相談所に行ってみる', result: '話してみたら、肩の力が少し抜けた。\n来週も、また行ってみよう。', effects: { stats: { kokoro: 25 } } },
      { label: '実家に帰って休む', result: '実家のごはんは、やっぱりおいしい。\n少し、元気が戻ってきた。', effects: { stats: { kokoro: 18, saifu: -3 } }, cond: (s) => s.profile.housing !== 'jikka' },
      { label: '何もしない日をつくる', result: '一日、何もしなかった。\nそれで、よかった。', effects: { stats: { kokoro: 15 } } },
    ],
    highlight: '少し立ち止まって休んだ',
  },

  // ════════ ランダムイベント（日記に並ぶ1行）
  // ── 食と街
  {
    id: 'stamina-ramen',
    kind: 'random',
    when: {},
    // 要確認
    text: 'スタミナラーメンにはまる。気づけば週3。',
    effects: { stats: { kokoro: 6, saifu: -4 } },
    highlight: 'スタミナラーメンにはまった',
  },
  {
    id: 'gakushoku-curry',
    kind: 'random',
    when: {},
    // 要確認
    text: '学食の自家製カレー。これでいいし、これがいい。',
    effects: { stats: { kokoro: 4, saifu: -1 } },
    highlight: '学食のカレーを食べた',
  },
  {
    id: 'gakushoku-neage',
    kind: 'random',
    when: {},
    once: true,
    // 要確認
    text: '学食の小鉢が、ちょっとだけ値上がりした。',
    effects: { stats: { saifu: -2 } },
  },
  {
    id: 'gakushoku-nesage',
    kind: 'random',
    when: {},
    once: true,
    // 要確認
    text: '学食に、ちょっと安い新メニューが出た。',
    effects: { stats: { saifu: 2 } },
  },
  {
    id: 'gyutan',
    kind: 'random',
    when: {},
    text: '牛タン定食を食べた。ちょっといい日。',
    effects: { stats: { saifu: -6, kokoro: 5 } },
    highlight: '牛タン定食を食べた',
  },
  {
    id: 'kenichi-nuigurumi',
    kind: 'random',
    when: {},
    once: true,
    // 要確認：購買で販売しているか
    text: '購買で、研一のぬいぐるみを買ってしまった。',
    effects: { stats: { saifu: -4, kokoro: 5 } },
    highlight: '研一のぬいぐるみを買った',
  },
  {
    id: 'kenichi-shot',
    kind: 'random',
    when: { sem: [1, 2] },
    once: true,
    prob: 'game.ev.kenichi',
    rare: { label: '研一とツーショット' },
    // 要確認：入学式・オープンキャンパスなどで会えるか
    text: 'キャンパスで研一とツーショット！ 今日はいい日。',
    effects: { stats: { kokoro: 8 } },
    highlight: '研一とツーショットを撮った',
  },
  {
    id: 'matsushima',
    kind: 'random',
    when: {},
    once: true,
    // 要確認
    text: '思い立って松島へ。海を見て、少し元気が出た。',
    effects: { stats: { kokoro: 6, saifu: -5 } },
    highlight: '松島で海を見た',
  },
  {
    id: 'kyoukasho',
    kind: 'random',
    when: { sem: [1, 3, 5] },
    // 要確認
    text: '生協で教科書をまとめ買い。財布が軽くなった。',
    effects: { stats: { saifu: -6, tani: 2 } },
  },
  {
    id: 'toshokan',
    kind: 'random',
    when: {},
    text: 'テスト前、図書館の席が全部埋まっていた。',
    effects: { stats: { tani: 4, kokoro: -2 } },
  },
  {
    id: 'baito',
    kind: 'random',
    when: {},
    text: 'バイト代が入った。シフトを入れすぎたかも。',
    effects: { stats: { saifu: 7, tani: -2 } },
  },
  // ── 季節と仙台
  {
    id: 'hanami',
    kind: 'random',
    when: { sem: ODD },
    once: true,
    // 要確認
    text: '西公園で花見。シートの場所取りは、じゃんけんで決めた。',
    effects: { stats: { tsunagari: 5 } },
    highlight: '西公園で花見をした',
  },
  {
    id: 'tanabata',
    kind: 'random',
    when: { sem: ODD },
    once: true,
    // 要確認
    text: '七夕まつりの吹き流しの下を、ゆっくり歩いた。',
    effects: { stats: { kokoro: 4 } },
    highlight: '七夕まつりを歩いた',
  },
  {
    id: 'imoni',
    kind: 'random',
    when: { sem: EVEN },
    cond: (s) => s.stats.tsunagari >= 50,
    // 要確認
    text: '広瀬川の河川敷で芋煮会。鍋のまわりに人が増えていく。',
    effects: { stats: { tsunagari: 8 }, flags: { imoni: true } },
    highlight: '広瀬川で芋煮会をした',
  },
  {
    id: 'pageant',
    kind: 'random',
    when: { sem: EVEN },
    once: true,
    // 要確認
    text: '光のページェントを見に行った。冬の並木がまぶしい。',
    effects: { stats: { kokoro: 5, tsunagari: 2 } },
    highlight: '光のページェントを見た',
  },
  {
    id: 'pond',
    kind: 'random',
    when: { sem: ODD },
    cond: at('kawauchi'),
    once: true,
    prob: 'game.ev.pond',
    rare: { label: '大雨の日に生協前で泳いだ' },
    tags: ['danger'],
    caution: '※大雨の日に水に入るのは危険です。',
    // 要確認：大雨で川内の生協前が池になる
    text: '大雨で川内の生協前が池に。勢いで泳いでしまった。',
    effects: { stats: { kokoro: 6, tsunagari: 3 } },
    highlight: '大雨の日、生協前の池で泳いだ',
  },
  {
    id: 'yuki-zaka',
    kind: 'random',
    when: { sem: EVEN },
    cond: at('aobayama'),
    once: true,
    // 要確認
    text: '雪の日の青葉山。坂道で、つるっといきかけた。',
    effects: { stats: { kokoro: -2 } },
  },
  {
    id: 'chikatetsu',
    kind: 'random',
    when: {},
    cond: at('aobayama'),
    once: true,
    // 要確認：地下鉄で青葉山に通える
    text: '地下鉄で寝過ごして、終点まで行ってしまった。',
    effects: { stats: { kokoro: -2 } },
  },
  {
    id: 'takuetsu',
    kind: 'random',
    when: { sem: [3, 4, 5, 6, 7, 8] },
    once: true,
    // 要確認
    text: '東北大が国際卓越研究大学の第1号に、とニュースで見た。',
    effects: { stats: { kokoro: 3 } },
    highlight: '国際卓越研究大学のニュースを見た',
  },
  // ── 友達・サークル
  {
    id: 'jimoto-talk',
    kind: 'random',
    when: { sem: [1] },
    once: true,
    text: '学科の友達と、地元トークで盛り上がった。',
    effects: { stats: { tsunagari: 6 } },
  },
  {
    id: 'kyoutsu-test',
    kind: 'random',
    when: { sem: [2] },
    once: true,
    text: '今年の共通テストを解いてみて、ちょっとイキった。',
    effects: { stats: { kokoro: 3 } },
  },
  {
    id: 'karaoke',
    kind: 'random',
    when: {},
    cond: (s) => s.stats.tsunagari >= 50,
    text: 'カラオケでオール。始発の空がまぶしい。',
    effects: { stats: { tsunagari: 6, tani: -5, kokoro: -2 } },
    highlight: 'カラオケでオールした',
  },
  {
    id: 'kintore',
    kind: 'random',
    when: {},
    cond: (s) => !s.flags.circle,
    once: true,
    text: 'することがなくて、筋トレにはまった。',
    effects: { stats: { kokoro: 6 } },
  },
  {
    id: 'jisui',
    kind: 'random',
    when: {},
    cond: (s) => !s.flags.circle,
    once: true,
    text: '料理にはまって、作れるメニューが10個に増えた。',
    effects: { stats: { kokoro: 4, saifu: 3 } },
  },
  {
    id: 'koukan-ryugakusei',
    kind: 'random',
    when: { sem: [2, 3, 4, 5, 6] },
    cond: (s) => !!s.flags.circle,
    once: true,
    text: 'サークルに、半年だけ交換留学生がやってきた。',
    effects: { stats: { tsunagari: 6 } },
    highlight: 'サークルに交換留学生が来た',
  },
  {
    id: 'gentsuki',
    kind: 'random',
    when: { sem: EVEN },
    once: true,
    prob: 'game.ev.gentsuki',
    text: '卒業する先輩から、原付をゆずってもらった。',
    effects: { stats: { saifu: 6, kokoro: 2 } },
    highlight: '先輩から原付をもらった',
  },
  {
    id: 'koibito',
    kind: 'random',
    when: { sem: [2, 3, 4, 5, 6, 7] },
    cond: (s) => !!s.flags.circle && s.stats.tsunagari >= 40,
    // 1回のプレイで恋人ができるのが3割くらいになるよう寄せる
    weight: 2,
    once: true,
    prob: 'game.ev.koibito',
    rare: { label: 'サークルで恋人ができた' },
    text: 'サークルの先輩と、付き合うことになった。',
    effects: { stats: { kokoro: 10 }, flags: { koibito: true } },
    highlight: '恋人ができた',
  },
  {
    id: 'kekkon',
    kind: 'random',
    when: { sem: [5, 6, 7, 8, 9, 10] },
    cond: (s) => !!s.flags.koibito,
    once: true,
    prob: 'game.ev.kekkon',
    rare: { label: '学生結婚した' },
    text: '学生結婚することにした。ふたりで区役所へ行った。',
    effects: { stats: { kokoro: 10, saifu: -8 }, flags: { kekkon: true } },
    highlight: '学生結婚した',
  },
  // ── 浪人（入学方式と同じく、在学中の判定には使わない）
  {
    id: 'ronin-nakama',
    kind: 'random',
    when: { sem: [1, 2] },
    cond: (s) => s.profile.ronin,
    once: true,
    text: '浪人組で、なんとなく固まって行動している。',
    effects: { stats: { tsunagari: 6 } },
  },
  {
    id: 'ronin-nomikai',
    kind: 'random',
    when: { sem: [3, 4, 5, 6] },
    cond: (s) => s.profile.ronin,
    once: true,
    tags: ['drinking'],
    caution: DRINK,
    text: '飲み会で浪人の話になって、少しだけ話しづらかった。',
    effects: { stats: { tsunagari: 3, kokoro: -3 } },
  },
  {
    id: 'hajimete-osake',
    kind: 'random',
    when: { sem: [3, 4, 5, 6, 7, 8] },
    cond: (s) => !!s.flags.circle,
    once: true,
    tags: ['drinking'],
    caution: DRINK,
    text: '初めてのお酒で、ちょっとはしゃぎすぎた。',
    effects: { stats: { tsunagari: 5, kokoro: -2 } },
  },
  // ── テストと単位
  {
    id: 'nebou-ok',
    kind: 'random',
    when: {},
    cond: (s) => s.stats.tsunagari >= 50,
    once: true,
    prob: 'game.ev.nebou',
    text: 'テストに寝坊。友達の電話で飛び起きて、ギリギリ間に合った。',
    effects: { stats: { tsunagari: 3, kokoro: -2 } },
    highlight: 'テストに寝坊したが間に合った',
  },
  {
    id: 'nebou-ng',
    kind: 'random',
    when: {},
    cond: (s) => s.stats.tsunagari < 50,
    once: true,
    prob: 'game.ev.nebou',
    rare: { label: 'テストに寝坊した' },
    text: 'テストに寝坊した。この単位は、もう浮かない。',
    effects: { stats: { tani: -12, kokoro: -4 } },
    highlight: 'テストに寝坊した',
  },
  {
    id: 'kawauchi-kudari',
    kind: 'random',
    when: {},
    cond: (s) => !!s.flags.saiRishu && at('aobayama')(s),
    weight: 2,
    // 要確認
    text: '落とした必修を取りに、青葉山から川内へ降りる。',
    effects: { stats: { tani: -1, kokoro: -3 } },
    highlight: '必修を取りに川内へ降りた',
  },
  {
    id: 'ai-bareta',
    kind: 'random',
    when: {},
    cond: (s) => !!s.flags.aiReport,
    once: true,
    prob: 'game.ev.aiBare',
    text: 'AIで書いたレポートの件で、先生に呼ばれた。',
    effects: { stats: { tani: -10, kokoro: -5 } },
    highlight: 'AIのレポートで先生に呼ばれた',
  },
  // ── 留学
  {
    id: 'ryugaku-netsu',
    kind: 'random',
    when: {},
    cond: (s) => !!s.flags.ryugaku,
    once: true,
    prob: 'game.ev.abroadSick',
    text: '留学先で熱を出した。現地の病院、ちょっとドキドキした。',
    effects: { stats: { kokoro: -6, tani: -3 } },
  },
  {
    id: 'ryugaku-tomodachi',
    kind: 'random',
    when: {},
    cond: (s) => !!s.flags.ryugaku,
    once: true,
    text: '留学先の友達から、久しぶりにメッセージが来た。',
    effects: { stats: { tsunagari: 4, kokoro: 3 } },
  },
  // ── 住まい（得と損を同じだけ）
  { id: 'jikka-asagohan', kind: 'random', when: {}, cond: (s) => s.profile.housing === 'jikka', once: true, text: '朝ごはん付きで、1限に余裕で間に合った。', effects: { stats: { kokoro: 4 } } },
  { id: 'jikka-shuuden', kind: 'random', when: {}, cond: (s) => s.profile.housing === 'jikka', once: true, text: '遊んだ帰り、終電の時間ばかり気にしてしまう。', effects: { stats: { tsunagari: -3 } } },
  { id: 'hitori-tamariba', kind: 'random', when: {}, cond: (s) => s.profile.housing === 'hitori', once: true, text: '一人暮らしの部屋が、みんなのたまり場になった。', effects: { stats: { tsunagari: 5 } } },
  { id: 'hitori-jisui', kind: 'random', when: {}, cond: (s) => s.profile.housing === 'hitori', once: true, text: '自炊が3日で止まった。コンビニが近すぎる。', effects: { stats: { saifu: -3, kokoro: -1 } } },
  { id: 'ryo-yoru', kind: 'random', when: {}, cond: (s) => s.profile.housing === 'ryo', once: true, text: '寮の夜は、いつも誰かが起きている。', effects: { stats: { tsunagari: 5 } } },
  { id: 'ryo-gyouji', kind: 'random', when: {}, cond: (s) => s.profile.housing === 'ryo', once: true, text: '寮の行事が楽しくて、寝不足が続く。', effects: { stats: { kokoro: -4 } } },
  // ── お財布事情（イベントの種類が変わるだけ。進路・判定には効かない）
  { id: 'shiokuri', kind: 'random', when: {}, cond: (s) => ['yoyu', 'yayaYoyu'].includes(s.profile.wallet), once: true, text: '仕送りの箱に、お米も入っていた。', effects: { stats: { saifu: 6 } } },
  { id: 'shougakukin', kind: 'random', when: {}, cond: (s) => ['yayaKurushii', 'kurushii'].includes(s.profile.wallet), once: true, text: '奨学金が振り込まれた。今月はこれでやりくりする。', effects: { stats: { saifu: 6 } } },
  // ── 性格（どの性格にも、得意な場面と苦手な場面を同じだけ）
  { id: 'keikaku-plus', kind: 'random', when: {}, cond: (s) => s.profile.personality === 'keikaku', once: true, text: '計画どおりに、レポートが進んだ。', effects: { stats: { tani: 4 } } },
  { id: 'keikaku-minus', kind: 'random', when: {}, cond: (s) => s.profile.personality === 'keikaku', once: true, text: '予定どおりにいかず、課題がひとつ遅れた。', effects: { stats: { tani: -4 } } },
  { id: 'nori-plus', kind: 'random', when: {}, cond: (s) => s.profile.personality === 'nori', once: true, text: 'ノリで入った勉強会が、意外とためになった。', effects: { stats: { tani: 4 } } },
  { id: 'nori-minus', kind: 'random', when: {}, cond: (s) => s.profile.personality === 'nori', once: true, text: 'ノリで取った授業が、思ったよりきつい。', effects: { stats: { tani: -4 } } },
  { id: 'naikou-plus', kind: 'random', when: {}, cond: (s) => s.profile.personality === 'naikou', once: true, text: '図書館の静かな席が、定位置になった。', effects: { stats: { tani: 4 } } },
  { id: 'naikou-minus', kind: 'random', when: {}, cond: (s) => s.profile.personality === 'naikou', once: true, text: 'グループワークで、言い出せないまま終わった。', effects: { stats: { tani: -4 } } },
  { id: 'kori-plus', kind: 'random', when: {}, cond: (s) => s.profile.personality === 'kori', once: true, text: '気になって調べたことが、レポートで役に立った。', effects: { stats: { tani: 4 } } },
  { id: 'kori-minus', kind: 'random', when: {}, cond: (s) => s.profile.personality === 'kori', once: true, text: 'こだわりすぎて、課題が終わらない。', effects: { stats: { tani: -4 } } },
  { id: 'rakkan-plus', kind: 'random', when: {}, cond: (s) => s.profile.personality === 'rakkan', once: true, text: '「まあなんとかなる」で、本当になんとかなった。', effects: { stats: { tani: 4 } } },
  { id: 'rakkan-minus', kind: 'random', when: {}, cond: (s) => s.profile.personality === 'rakkan', once: true, text: '締切を、一日まちがえていた。', effects: { stats: { tani: -4 } } },
  // ── 入学方式（入学前後の出来事だけ。単位は動かさない）
  { id: 'entry-zenki', kind: 'random', when: { sem: [1], entry: ['zenki'] }, once: true, text: '合格発表から入学まで、あっという間だった。', effects: { stats: { kokoro: 2 } } },
  { id: 'entry-kouki', kind: 'random', when: { sem: [1], entry: ['kouki'] }, once: true, text: '合格から入学まで、とにかく慌ただしかった。', effects: { stats: { tsunagari: 2 } } },
  { id: 'entry-ao2', kind: 'random', when: { sem: [1], entry: ['ao2'] }, once: true, text: '合格が早かったぶん、入学前の時間をゆっくり使えた。', effects: { stats: { kokoro: 2 } } },
  {
    id: 'entry-ao3',
    kind: 'random',
    when: { sem: [1], entry: ['ao3'] },
    once: true,
    // 要確認：入学前グローバル学習プログラム
    text: '入学前の学習プログラムで、もう顔見知りがいる。',
    effects: { stats: { tsunagari: 2 } },
  },
  // ── 学部（学部ごとに2本。単位は動かさない）
  // 1〜2セメは全学教育が中心なので、専門の授業・実習・ゼミの場面は時期を絞る。
  // FROM_2NEN＝2年（3セメ）から、FROM_3NEN＝3年（5セメ）から。どの時期も要確認
  { id: 'lit-kuzushiji', kind: 'random', when: { faculty: ['lit'], sem: FROM_2NEN }, once: true, text: '崩し字の古文書が、少しだけ読めるようになった。', effects: { stats: { kokoro: 4 } } },
  { id: 'lit-yomikaesu', kind: 'random', when: { faculty: ['lit'], sem: FROM_3NEN }, once: true, text: 'ゼミの発表のために、同じ本を何度も読み返す。', effects: { stats: { kokoro: -2, tsunagari: 2 } } },
  { id: 'edu-tsutaeru', kind: 'random', when: { faculty: ['edu'], sem: ANY_SEM }, once: true, text: '子どもにどう伝えるか、ずっと考えている。', effects: { stats: { kokoro: 3 } } },
  { id: 'edu-shidouan', kind: 'random', when: { faculty: ['edu'], sem: FROM_3NEN }, once: true, text: '実習の指導案を、何度も書き直した。', effects: { stats: { kokoro: -2, tsunagari: 3 } } },
  { id: 'law-roppou', kind: 'random', when: { faculty: ['law'], sem: ANY_SEM }, once: true, text: '六法が、日に日に重く感じる。', effects: { stats: { kokoro: -2 } } },
  { id: 'law-hanrei', kind: 'random', when: { faculty: ['law'], sem: FROM_2NEN }, once: true, text: '条文の意味が、ふっと腑に落ちた。', effects: { stats: { kokoro: 4 } } },
  { id: 'econ-data', kind: 'random', when: { faculty: ['econ'], sem: FROM_2NEN }, once: true, text: '仙台の街の数字を、データで眺めてみた。', effects: { stats: { kokoro: 3 } } },
  { id: 'econ-debate', kind: 'random', when: { faculty: ['econ'], sem: FROM_3NEN }, once: true, text: 'ゼミのディベートで、言い負かされた。次は負けない。', effects: { stats: { kokoro: -3, tsunagari: 3 } } },
  { id: 'sci-sushiki', kind: 'random', when: { faculty: ['sci'], sem: ANY_SEM }, once: true, text: '黒板いっぱいの数式に、見とれてしまった。', effects: { stats: { kokoro: 3 } } },
  { id: 'sci-kousatsu', kind: 'random', when: { faculty: ['sci'], sem: FROM_2NEN }, once: true, text: '実験レポートの考察が、終わらない。', effects: { stats: { kokoro: -3 } } },
  { id: 'eng-seizu', kind: 'random', when: { faculty: ['eng'], sem: FROM_2NEN }, once: true, text: '製図の課題で、手が真っ黒になった。', effects: { stats: { kokoro: -2, tsunagari: 2 } } },
  { id: 'eng-ugoita', kind: 'random', when: { faculty: ['eng'], sem: FROM_3NEN }, once: true, text: '設計したものが動いた。思わず声が出た。', effects: { stats: { kokoro: 5 } } },
  {
    id: 'eng-saka',
    kind: 'random',
    when: { faculty: ['eng', 'sci'] },
    cond: at('aobayama'),
    once: true,
    // 要確認
    text: '青葉山の坂を、今日も登る。',
    effects: { stats: { kokoro: -2 } },
  },
  { id: 'agr-hatake', kind: 'random', when: { faculty: ['agr'], sem: FROM_2NEN }, once: true, text: '実習で、朝から畑に出た。', effects: { stats: { kokoro: 3 } } },
  { id: 'agr-taberu', kind: 'random', when: { faculty: ['agr'], sem: FROM_2NEN }, once: true, text: '育てた作物を、みんなで食べた。', effects: { stats: { tsunagari: 4 } } },
  { id: 'med-kaibou', kind: 'random', when: { faculty: ['med'], sem: ANY_SEM }, once: true, text: '覚えることが多すぎて、ノートが追いつかない。', effects: { stats: { kokoro: -3 } } },
  { id: 'med-hakui', kind: 'random', when: { faculty: ['med'], sem: FROM_2NEN }, once: true, text: '白衣を着る日が、少しずつ増えてきた。', effects: { stats: { kokoro: 3 } } },
  { id: 'dent-kezuru', kind: 'random', when: { faculty: ['dent'], sem: FROM_3NEN }, once: true, text: '模型の歯を削る練習。指先に力が入る。', effects: { stats: { kokoro: -2 } } },
  { id: 'dent-kigu', kind: 'random', when: { faculty: ['dent'], sem: FROM_3NEN }, once: true, text: '実習器具の名前を、全部覚えた。', effects: { stats: { kokoro: 3 } } },
  { id: 'pharm-hannou', kind: 'random', when: { faculty: ['pharm'], sem: FROM_2NEN }, once: true, text: '有機化学の反応式が、夢に出てきた。', effects: { stats: { kokoro: -2 } } },
  { id: 'pharm-kessho', kind: 'random', when: { faculty: ['pharm'], sem: FROM_2NEN }, once: true, text: '実験で、きれいな結晶がとれた。', effects: { stats: { kokoro: 4 } } },
  // ── 工学部の学科（1本ずつ）。専門の授業・実験の場面なので時期を絞る（要確認）
  { id: 'mech-shisaku', kind: 'random', when: { dept: ['eng.mech'], sem: FROM_3NEN }, once: true, text: '試作したロボットが、初めてまっすぐ歩いた。', effects: { stats: { kokoro: 4 } } },
  { id: 'ecei-led', kind: 'random', when: { dept: ['eng.ecei'], sem: FROM_2NEN }, once: true, text: '回路がつながって、LEDが光った瞬間。', effects: { stats: { kokoro: 4 } } },
  { id: 'chem-shimi', kind: 'random', when: { dept: ['eng.chem'], sem: FROM_2NEN }, once: true, text: '白衣に、薬品のしみがまたひとつ増えた。', effects: { stats: { tsunagari: 2 } } },
  { id: 'mat-soshiki', kind: 'random', when: { dept: ['eng.mat'], sem: FROM_3NEN }, once: true, text: '顕微鏡で見た金属の組織が、きれいすぎる。', effects: { stats: { kokoro: 4 } } },
  { id: 'arch-mokei', kind: 'random', when: { dept: ['eng.arch'], sem: FROM_2NEN }, once: true, text: '模型づくりで、スチレンボードを切り続ける。', effects: { stats: { kokoro: -2, tsunagari: 3 } } },
  // ── 研究室（配属後）
  { id: 'lab-tomari', kind: 'random', when: {}, cond: (s) => s.tankyuUnlocked, once: true, text: '研究室に泊まった。朝のキャンパスは静かだ。', effects: { stats: { tankyu: 6, kokoro: -4 } }, highlight: '研究室に泊まった' },
  { id: 'lab-akari', kind: 'random', when: {}, cond: (s) => s.tankyuUnlocked, once: true, text: '終電を過ぎても、研究室の明かりがついている。', effects: { stats: { tankyu: 5, kokoro: -3 } } },
  { id: 'lab-boardgame', kind: 'random', when: {}, cond: (s) => s.tankyuUnlocked, once: true, text: '先生がいない間に、研究室でボードゲーム大会。', effects: { stats: { tsunagari: 6 } }, highlight: '研究室でボードゲーム大会' },
  { id: 'lab-kenkyuhi', kind: 'random', when: {}, cond: (s) => s.tankyuUnlocked, once: true, text: '個人研究費が、底をついた。', effects: { stats: { tankyu: -4 } } },
  { id: 'lab-umakuitta', kind: 'random', when: {}, cond: (s) => s.tankyuUnlocked, once: true, text: '実験が、3回目でやっとうまくいった。', effects: { stats: { tankyu: 4, kokoro: 3 } } },
  { id: 'lab-theme', kind: 'random', when: {}, cond: (s) => s.tankyuUnlocked, once: true, text: '{theme}の論文を読んでいたら、夜が明けていた。', effects: { stats: { tankyu: 5, kokoro: -2 } } },
  // ── 修士
  { id: 'gakkai-tomodachi', kind: 'random', when: { master: [1, 2] }, cond: (s) => s.ladder >= 1, once: true, text: '学会で、他大学に友達ができた。', effects: { stats: { tsunagari: 6 } }, highlight: '学会で他大学に友達ができた' },
  { id: 'kouhai-ronbun', kind: 'random', when: { master: [1, 2] }, once: true, text: '後輩に、先に論文を出された。悔しい、けど嬉しい。', effects: { stats: { tankyu: 4, kokoro: -3 } } },
  { id: 'inyou', kind: 'random', when: { master: [2] }, cond: (s) => s.ladder >= 3, once: true, text: '自分の論文が、初めて引用された。', effects: { stats: { kokoro: 8 }, flags: { cited: true } }, highlight: '論文が初めて引用された' },
];

export const EVENTS: GameEvent[] = BASE_EVENTS.map((ev) =>
  ARUARU.includes(ev.id) && !ev.prob
    ? { ...ev, prob: 'game.ev.aruaru', rare: ev.rare ?? { label: ev.highlight ?? ev.text.replace(/。.*$/, '') } }
    : ev,
);
