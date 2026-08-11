'use strict';
/* シーン集3：主人公の表情差分4枚（『村上宗嗣の12時間』）
   キャンバスは 360×200。使えるもの: PAL / P / D / vgrad / lit / glow / laptop /
   person / face / paper / windowPane / label / labelC / scanlines / T() / hash(i)

   掟（このファイル固有）:
   - art.js の face() は小さすぎるので使わない。ここで胸から上（バストアップ）を新規に描く
   - 4枚は同一人物。輪郭・髪・服・部屋・光は下の共通関数だけが持ち、
     各エントリは「差分（目・口・血色・付属物）」しか触らない
   - 本人だと分かるキャラクターにする（写真の模写ではなく特徴の記号化）。
     識別要素は重要度順に ①細いメタルフレームのメガネ ②トップを立てた短い黒髪
     ③薄い口ひげ＋あご先のひげ ④黒スーツ＋黒シャツ＋シルバーのネクタイ ⑤左耳のピアス。
     ①〜⑤は muBody() と muGlasses() が持ち、4枚とも同じ形で出る
   - 乱数禁止（hash(i)）。動きは T() のみ
*/

/* ---- 主人公の骨格（唯一の定義。ここを直せば4枚とも同じだけ動く）----
   頭は小さめ・肩は広く丸く。棒にしないための比率をここで固定する。 */
const MU = {
  cx: 176,          // 顔の中心
  headL: 150, headW: 52,  // 顔の箱（150〜202）。細面にするため幅は狭く、丈は長く
  faceT: 50, faceB: 114,  // 額の生え際〜あごの下
  browY: 66,        // 眉（メガネの上辺と重ならない高さ。下げるとフレームと1本に潰れる）
  eyeY: 78,         // 目の上端
  eyeW: 13, eyeH: 6,      // 目は小さめ＝キリッとした印象の土台
  eyeLX: 156, eyeRX: 183, // 左右の目の左端
  noseY: 88,
  mouthY: 100,
  neckX: 165, neckW: 22, neckT: 108,
  shoY: 130,        // 肩の頂点
};

/* ── 共通1：部屋 ────────────────────────────────────
   4枚とも同じ暗い室内。時間帯で色を変えない（同じ人・同じ部屋に見せるため）。
   光源はフレーム外・左下のノートPCだけ。青緑(PAL.crt)が顔の左半分を舐める。 */
function muRoom() {
  // 奥の壁（上が暗く、机の高さに向かってわずかに持ち上がる）
  vgrad(0, 0, 360, 200, PAL.night, lit(PAL.navy, 0.9), 10);
  // 壁の継ぎ目（部屋だと分かる最低限の情報。柱1本だけ）
  P(300, 0, 3, 200, lit(PAL.navy, 1.15));
  P(303, 0, 1, 200, lit(PAL.night, 1.2));
  // 壁にうっすら映るノートPCの画面光（顔の背後＝縁光の種）
  glow(96, 150, 150, PAL.crt, 0.13);
  glow(176, 96, 120, PAL.crt, 0.06);
  // 机の縁（画面下端。バストアップの下限を作る）
  P(0, 190, 360, 2, lit(PAL.slate, 0.8));
  P(0, 192, 360, 8, lit(PAL.navy, 0.5));
  // 画面光の帯（左下から斜めに1本。光源の方向を明示する）
  _c.globalAlpha = 0.10;
  for (let i = 0; i < 7; i++) P(0, 150 + i * 7, 60 + i * 26, 3, PAL.crt);
  _c.globalAlpha = 1;
}

/* ── 共通2：バストアップの土台 ──────────────────────
   胴 → 首 → 顔の輪郭 → 髪 → 耳 の順に置く。
   o.oy   … 全体の上下オフセット（息が上がる＝肩が上下する用）
   o.skin … 肌の色（真っ赤なときだけ差し替える）
   o.mess … 髪の乱れ量（0=整っている / 1=乱れている） */
