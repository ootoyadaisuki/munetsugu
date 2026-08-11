'use strict';
/* シーン集4（scenes1.js の書き方・密度に揃える）
   キャンバスは 360×200。使えるもの: PAL / P / D / vgrad / lit / glow / laptop /
   person / face / paper / windowPane / label / labelC / scanlines / T() / hash(i)

   収録:
     ART.server_room    E6「サーバー負荷90%」（AM11:30）
     ART.server_down    同じラックが落ちた直後（E6-B の暗転ギャグ）
     ART.books          幕間 PM4:00「教材はない。あるのは、ボロボロの一冊」
     ART.result_bg      PM6:00 結果発表の背景（人はいない）
     ART.epilogue_sky   エピローグ「あれから17年」
*/

/* ---- server_room / server_down の共通骨格 --------------------------
   2枚は「同じラックの、通電しているときと落ちたとき」でなければ意味がない。
   だから機器の並びもLEDの座席も1本の関数で作り、点灯状態だけ引数で切り替える。
   ここを分けて書くと、見比べたときに別のラックに見えて演出が死ぬ。 */

/* ラック1本ぶんの機器リスト（高さと表情を hash で崩す＝等間隔の反復を避ける）
   戻り値: [{y, h, kind}]  kind: 0=1Uの薄い箱 / 1=ドライブ列 / 2=ファン付きの厚い箱 */
function _rackUnits(seed, top, bottom) {
  const list = [];
  let y = top, i = 0;
  while (y < bottom - 5) {
    const r = hash(seed * 31 + i);
    const h = 5 + Math.floor(hash(seed * 17 + i * 3) * 4) * 3;   // 5 / 8 / 11 / 14
    if (y + h > bottom) break;
    list.push({ y: y, h: h, kind: r < 0.34 ? 0 : (r < 0.72 ? 1 : 2), s: seed * 100 + i });
    y += h + 1;                                                   // 1px の隙間＝ラックレール
    i++;
  }
  return list;
}

/* 回転する冷却ファン（羽根を4本、角度から打つ。止めるときは ang を固定値で渡す） */
function _fanBlades(cx, cy, r, ang, col) {
  for (let k = 0; k < 4; k++) {
    const a = ang + k * Math.PI / 2;
    for (let d = 1; d <= r; d++) D(cx + Math.cos(a) * d, cy + Math.sin(a) * d, col);
  }
}

/* ラック本体。on=true で通電（赤LEDが明滅・ファンが回る）、false で落ちた状態。
   x,y,w,h はキャビネットの外形。seed が同じなら機器配置は完全に一致する。 */
function _rackBody(x, y, w, h, seed, on) {
  // キャビネットの枠（黒に近い鉄。手前側のフチだけ1px明るくして厚みを出す）
  P(x, y, w, h, lit(PAL.night, 1.5));
  P(x, y, w, 2, PAL.steel);
  P(x, y, 2, h, lit(PAL.steel, 0.8));
  P(x + w - 2, y, 2, h, lit(PAL.steel, 0.55));
  P(x, y + h - 3, w, 3, lit(PAL.steel, 0.6));                     // 足元のベース

  const ix = x + 3, iw = w - 6;                                   // 機器の載る内側
  P(ix, y + 3, iw, h - 7, lit(PAL.night, 0.8));                   // ラック内の闇

  const units = _rackUnits(seed, y + 4, y + h - 5);
  for (let u = 0; u < units.length; u++) {
    const m = units[u], my = m.y, mh = m.h;
    // 機器のフロントパネル（明るさを個体差にする＝同じ形の反復に見せない）
    const face = lit(PAL.slate, 0.75 + hash(m.s) * 0.4);
    P(ix, my, iw, mh, face);
    P(ix, my, iw, 1, lit(face, 1.35));                            // 上面のハイライト
    P(ix, my + mh - 1, iw, 1, lit(face, 0.55));                   // 下の影
    // 取っ手（左右）——機器によって有無を変える
    if (hash(m.s + 5) > 0.35) {
      P(ix + 1, my + 1, 2, mh - 2, lit(face, 1.5));
      P(ix + iw - 3, my + 1, 2, mh - 2, lit(face, 1.5));
    }

    if (m.kind === 1) {                                           // ドライブ列（縦スリット）
      const n = 4 + Math.floor(hash(m.s + 2) * 5);
      for (let k = 0; k < n; k++) {
        const dx = ix + 6 + k * Math.floor((iw - 14) / n);
        P(dx, my + 2, 2, mh - 4, lit(PAL.night, 1.9));
        // ドライブのアクセスランプ。落ちていれば当然、1個も点かない
        if (on && ((T() * (1.6 + hash(m.s + k) * 2.4) + hash(m.s * 3 + k)) % 1) < 0.42) {
          D(dx, my + mh - 3, PAL.red);
        }
      }
    } else if (m.kind === 2) {                                    // ファン付きの厚い箱
      const cx = ix + 9 + Math.floor(hash(m.s + 7) * (iw - 26));
      const cy = my + Math.floor(mh / 2);
      const r = Math.min(4, Math.floor(mh / 2) - 1);
      if (r >= 2) {
        P(cx - r - 1, cy - r - 1, r * 2 + 3, r * 2 + 3, lit(PAL.night, 1.2)); // 吸気口の枠
        // 回っていれば角度が進む／落ちていれば同じ角度で固定＝「止まっている」
        _fanBlades(cx, cy, r, on ? T() * 5.5 + hash(m.s) * 6 : hash(m.s) * 6,
                   on ? lit(PAL.ash, 0.75) : lit(PAL.ash, 0.32));
        D(cx, cy, on ? PAL.ash : lit(PAL.ash, 0.4));
      }
      // 通気スリット
      for (let k = 0; k < 3; k++) P(ix + iw - 9, my + 2 + k * 2, 6, 1, lit(PAL.night, 1.6));
    } else {                                                      // 1Uの薄い箱＝LEDの座席
      for (let k = 0; k < 3; k++) P(ix + iw - 12 - k * 4, my + 2, 2, mh - 4, lit(PAL.night, 1.7));
    }

    // ステータスLED（座席の数・位置を hash で崩す。等間隔に並べない）
    const n = 2 + Math.floor(hash(m.s + 11) * 5);
    for (let k = 0; k < n; k++) {
      const lx = ix + 4 + Math.floor(hash(m.s * 7 + k) * (iw - 12));
      const ly = my + 1 + Math.floor(hash(m.s * 13 + k) * Math.max(1, mh - 3));
      if (!on) {
        D(lx, ly, lit(PAL.red, 0.16));                            // 消灯（黒い座席だけ残る）
        continue;
      }
      // 明滅。周期も位相も個体ごとにずらす＝全部が同時に光ると機械に見えない
      const sp = 1.1 + hash(m.s + k * 5) * 3.2;
      const ph = hash(m.s * 5 + k * 3);
      const b = ((T() * sp + ph) % 1) < (0.3 + hash(m.s + k) * 0.4);
      D(lx, ly, b ? PAL.red : lit(PAL.red, 0.3));
      if (b && hash(m.s + k + 1) > 0.8) D(lx + 1, ly, lit(PAL.red, 0.7)); // 強く光る個体
    }
  }
  return units;
}

