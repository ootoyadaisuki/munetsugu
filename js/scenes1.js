'use strict';
/* シーン集1（本体セッションの参照実装。ほかの scenes*.js はこの書き方に揃える）
   キャンバスは 360×200。使えるもの: PAL / P / D / vgrad / lit / glow / laptop /
   person / face / paper / windowPane / label / labelC / scanlines / T() / hash(i) */

/* ── タイトル前：ゲーム禁止の少年 ──────────────────────
   子供部屋の夜。棚の上にゲーム機（手が届かない＝禁止の可視化）、
   机には一冊の小説だけ。少年は前かがみで読んでいる。
   ここで「持っていないもの」を先に見せておくと、最後のGAME CLEARが効く。 */
ART.title_boy = () => {
  // 壁と床
  P(0, 0, 360, 200, PAL.navy);
  P(0, 150, 360, 50, lit(PAL.navy, 0.7));
  // 窓（夜。外は青一色で、部屋の孤立を作る）
  windowPane(232, 26, 86, 62, PAL.night, '#22304f');
  for (let i = 0; i < 5; i++) {                       // 星（hashで散らす）
    const sx = 236 + hash(i) * 78, sy = 30 + hash(i + 9) * 54;
    D(sx, sy, i % 2 ? PAL.ash : PAL.paper);
  }
  // 棚（高い位置＝届かない）とゲーム機
  P(34, 44, 120, 5, PAL.slate);
  P(36, 49, 116, 2, lit(PAL.slate, 0.7));
  P(58, 30, 30, 14, PAL.steel);                       // 据置ゲーム機
  P(60, 33, 26, 8, lit(PAL.night, 1.3));
  D(84, 41, PAL.red);                                 // 電源ランプ（消えている＝赤の点だけ）
  P(96, 34, 18, 10, PAL.slate);                       // ソフトの箱
  P(98, 36, 14, 6, lit(PAL.slate, 1.4));
  // ほこり（使われていない）
  for (let i = 0; i < 7; i++) D(40 + hash(i + 3) * 108, 43, lit(PAL.ash, 0.6));

  // 机
  P(24, 132, 150, 6, PAL.amber);
  P(24, 138, 150, 3, lit(PAL.amber, 0.6));
  P(32, 141, 5, 32, lit(PAL.amber, 0.5));
  P(160, 141, 5, 32, lit(PAL.amber, 0.5));
  // 卓上ライト（この部屋で唯一の光源）
  P(150, 104, 4, 28, PAL.steel);
  P(136, 96, 26, 9, PAL.steel);
  P(139, 105, 20, 2, PAL.gold);
  glow(149, 122, 66, PAL.amber, 0.30);

  // 開いた本（ボロボロ＝ページの端が欠けている）
  const bx = 66, by = 120;
  P(bx, by, 60, 13, PAL.paper);
  P(bx + 29, by, 2, 13, PAL.ash);                     // 綴じ
  for (let i = 0; i < 4; i++) {                       // 本文
    P(bx + 4, by + 3 + i * 2, 22, 1, PAL.ash);
    P(bx + 33, by + 3 + i * 2, 22 - (i % 2) * 6, 1, PAL.ash);
  }
  for (let i = 0; i < 6; i++) D(bx + 2 + i * 10, by + (i % 2 ? 0 : 12), PAL.navy); // 欠けた端

  // 少年（前かがみ・肩を丸めて読む）
  person(84, 92, 1.6, 'bow', '#2f3d5c');
  // めくる手の指先だけ紙にかける
  P(118, 118, 4, 2, PAL.skin);

  scanlines(0, 0, 360, 200, 0.06);
};

/* ── AM5:55 夜明け前のデスク ──────────────────────
   2009年9月28日の朝。窓の外はまだ藍。部屋で光っているのは古いノートPCだけ。
   机の上には何もない（＝これから何かが起きる前の静けさ）。
   時計は5:55を指し、メールが1通だけ届いている。 */