function muBody(o) {
  const oy = o.oy || 0, skin = o.skin || PAL.skin, mess = o.mess || 0;
  const clothCol = '#12141c';   // 黒いスーツのジャケット
  const shirtCol = '#1d2029';   // 黒いシャツ（ジャケットよりわずかに明るいだけ）
  const tieCol = PAL.ash;       // シルバーのネクタイ＝この絵で一番明るい面
  const shade = lit(skin, 0.78);

  /* 胴（肩を丸める＝段を細かく積む。棒人間にしない肝） */
  for (let i = 0; i < 9; i++) {
    const w = 64 + i * i * 1.9 + i * 5.4;    // 下へ行くほど加速度的に広がる
    const y = MU.shoY + oy + i * 3;
    P(MU.cx - w / 2, y, w, 4, clothCol);
  }
  P(MU.cx - 130, MU.shoY + oy + 27, 260, 200 - (MU.shoY + oy + 27), clothCol);

  /* 襟元（黒シャツのV＋ラペル＋ネクタイ）
     暗い服の中でネクタイだけが明るい＝バストアップ下部の重心をここに置く。 */
  const vT = MU.shoY + oy + 2;                 // Vが開き始める高さ
  for (let y = vT; y < 200; y += 2) {
    const hw = 9 + (y - vT) * 0.30;            // 下へ向かって開くV
    P(MU.cx - hw, y, hw * 2, 2, shirtCol);     // シャツの面
    P(MU.cx - hw - 3, y, 3, 2, lit(clothCol, 2.2));   // ラペルの折り返し（左）
    P(MU.cx + hw, y, 3, 2, lit(clothCol, 1.7));       // 同（右・影側）
    P(MU.cx - hw - 8, y, 2, 2, lit(clothCol, 1.5));   // ラペル外側の2本目の線
    P(MU.cx + hw + 6, y, 2, 2, lit(clothCol, 1.25));
  }
  // シャツの襟（ネクタイの結び目を挟む2枚。角を落として布に見せる）
  P(MU.cx - 16, vT, 9, 12, lit(shirtCol, 1.5));
  P(MU.cx + 7, vT, 9, 12, lit(shirtCol, 1.2));
  P(MU.cx - 15, vT + 10, 7, 3, lit(shirtCol, 1.3));
  P(MU.cx + 8, vT + 10, 7, 3, lit(shirtCol, 1.05));
  // ネクタイ（結び目→剣先へ、下ほど広く）
  P(MU.cx - 7, vT + 1, 14, 9, lit(tieCol, 0.9));
  P(MU.cx - 6, vT + 2, 12, 3, lit(tieCol, 1.15));   // 結び目のハイライト
  P(MU.cx - 7, vT + 10, 14, 2, lit(tieCol, 0.6));   // 結び目の下の影
  for (let y = vT + 12; y < 200; y += 2) {
    const hw = 5 + (y - vT - 12) * 0.13;
    P(MU.cx - hw, y, hw * 2, 2, tieCol);
    P(MU.cx - hw, y, 2, 2, lit(tieCol, 1.25));      // 左＝画面光が当たる側
    P(MU.cx + hw - 2, y, 2, 2, lit(tieCol, 0.68));  // 右＝影
  }
  // 胸の影（服の落ち影。平面に見せない）
  P(MU.cx - 62, MU.shoY + oy + 16, 34, 3, lit(clothCol, 1.6));
  P(MU.cx + 30, MU.shoY + oy + 16, 34, 3, lit(clothCol, 1.35));
  // 肩の縁光（背後の画面光。左肩だけ青緑に光らせて輪郭を立てる）
  for (let i = 0; i < 8; i++) {
    const w = 64 + i * i * 1.9 + i * 5.4;
    const y = MU.shoY + oy + i * 3;
    P(MU.cx - w / 2, y, 2, 4, lit(PAL.crt, 0.55));
  }
  P(MU.cx - 130, MU.shoY + oy + 27, 2, 200, lit(PAL.crt, 0.35));

  /* 首（あごの落ち影を必ず入れる） */
  P(MU.neckX, MU.neckT + oy, MU.neckW, MU.shoY + oy - (MU.neckT + oy) + 4, shade);
  P(MU.neckX, MU.neckT + oy, MU.neckW, 5, lit(skin, 0.6)); // あごの影
  P(MU.neckX, MU.neckT + oy, 2, 24, lit(PAL.crt, 0.5));    // 首の縁光（左）

  /* 顔の輪郭（横帯を積む。左右対称・あごへ向かって細る） */
  const bands = [
    [MU.faceT - 2, 4, 7], [MU.faceT + 2, 4, 3], [MU.faceT + 6, 4, 1],
    [MU.faceT + 10, 34, 0],
    [MU.faceT + 44, 4, 2], [MU.faceT + 48, 4, 4], [MU.faceT + 52, 4, 7],
    [MU.faceT + 56, 4, 11], [MU.faceT + 60, 3, 17],
  ];
  for (const [by, bh, ins] of bands) P(MU.headL + ins, by + oy, MU.headW - ins * 2, bh, skin);
  // 顔の右半分に影（光は左から）。輪郭と同じ帯で描く＝あご下や耳の外へはみ出さない
  _c.globalAlpha = 0.20;
  for (const [by, bh, ins] of bands) {
    const x0 = Math.max(MU.cx + 6, MU.headL + ins), x1 = MU.headL + MU.headW - ins;
    if (x1 > x0) P(x0, by + oy, x1 - x0, bh, lit(skin, 0.45));
  }
  _c.globalAlpha = 1;
  // 顔の左縁の縁光（背後の画面光が輪郭をなぞる）
  P(MU.headL, MU.faceT + 8 + oy, 2, 44, lit(PAL.crt, 0.55));
  P(MU.headL + 1, MU.faceT + 52 + oy, 3, 4, lit(PAL.crt, 0.4));

  /* 耳（1ドットの主張。輪郭の外に少しだけ） */
  P(MU.headL - 4, MU.faceT + 26 + oy, 5, 14, shade);
  P(MU.headL + MU.headW - 1, MU.faceT + 26 + oy, 5, 14, lit(skin, 0.62));

  /* 髪（本人の識別要素その2：トップを立てた短い黒髪）
     ・前髪は下ろさない＝生え際は faceT+2 で止め、額を18px分あける
     ・サイドと後ろは刈り込み＝もみあげを短くし、耳を完全に外へ出す
     ・頭頂に毛束を跳ねさせる（本数と角度は hash で固定＝毎フレーム暴れない） */
  P(MU.headL + 14, MU.faceT - 19 + oy, MU.headW - 28, 4, PAL.hair); // 頭頂（丸みの頂点）
  P(MU.headL + 8, MU.faceT - 16 + oy, MU.headW - 16, 5, PAL.hair);
  P(MU.headL + 3, MU.faceT - 11 + oy, MU.headW - 6, 6, PAL.hair);
  P(MU.headL, MU.faceT - 5 + oy, MU.headW, 7, PAL.hair);            // 生え際まで
  P(MU.headL, MU.faceT + 2 + oy, 5, 14, PAL.hair);                  // 刈り込んだサイド（左）
  P(MU.headL + MU.headW - 5, MU.faceT + 2 + oy, 5, 14, PAL.hair);   // 同（右）
  // 生え際を1段ギザに（のっぺりを消す。M字にはしない）
  for (let i = 0; i < 5; i++) P(MU.headL + 5 + i * 9, MU.faceT + 2 + oy, 8, 1 + (hash(i) > 0.5 ? 1 : 0), PAL.hair);
  /* 跳ねた毛束（5本）。根元は必ず頭頂の塊に食い込ませる＝浮いたアンテナにしない。
     [根元x, 長さ, 倒す向き, 根元の高さ] */
  const spikes = [[8, 6, -1, -14], [16, 10, -1, -17], [25, 12, 1, -19], [34, 10, 1, -17], [42, 6, 1, -14]];
  for (let i = 0; i < spikes.length; i++) {
    const [sx, len, dir, sy] = spikes[i];
    const L = len + (mess ? 3 + hash(i) * 4 : 0);          // 乱れているときだけ伸ばす
    for (let j = 0; j < L; j++) {
      const w = Math.max(2, 6 - j * 0.42);                 // 根元は太く、先へ細る
      const lean = dir * j * (0.42 + (mess ? hash(i + 3) * 0.6 : 0));
      P(MU.headL + sx + lean, MU.faceT + sy - j + oy, w, 2, PAL.hair);
    }
  }
  // 髪の縁光（背後の画面光。頭の左上と毛束の先だけ）
  P(MU.headL + 1, MU.faceT - 10 + oy, 3, 14, lit(PAL.crt, 0.5));
  P(MU.headL + 6, MU.faceT - 14 + oy, 12, 2, lit(PAL.crt, 0.45));
  for (let i = 0; i < spikes.length; i++) {
    const [sx, len, dir, sy] = spikes[i];
    const L = len + (mess ? 3 : 0);
    P(MU.headL + sx + dir * L * 0.42, MU.faceT + sy - L + 1 + oy, 2, 2, lit(PAL.crt, 0.6));
  }

  muBrows(oy, o.brow);

  /* 鼻（影1本だけ。記号で足りる） */
  P(MU.cx - 3, MU.noseY + oy, 3, 8, lit(skin, 0.72));
  P(MU.cx - 5, MU.noseY + 8 + oy, 7, 2, lit(skin, 0.62));

  /* 口ひげ・あごひげ（本人の識別要素その3：薄く整えてある）
     口をぐるりと囲まず、鼻の下とあご先の2ブロックだけ。無精髭にしない＝
     真っ黒を置かず、肌に髪色を薄く重ねた中間色を使う。 */
  const beard = '#453f4c';                                 // 薄い。真っ黒にすると無精髭になる
  _c.globalAlpha = 0.72;
  P(MU.cx - 9, MU.noseY + 7 + oy, 18, 3, beard);           // 口ひげ（鼻の下。細く一本）
  P(MU.cx - 2, MU.noseY + 7 + oy, 4, 2, lit(skin, 0.9));   // 人中のくぼみ＝中央を割る
  _c.globalAlpha = 0.45;
  P(MU.cx - 11, MU.noseY + 8 + oy, 2, 2, beard);           // 端をぼかす
  P(MU.cx + 9, MU.noseY + 8 + oy, 2, 2, beard);
  _c.globalAlpha = 0.68;
  P(MU.cx - 5, MU.mouthY + 5 + oy, 10, 5, beard);          // あご先（小さく）
  _c.globalAlpha = 0.4;
  P(MU.cx - 3, MU.mouthY + 10 + oy, 6, 2, beard);
  P(MU.cx - 10, MU.mouthY + 4 + oy, 20, 1, beard);         // 生え際をなじませる
  _c.globalAlpha = 1;

  /* 左耳のピアス（1ドットの主張。金属なので画面光を拾う） */
  D(MU.headL - 3, MU.faceT + 38 + oy, PAL.ash);
  D(MU.headL - 3, MU.faceT + 37 + oy, PAL.white);
}

