'use strict';
/* ============ ドット絵ヘルパー（『村上宗嗣の12時間』）============
   画像ファイルは1枚も持たない。全部その場でCanvasが描く。
   キャンバスは 360×200 固定。1ドット=論理1px（CSS側で整数倍に拡大＝pixelated）。

   掟（/dot-art の実証ぶん）:
   - 一枚一場面。俯瞰の間取り図は描かない
   - 乱数禁止。散らすときは hash(i) を使う（毎フレーム暴れるのを防ぐ）
   - 時間は T() のみ
   - 白い矩形を床に置き忘れない（UIの空欄に見える）
   - 人物は棒にしない。肩を丸く・頭を小さく・1アクションを付ける
*/

/* ---- パレット（このゲームの色。8色＋補助）----
   2009年の12時間を「夜明け前の藍 → 昼の白 → 夕方の橙」で通す。
   UI側の金 #f0c33c と赤 #ff6b6b に混ざるよう、彩度は低めに寄せてある。 */
const PAL = {
  night:  '#0b0e16', // 夜明け前の空
  navy:   '#16203a', // 室内の影
  slate:  '#2b3550', // 家具・壁
  steel:  '#48566f', // 金属・サッシ
  ash:    '#8792a6', // ハイライト寄りのグレー
  paper:  '#e8e4d8', // 紙・白物
  gold:   '#f0c33c', // 光・金・強調
  amber:  '#c8862a', // 電球色
  crt:    '#7fd4c8', // 画面の光（2009年の液晶）
  red:    '#c8443c',
  skin:   '#d8a882',
  hair:   '#1a1a1f',
  dawn:   '#3a4a72', // 夜明けの空のグラデ上
  dusk:   '#d2762f', // 夕方
  white:  '#ffffff',
};

let _t0 = Date.now();
function T() { return (Date.now() - _t0) / 1000; }
/* 擬似ハッシュ（乱数の代わり。同じiなら毎回同じ値） */
function hash(i) { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); }

/* 現在の描画対象 */
let _c = null;
function useCtx(ctx) { _c = ctx; }