ART.desk_dawn = () => {
  P(0, 0, 360, 200, PAL.night);
  // 窓（夜明け前。下だけわずかに白む）
  windowPane(206, 18, 118, 74, PAL.night, PAL.dawn);
  P(208, 84, 114, 6, '#54608c');                      // 地平の白み
  for (let i = 0; i < 9; i++) {                       // 遠くのビルの灯り
    const bx = 210 + i * 12, bh = 8 + hash(i) * 14;
    P(bx, 90 - bh, 9, bh, '#141b2e');
    if (hash(i + 5) > 0.45) D(bx + 3, 90 - bh + 3, PAL.amber);
    if (hash(i + 11) > 0.6) D(bx + 6, 90 - bh + 7, PAL.amber);
  }
  // 壁と机
  P(0, 118, 360, 82, lit(PAL.navy, 0.55));
  P(0, 118, 360, 3, PAL.slate);
  P(18, 128, 210, 7, PAL.slate);
  P(18, 135, 210, 4, lit(PAL.slate, 0.6));

  // ノートPC（2009年型＝厚くて四角い）
  laptop(74, 62, 96, PAL.crt);
  // 画面の中身（メール1通）
  P(78, 66, 88, 8, lit(PAL.crt, 0.55));
  P(80, 76, 60, 2, lit(PAL.night, 1.6));
  P(80, 81, 72, 2, lit(PAL.night, 1.6));
  P(80, 86, 44, 2, lit(PAL.night, 1.6));
  const blink = (T() % 1.2) < 0.7;
  if (blink) P(152, 76, 10, 7, PAL.gold);             // 新着の印
  scanlines(78, 66, 88, 34, 0.10);

  // 座っている村上（後ろ姿・肩を丸める）
  person(28, 96, 2.2, 'sit', '#232c44');
  // マグカップ（湯気が1本だけ上がる＝時間が動いている合図）
  P(190, 118, 12, 10, PAL.paper);
  P(202, 121, 4, 4, PAL.paper);
  P(191, 118, 10, 2, '#4a3524');
  for (let i = 0; i < 3; i++) {
    const t = (T() * 0.8 + i * 0.33) % 1;
    _c.globalAlpha = 0.5 - t * 0.5;
    P(194 + Math.sin((t + i) * 4) * 3, 116 - t * 16, 2, 3, PAL.paper);
    _c.globalAlpha = 1;
  }
  // 置き時計 5:55
  P(240, 108, 34, 20, PAL.slate);
  P(243, 111, 28, 14, lit(PAL.night, 1.4));
  labelC(257, 113, '5:55', PAL.crt, 11);

  glow(122, 84, 130, PAL.crt, 0.16);
};

/* ── 執筆デスク（時刻で変わる）──────────────────────
   12通ぶんの時間経過を1枚で受ける絵。6:00の夜明け前から18:00の日暮れまで、
   **窓の外の色と部屋の明るさ**だけが変わる（家具の配置は動かさない＝同じ部屋にいる感じ）。
   6時=まだ暗い／7時=朝焼け／9〜15時=明るい昼／16時〜=夕方の橙。
   ノートPCの画面だけは、どの時間でも同じ明るさで光っている。 */