/* 眉（3種）。細く、外側へ向かって上がる＝吊り上がり気味が基準の顔。
   太らせると途端に鈍くなるので、厚みは2ドットで固定する。
   mode: 'base' 吊り上がり／'up' さらに上げる（好調）／'worry' 八の字（内側が上がる） */
function muBrows(oy, mode) {
  const up = mode === 'up' ? -3 : 0;
  if (mode === 'worry') {                    // 困り眉＝内側だけ持ち上がる
    const seg = [[-2, 4], [4, 2], [9, 0]];   // [x, 下げ量] 外→内
    for (const [dx, dy] of seg) {
      P(MU.eyeLX - 1 + dx, MU.browY + dy + oy, 6, 2, PAL.hair);
      P(MU.eyeRX + 12 - dx - 6, MU.browY + dy + oy, 6, 2, PAL.hair);
    }
    return;
  }
  // 外側が高く、内側へ向かって下がる（吊り上がり）
  const seg = [[-2, -1], [4, 1], [9, 2]];    // [x, 下げ量] 外→内
  for (const [dx, dy] of seg) {
    P(MU.eyeLX - 1 + dx, MU.browY + dy + up + oy, 6, 2, PAL.hair);        // 左（外は画面左）
    P(MU.eyeRX + 12 - dx - 6, MU.browY + dy + up + oy, 6, 2, PAL.hair);   // 右（左右対称）
  }
}