/* 矩形（ドット絵の基本単位） */
function P(x, y, w, h, col) { _c.fillStyle = col; _c.fillRect(x | 0, y | 0, Math.max(1, w | 0), Math.max(1, h | 0)); }
/* 1ドット */
function D(x, y, col) { P(x, y, 1, 1, col); }
/* 縦グラデ（帯を積むだけ＝ドット絵の階調） */
function vgrad(x, y, w, h, c0, c1, steps) {
  steps = steps || 8;
  const a = hex2rgb(c0), b = hex2rgb(c1);
  const sh = Math.max(1, Math.round(h / steps));
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1 || 1);
    P(x, y + i * sh, w, sh, rgb2hex(mix(a, b, t)));
  }
}
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgb2hex(c) { return '#' + c.map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
/* 色を明るく／暗く */
function lit(col, k) { const c = hex2rgb(col); return rgb2hex([c[0] * k, c[1] * k, c[2] * k]); }

/* ---- よく使う部品 ---------------------------------------------- */

/* 画面の光（モニタ・液晶）。中心が明るく、外へ落ちる */
function glow(cx, cy, r, col, alpha) {
  const g = _c.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  _c.globalAlpha = alpha == null ? 0.35 : alpha;
  _c.fillStyle = g; _c.fillRect(cx - r, cy - r, r * 2, r * 2);
  _c.globalAlpha = 1;
}

/* 2009年のノートPC（厚い・液晶が四角い・パームレストが広い）
   open=画面の開き具合(0.8〜1)、lightは画面の色 */
function laptop(x, y, w, light) {
  const h = Math.round(w * 0.62);
  // 画面（背面のベゼルは厚く）
  P(x, y, w, h, PAL.slate);
  P(x + 2, y + 2, w - 4, h - 6, lit(PAL.night, 1.2));
  P(x + 4, y + 4, w - 8, h - 10, light || PAL.crt);
  // ヒンジと本体
  P(x - 3, y + h, w + 6, 3, PAL.steel);
  P(x - 6, y + h + 3, w + 12, 5, PAL.slate);
  P(x - 4, y + h + 4, w + 8, 2, lit(PAL.slate, 1.3)); // キーボード面のハイライト
  glow(x + w / 2, y + h / 2, w * 0.9, light || PAL.crt, 0.22);
}

/* 人物（横向き・座り／立ち）。棒にしない＝肩を丸め、頭は小さく。
   pose: 'sit'|'stand'|'handstand'|'bow' */
function person(x, y, s, pose, col) {
  const c = col || PAL.slate, sk = PAL.skin;
  s = s || 1;
  const px = (dx, dy, dw, dh, cc) => P(x + dx * s, y + dy * s, dw * s, dh * s, cc);
  if (pose === 'handstand') {          // 逆立ち（頭が下）
    px(2, 0, 5, 6, c);                 // 脚（上）
    px(1, 6, 7, 8, c);                 // 胴
    px(3, 14, 4, 4, sk);               // 頭（下）
    px(0, 8, 2, 9, sk); px(8, 8, 2, 9, sk); // 腕（床へ）
    return;
  }
  if (pose === 'stand') {
    px(3, 0, 4, 4, sk); px(3, 0, 4, 2, PAL.hair);
    px(2, 4, 6, 8, c);                 // 胴（肩を1px落として丸める）
    px(1, 5, 1, 6, c); px(8, 5, 1, 6, c);
    px(3, 12, 2, 6, lit(c, .8)); px(5, 12, 2, 6, lit(c, .8));
    return;
  }
  if (pose === 'bow') {                // 前かがみ（キーを叩く）
    px(4, 1, 4, 4, sk); px(4, 1, 4, 2, PAL.hair);
    px(2, 5, 7, 7, c);
    px(8, 7, 4, 2, sk);                // 伸ばした腕
    px(2, 12, 6, 5, lit(c, .8));
    return;
  }
  // sit
  px(3, 0, 4, 4, sk); px(3, 0, 4, 2, PAL.hair);
  px(2, 4, 6, 7, c);
  px(7, 6, 4, 2, sk);
  px(2, 11, 8, 3, lit(c, .8));
}

/* 顔のアップ（表情差分用・正面）。x,yは左上、sはドット倍率
   mood: 'normal'|'red'|'breath'|'tear'  */
function face(x, y, s, mood) {
  const px = (dx, dy, dw, dh, cc) => P(x + dx * s, y + dy * s, dw * s, dh * s, cc);
  const skin = mood === 'red' ? '#e07a62' : PAL.skin;
  // 輪郭
  px(3, 0, 12, 3, PAL.hair);
  px(2, 3, 14, 13, skin);
  px(2, 3, 14, 2, PAL.hair);          // 前髪
  px(1, 5, 1, 7, PAL.hair); px(16, 5, 1, 7, PAL.hair);
  px(4, 16, 10, 2, lit(skin, .85));   // あご
  // 目
  if (mood === 'breath') { px(5, 8, 3, 1, PAL.hair); px(10, 8, 3, 1, PAL.hair); }  // 閉じ目
  else { px(5, 7, 2, 2, PAL.hair); px(11, 7, 2, 2, PAL.hair); }
  // 眉
  px(4, 5, 4, 1, PAL.hair); px(10, 5, 4, 1, PAL.hair);
  // 口
  if (mood === 'breath') px(8, 12, 2, 3, '#8a4a44');       // すぼめて吐く
  else if (mood === 'tear') px(6, 12, 6, 1, '#8a4a44');
  else px(6, 12, 6, 1, '#8a4a44');
  // 差分の要素
  if (mood === 'red') {                                    // 血が上った頬＋汗
    px(3, 9, 2, 2, '#c95a4a'); px(13, 9, 2, 2, '#c95a4a');
    px(15, 4, 1, 3, PAL.crt);
  }
  if (mood === 'breath') {                                 // 吐いた息
    const t = (T() * 1.2) % 1;
    for (let i = 0; i < 3; i++) {
      const a = 0.5 - t * 0.4 - i * 0.1;
      if (a <= 0) continue;
      _c.globalAlpha = a;
      P(x + (9 + i * 3 + t * 6) * s, y + (12 + i) * s, 2 * s, 1 * s, PAL.paper);
      _c.globalAlpha = 1;
    }
  }
  if (mood === 'tear') {                                   // 涙（ゆっくり落ちる）
    const t = (T() * 0.6) % 1;
    px(5, 9 + t * 8, 1, 2, PAL.crt);
    px(12, 9 + ((t + .4) % 1) * 8, 1, 2, PAL.crt);
    px(5, 9, 1, 1, PAL.white); px(12, 9, 1, 1, PAL.white);
  }
}

/* 紙（手紙・書類）。角を1ドット落として紙らしく */
function paper(x, y, w, h, col, lines) {
  col = col || PAL.paper;
  P(x + 1, y, w - 2, h, col); P(x, y + 1, w, h - 2, col);
  P(x, y, 1, 1, 'rgba(0,0,0,0)');
  for (let i = 0; i < (lines || 0); i++) P(x + 3, y + 4 + i * 3, w - 6 - (i % 3) * 3, 1, PAL.ash);
}

/* 窓（時間帯で外の色が変わる）。sky0→sky1でグラデ */
function windowPane(x, y, w, h, sky0, sky1) {
  P(x - 2, y - 2, w + 4, h + 4, PAL.steel);
  vgrad(x, y, w, h, sky0, sky1, 6);
  P(x + w / 2 - 1, y, 2, h, PAL.steel);          // 桟
  P(x, y + h / 2 - 1, w, 2, PAL.steel);
}

/* 走る文字（ドット文字は使わず、Canvasのフォントで小さく。看板・ラベル用） */
function label(x, y, text, col, size) {
  _c.font = `${size || 8}px "Hiragino Kaku Gothic ProN", monospace`;
  _c.fillStyle = col || PAL.paper;
  _c.textAlign = 'left'; _c.textBaseline = 'top';
  _c.fillText(text, x, y);
}
function labelC(cx, y, text, col, size, weight) {
  _c.font = `${weight ? weight + ' ' : ''}${size || 8}px "Hiragino Kaku Gothic ProN", sans-serif`;
  _c.fillStyle = col || PAL.paper;
  _c.textAlign = 'center'; _c.textBaseline = 'top';
  _c.fillText(text, cx, y);
  _c.textAlign = 'left';
}

/* 走査線（画面の質感。強すぎると汚いので薄く） */
function scanlines(x, y, w, h, alpha) {
  _c.globalAlpha = alpha == null ? 0.08 : alpha;
  for (let i = 0; i < h; i += 2) P(x, y + i, w, 1, '#000');
  _c.globalAlpha = 1;
}

/* いま何時か（ゲーム内時刻）。窓の外の色と部屋の明るさがこれで変わる。
   ラウンドが進むたび game.js が setArtHour() で更新する */
let ART_HOUR = 9;
function setArtHour(h) { ART_HOUR = h; }

/* 時刻ごとのキーフレームを線形補間する（表は [時, 値...] の昇順） */
function byHour(table) {
  const h = ART_HOUR;
  if (h <= table[0][0]) return table[0].slice(1);
  const last = table[table.length - 1];
  if (h >= last[0]) return last.slice(1);
  for (let i = 1; i < table.length; i++) {
    if (h <= table[i][0]) {
      const a = table[i - 1], b = table[i];
      const t = (h - a[0]) / (b[0] - a[0]);
      const out = [];
      for (let j = 1; j < a.length; j++) out.push(rgb2hex(mix(hex2rgb(a[j]), hex2rgb(b[j]), t)));
      return out;
    }
  }
  return last.slice(1);
}

/* 絵の登録先。各シーンは ART['key'] = (ctx) => {...} で足す */
const ART = {};

if (typeof module !== 'undefined') module.exports = { ART, PAL };
