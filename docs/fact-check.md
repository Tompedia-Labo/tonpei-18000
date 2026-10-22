# 事実確認リスト

`npm run facts` で書き出したもの（このファイルは手で直さない）。

残り **63件**

## 直し方

1. 左のリンクを開くと、ソースの該当の行に飛ぶ（VS Code ならリンクを Ctrl＋クリック）
2. 間違っていたら、その場で文を直す。イベント文は `'…'` の中だけを直す。`\n` は改行で、1画面3行まで
3. 確かめ終わったら、その行のコメントから「要確認」を消す（`// 要確認` だけの行なら行ごと消す。メモを残したいなら `// 確認済み：確かめた日と方法` のように書きかえる）
4. `npm run facts` でこの一覧を作り直す。消した分だけ減る
5. 最後に `npm run lint:content` と `npm run typecheck` が通るか確かめる

`npm run dev` を動かしたままにしておくと、保存した文がすぐ画面に反映される。

## イベント文（src/data/events.ts）（28件）

| 場所 | 確かめること | 対象 |
| --- | --- | --- |
| [events.ts:16](../src/data/events.ts#L16) | 学部・学科のイベントの時期。1〜2セメは全学教育が中心なので、専門の場面は2年・3年から | `const ANY_SEM = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];` |
| [events.ts:37](../src/data/events.ts#L37) | 学生歌の題名。歌詞は画面に出さない | `text: '入学式。\n学生歌「青葉もゆるこのみちのく」を、なんとなく口ずさむ。\n今日から{faculty}生だ。',` |
| [events.ts:56](../src/data/events.ts#L56) | 臨床実習が始まる時期 | `text: '臨床実習が始まった。\n白衣のポケットに、小さなメモ帳を入れる。',` |
| [events.ts:116](../src/data/events.ts#L116) | 本文の事実 | `text: '川内を歩くだけで、新歓のビラが両手いっぱいに。\nさて、どうする？',` |
| [events.ts:156](../src/data/events.ts#L156) | じかそう（自然科学総合実験） | `text: 'じかそうのレポート、締切は明日。\nまだ白紙。',` |
| [events.ts:183](../src/data/events.ts#L183) | 通い方 | `text: '専門の授業が始まり、通うキャンパスが変わる。\n青葉山へ、どう通う？',` |
| [events.ts:284](../src/data/events.ts#L284) | 蔵王へ日帰りでスキーに行けるか | `{ label: 'スキーに行く', result: '蔵王まで日帰りで。\n帰りのバスで、全員寝ていた。', effects: { stats: { tsunagari: 6, …` |
| [events.ts:413](../src/data/events.ts#L413) | 本文の事実 | `text: 'スタミナラーメンにはまる。気づけば週3。',` |
| [events.ts:422](../src/data/events.ts#L422) | 本文の事実 | `text: '学食の自家製カレー。これでいいし、これがいい。',` |
| [events.ts:432](../src/data/events.ts#L432) | 本文の事実 | `text: '学食の小鉢が、ちょっとだけ値上がりした。',` |
| [events.ts:441](../src/data/events.ts#L441) | 本文の事実 | `text: '学食に、ちょっと安い新メニューが出た。',` |
| [events.ts:458](../src/data/events.ts#L458) | 購買で販売しているか | `text: '購買で、研一のぬいぐるみを買ってしまった。',` |
| [events.ts:470](../src/data/events.ts#L470) | 入学式・オープンキャンパスなどで会えるか | `text: 'キャンパスで研一とツーショット！ 今日はいい日。',` |
| [events.ts:480](../src/data/events.ts#L480) | 本文の事実 | `text: '思い立って松島へ。海を見て、少し元気が出た。',` |
| [events.ts:489](../src/data/events.ts#L489) | 本文の事実 | `text: '生協で教科書をまとめ買い。財布が軽くなった。',` |
| [events.ts:513](../src/data/events.ts#L513) | 本文の事実 | `text: '西公園で花見。シートの場所取りは、じゃんけんで決めた。',` |
| [events.ts:523](../src/data/events.ts#L523) | 本文の事実 | `text: '七夕まつりの吹き流しの下を、ゆっくり歩いた。',` |
| [events.ts:533](../src/data/events.ts#L533) | 本文の事実 | `text: '広瀬川の河川敷で芋煮会。鍋のまわりに人が増えていく。',` |
| [events.ts:543](../src/data/events.ts#L543) | 本文の事実 | `text: '光のページェントを見に行った。冬の並木がまぶしい。',` |
| [events.ts:558](../src/data/events.ts#L558) | 大雨で川内の生協前が池になる | `text: '大雨で川内の生協前が池に。勢いで泳いでしまった。',` |
| [events.ts:569](../src/data/events.ts#L569) | 本文の事実 | `text: '雪の日の青葉山。坂道で、つるっといきかけた。',` |
| [events.ts:579](../src/data/events.ts#L579) | 地下鉄で青葉山に通える | `text: '地下鉄で寝過ごして、終点まで行ってしまった。',` |
| [events.ts:588](../src/data/events.ts#L588) | 本文の事実 | `text: '東北大が国際卓越研究大学の第1号に、とニュースで見た。',` |
| [events.ts:743](../src/data/events.ts#L743) | 本文の事実 | `text: '落とした必修を取りに、青葉山から川内へ降りる。',` |
| [events.ts:809](../src/data/events.ts#L809) | 入学前グローバル学習プログラム | `text: '入学前の学習プログラムで、もう顔見知りがいる。',` |
| [events.ts:815](../src/data/events.ts#L815) | FROM_2NEN＝2年（3セメ）から、FROM_3NEN＝3年（5セメ）から。どの時期も要確認 | イベント `lit-kuzushiji`：「崩し字の古文書が、少しだけ読めるようになった。」 |
| [events.ts:834](../src/data/events.ts#L834) | 本文の事実 | `text: '青葉山の坂を、今日も登る。',` |
| [events.ts:846](../src/data/events.ts#L846) | ── 工学部の学科（1本ずつ）。専門の授業・実験の場面なので時期を絞る | イベント `mech-shisaku`：「試作したロボットが、初めてまっすぐ歩いた。」 |

## 学部・キャンパス・時期（src/data/structure.ts）（27件）

| 場所 | 確かめること | 対象 |
| --- | --- | --- |
| [structure.ts:3](../src/data/structure.ts#L3) | MVPのデータ方針：確認できた層だけ分ける。【要確認】の層（文学部の専修名、農学部の学科・コース名、薬学部の学科分け）はまだ分けない。 | （ファイル全体の方針） |
| [structure.ts:45](../src/data/structure.ts#L45) | from セメから通うキャンパス。要確認：全学教育の期間を川内としている | `campus: { from: number; campus: Campus }[];` |
| [structure.ts:62](../src/data/structure.ts#L62) | 専修（26）は2セメ終了時に決まるが、専修名が未確認なのでMVPでは分けない | `units: [{ id: 'lit.jinbun', name: '人文社会学科', dept: 'lit.jinbun' }],` |
| [structure.ts:65](../src/data/structure.ts#L65) | 内容が合っているか | 文学部：ゼミが決まる時期：7セメ |
| [structure.ts:76](../src/data/structure.ts#L76) | 内容が合っているか | 教育学部：ゼミが決まる時期：7セメ |
| [structure.ts:82](../src/data/structure.ts#L82) | 内容が合っているか | 法学部：ゼミが決まる時期：7セメ |
| [structure.ts:92](../src/data/structure.ts#L92) | 内容が合っているか | 経済学部：ゼミが決まる時期：7セメ |
| [structure.ts:113](../src/data/structure.ts#L113) | 地球惑星物質科学科の時期 | 理学部 地球科学系：研究グループが決まる時期：7セメ |
| [structure.ts:114](../src/data/structure.ts#L114) | 資料により2年の夏とも | `assigns: [{ sem: 4, label: '学科', options: [{ name: '地圏環境科学科', dept: 'sci.earth.chiken' }, …` |
| [structure.ts:127](../src/data/structure.ts#L127) | 学科名は要確認 | `units: [` |
| [structure.ts:134](../src/data/structure.ts#L134) | バリアの時期 | 工学部 電気情報物理工学科：研究室が決まる時期：6セメ、3・6セメ末にバリアの判定 |
| [structure.ts:154](../src/data/structure.ts#L154) | 内容が合っているか | 工学部：5セメから青葉山に通う |
| [structure.ts:160](../src/data/structure.ts#L160) | 2学科6コースは3セメに選ぶが、学科・コース名が未確認なのでMVPでは分けない | `units: [{ id: 'agr.all', name: '学部一括' }],` |
| [structure.ts:163](../src/data/structure.ts#L163) | 内容が合っているか | 農学部：1セメから川内に通う |
| [structure.ts:164](../src/data/structure.ts#L164) | 青葉山新キャンパス | 農学部：3セメから青葉山に通う |
| [structure.ts:166](../src/data/structure.ts#L166) | 内容が合っているか | 農学部：研究室が決まる時期：7セメ |
| [structure.ts:171](../src/data/structure.ts#L171) | 内容が合っているか | 医学部 医学科：研究室が決まる時期：9セメ |
| [structure.ts:177](../src/data/structure.ts#L177) | 内容が合っているか | 医学部：1セメから川内に通う |
| [structure.ts:178](../src/data/structure.ts#L178) | 内容が合っているか | 医学部：3セメから星陵に通う |
| [structure.ts:180](../src/data/structure.ts#L180) | 内容が合っているか | 医学部：研究室が決まる時期：7セメ |
| [structure.ts:186](../src/data/structure.ts#L186) | 内容が合っているか | 歯学部：1セメから川内に通う |
| [structure.ts:187](../src/data/structure.ts#L187) | 内容が合っているか | 歯学部：3セメから星陵に通う |
| [structure.ts:189](../src/data/structure.ts#L189) | 内容が合っているか | 歯学部：研究室が決まる時期：9セメ |
| [structure.ts:192](../src/data/structure.ts#L192) | 学科分け（創薬科学4年制／薬学6年制）は時期が要確認なので、MVPでは学部単位・4年で扱う | `id: 'pharm', name: '薬学部', short: '薬', capacity: 'capacity.pharm', shingaku: 'grad.pharmSou…` |
| [structure.ts:196](../src/data/structure.ts#L196) | 内容が合っているか | 薬学部：1セメから川内に通う |
| [structure.ts:197](../src/data/structure.ts#L197) | 内容が合っているか | 薬学部：3セメから青葉山に通う |
| [structure.ts:248](../src/data/structure.ts#L248) | 研究室・ゼミが決まる時期。学科→入試単位→学部の既定の順に探す | `export const labOf = (p: { faculty: string; unit: string; dept: string \| null }): Lab =>` |

## 豆知識（src/data/trivia.ts）（5件）

| 場所 | 確かめること | 対象 |
| --- | --- | --- |
| [trivia.ts:9](../src/data/trivia.ts#L9) | 内容が合っているか | 「東北大は、国際卓越研究大学の第1号に認定された。」 |
| [trivia.ts:11](../src/data/trivia.ts#L11) | 内容が合っているか | 「青葉山には、世界最高水準の放射光施設NanoTerasuがある。」 |
| [trivia.ts:13](../src/data/trivia.ts#L13) | 出典を付ける | 「災害科学を研究する拠点がある。」 |
| [trivia.ts:15](../src/data/trivia.ts#L15) | 出典を付ける | 「テレビアンテナの原型になった技術は、この大学で生まれた。」 |
| [trivia.ts:17](../src/data/trivia.ts#L17) | 出典を付ける | 「強力な磁石鋼も、この大学で生まれた。」 |

## その他（3件）

| 場所 | 確かめること | 対象 |
| --- | --- | --- |
| [turns.ts:44](../src/core/turns.ts#L44) | 修士は学部の最後のキャンパスで研究を続ける | `const sem = t.kind === 'master' ? 99 : t.sems[0];` |
| [research.ts:82](../src/data/research.ts#L82) | 例：共同研究でNanoTerasuを使った測定に立ち会う | `{ id: 'world', name: '世界的な成果', when: 'master2', need: 85, chance: 'game.ladder.world', rar…` |
| [map.ts:2](../src/ui/pixel/map.ts#L2) | キャンパスと川・地下鉄の位置関係は大まかなイメージ | （ファイル全体の方針） |