/* 開いた目（記号的に：白目の四角＋黒目の四角＋光点1つ）
   sq … 上まぶたを下げる量（まばたき／伏し目） */
function muEyesOpen(oy, sq, pupilCol) {
  const h = Math.max(1, MU.eyeH - sq);
  for (let i = 0; i < 2; i++) {
    const ex = i ? MU.eyeRX : MU.eyeLX, out = i ? 1 : -1;   // out = 顔の外側の向き
    P(ex, MU.eyeY + sq + oy, MU.eyeW, h, PAL.paper);
    // 上まぶた（濃い1本）。外側の端だけ1段持ち上げて目尻を切れ上がらせる
    P(ex, MU.eyeY + sq + oy, MU.eyeW, 1, PAL.hair);
    P(ex + (out > 0 ? MU.eyeW - 4 : 0), MU.eyeY + sq - 1 + oy, 4, 1, PAL.hair);
    if (h >= 3) {
      P(ex + 4, MU.eyeY + sq + 1 + oy, 5, h - 1, pupilCol || PAL.hair);
      D(ex + 5, MU.eyeY + sq + 1 + oy, PAL.white);           // 光点
    }
    // 目頭の影（1ドット。彫りを出す）
    P(ex + (out > 0 ? 0 : MU.eyeW - 1), MU.eyeY + sq + 1 + oy, 1, Math.max(1, h - 1), lit(PAL.slate, 0.8));
  }
}
/* 閉じた目（線1本＋まつげの段。三日月にして安らかに） */
function muEyesClosed(oy) {
  for (const ex of [MU.eyeLX, MU.eyeRX]) {
    P(ex + 1, MU.eyeY + 4 + oy, MU.eyeW - 2, 2, PAL.hair);
    P(ex, MU.eyeY + 3 + oy, 2, 2, PAL.hair);
    P(ex + MU.eyeW - 2, MU.eyeY + 3 + oy, 2, 2, PAL.hair);
  }
}

/* ── 共通4：メガネ（本人の識別要素その1。これが入るだけで本人になる）──
   細いメタルフレームの長方形・レンズは小さめの横長・ハーフリム（下辺だけ細く暗い）。
   ブリッジは1ドット線、テンプルは耳のピアスの高さへ抜ける。
   目より必ず後に呼ぶこと（レンズが目の上に乗る）。
   o.tilt … 左右のズレ量（逆立ちのあとだけ傾く）
   o.fog  … レンズの曇り（0〜1）
   o.hi   … ハイライトの強さ（0.35=静か／1.0=最大の見せ場） */
