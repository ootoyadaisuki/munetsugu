'use strict';
/* シーン集2（scenes1.js と同じ書き方・密度に揃える）
   キャンバスは 360×200。使えるもの: PAL / P / D / vgrad / lit / glow / laptop /
   person / face / paper / windowPane / label / labelC / scanlines / T() / hash(i)

   担当は3枚:
     ART.lp_page     … 継承のセールスレター（6:00 販売開始）
     ART.phone_flip  … 裏返しの携帯が光る（E4 おいしい電話）
     ART.letter_note … 手紙と愛用のノート（E3b 紹介者たちへの返礼）
   実在の企業名・商品名の文字は一切描かない。文言はすべて「読めない行」で表す。 */

/* ── AM6:00 販売開始：継承プログラムのLP ──────────────────────
/* ── 6:00 販売開始：継承プログラムのセールスレター ──────────────────────
   2009年のこの手のページは**文字だけ**だった。写真も動画もなく、
   上に大きな文字でヘッドコピーが7行、その下に普通サイズの本文がびっしり続く。
   だから絵の主役は「大きい字の塊」と「小さい字の塊」の**面積の対比**になる。
   文字は読めないダミー行で表す（実在の文言は描かない）。行の長さは hash で崩し、
   中央寄せのヘッドは真ん中を軸に、本文は左揃えにして「紙面」を作る。
   赤い強調行と、下のほうに申し込みボタンが1つだけ見えている。 */
ART.lp_page = () => {
  // デスクトップ（2009年のOS。青い壁紙）
  vgrad(0, 0, 360, 200, '#2f4d7d', '#141c30', 7);

  // ブラウザの窓
  const px = 10, py = 8, pw = 340, ph = 184;
  P(px - 2, py - 2, pw + 4, ph + 4, '#8fa3c4');
  P(px, py, pw, ph, '#d7dde8');
  // タイトルバーとタブ
  P(px, py, pw, 9, '#4a6392');
  P(px + 3, py + 2, 74, 7, '#c9d4e6');
  P(px + 80, py + 2, 62, 7, '#93a4c0');
  P(px + 145, py + 3, 7, 5, '#b9c6dc');
  // アドレスバー
  P(px + 3, py + 11, pw - 6, 8, PAL.paper);
  P(px + 5, py + 13, 4, 4, '#8fa3c4');
  P(px + 12, py + 14, 170, 2, '#9aa6ba');
  P(px + pw - 66, py + 11, 60, 8, PAL.paper);
  P(px + pw - 62, py + 14, 34, 2, '#9aa6ba');

  // 紙面（ここから下が全部「文字」）
  const cx = px + (pw - 7) / 2;            // 紙面の中心（スクロールバーぶんを除く）
  const top = py + 23;
  P(px + 1, top, pw - 8, ph - 25, PAL.paper);

  /* ヘッドコピー。当時の定番どおり、いちばん言いたい約束の一行だけ赤にする。
     商品名を大きく、約束を中サイズで2行。スマホで読める大きさに取ってある */
  labelC(cx, top + 6, '継承プログラム', '#1d2430', 27, 'bold');
  labelC(cx, top + 40, '16週間で月収40万円を目指す', '#c0392b', 14, 'bold');
  labelC(cx, top + 58, '人生成功プログラム', '#1d2430', 14, 'bold');

  // ヘッドと本文のあいだの区切り（細い線と余白＝紙面が締まる）
  P(cx - 60, top + 78, 120, 1, '#b4bcc8');

  /* 本文：普通サイズの字がびっしり。段落ごとに間を空け、
     段落の最後の行だけ短くする（＝文章に見える最短の手） */
  const by = py + ph - 24;                 // 申し込みボタンの位置（本文はここで止める）
  let y = top + 86;
  for (let para = 0; para < 8; para++) {
    const rows = 3 + Math.floor(hash(para + 20) * 3);
    for (let r = 0; r < rows; r++) {
      if (y > by - 8) { para = 99; break; }     // ボタンに触れる前に打ち切る
      const last = r === rows - 1;
      const w = last ? 70 + hash(para * 7 + r) * 100 : 286 - hash(para * 5 + r) * 16;
      P(px + 14, y, w, 2, '#3c4657');
      y += 4;
    }
    y += 3;
  }

  // 申し込みボタン（紙面のいちばん下に1つだけ。文字だけの中で唯一の「色の面」）
  P(cx - 66, by, 132, 15, '#c0392b');
  P(cx - 66, by, 132, 2, '#e05a49');                 // 上のツヤ
  P(cx - 66, by + 13, 132, 2, '#8e2a20');            // 下の影
  P(cx - 50, by + 5, 100, 3, PAL.paper);             // ボタンの文字（読めない）
  P(cx - 34, by + 10, 68, 2, lit(PAL.paper, 0.85));

  // 右端のスクロールバー（つまみが上のほう＝この下にまだ長文が続いている）
  P(px + pw - 7, py + 21, 7, ph - 23, lit(PAL.paper, 0.9));
  P(px + pw - 7, py + 21, 7, 8, lit(PAL.ash, 0.9));
  P(px + pw - 6, py + 31, 5, 30, lit(PAL.ash, 0.8));  // つまみが短い＝ページが長い
  P(px + pw - 6, py + 31, 5, 1, PAL.paper);
  P(px + pw - 7, py + ph - 8, 7, 8, lit(PAL.ash, 0.9));

  scanlines(px, py, pw, ph, 0.05);
};