ART.desk = () => {
  // 時刻キーフレーム: [時, 空の上, 空の下, 壁, 机, 差し込む光]
  const [sky0, sky1, wall, deskCol, shaft] = byHour([
    [6,  '#2a3550', '#54608c', '#232c44', '#3a2a18', '#7fd4c8'],  // 夜明け前
    [7,  '#5a74a8', '#c0a888', '#3a4560', '#5a4228', '#ffd9a0'],  // 朝焼け
    [9,  '#7ab0e0', '#cfe4f2', '#4a5570', '#7a5a34', '#ffe9b8'],  // 昼前
    [12, '#6fa8e2', '#c2dcef', '#525d78', '#805e36', '#fff3d2'],  // 真昼
    [15, '#78a8d8', '#c8d8e2', '#4e586f', '#7a5a34', '#ffe6b0'],
    [16, '#d99a52', '#f0cf9a', '#5a4a48', '#7a5230', '#ffcf86'],  // 夕方
    [17, '#cf7434', '#eeb070', '#54423e', '#6e4a2c', '#ffbc6a'],
    [18, '#a4522c', '#c07048', '#3e332f', '#5c3e26', '#e09a52'],  // 日暮れ
  ]);
  const night = ART_HOUR <= 6;

  // 壁と床
  P(0, 0, 360, 200, wall);
  P(0, 118, 360, 82, lit(wall, 0.72));
  P(0, 118, 360, 3, lit(wall, 1.15));

  // 窓（外の色が主役。昼は明るく、夕方は橙、夜は藍）
  windowPane(206, 18, 118, 74, sky0, sky1);
  if (!night) {                                   // 昼〜夕方は外の街が見える
    for (let i = 0; i < 9; i++) {
      const bx = 210 + i * 12, bh = 8 + hash(i) * 14;
      P(bx, 90 - bh, 9, bh, lit(sky0, 0.72));
    }
    // 窓から差し込む光の帯（机の上に落ちる）
    _c.globalAlpha = ART_HOUR >= 16 ? 0.22 : 0.14;
    P(150, 118, 120, 3, shaft);
    P(168, 121, 96, 2, shaft);
    _c.globalAlpha = 1;
  } else {                                        // 夜は遠くのビルの灯り
    for (let i = 0; i < 9; i++) {
      const bx = 210 + i * 12, bh = 8 + hash(i) * 14;
      P(bx, 90 - bh, 9, bh, '#141b2e');
      if (hash(i + 5) > 0.45) D(bx + 3, 90 - bh + 3, PAL.amber);
      if (hash(i + 11) > 0.6) D(bx + 6, 90 - bh + 7, PAL.amber);
    }
  }

  // 机
  P(18, 128, 210, 7, deskCol);
  P(18, 135, 210, 4, lit(deskCol, 0.6));

  // ノートPC（画面の明るさは終日いっしょ＝ここだけが12時間ずっと同じ）
  laptop(74, 62, 96, PAL.crt);
  P(78, 66, 88, 8, lit(PAL.crt, 0.55));
  P(80, 76, 60, 2, lit(PAL.night, 1.6));
  P(80, 81, 72, 2, lit(PAL.night, 1.6));
  P(80, 86, 44, 2, lit(PAL.night, 1.6));
  if ((T() % 1.2) < 0.7) P(152, 76, 10, 7, PAL.gold);   // 新着の印
  scanlines(78, 66, 88, 34, 0.10);

  // 座っている村上（後ろ姿）。夜だけシルエットが濃くなる
  person(28, 96, 2.2, 'sit', night ? '#232c44' : lit(wall, 0.55));

  // マグカップ（湯気は昼のうちだけ立てる＝時間の経過が分かる）
  P(190, 118, 12, 10, PAL.paper);
  P(202, 121, 4, 4, PAL.paper);
  P(191, 118, 10, 2, '#4a3524');
  if (ART_HOUR < 16) {
    for (let i = 0; i < 3; i++) {
      const t = (T() * 0.8 + i * 0.33) % 1;
      _c.globalAlpha = 0.45 - t * 0.45;
      P(194 + Math.sin((t + i) * 4) * 3, 116 - t * 16, 2, 3, PAL.paper);
      _c.globalAlpha = 1;
    }
  }

  // 置き時計（いまの時刻）
  P(240, 108, 34, 20, lit(wall, 0.6));
  P(243, 111, 28, 14, lit(PAL.night, 1.4));
  labelC(257, 113, `${ART_HOUR}:00`, PAL.crt, 11);

  if (night) glow(122, 84, 130, PAL.crt, 0.16);
};