/* ラックの上から垂れて束ねられたケーブル（両シーン共通。落ちても形は変わらない） */
function _rackCables(x, y, w, on) {
  for (let i = 0; i < 9; i++) {
    const cx = x + 4 + Math.floor(hash(i * 3 + 1) * (w - 8));
    const drop = 10 + Math.floor(hash(i * 7 + 2) * 22);
    const col = [lit(PAL.slate, 0.7), lit(PAL.steel, 0.7), lit(PAL.amber, 0.45)][i % 3];
    for (let d = 0; d < drop; d++) {                              // 少したわませて垂らす
      D(cx + Math.round(Math.sin((d + i * 4) * 0.35) * 1.6), y + d, col);
    }
  }
  P(x + 6, y + 16, w - 12, 3, lit(PAL.night, 1.6));               // 結束バンドの帯
  P(x + 6, y + 16, w - 12, 1, lit(PAL.steel, on ? 0.9 : 0.5));
}

/* ── E6 AM11:30 サーバー負荷90% ──────────────────────
   2009年のサーバーラックを正面から。マシン室は暗く、光っているのは無数の赤LEDだけ。
   負荷メーターは右へ振り切れかけ、針が90%の壁を叩いている。
   「このままだと落ちます！」——絵の側では、まだ落ちていない。 */
ART.server_room = () => {
  // マシン室（床は冷たいグレー、奥は闇）
  P(0, 0, 360, 200, lit(PAL.night, 1.1));
  vgrad(0, 0, 360, 120, PAL.night, lit(PAL.navy, 0.9), 6);
  P(0, 152, 360, 48, lit(PAL.slate, 0.42));                       // フリーアクセス床
  for (let i = 0; i < 7; i++) P(i * 52, 152, 1, 48, lit(PAL.slate, 0.6)); // 床パネルの目地
  P(0, 152, 360, 2, lit(PAL.steel, 0.7));

  // 空調ダクト（天井。緊迫感は「囲まれている」で作る）
  P(0, 0, 360, 10, lit(PAL.navy, 0.8));
  for (let i = 0; i < 12; i++) P(8 + i * 30, 10, 18, 2, lit(PAL.steel, 0.45));

  // ラック3本。中央が主役、左右は奥に引いて暗く（seedを分けて配置を別物にする）
  _rackBody(14, 34, 66, 122, 3, true);
  _rackBody(276, 34, 66, 122, 9, true);
  _c.globalAlpha = 0.45; P(14, 34, 66, 122, PAL.night); P(276, 34, 66, 122, PAL.night); _c.globalAlpha = 1;
  _rackCables(96, 12, 168, true);
  _rackBody(96, 26, 168, 130, 1, true);

  // 負荷メーター（ラック最上段のパネル。針が右端の手前で震える）
  const mx = 108, my = 30;
  P(mx, my, 84, 16, lit(PAL.night, 1.3));
  P(mx, my, 84, 1, lit(PAL.steel, 0.8));
  for (let i = 0; i < 20; i++) {                                  // 目盛りバー（90%まで埋まる）
    const on = i < 18;
    P(mx + 4 + i * 4, my + 4, 3, 8, on ? (i > 13 ? PAL.red : PAL.amber) : lit(PAL.slate, 0.5));
  }
  const jitter = Math.sin(T() * 9) * 1.5 + Math.sin(T() * 3.7) * 1;
  P(mx + 74 + jitter, my + 2, 1, 12, PAL.gold);                   // 針（振り切れ寸前）
  if ((T() * 3) % 1 < 0.5) P(mx + 76, my + 4, 5, 8, PAL.red);     // 赤ゾーンの警告灯

  // 非常灯（天井の回転灯。壁を舐めるように赤が流れる）
  const sw = (Math.sin(T() * 1.6) + 1) / 2;
  glow(40 + sw * 280, 14, 90, PAL.red, 0.10);
  glow(180, 92, 150, PAL.red, 0.13);                              // ラック全体に乗る赤

  scanlines(0, 0, 360, 200, 0.07);
};