function muGlasses(oy, o) {
  o = o || {};
  const tilt = o.tilt || 0, fog = o.fog || 0, hi = o.hi == null ? 0.75 : o.hi;
  const dx = o.dx || 0;
  const rim = lit(PAL.ash, 1.25);          // 明るいシルバー
  const rimLo = lit(PAL.ash, 0.55);        // 下辺（ハーフリム＝細く暗い）
  const lens = [                            // [左端, 上端]
    [MU.eyeLX - 5 + dx, MU.eyeY - 5 + oy - tilt],
    [MU.eyeRX - 4 + dx, MU.eyeY - 5 + oy + tilt],
  ];
  const LW = 25, LH = 16;
  for (let i = 0; i < 2; i++) {
    const [lx, ly] = lens[i];
    // レンズ面（ガラス越しにわずかに青緑が乗る）
    _c.globalAlpha = 0.12 + fog * 0.55;
    P(lx + 1, ly + 1, LW - 2, LH - 2, fog ? PAL.paper : PAL.crt);
    _c.globalAlpha = 1;
    // フレーム（上辺と左右は1ドットでくっきり、下辺は暗く落としてハーフリムに）
    P(lx, ly, LW, 1, rim);
    P(lx, ly + 1, 1, LH - 2, rim);
    P(lx + LW - 1, ly + 1, 1, LH - 2, rim);
    P(lx, ly + LH - 1, LW, 1, rimLo);
    P(lx, ly, 1, 1, rimLo); P(lx + LW - 1, ly, 1, 1, rimLo);  // 角を1ドット落とす
    // レンズのハイライト（画面光の反射。左上から右下へ斜めに2本）
    if (hi > 0) {
      _c.globalAlpha = Math.min(1, hi * 0.9);
      P(lx + 2, ly + 2, 5, 1, PAL.white);
      _c.globalAlpha = Math.min(1, hi * 0.5);
      P(lx + 4, ly + 4, 3, 1, PAL.white);
      _c.globalAlpha = 1;
    }
  }
  // ブリッジ（細い1ドット線。鼻の付け根を1段またぐ）
  const by = MU.eyeY - 1 + oy;
  P(lens[0][0] + LW, by, 2, 1, rim);
  P(lens[0][0] + LW + 2, by - 1, MU.eyeRX - MU.eyeLX - LW - 1, 1, rim);
  P(lens[1][0] - 2, by, 2, 1, rim);
  // テンプル（つる）。左は耳まで見え、右は輪郭の外へ抜ける
  P(MU.headL - 4, lens[0][1] + 7, lens[0][0] - MU.headL + 4, 1, rim);
  P(lens[1][0] + LW, lens[1][1] + 7, MU.headL + MU.headW + 4 - (lens[1][0] + LW), 1, lit(PAL.ash, 0.85));
  // 鼻当ての影（メガネが顔から浮いている証拠。1ドットで足りる）
  D(lens[0][0] + LW - 1, by + 3, lit(PAL.skin, 0.6));
  D(lens[1][0], by + 3, lit(PAL.skin, 0.6));
}

/* ── ① 通常 ───────────────────────────────────────
   「自信はないですよ。でも不安でもない。ニュートラルです」の顔。
   眉は水平、口は真横一文字、目線はまっすぐ画面（＝ノートPC）へ。
   起きているのはまばたきだけ。約4秒に1回、2フレームぶん閉じる。 */
ART.face_normal = () => {
  muRoom();
  muBody({});
  // まばたき（T()のみ。周期4.3秒＝規則的すぎず、止まって見えない）
  const bt = T() % 4.3;
  const sq = bt < 0.09 ? 6 : (bt < 0.16 ? 3 : 0);
  muEyesOpen(0, sq);
  // 目の下のわずかな隈（徹夜明けの5時台。老けさせない程度に1段だけ）
  _c.globalAlpha = 0.25;
  P(MU.eyeLX + 1, MU.eyeY + MU.eyeH + 1, MU.eyeW - 2, 2, lit(PAL.skin, 0.55));
  P(MU.eyeRX + 1, MU.eyeY + MU.eyeH + 1, MU.eyeW - 2, 2, lit(PAL.skin, 0.55));
  _c.globalAlpha = 1;
  // メガネ（基準の見え方。ここが4枚の標準になる）
  muGlasses(0, { hi: 0.75 });
  // 口（一文字。ただし口角を1ドットだけ上げる＝柔らかいニュートラル）
  P(MU.cx - 11, MU.mouthY, 22, 2, '#8a4a44');
  P(MU.cx - 12, MU.mouthY - 1, 2, 2, '#8a4a44');
  P(MU.cx + 10, MU.mouthY - 1, 2, 2, '#8a4a44');
  P(MU.cx - 11, MU.mouthY + 2, 22, 1, lit(PAL.skin, 0.7));
  scanlines(0, 0, 360, 200, 0.06);
};