/* ── AM10:05 E4：裏返しの携帯が光る ──────────────────────
   本人の習慣「音を出さない・バイブにもしない・裏返して置く」を、絵だけで言う。
   だから本体は暗いシルエットのまま一切明滅させず、**机に漏れた光だけ**が呼吸する。
   携帯は小さく（46px）置く。広い机の余白が「静かな部屋にこれだけが起きている」を作る。
   見えているのは背面＝サブ液晶（消灯）とカメラのレンズだけ。ボタンの列は描かない
   （描くとノートPCのキーボードに見えて、この絵の意味が消える）。 */
ART.phone_flip = () => {
  // 部屋（奥は闇）
  P(0, 0, 360, 200, PAL.night);
  vgrad(0, 0, 360, 74, PAL.night, lit(PAL.navy, 0.8), 5);
  // 奥にノートPCの裏側（点いているが、ここでは脇役）
  P(258, 34, 68, 34, lit(PAL.navy, 0.7));
  P(260, 36, 64, 2, lit(PAL.slate, 0.7));
  glow(292, 52, 46, PAL.crt, 0.07);

  // 机（木目。間隔と長さを hash で崩す）
  const deskY = 74;
  vgrad(0, deskY, 360, 126, '#3a2a18', '#20150c', 7);
  P(0, deskY, 360, 2, '#4a361f');
  for (let i = 0; i < 16; i++) {
    const gy = deskY + 8 + hash(i) * 112;
    const gx = hash(i + 30) * 120, gw = 90 + hash(i + 60) * 170;
    P(gx, gy, gw, 1, i % 3 ? 'rgba(90,64,36,0.55)' : 'rgba(120,88,50,0.45)');
  }

  // ---- 携帯（閉じた折りたたみ・平らに伏せる。中心 x=168, y=118）----
  const px = 145, py = 108, pw = 46, ph = 22;
  const beat = 0.5 + 0.5 * Math.sin(T() * 4.4);          // 1.4秒周期の呼吸

  // 先に「下から漏れる光」を机へ。本体より一回り大きく、輪郭の外へにじむ
  _c.globalAlpha = 0.26 + beat * 0.30;
  glow(px + pw / 2, py + ph / 2 + 4, 42, '#8fd8ff', 1);
  _c.globalAlpha = 0.20 + beat * 0.24;
  glow(px + pw / 2, py + ph / 2 + 6, 24, '#cfeeff', 1);
  _c.globalAlpha = 1;
  // 光が触れた木目だけを浮かび上がらせる
  for (let i = 0; i < 5; i++) {
    const gy = py - 6 + i * 9;
    _c.globalAlpha = (0.10 + beat * 0.14) * (1 - Math.abs(i - 2) / 3);
    P(px - 26, gy, pw + 52, 1, '#9fc4e0');
    _c.globalAlpha = 1;
  }
  // 合わせ目（本体の隙間）から漏れる強い筋＝ここが光源だと分かる線
  _c.globalAlpha = 0.45 + beat * 0.45;
  P(px - 1, py + ph - 9, pw + 2, 1, '#dff2ff');
  P(px - 2, py + ph - 3, pw + 4, 1, '#bfe4ff');
  _c.globalAlpha = 1;

  // 落ち影（光より先に置くと影が光る事故になるので、本体の直前に）
  _c.globalAlpha = 0.5;
  P(px + 3, py + ph - 1, pw, 3, '#0d0906');
  _c.globalAlpha = 1;

  // 本体（背面。暗いまま＝光っているのは机だけ）
  P(px, py, pw, ph, '#15181e');                          // 下側の筐体
  P(px + 1, py + 1, pw - 2, ph - 10, '#1d2129');         // 上側（伏せた表面）
  P(px + 1, py + 1, pw - 2, 1, '#333a46');               // 天面のエッジ光
  P(px, py + ph - 8, pw, 1, '#0a0c10');                  // 合わせ目の陰
  P(px + 2, py + ph - 3, pw - 4, 2, '#101319');          // 手前の厚み
  // サブ液晶（消灯した横長の窓）とカメラのレンズ
  P(px + 9, py + 4, 20, 6, '#0b0d11');
  P(px + 9, py + 4, 20, 1, '#242a34');
  P(px + 34, py + 5, 5, 5, '#0b0d11');
  D(px + 36, py + 7, '#2b3644');                          // レンズは光を一粒だけ拾う
  _c.globalAlpha = 0.35 + beat * 0.4;
  D(px + 36, py + 7, '#9fd8ff');
  _c.globalAlpha = 1;
  // ヒンジ側の段差（折りたたみだと分かる線）
  P(px + 1, py + ph - 11, pw - 2, 1, '#2a303c');

  // ストラップ（机に垂れて、光の縁を拾う）
  for (let i = 0; i < 7; i++) {
    const sx = px + pw + i * 3, sy = py + ph - 6 + Math.sin(i * 0.8) * 3;
    D(sx, sy, i < 4 ? '#3c4452' : '#2a303c');
  }

  // 手前の暗がり（画面下を落として、光の一点に目を集める）
  for (let i = 0; i < 10; i++) {
    _c.globalAlpha = i * 0.035;
    P(0, 176 + i * 2.4, 360, 3, '#000');
    _c.globalAlpha = 1;
  }
};