/* ── E6-B サーバーが落ちた直後 ──────────────────────
   server_room と同じ構図・同じ seed。違うのは「点いているかどうか」だけ。
   LEDはほぼ全消灯、ファンは同じ角度で止まり、残るのは非常灯の弱い赤。
   ラックの前には何もない暗闇——10分間、売上が止まっている絵。 */
ART.server_down = () => {
  // 同じ部屋を、光源を失った明るさで塗る
  P(0, 0, 360, 200, lit(PAL.night, 0.7));
  vgrad(0, 0, 360, 120, lit(PAL.night, 0.6), lit(PAL.navy, 0.5), 6);
  P(0, 152, 360, 48, lit(PAL.slate, 0.16));
  for (let i = 0; i < 7; i++) P(i * 52, 152, 1, 48, lit(PAL.slate, 0.26));
  P(0, 152, 360, 2, lit(PAL.steel, 0.28));

  P(0, 0, 360, 10, lit(PAL.navy, 0.45));
  for (let i = 0; i < 12; i++) P(8 + i * 30, 10, 18, 2, lit(PAL.steel, 0.2));

  // ラック（seed も座標も server_room と同一。点灯フラグだけ false）
  _rackBody(14, 34, 66, 122, 3, false);
  _rackBody(276, 34, 66, 122, 9, false);
  _c.globalAlpha = 0.55; P(14, 34, 66, 122, PAL.night); P(276, 34, 66, 122, PAL.night); _c.globalAlpha = 1;
  _rackCables(96, 12, 168, false);
  _rackBody(96, 26, 168, 130, 1, false);

  // 負荷メーター（全消灯。針だけ0へ戻って動かない）
  const mx = 108, my = 30;
  P(mx, my, 84, 16, lit(PAL.night, 0.9));
  P(mx, my, 84, 1, lit(PAL.steel, 0.35));
  for (let i = 0; i < 20; i++) P(mx + 4 + i * 4, my + 4, 3, 8, lit(PAL.slate, 0.22));
  P(mx + 4, my + 2, 1, 12, lit(PAL.ash, 0.35));

  // 非常灯だけが生きている（ゆっくり息をする赤。回転灯ではなく、ただの残り火）
  const pulse = 0.06 + (Math.sin(T() * 1.1) + 1) / 2 * 0.07;
  P(178, 4, 6, 4, lit(PAL.red, 0.8));                             // 天井の小さな非常灯
  glow(181, 8, 70, PAL.red, pulse + 0.04);
  glow(180, 100, 130, PAL.red, pulse);

  // ラックの前の暗闇（手前を落として「何も見えない」を作る）
  for (let i = 0; i < 22; i++) {
    _c.globalAlpha = i / 22 * 0.55;
    P(0, 178 - i * 2, 360, 2, '#000');
    _c.globalAlpha = 1;
  }
  scanlines(0, 0, 360, 200, 0.10);
};

/* ── 幕間 PM4:00 教材 ──────────────────────
   「教材はない。あるのは、ボロボロになった一冊の小説。」
   机を真上から見下ろした構図。斜め投影をやめたので、見えるのは
     ・表紙（長方形）
     ・背表紙（左端の帯。丸背なので少しふくらむ）
     ・小口（右端からのぞくページの束）
   の3つだけ。左＝一度も開かれていない新品（青い背）、右＝読み込まれた小説（赤い背）。
   ※実在の書名は描かない。題字は読めないダミーの罫だけ。 */