/* ── ② 逆立ち腕立て20回の直後 ─────────────────────
   血が上って真っ赤・汗・髪が乱れ・肩が上下する。
   ギャグ寄りだが下品にしない＝口は開けても歯や舌は描かない、
   汗は「一定間隔で落ちる小さな粒」だけにする。 */
ART.face_red = () => {
  muRoom();
  const skin = '#e0714f';                       // 血が上った肌
  // 肩の上下（呼吸。周期0.75秒＝息が上がっている速さ）
  const oy = Math.round(Math.sin(T() * 8.4) * 2);
  muBody({ oy, skin, mess: 1 });
  // 目（見開きすぎない。少し伏せて息を整えている）
  muEyesOpen(oy, 2);
  // 眉を八の字に（力が抜けた直後）
  muBrows(oy, 'worry');
  // メガネがズレて曇っている（この1枚のギャグの本体。傾き＋横ズレ＋白い曇り）
  muGlasses(oy, { tilt: 2, dx: 2, fog: 0.55, hi: 0.25 });
  // ズレたぶんだけ鼻の上に赤い当たり跡（ちゃんと乗っていた証拠）
  P(MU.cx - 4, MU.eyeY + 6 + oy, 3, 2, '#c8402f');
  // 口（すこし開いて息をしている。中は暗い1色のみ）
  P(MU.cx - 8, MU.mouthY - 1 + oy, 16, 6, '#7a3a36');
  P(MU.cx - 8, MU.mouthY - 1 + oy, 16, 1, '#5e2b28');
  // 頬の火照り（斜線3本＝マンガ記号。ドットで太らせない）
  for (let i = 0; i < 3; i++) {
    P(MU.headL + 4 + i * 4, MU.eyeY + 12 + i * 2 + oy, 8, 1, '#c8402f');
    P(MU.headL + MU.headW - 20 + i * 4, MU.eyeY + 12 + i * 2 + oy, 8, 1, '#c8402f');
  }
  // 額と首すじの光沢（汗をかいた肌）
  P(MU.headL + 16, MU.faceT + 10 + oy, 12, 2, lit(skin, 1.35));
  P(MU.headL + 34, MU.faceT + 12 + oy, 6, 2, lit(skin, 1.3));
  /* 汗（3粒。レンズの上は通さない＝こめかみの外側と、レンズより下の頬だけを流す。
     出発点は hash で固定し、T() で落とす＝乱数なしでバラける） */
  const drops = [
    [MU.headL + 1, MU.faceT + 4, 52],                    // 左こめかみ（レンズの左外）
    [MU.headL + MU.headW - 3, MU.eyeY + 18, 26],         // 右頬（レンズより下から）
    [MU.cx + 16, MU.mouthY + 6, 20],                     // あご〜首すじ
  ];
  for (let i = 0; i < drops.length; i++) {
    const [sx, sy0, run] = drops[i];
    const t = (T() * 0.9 + hash(i)) % 1;
    const sy = sy0 + t * run;
    P(sx, sy + oy, 2, 4, PAL.crt);
    D(sx, sy + 1 + oy, PAL.white);
  }
  // 飛んだ汗（頬の外へ1粒。勢いの記号）
  const ft = (T() * 1.4) % 1;
  _c.globalAlpha = 1 - ft;
  P(MU.headL + MU.headW + 2 + ft * 14, MU.eyeY + 6 - ft * 10 + oy, 3, 3, PAL.crt);
  _c.globalAlpha = 1;
  scanlines(0, 0, 360, 200, 0.06);
};

/* ── ③ システマ呼吸 ───────────────────────────────
   目を閉じ、口をすぼめて細く長く吐く。動きは息だけ＝画面がほぼ静止する。
   肩はほんのわずかに下がる（吐ききる＝力が抜ける）。静けさが主役。 */
