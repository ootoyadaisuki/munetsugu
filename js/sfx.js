'use strict';
/* ============ 効果音（『村上宗嗣の12時間』）============
   絵と同じで、音のファイルは1つも持たない。全部その場で合成する（＝配信サイズが増えない）。
   狙いは2009年のPCの前にいる感じ。派手なゲーム音にはしない。
     ピッ        … 選択肢を押した
     ピピピ      … 文字が出ている間
     チャリン    … 売上が跳ねた
     ピロン      … 正解（村上の哲学どおり）
     ボフッ      … 地雷
     キラン      … NEW MEMORY が開いた
     ズドン→シュー… サーバーが落ちた
     ドン！      … 《本物のコピー》のスタンプ
     ——         … 涙（音を減らす。ここは静けさが主役）
   ブラウザは客が触る前に音を出させてくれないので、最初の操作で目を覚ます。 */
const Sfx = {
  KEY: 'munetsugu_sfx',
  ctx: null,
  on: true,
  last: {},                                   // 種類ごとの直近再生時刻（連打で団子にならないように）
  pulse: null,                                // ラストカウントの鼓動（鳴りっぱなし系）

  init() {
    this.on = localStorage.getItem(this.KEY) !== 'off';
    const wake = () => this.ready();
    for (const ev of ['pointerdown', 'keydown']) document.addEventListener(ev, wake, { capture: true });
    // 押せるものは、どこを押しても「ピッ」。個々の場所に書いて回ると必ず付け忘れが出る
    document.addEventListener('pointerdown', e => {
      if (e.target.closest && e.target.closest('button, .choice')) this.play('ui');
    }, { capture: true });
  },
  toggle() {
    this.on = !this.on;
    localStorage.setItem(this.KEY, this.on ? 'on' : 'off');
    if (this.on) this.play('ui'); else this.rush(false);
    return this.on;
  },
  ready() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  },

  /* 単音。type=波形／f0→f1=周波数の動き／dur=長さ／vol=音量／delay=遅らせる秒 */
  tone(type, f0, f1, dur, vol, delay) {
    const c = this.ctx; if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);      // 立ち上がりだけ速く
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },
  /* ざらついた一撃（打撃の芯）。低いところだけ残す */
  noise(dur, vol, delay, cut) {
    const c = this.ctx; if (!c) return;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = vol;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut || 900;
    src.connect(lp); lp.connect(g); g.connect(c.destination);
    src.start(c.currentTime + (delay || 0));
  },
  /* 金属質な一撃（硬貨・スタンプ）。高いところだけ残す */
  clank(dur, vol, freq, delay) {
    const c = this.ctx; if (!c) return;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const src = c.createBufferSource(); src.buffer = buf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 1.6;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(bp); bp.connect(g); g.connect(c.destination);
    src.start(c.currentTime + (delay || 0));
  },

  play(kind) {
    if (!this.on) return;
    const c = this.ready(); if (!c) return;
    const now = c.currentTime;
    const gap = { ui: 0.04, talk: 0.03, cash: 0.07, roll: 0.03, tick: 0.05 }[kind] || 0.12;
    if (this.last[kind] && now - this.last[kind] < gap) return;
    this.last[kind] = now;
    switch (kind) {
      case 'ui':                                            // ピッ
        this.tone('square', 1180, 1180, 0.05, 0.06);
        break;
      case 'talk':                                          // ピ（続いて「ピピピ」になる）
        this.tone('square', 1500, 1500, 0.016, 0.018);
        break;
      case 'cash':                                          // チャリン（売上が跳ねた）
        this.tone('triangle', 1568, 1568, 0.14, 0.07);
        this.tone('triangle', 2093, 2093, 0.34, 0.05, 0.05);
        break;
      case 'roll':                                          // カウンターが回っている間の粒
        this.tone('square', 900 + Math.random() * 120, 0, 0.02, 0.014);
        break;
      /* ピロン（正解）。上がって、もう一段上がる＝「分かってる」の気持ちよさ。
         派手なファンファーレにはしない（本人にとっては当たり前の判断なので） */
      case 'correct':
        this.tone('triangle', 1046, 1046, 0.09, 0.07);
        this.tone('triangle', 1568, 1568, 0.22, 0.06, 0.07);
        break;
      /* ボフッ（地雷）。責める音にしない＝短く鈍いだけ。失敗は罰ではない、という設計に合わせる */
      case 'miss':
        this.tone('square', 300, 150, 0.16, 0.055);
        this.noise(0.10, 0.045, 0, 600);
        break;
      /* キラン（NEW MEMORY）。古い記憶が開く音＝高いところで2音、間をあける */
      case 'memory':
        this.tone('sine', 1318, 1318, 0.20, 0.06);
        this.tone('sine', 1760, 1760, 0.34, 0.05, 0.10);
        this.tone('sine', 2637, 2637, 0.50, 0.03, 0.20);
        break;
      /* ズドン→シュー（サーバーが落ちた）。電源が切れて、ファンが惰性で止まっていく */
      case 'down':
        this.noise(0.20, 0.10, 0, 400);
        this.tone('square', 220, 40, 0.55, 0.09);
        this.tone('sawtooth', 180, 30, 1.10, 0.05, 0.10);
        break;
      /* ドン！（《本物のコピー》のスタンプ）。紙に判子が落ちる＝低い打撃＋紙の乾いた響き */
      case 'stamp':
        this.noise(0.14, 0.16, 0, 500);
        this.tone('square', 140, 60, 0.26, 0.10);
        this.clank(0.09, 0.10, 2200, 0.02);
        break;
      /* 涙。ここは音を「減らす」のが演出＝細く高い1音だけ、長く残す */
      case 'tear':
        this.tone('sine', 1975, 1975, 1.60, 0.035);
        this.tone('sine', 2637, 2637, 2.20, 0.018, 0.30);
        break;
      /* 解除。売上のチャリンの正反対＝乾いて、引いていく音。本作で一番効く音。
         高い音が下がりながら細る＋紙が破れるような短いノイズ */
      case 'unsub':
        this.tone('square', 880, 220, 0.30, 0.06);
        this.tone('square', 660, 165, 0.34, 0.045, 0.06);
        this.noise(0.12, 0.05, 0, 1400);
        break;
      case 'tick':                                          // 時計
        this.tone('square', 1800, 1800, 0.02, 0.03);
        break;
      /* 史実超え。ここだけは派手にする（17年ぶりに自分を倒した瞬間） */
      case 'win':
        [523, 659, 784, 1046].forEach((f, i) =>
          this.tone('triangle', f, f, 0.28, 0.075, i * 0.10));
        this.tone('triangle', 1568, 1568, 0.80, 0.07, 0.42);
        this.clank(0.12, 0.09, 3200, 0.42);
        break;
      /* 届かなかった。落として終わらない＝最後にひとつ上げる（負けても面白い設計に合わせる） */
      case 'lose':
        this.tone('triangle', 784, 784, 0.22, 0.06);
        this.tone('triangle', 587, 587, 0.26, 0.055, 0.16);
        this.tone('triangle', 698, 698, 0.55, 0.05, 0.36);
        break;
      case 'rank':                                          // リザルトのランクが1行ずつ出る
        this.tone('square', 1318, 1318, 0.05, 0.045);
        this.clank(0.05, 0.05, 2600, 0.01);
        break;
      /* GAME CLEAR。最後の「よっ」「メンソーレ」に被せる一本締めの気分 */
      case 'clear':
        [523, 784, 1046, 1318, 1568].forEach((f, i) =>
          this.tone('triangle', f, f, 0.30, 0.07, i * 0.09));
        this.clank(0.16, 0.10, 2800, 0.45);
        break;
    }
  },

  /* ラストカウントの鼓動。単発ではなく鳴りっぱなしなので別あつかい。
     18:00へ向かって心拍が速くなる＝低い音を一定間隔で打ち続ける */
  rush(on, bpm) {
    const c = on ? this.ready() : this.ctx;
    if (!c) return;
    if (this.pulse) { clearInterval(this.pulse); this.pulse = null; }
    if (!on || !this.on) return;
    const beat = () => { this.tone('sine', 90, 60, 0.16, 0.09); this.tone('sine', 180, 120, 0.08, 0.03); };
    beat();
    this.pulse = setInterval(beat, 60000 / (bpm || 96));
  },
};