/* 真上から見た一冊。左端が背表紙、右端が小口。worn で状態だけが変わる */
function _bookTop(x, y, w, h, cover, spine, opts) {
  opts = opts || {};
  const worn = !!opts.worn;
  const SP = 13;                                   // 背表紙の幅
  const corner = (r) => {                          // 使い込んだ本は四隅が丸い
    if (!worn) return 0;
    const d = Math.min(r, h - 1 - r);
    return d === 0 ? 3 : d === 1 ? 2 : d === 2 ? 1 : 0;
  };

  // 机に落ちる影（真上からの光なので、四方へ薄く均等に出る）
  _c.globalAlpha = 0.34;
  P(x + 3, y + 4, w + 2, h, '#000');
  _c.globalAlpha = 1;

  /* --- 小口（右端。ページの束が表紙の下からのぞく） --- */
  for (let r = 0; r < h; r++) {
    const ins = corner(r);
    if (ins > 3) continue;
    // 使い込んだ本は膨らんで波打つ。新品は工場出荷のまま真っ平ら
    const d = worn ? 5 + Math.round(Math.sin(r * 0.3) * 1.6 + Math.sin(r * 0.08 + 1.1) * 1.2) : 4;
    for (let i = 0; i < d; i++) {
      const c = i === d - 1 ? lit(opts.pageB || PAL.paper, 0.62)
        : (i % 2 ? (opts.pageB || lit(PAL.paper, 0.84)) : (opts.pageA || PAL.paper));
      D(x + w + i - ins, y + r, c);
    }
  }

  /* --- 表紙 --- */
  for (let r = 0; r < h; r++) {
    const ins = corner(r);
    const k = worn ? 0.86 + (r / h) * 0.22 : 1;    // 日焼け（手前ほど褪せる）
    P(x + ins, y + r, w - ins, 1, lit(cover, k));
  }
  P(x + SP, y, w - SP, 1, lit(cover, 1.3));        // 天のエッジ
  P(x + SP, y + h - 1, w - SP, 1, lit(cover, 0.7));

  /* --- 背表紙（左端の帯。丸背なので中央がいちばん光る） --- */
  for (let r = 0; r < h; r++) {
    const ins = corner(r);
    if (ins > 3) continue;
    for (let c = 0; c < SP; c++) {
      const t = c / (SP - 1);
      const k = c === 0 ? 0.55 : 0.72 + Math.sin(t * Math.PI) * 0.75;   // 丸みの陰影
      D(x + c + Math.max(0, ins - c), y + r, lit(spine, k));
    }
    D(x - 1 + ins, y + r, lit(PAL.night, 1.0));    // 机との境（背が立ち上がる）
  }
  P(x, y, SP, 1, lit(spine, 0.5));                 // 背の天地
  P(x, y + h - 1, SP, 1, lit(spine, 0.5));
  // 背バンド（天と地の帯）＝一目で「本の背」と分かる signature
  for (const r of [5, 6, h - 7, h - 6]) {
    if (r > 0 && r < h) P(x + 1, y + r, SP - 2, 1, lit(spine, worn ? 0.5 : 1.75));
  }
  // 背文字（読めないダミーの罫。縦に並ぶ）
  for (let i = 0; i < 5; i++) {
    P(x + 5, y + 22 + i * 11, 3, 6 + Math.round(hash(i + 1) * 3),
      worn ? lit(PAL.paper, 0.42) : lit(PAL.gold, 0.95));
  }
  return { SP: SP };
}