ART.face_breath = () => {
  muRoom();
  // 吐く4秒／吸う2秒。肩は吐くあいだゆっくり沈む
  const cyc = T() % 6, out = cyc < 4 ? cyc / 4 : 0;
  const oy = Math.round((cyc < 4 ? out : 1 - (cyc - 4) / 2) * 2);
  muBody({ oy });
  muEyesClosed(oy);
  // 眉は水平のまま少しだけ下げる（力みを抜く）
  P(MU.eyeLX, MU.browY + 2 + oy, 16, 2, PAL.hair);
  P(MU.eyeRX, MU.browY + 2 + oy, 16, 2, PAL.hair);
  // メガネ（レンズ越しに閉じた目が見える。ハイライトは最小＝反射を殺して静けさを出す）
  muGlasses(oy, { hi: 0.22 });
  // 口（すぼめる。縦長の小さな穴＋唇の輪郭）
  P(MU.cx - 4, MU.mouthY - 2 + oy, 8, 8, lit(PAL.skin, 0.7));
  P(MU.cx - 2, MU.mouthY + oy, 4, 5, '#7a3a36');
  // 吐いた息（細い筋が前へ流れる。alphaで消えるだけ＝うるさくしない）
  if (cyc < 4) {
    for (let i = 0; i < 6; i++) {
      const t = (out + i * 0.16) % 1;
      const a = (1 - t) * 0.34 * (1 - Math.abs(out - 0.5) * 0.6);
      if (a <= 0.02) continue;
      _c.globalAlpha = a;
      // 口元から右下へゆるく垂れながら伸びる
      P(MU.cx + 4 + t * 96, MU.mouthY + 2 + t * 14 + Math.sin(t * 5 + i) * 2 + oy,
        3 + t * 5, 1, PAL.paper);
      _c.globalAlpha = 1;
    }
    // 息の根元（口のすぐ前だけ濃い）
    _c.globalAlpha = 0.22;
    P(MU.cx + 3, MU.mouthY + 1 + oy, 8, 2, PAL.paper);
    _c.globalAlpha = 1;
  }
  // 部屋を1段暗く落とす（集中している時間だけ、周りが引く）
  _c.globalAlpha = 0.14;
  P(0, 0, 360, 200, PAL.night);
  _c.globalAlpha = 1;
  scanlines(0, 0, 360, 200, 0.06);
};

/* ── ④ E11大正解：書き上げた直後の涙 ──────────────
   ゲーム最大の見せ場。ここだけ手数を増やす。
   泣き顔にしない＝眉も口も通常のまま動かさず、変わるのは目の中の光量だけ。
   涙は左目から一筋、約9秒かけて溜まり→落ち→あごで消える。 */
ART.face_tear = () => {
  muRoom();
  // 背景の淡い光（書き上がった原稿＝ノートPCの画面が明るくなった、の表現）
  glow(176, 88, 170, PAL.crt, 0.16);
  glow(176, 96, 90, PAL.paper, 0.07);
  // 光の輪（頭の後ろ）。帯を積むと明るい背景の上では逆に黒く見えるので、
  // ここだけは glow を重ねて頭の後ろを持ち上げる
  glow(MU.cx, MU.faceT + 6, 78, PAL.crt, 0.22);

  muBody({});
  // 縁光を通常より強く（この1枚だけ、輪郭がはっきり浮く）
  P(MU.headL - 1, MU.faceT + 6, 2, 48, lit(PAL.crt, 0.85));
  P(MU.headL + 1, MU.faceT - 14, 3, 24, lit(PAL.crt, 0.8));

  // 目（開いたまま。瞳を1段明るくして、涙の膜で濡れている状態にする）
  muEyesOpen(0, 0, '#20222c');
  for (const ex of [MU.eyeLX, MU.eyeRX]) {
    // 下まぶたに溜まった光（ここが泣き顔にしないための全て）
    P(ex + 1, MU.eyeY + MU.eyeH - 2, MU.eyeW - 2, 2, lit(PAL.crt, 1.1));
    P(ex + 3, MU.eyeY + MU.eyeH - 1, 6, 1, PAL.white);
    // 瞳の上の反射（画面の光が映り込む）
    D(ex + 9, MU.eyeY + 2, PAL.white);
  }
  // 目のふち（充血させない。うっすら赤を1ドットだけ）
  D(MU.eyeLX - 1, MU.eyeY + 4, '#a05a52');
  D(MU.eyeRX + MU.eyeW, MU.eyeY + 4, '#a05a52');

  /* 涙（左目から一筋だけ。9秒周期。メガネがあるぶん、段取りが1つ増える。
     0〜0.35=レンズの内側にたまる（＝フレームより先に描く）
     0.35〜0.5=フレームの下辺を越える／0.5〜0.85=頬を伝う／0.85〜1=あご先で消える） */
  const t = (T() % 9) / 9;
  const tx = MU.eyeLX + 3;
  const lensB = MU.eyeY - 5 + 15;                 // レンズの下辺（muGlassesと同じ算）

  // ① レンズの内側にたまる（フレームの奥＝ここだけメガネより先に描く）
  if (t < 0.42) {
    const g = Math.min(1, t / 0.35);
    P(tx, MU.eyeY + MU.eyeH - 1, 3, 1 + Math.round(g * 3), lit(PAL.crt, 1.15));
    if (g > 0.6) P(tx, MU.eyeY + MU.eyeH + 2, 2, Math.round(g * 4), lit(PAL.crt, 1.05));
    if (g > 0.8) D(tx + 1, MU.eyeY + MU.eyeH + 3, PAL.white);
  }

  // メガネ（4枚で最強のハイライト。書き上がった画面がレンズに映り込んでいる）
  muGlasses(0, { hi: 1.0 });

  // 眉・口は通常と同じ（真顔のまま＝歪ませない）
  P(MU.cx - 11, MU.mouthY, 22, 2, '#8a4a44');
  P(MU.cx - 12, MU.mouthY - 1, 2, 2, '#8a4a44');
  P(MU.cx + 10, MU.mouthY - 1, 2, 2, '#8a4a44');
  P(MU.cx - 11, MU.mouthY + 2, 22, 1, lit(PAL.skin, 0.7));

  if (t >= 0.35 && t < 0.5) {
    // ② フレームの下辺を越える（レンズの下でふくらんで、いまにも落ちる粒）
    const g = (t - 0.35) / 0.15;
    P(tx, lensB - 1 + g * 3, 3, 3 + g * 2, lit(PAL.crt, 1.2));
    D(tx + 1, lensB, PAL.white);
  } else if (t < 0.85) {
    // ③ 頬を伝う（フレームの外側。輪郭に沿ってわずかに内へ寄る）
    const g = (t - 0.5) / 0.35;
    const y = lensB + 3 + g * 26;
    const x = tx + g * 3;
    P(x, y, 2, 4, lit(PAL.crt, 1.15));
    D(x, y + 1, PAL.white);
    // 通った跡（濡れて光る筋。フレームの下から落ちた先まで）
    _c.globalAlpha = 0.30;
    P(tx, lensB + 2, 2, Math.max(1, y - lensB - 2), lit(PAL.crt, 0.9));
    _c.globalAlpha = 1;
  } else if (t >= 0.85) {
    // ④ あご先で消える（跡だけ薄く残す）
    _c.globalAlpha = 0.9 - (t - 0.85) / 0.15 * 0.9;
    P(tx, lensB + 2, 2, 27, lit(PAL.crt, 0.9));
    _c.globalAlpha = 1;
  }
  scanlines(0, 0, 360, 200, 0.05);
};