/* ── AM9:30 E3b：手紙と愛用のノート ──────────────────────
   「金じゃないものを送る」——その物証だけを机の上に並べる。
   便箋は書きかけ（最後の行が途中で切れている）、ノートは角が丸まり、
   栞紐が垂れ、付箋が数枚はみ出す。付箋は幅も間隔も高さもすべてバラバラにする
   （等間隔の反復はUIに見えて情感が死ぬ）。光は電球色で、左上から斜めに落とす。 */
ART.letter_note = () => {
  // 部屋と机（電球1つの下。奥は暗く、手前の紙だけが明るい）
  P(0, 0, 360, 200, lit(PAL.navy, 0.55));
  vgrad(0, 0, 360, 62, lit(PAL.navy, 0.42), lit(PAL.amber, 0.30), 6);
  const dy = 58;
  vgrad(0, dy, 360, 200 - dy, lit(PAL.amber, 0.52), lit(PAL.amber, 0.30), 8);
  P(0, dy, 360, 2, lit(PAL.amber, 0.72));
  for (let i = 0; i < 9; i++) {                               // 木目（間隔を崩す）
    const y = dy + 10 + i * 15 + hash(i + 1) * 7;
    P(hash(i + 5) * 40, y, 320 + hash(i + 2) * 40, 1, lit(PAL.amber, 0.22));
  }
  glow(96, 52, 190, PAL.amber, 0.30);                         // 電球色の落ち方（左上から）

  // ── 便箋（書きかけ。少し傾けて「今書いている」感を出す） ──
  const lx = 26, ly = 62, lw = 150, lh = 116;
  P(lx + 4, ly + 5, lw, lh, 'rgba(0,0,0,0.26)');              // 紙の影
  P(lx + 1, ly, lw - 2, lh, PAL.paper); P(lx, ly + 1, lw, lh - 2, PAL.paper);
  P(lx, ly + 1, 1, lh - 2, lit(PAL.paper, 1.06));             // 光の当たる左端
  P(lx + 1, ly + lh - 3, lw - 2, 3, lit(PAL.paper, 0.82));    // 下端の陰
  P(lx + 10, ly + 8, lw - 20, 1, lit(PAL.amber, 0.9));        // 便箋の飾り罫（上）
  P(lx + 10, ly + 11, 40, 1, lit(PAL.amber, 0.9));
  // 万年筆の筆致（読めない字。語のかたまりを継いで書く＝波線の反復にしない）
  const ink = '#243a6a';
  for (let i = 0; i < 13; i++) {
    const yy = ly + 20 + i * 7;
    let x = lx + 12 + Math.round(hash(i) * 4) + (i === 0 ? 9 : 0);      // 1行目だけ字下げ
    let end = lx + lw - 14 - Math.round(hash(i + 3) * 26);
    if (i === 6) end -= 38;                                   // 段落の切れ目で行が短くなる
    if (i === 12) end = x + Math.round((end - x) * 0.34);      // 最終行＝途中で止まっている
    let w = 0;
    while (x < end) {                                          // 語のかたまり（長さも間隔もバラバラ）
      const wl = 4 + Math.round(hash(i * 13 + w) * 10);
      for (let k = 0; k < wl && x + k < end; k++) {
        const wob = Math.round(Math.sin((x + k) * 0.22 + i) * 0.9);     // ゆるい上下動＝手の癖
        D(x + k, yy + wob, ink);
        if (hash(i * 31 + x + k) > 0.79) D(x + k, yy + wob - 1, ink);   // 跳ね・濁点
      }
      x += wl + 2 + Math.round(hash(i * 5 + w) * 3);
      w++;
    }
    if (i === 12) P(x - 2, yy - 1, 2, 2, lit(ink, 1.3));       // 止めたところのインク溜まり
  }

  // ── 万年筆（便箋の上に斜めに置かれている。書いていた手を離した直後） ──
  const ppx = 150, ppy = 150;
  for (let i = 0; i < 46; i++) {                              // 軸（右下がりに積む）
    const x = ppx - i, y = ppy + Math.round(i * 0.34);
    const c = i < 14 ? '#c8b070' : (i < 18 ? PAL.gold : '#1a1c24'); // ペン先→リング→軸
    P(x, y, 1, i < 14 ? 2 : 4, c);
    if (i >= 18 && i % 11 === 0) D(x, y + 1, lit('#1a1c24', 2.4));  // 軸のツヤ
  }
  P(ppx - 4, ppy + 1, 5, 1, '#e0cf94');                       // ペン先の光
  for (let i = 0; i < 5; i++) D(ppx + 2 + i, ppy - Math.round(i * 0.4), 'rgba(0,0,0,0.25)'); // 影

  // ── 愛用のノート（右。角が丸まり、栞紐、付箋がはみ出す） ──
  const nx = 196, ny = 68, nw = 128, nh = 112;
  P(nx + 5, ny + 6, nw, nh, 'rgba(0,0,0,0.30)');              // 影
  // 小口（使い込んで反った紙の束。厚みを段で出す）
  for (let i = 0; i < 6; i++) P(nx - i, ny + 3 + i, nw, nh - 4, i % 2 ? lit(PAL.paper, 0.86) : lit(PAL.paper, 0.94));
  // 表紙（濃い革色。角は1〜3ドット落として「丸まり」を出す）
  P(nx, ny, nw, nh, '#4a3524');
  P(nx, ny, nw, 2, lit('#4a3524', 1.45));                     // 光の当たる上端
  P(nx, ny, 2, nh, lit('#4a3524', 1.2));
  P(nx + nw - 3, ny + 2, 3, nh - 2, lit('#4a3524', 0.68));    // 右の陰
  P(nx, ny, 3, 3, lit(PAL.amber, 0.5)); P(nx + 1, ny, 2, 1, lit(PAL.amber, 0.4)); // 丸まった角
  P(nx + nw - 3, ny, 3, 2, lit(PAL.amber, 0.5));
  P(nx, ny + nh - 3, 4, 3, lit(PAL.amber, 0.5));
  P(nx + nw - 4, ny + nh - 3, 4, 3, lit(PAL.amber, 0.45));
  for (let i = 0; i < 14; i++) {                              // 表紙の擦れ（hashで散らす）
    const sx = nx + 6 + hash(i) * (nw - 16), sy = ny + 6 + hash(i + 8) * (nh - 14);
    P(sx, sy, 1 + (hash(i + 3) > 0.7 ? 2 : 0), 1, lit('#4a3524', 1.3));
  }
  P(nx + 12, ny + nh - 24, 46, 2, lit('#4a3524', 1.55));      // 表紙の型押し（読めない行）
  P(nx + 12, ny + nh - 18, 28, 2, lit('#4a3524', 1.35));
  // ゴムバンドではなく栞紐（下から垂れて、先がほつれている）
  for (let i = 0; i < 26; i++) {
    const bx2 = nx + 74 + Math.round(Math.sin(i * 0.24) * 4);
    P(bx2, ny + nh - 4 + i, 2, 1, i < 22 ? '#a53c3c' : '#c4605c');
  }
  D(nx + 74, ny + nh + 22, '#c4605c'); D(nx + 79, ny + nh + 21, '#c4605c'); // ほつれ
  // 付箋（上と右に。幅・間隔・はみ出し量・色をすべて崩す＝反復にしない）
  const tabsTop = [[10, 13, 5, PAL.gold], [30, 8, 7, '#e08a5a'], [46, 15, 4, '#8fc48a'], [72, 9, 6, PAL.gold]];
  for (const [ox, tw, out, col] of tabsTop) {
    P(nx + ox, ny - out, tw, out + 3, col);
    P(nx + ox, ny - out, tw, 1, lit(col, 1.2));
    P(nx + ox, ny - 1, tw, 1, lit(col, 0.65));                // 折り返しの陰
  }
  const tabsRight = [[22, 11, 6, '#e08a5a'], [51, 7, 9, PAL.gold], [78, 14, 5, '#8fc48a']];
  for (const [oy, th, out, col] of tabsRight) {
    P(nx + nw - 2, ny + oy, out + 2, th, col);
    P(nx + nw - 2, ny + oy, out + 2, 1, lit(col, 1.2));
    P(nx + nw - 2, ny + oy + th - 1, out + 2, 1, lit(col, 0.6));
  }

  // 便箋を入れる封筒（ノートの手前に半分だけ覗く。宛名は読めない行）
  P(150, 176, 92, 22, lit(PAL.paper, 0.92));
  P(150, 176, 92, 1, PAL.paper);
  for (let i = 0; i < 22; i++) { D(150 + 46 - i * 2, 176 + i, lit(PAL.ash, 1.05)); D(150 + 46 + i * 2, 176 + i, lit(PAL.ash, 1.05)); } // 封の折り線
  P(158, 190, 30, 2, lit(PAL.ash, 0.9));
  P(158, 194, 18, 2, lit(PAL.ash, 0.9));

  glow(120, 120, 150, PAL.amber, 0.16);                       // 全体をもう一度温める
  scanlines(0, 0, 360, 200, 0.05);
};