/* ── 幕間 PM4:00 教材（真上から）────────────────────── */
ART.books = () => {
  /* 机。本の背（青・赤）と明度で殴り合わないよう、暗く冷たい木にする */
  const DESK = '#2e2a33';
  P(0, 0, 360, 200, DESK);
  P(0, 0, 360, 26, lit(DESK, 1.28));               // 奥ほど明るい（真上の光）
  P(0, 174, 360, 26, lit(DESK, 0.78));
  for (let i = 0; i < 16; i++) {                   // 木目（長さと間隔を崩す）
    P(hash(i + 2) * 40, 8 + i * 12 + Math.floor(hash(i) * 5),
      120 + hash(i + 5) * 220, 1, lit(DESK, 1.14));
  }
  for (let i = 0; i < 5; i++) {                    // 傷
    P(20 + hash(i * 3) * 300, 16 + hash(i * 7) * 170, 8 + hash(i) * 26, 1, lit(DESK, 0.72));
  }
  glow(180, 100, 190, PAL.paper, 0.10);            // 真上からの静かな光

  /* --- 左：新品の教材（青い背。帯が掛かったまま＝一度も開かれていない） --- */
  const AX = 34, AY = 34, AW = 118, AH = 132;
  _bookTop(AX, AY, AW, AH, PAL.slate, '#3f6fd8', { pageA: PAL.white, pageB: lit(PAL.white, 0.84) });
  const cx = AX + 13 + 6;                          // 背表紙のぶんだけ内側から
  for (let i = 0; i < 3; i++) {                    // 箔押しの飾り罫（文字は描かない）
    P(cx, AY + 26 + i * 9, [72, 50, 60][i], 2, i === 0 ? PAL.gold : lit(PAL.gold, 0.7));
  }
  P(cx - 4, AY + 14, AW - 26, 1, lit(PAL.gold, 0.5));       // 罫の囲み
  P(cx - 4, AY + AH - 16, AW - 26, 1, lit(PAL.gold, 0.5));
  P(AX + 13, AY + AH - 46, AW - 13, 14, PAL.red);           // 帯（未開封の証拠）
  P(AX + 13, AY + AH - 46, AW - 13, 1, lit(PAL.red, 1.35));
  for (let i = 0; i < 4; i++) P(cx + i * 22, AY + AH - 42, 14, 3, lit(PAL.paper, 0.92));
  for (let r = 0; r < AH; r++) D(AX + 74, AY + r, lit(PAL.white, 0.5));   // シュリンクの継ぎ目
  for (let i = 0; i < 26; i++) {                            // PP加工のてかり（斜め）
    _c.globalAlpha = 0.08;
    P(AX + 30 + i, AY + 96 - i, 14, 2, PAL.white);
    _c.globalAlpha = 1;
  }
  for (let i = 0; i < 8; i++) D(AX + 20 + hash(i + 2) * 92, AY + 3 + hash(i) * 3, lit(PAL.ash, 0.5)); // ほこり

  /* --- 右：ボロボロの小説（赤い背。角が丸く、付箋と栞紐がはみ出す） --- */
  const BX = 206, BY = 40, BW = 108, BH = 120;
  const WORN = lit(PAL.red, 0.66);
  _bookTop(BX, BY, BW, BH, WORN, '#d24a40',
    { worn: true, pageA: lit(PAL.paper, 0.88), pageB: lit(PAL.paper, 0.64) });
  // 題字＝褪せて半分消えた罫（実在の書名は描かない）
  for (let i = 0; i < 2; i++) P(BX + 26, BY + 30 + i * 10, [46, 30][i], 2, lit(PAL.paper, 0.42));
  P(BX + 26, BY + BH - 30, 26, 1, lit(PAL.paper, 0.3));
  // 表紙の擦れ（触るところが白っぽく毛羽立つ）
  for (let i = 0; i < 30; i++) {
    _c.globalAlpha = 0.16 + hash(i) * 0.2;
    P(BX + 18 + hash(i * 7) * (BW - 26), BY + 6 + hash(i * 3 + 5) * (BH - 12),
      1 + hash(i + 2) * 3, 1, lit(PAL.paper, 0.8));
    _c.globalAlpha = 1;
  }
  // 手垢（いちばん触る右下が黒ずむ）
  for (let i = 0; i < 16; i++) {
    _c.globalAlpha = 0.10 + hash(i) * 0.12;
    P(BX + BW - 34 + hash(i * 9) * 26, BY + BH - 40 + hash(i * 5) * 32, 5, 2, '#2a1c14');
    _c.globalAlpha = 1;
  }
  // 付箋（小口から右へはみ出す。幅も長さも位置もバラバラ）
  for (let i = 0; i < 5; i++) {
    const r = 12 + Math.floor(hash(i * 13 + 2) * (BH - 26));
    const tl = 6 + Math.floor(hash(i * 4) * 7);
    const tc = [PAL.gold, PAL.crt, '#d98aa0', lit(PAL.paper, 0.95)][i % 4];
    P(BX + BW + 3, r + BY, tl, 4, tc);
    P(BX + BW + 3 + tl - 1, r + BY, 1, 4, lit(tc, 0.6));
  }
  // ドッグイヤー（小口の下寄りで、ページの角が折れている）
  for (let i = 0; i < 6; i++) P(BX + BW - 1 + i, BY + BH - 18 + i, 5 - i, 1, lit(PAL.paper, 0.95));
  // 栞紐（背の下から垂れて、机の上でくたっと曲がる）
  for (let i = 0; i < 20; i++) {
    D(BX + 6 + Math.round(Math.sin(i * 0.42) * 4), BY + BH + i, i > 14 ? lit(PAL.red, 0.75) : PAL.red);
  }

  _c.globalAlpha = 0.10; P(0, 0, 360, 40, '#0a1a2e'); _c.globalAlpha = 1;
  scanlines(0, 0, 360, 200, 0.05);
};


/* ── PM6:00 結果発表の背景 ──────────────────────
   18:00。12時間が終わったオフィス。窓の外は夕暮れが終わって藍に変わる直前。
   机には空のマグ、閉じたノートPC、散らかった紙。人はいない——主役は数字なので絵は引く。
   画面の下半分は暗く落とし、上に載る文字が確実に読めるようにしてある。 */