/* ── ⑤ セールス中の顔（画面いっぱいのバストアップ）────────────
   ラウンド中はこの3枚のどれかが出る。①〜④とまったく同じ骨格を使うので
   別人にならない。差分は 眉・目・口・レンズの反射 の4点だけ。
   smile … 売上が史実ペースを上回っている
   calm  … 拮抗している（基準）
   worry … ゲームオーバーのペース */
function muFace(mood) {
  const smile = mood === 'smile', worry = mood === 'worry';
  muRoom();
  // 不安なときだけ肩がわずかに落ちる
  const oy = worry ? 2 : 0;
  muBody({ oy, brow: worry ? 'worry' : smile ? 'up' : 'base' });
  // 目（まばたきは①と同じ周期。笑うと少し細くなる）
  const bt = T() % 4.3;
  const blink = bt < 0.09 ? 6 : (bt < 0.16 ? 3 : 0);
  muEyesOpen(oy, smile ? Math.max(blink, 2) : blink);
  // メガネ（好調ほど反射が強い＝表情より先に「調子」が伝わる）
  muGlasses(oy, { hi: smile ? 1.0 : worry ? 0.3 : 0.7 });
  const lipC = '#8a4a44';
  if (smile) {                      // 口角の上がった弧
    P(MU.cx - 10, MU.mouthY, 20, 2, lipC);
    P(MU.cx - 13, MU.mouthY - 2, 3, 2, lipC);
    P(MU.cx + 10, MU.mouthY - 2, 3, 2, lipC);
    P(MU.cx - 15, MU.mouthY - 4, 2, 2, lipC);
    P(MU.cx + 13, MU.mouthY - 4, 2, 2, lipC);
    P(MU.cx - 9, MU.mouthY + 2, 18, 1, lit(PAL.skin, 0.72));
  } else if (worry) {               // への字＋こめかみの冷や汗（3秒に1粒）
    P(MU.cx - 9, MU.mouthY + 2 + oy, 18, 2, lipC);
    P(MU.cx - 12, MU.mouthY + oy, 3, 2, lipC);
    P(MU.cx + 9, MU.mouthY + oy, 3, 2, lipC);
    const sw = (T() * 0.85) % 3;
    if (sw < 1.3) P(MU.headL + MU.headW - 10, MU.faceT + 6 + sw * 22 + oy, 2, 5, lit(PAL.crt, 1.5));
  } else {                          // 一文字（口角を1ドットだけ上げた基準の顔）
    P(MU.cx - 11, MU.mouthY, 22, 2, lipC);
    P(MU.cx - 12, MU.mouthY - 1, 2, 2, lipC);
    P(MU.cx + 10, MU.mouthY - 1, 2, 2, lipC);
    P(MU.cx - 11, MU.mouthY + 2, 22, 1, lit(PAL.skin, 0.7));
  }
  scanlines(0, 0, 360, 200, 0.06);
}
ART.face_smile = () => muFace('smile');
ART.face_calm = () => muFace('calm');
ART.face_worry = () => muFace('worry');
