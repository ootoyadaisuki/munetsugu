# 村上宗嗣の12時間 〜12時間で5億を売れ〜

村上宗嗣さん本人へのプレゼント用ゲーム。宣伝も配布もしない、一点ものの贈り物。

▶ 遊ぶ: https://ootoyadaisuki.github.io/munetsugu/

2009年9月28日、12時間で約5億6490万円を売った「継承」プロモーションを、
**12通のメルマガ**として遊び直す。1通1時間、全12ラウンド。

- 表のクリア条件 … 史実 **¥564,900,000** を超える
- 裏のクリア条件 … **リストを焼かずに**超える（総合Sの条件）

## 遊び方

```bash
python3 dev-server.py 8792
```

→ http://localhost:8792

依存パッケージなし。画像ファイルも音声ファイルも1つも持たず、
ドット絵は Canvas が、効果音は WebAudio がその場で生成する。

## 構成

| パス | 中身 |
|---|---|
| `index.html` | 画面とスタイル |
| `js/data.js` | 数値とテキスト（12ラウンド・選択肢・顧客の声・小ネタ） |
| `js/game.js` | 進行と経済シミュレーション（`Econ` は乱数ゼロの純関数） |
| `js/art.js` | ドット絵ヘルパーとパレット。`setArtHour()` で時刻連動 |
| `js/scenes1〜4.js` | 各シーンの描画 |
| `js/sfx.js` | 効果音（WebAudio合成） |
| `tests/econ_test.js` | 経済の合格基準テスト |
| `docs/` | 台本・企画書・裏取り済みの事実集 |

## 開発

```bash
node tests/econ_test.js
```

デバッグ用URL:

- `?reset` … セーブを消す
- `?jump=R6` … 指定ラウンドへ直行（それまでは全A選択で埋まる）
- `?autotest[&policy=worst|hype]` … タイマー非依存で全編を自動走行
- `_artcheck.html#lp_page,desk` … ドット絵だけを並べて確認

## 資料

- `docs/SCRIPT.md` … 台本 v5（正）
- `docs/FACTS.md` … 裏取り済みの事実。**ここに無い事実をゲームに書かない**
- `docs/GAME_DESIGN.md` … 企画書