ART.result_bg = () => {
  // 室内（照明は落ちている。窓からの残光だけ）
  P(0, 0, 360, 200, lit(PAL.navy, 0.6));
  vgrad(0, 0, 360, 116, lit(PAL.navy, 0.75), lit(PAL.navy, 0.45), 6);

  // 窓（夕暮れの最後。橙が薄まりきって藍が降りてくる境目）
  windowPane(24, 20, 128, 76, '#243250', '#7a5a5e');
  vgrad(26, 74, 124, 20, '#8a5a48', '#c07a44', 5);                // 地平すれすれの残照
  for (let i = 0; i < 11; i++) {                                  // 遠くのビル（灯りは疎ら）
    const bx = 26 + i * 12, bh = 10 + hash(i + 2) * 22;
    P(bx, 94 - bh, 10, bh, '#161d33');
    if (hash(i + 6) > 0.5) D(bx + 3, 94 - bh + 4, PAL.amber);
    if (hash(i + 13) > 0.7) D(bx + 7, 94 - bh + 9, lit(PAL.amber, 0.8));
  }
  P(24, 20, 128, 1, lit(PAL.dusk, 0.5));                          // サッシに乗る残光

  // 右の窓（もう一枚。奥行きを作りつつ、右上を暗くして文字の逃げ場にする）
  windowPane(238, 26, 84, 62, '#1b2742', '#5c4a5c');
  _c.globalAlpha = 0.45; P(236, 24, 88, 66, PAL.night); _c.globalAlpha = 1;

  // 壁と机
  P(0, 116, 360, 4, lit(PAL.slate, 0.7));
  P(0, 120, 360, 80, lit(PAL.navy, 0.5));
  P(40, 128, 268, 7, PAL.slate);
  P(40, 135, 268, 4, lit(PAL.slate, 0.55));
  P(56, 139, 6, 30, lit(PAL.slate, 0.4));
  P(288, 139, 6, 30, lit(PAL.slate, 0.4));

  // 閉じたノートPC（開いていない＝仕事が終わった合図。液晶の光もない）
  P(96, 118, 74, 6, PAL.slate);
  P(96, 118, 74, 2, lit(PAL.slate, 1.4));
  P(96, 124, 74, 4, lit(PAL.slate, 0.55));
  P(112, 121, 42, 1, lit(PAL.steel, 0.9));                        // 天板の合わせ目
  D(166, 121, lit(PAL.red, 0.5));                                 // 落ちたスリープランプ

  // 空のマグ（湯気は上げない。空だから）
  P(186, 108, 13, 12, PAL.paper);
  P(199, 111, 4, 5, PAL.paper);
  P(187, 108, 11, 2, lit(PAL.ash, 0.9));                          // 内側の縁＝空
  P(188, 110, 9, 2, '#3a2a20');                                   // 底に残った跡
  _c.globalAlpha = 0.3; P(186, 120, 18, 2, '#000'); _c.globalAlpha = 1;

  // 散らかった紙（角度も重なりも hash で崩す。整列させない）
  paper(56, 112, 26, 9, PAL.paper, 2);
  paper(64, 116, 22, 8, lit(PAL.paper, 0.86), 2);
  paper(216, 114, 30, 10, lit(PAL.paper, 0.92), 3);
  paper(236, 110, 20, 8, lit(PAL.paper, 0.8), 2);
  for (let i = 0; i < 5; i++) {                                   // 床に落ちた紙
    const px = 30 + hash(i * 5 + 1) * 290, py = 146 + hash(i * 3) * 34;
    paper(px, py, 14 + hash(i + 8) * 12, 6, lit(PAL.paper, 0.5 + hash(i) * 0.2), 1);
  }
  // 転がったペン
  P(150, 124, 16, 2, PAL.gold);
  P(164, 124, 3, 2, lit(PAL.gold, 0.6));

  // 残光のなじませ（窓側だけ暖かく）
  glow(88, 70, 130, PAL.dusk, 0.14);

  // 下半分を落とす（この上に金額が載る。文字の可読性を絵より優先する）
  for (let i = 0; i < 26; i++) {
    _c.globalAlpha = Math.min(0.62, i / 26 * 0.72);
    P(0, 108 + i * 4, 360, 4, '#05070d');
    _c.globalAlpha = 1;
  }
  scanlines(0, 0, 360, 200, 0.06);
};

/* ── エピローグ「あれから17年」 ──────────────────────
   2026年。2009年の暗い室内から、外へ出た絵。旅先の朝、広い水平線、高い空。
   人物は小さく、後ろ姿でひとりだけ。顔は描かない（誰でもよく、あなたでもいい）。
   雲と鳥がゆっくり動く。「要は、楽しいことだけやる。」の解放感。
   ただし上に白文字が載るので、空の上半分は青を残して白飛びさせない。 */
ART.epilogue_sky = () => {
  // 空（上は深い青＝文字の下地／下は水平線へ向かって明るく抜ける）
  vgrad(0, 0, 360, 128, '#3f6ea8', '#b9d2d6', 10);
  // 高いところに薄い巻雲（横に伸ばして「高い空」を出す）
  for (let i = 0; i < 6; i++) {
    const cy = 12 + hash(i * 3) * 34;
    const cw = 40 + hash(i + 2) * 70;
    const cx = ((hash(i * 7) * 360 + T() * (2 + hash(i) * 3)) % 420) - 40;
    _c.globalAlpha = 0.16 + hash(i + 5) * 0.14;
    P(cx, cy, cw, 2, PAL.white);
    P(cx + 8, cy + 3, cw - 20, 1, PAL.white);
    _c.globalAlpha = 1;
  }
  // 積雲（ゆっくり右へ流れる。塊を3つ重ねて綿にする）
  for (let i = 0; i < 4; i++) {
    const cx = ((hash(i * 11 + 3) * 380 + T() * (3.5 + hash(i) * 2.5)) % 440) - 60;
    const cy = 46 + hash(i * 5) * 30;
    const s = 0.7 + hash(i + 9) * 0.8;
    _c.globalAlpha = 0.72;
    P(cx, cy, 34 * s, 8 * s, '#e6eef0');
    P(cx + 8 * s, cy - 5 * s, 18 * s, 8 * s, '#eef4f4');
    P(cx + 20 * s, cy - 2 * s, 14 * s, 6 * s, '#e0e9ec');
    _c.globalAlpha = 0.5;
    P(cx + 2 * s, cy + 7 * s, 28 * s, 2 * s, '#a8bfc8');          // 雲の底の影
    _c.globalAlpha = 1;
  }
  // 鳥（2羽。ゆっくり横切りながら、羽ばたきで上下する）
  for (let i = 0; i < 2; i++) {
    const t = (T() * 0.05 + i * 0.42) % 1;
    const bx = 380 - t * 420, by = 34 + i * 13 + Math.sin(T() * 1.4 + i) * 2;
    const flap = Math.sin(T() * 3 + i * 2) > 0 ? 1 : 0;
    P(bx, by, 2, 1, lit(PAL.navy, 1.1));
    P(bx - 2, by - flap, 2, 1, lit(PAL.navy, 1.1));
    P(bx + 2, by - flap, 2, 1, lit(PAL.navy, 1.1));
  }

  // 水平線（ここが画面でいちばん明るいが、白ではなく淡い水色で止める）
  P(0, 126, 360, 2, '#d6e6e4');
  // 海（沖は明るく、手前ほど濃い）
  vgrad(0, 128, 360, 34, '#8fb6bd', '#3f6f80', 7);
  // 光の道（太陽の反射。手前ほど幅を広げる＝一点透視）
  for (let i = 0; i < 17; i++) {
    const y = 128 + i * 2;
    const w = 4 + i * 2;
    const on = ((T() * 1.2 + hash(i) * 2) % 1) < 0.75;
    _c.globalAlpha = on ? 0.30 - i * 0.012 : 0.16;
    P(238 - w / 2 + Math.sin(T() * 0.7 + i * 0.6) * 2, y, w, 2, '#f2f6e8');
    _c.globalAlpha = 1;
  }
  // 波（横線を hash でずらして打つ。等間隔にしない）
  for (let i = 0; i < 22; i++) {
    const wy = 130 + hash(i * 3 + 1) * 30;
    const wx = hash(i * 7) * 340;
    const ww = 6 + hash(i + 4) * 16;
    _c.globalAlpha = 0.35;
    P(wx + Math.sin(T() * 0.9 + i) * 2, wy, ww, 1, '#cfe3e2');
    _c.globalAlpha = 1;
  }

  // 砂浜（手前。白飛びを避けるため、白ではなく温かいベージュで置く）
  vgrad(0, 162, 360, 38, '#c9b791', '#9b8a68', 5);
  P(0, 162, 360, 1, '#ded0ac');
  for (let i = 0; i < 26; i++) {                                  // 砂の粒と貝殻
    D(hash(i * 5) * 360, 166 + hash(i * 3 + 2) * 32, hash(i) > 0.6 ? '#e2d6b6' : '#8a7a5c');
  }
  // 波打ち際（砂へ薄く上がってくる）
  for (let i = 0; i < 3; i++) {
    _c.globalAlpha = 0.5 - i * 0.13;
    P(0, 162 + i * 2, 360, 2, '#dfeceb');
    _c.globalAlpha = 1;
  }

  // 人物（小さく・後ろ姿・ひとり。顔は描かない。遠くを見て立っている）
  const px = 156, py = 138;
  person(px, py, 1.5, 'stand', '#33506b');
  P(px + 4, py, 6, 5, PAL.hair);                                  // 後頭部（＝振り向いていない）
  P(px + 4, py + 4, 6, 2, lit(PAL.hair, 1.3));                    // 襟足
  P(px + 1, py + 7, 12, 1, lit('#33506b', 1.3));                  // 肩のライン（丸く見せる）
  _c.globalAlpha = 0.28;                                          // 砂に落ちる影（長い＝朝）
  P(px - 12, py + 26, 26, 3, '#6b5c40');
  _c.globalAlpha = 1;
  // 足元の濡れた砂の照り返し
  _c.globalAlpha = 0.2; P(px + 1, py + 25, 12, 2, '#e6eeea'); _c.globalAlpha = 1;

  // 全体をほんの少しだけ落とす（明るい絵のまま、白文字が乗る余地を作る）
  _c.globalAlpha = 0.10; P(0, 0, 360, 90, '#0a1a2e'); _c.globalAlpha = 1;
  scanlines(0, 0, 360, 200, 0.04);
};

/* ── 小ネタK3「差し入れ」の払い ──────────────────────
   注文を最後まで正確に伝えたときだけ出す絵。
   届いたチャイティーラテ（テイクアウトの紙カップ）と、自分で入れるアガベシロップ。
   ——「なんでもいい」と言わなかった人の机の上。
   ※実在のロゴ・店名は描かない。スリーブは無地。 */
ART.chai = () => {
  // 部屋と机（books と同じ机＝同じ部屋にいることが分かる）
  P(0, 0, 360, 200, lit(PAL.navy, 0.55));
  vgrad(0, 0, 360, 70, lit(PAL.night, 1.1), lit(PAL.navy, 0.85), 6);
  P(0, 70, 360, 4, lit(PAL.amber, 1.2));
  P(0, 74, 360, 126, PAL.amber);
  P(0, 86, 360, 114, lit(PAL.amber, 0.72));
  for (let i = 0; i < 11; i++) {
    P(6 + i * 33, 92 + Math.floor(hash(i + 3) * 96), 24 + hash(i + 6) * 28, 1, lit(PAL.amber, 0.56));
  }
  glow(168, 118, 150, PAL.amber, 0.20);

  /* --- 紙カップ（下すぼまりの台形。上ほど広い） --- */
  const CX = 168, TOP = 74, BOT = 168, WT = 25, WB = 18;   // 半幅
  _c.globalAlpha = 0.32;                                    // 接地の影
  P(CX - WB - 3, BOT + 1, WB * 2 + 12, 3, '#241606');
  _c.globalAlpha = 1;
  for (let y = TOP; y <= BOT; y++) {
    const t = (y - TOP) / (BOT - TOP);
    const w = Math.round(WT + (WB - WT) * t);
    P(CX - w, y, w * 2, 1, lit(PAL.paper, 0.94));
    P(CX - w, y, 3, 1, lit(PAL.paper, 1.06));               // 左＝光の当たる側
    P(CX + w - 4, y, 4, 1, lit(PAL.paper, 0.74));           // 右＝回り込みの陰
  }
  // 蓋（カップより一回り広い。縁が立ち上がり、飲み口のタブが手前に出る）
  P(CX - WT - 3, TOP - 7, (WT + 3) * 2, 7, lit(PAL.paper, 0.76));
  P(CX - WT - 3, TOP - 7, (WT + 3) * 2, 2, lit(PAL.paper, 0.92));
  P(CX - WT - 3, TOP - 1, (WT + 3) * 2, 1, lit(PAL.paper, 0.6));
  P(CX + 4, TOP - 10, 13, 4, lit(PAL.paper, 0.84));         // 飲み口のタブ
  P(CX + 4, TOP - 10, 13, 1, lit(PAL.paper, 1.0));

  /* --- スリーブ（無地の厚紙。段ボールの目を縦に入れる） --- */
  const SY = 106, SH2 = 30;
  for (let y = SY; y < SY + SH2; y++) {
    const t = (y - TOP) / (BOT - TOP);
    const w = Math.round(WT + (WB - WT) * t) + 1;
    P(CX - w, y, w * 2, 1, '#9a6634');
    P(CX - w, y, 3, 1, lit('#9a6634', 1.22));
    P(CX + w - 4, y, 4, 1, lit('#9a6634', 0.72));
  }
  for (let i = 0; i < 13; i++) {                            // 段の目
    const x = CX - 20 + i * 3;
    P(x, SY + 2, 1, SH2 - 4, lit('#9a6634', 1.12));
  }
  P(CX - WT, SY, WT * 2 + 1, 1, lit('#9a6634', 1.4));       // 上端の光
  P(CX - WB - 1, SY + SH2 - 1, WB * 2 + 3, 1, lit('#9a6634', 0.62));

  /* --- 湯気（静止画なので、上へ細くほどける形で固定する） --- */
  for (let s = 0; s < 3; s++) {
    const bx = CX - 12 + s * 12;
    for (let i = 0; i < 22; i++) {
      _c.globalAlpha = 0.30 * (1 - i / 22);
      D(bx + Math.round(Math.sin(i * 0.34 + s * 1.7) * (2 + i * 0.12)), TOP - 12 - i, PAL.white);
      _c.globalAlpha = 1;
    }
  }

  /* --- アガベシロップの小瓶（後から自分で入れる） --- */
  const AX2 = 246, AY2 = 118, AW2 = 22, AH2 = 46;
  _c.globalAlpha = 0.30;
  P(AX2 - 2, AY2 + AH2, AW2 + 8, 3, '#241606');
  _c.globalAlpha = 1;
  P(AX2, AY2 + 6, AW2, AH2 - 6, lit(PAL.amber, 0.62));      // 瓶
  P(AX2 + 2, AY2 + 16, AW2 - 4, AH2 - 20, lit('#8a5a1c', 1.1));  // 中身（琥珀の液）
  P(AX2, AY2 + 6, 3, AH2 - 6, lit(PAL.amber, 1.05));        // 左の光
  P(AX2 + AW2 - 3, AY2 + 8, 3, AH2 - 8, lit(PAL.amber, 0.4));
  P(AX2 + 6, AY2, 10, 8, lit(PAL.gold, 0.62));              // 首とキャップ
  P(AX2 + 5, AY2 - 4, 12, 5, PAL.gold);
  P(AX2 + 5, AY2 - 4, 12, 1, lit(PAL.gold, 1.35));
  P(AX2 + 3, AY2 + 24, AW2 - 6, 10, lit(PAL.paper, 0.9));   // ラベル（文字は描かない）
  P(AX2 + 5, AY2 + 27, AW2 - 12, 1, lit(PAL.amber, 0.7));
  P(AX2 + 5, AY2 + 30, AW2 - 16, 1, lit(PAL.amber, 0.55));

  /* --- スタッフのメモ（注文を書き取った紙。字は読めない罫で示す） --- */
  const MX = 52, MY = 132;
  _c.globalAlpha = 0.26;
  P(MX + 3, MY + 4, 62, 34, '#241606');
  _c.globalAlpha = 1;
  P(MX, MY, 62, 34, PAL.paper);
  P(MX, MY, 62, 1, lit(PAL.paper, 1.1));
  P(MX, MY + 33, 62, 1, lit(PAL.paper, 0.72));
  for (let i = 0; i < 5; i++) {
    const w = 22 + Math.round(hash(i * 7 + 2) * 30);
    P(MX + 5, MY + 6 + i * 6, w, 1, lit(PAL.navy, 2.2));
  }
  P(MX + 5, MY + 6, 12, 1, lit(PAL.red, 1.1));              // 1行目だけ赤で囲った＝復唱した箇所

  _c.globalAlpha = 0.10; P(0, 0, 360, 60, '#0a1a2e'); _c.globalAlpha = 1;
  scanlines(0, 0, 360, 200, 0.05);
};
