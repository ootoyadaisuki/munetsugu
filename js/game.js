// 『村上宗嗣の12時間』 game.js v5 — 12通のメルマガで継承を売る
// 進行・経済・演出・セーブ。数値とテキストは data.js が正。

/* ================= 経済（純関数・nodeテスト共用） =================
   乱数ゼロ。同じ選択列は必ず同じ結果になる。
   chosen = { rounds: [{b:'A', s:'A'}, ...], koneta: {K1:'B', K2:'B', K3:'B'} } */
const Econ = {
  /* いまのメンタルで「地雷（💀）」になっている型。疲れるほど増える */
  killTones(mental) {
    let out = [];
    for (const [th, tones] of CONF.MENTAL.killAt) if (mental < th) out = tones;
    return out;
  },
  isKill(opt, mental) {
    const t = opt.hiddenTone ? 'hype' : opt.tone;
    return this.killTones(mental).includes(t);
  },
  pairClass(round, bIdx, sIdx) {
    const b = round.bodies[bIdx], s = round.subjects[sIdx];
    const bt = b.hiddenTone ? 'hype' : b.tone;   // R10-D: honestの顔をしたhype
    const st = s.tone;
    // R6/R10の特殊組（台本の明示指定が汎用規則より優先）
    if (round.special === 'r6_combo' && s.t === 'A') {
      if (b.t === 'A') return 'super';
      if (b.t === 'B' || b.t === 'D') return 'tsuri';
    }
    if (round.special === 'r10_trap' && s.t === 'A' && b.t === 'D') return 'tsuri';
    if (st === bt) return 'match';
    if (st === 'honest' && (bt === 'hype' || bt === 'ego')) return 'tsuri';
    if (st === 'hype' && (bt === 'honest' || bt === 'flat')) return 'katasuka';
    return 'neutral';
  },
  simulate(chosen) {
    const C = CONF;
    let list = C.LIST0, buyers = 0, upsells = 0, unsub = 0, sales = 0;
    let trust = 0, rikai = 0, expect = 0, stim = 0, kizukai = 0;
    let calm = 0, tsuriCnt = 0, egoCnt = 0, badKoneta = 0, mental = C.MENTAL.start;
    let honestCnt = 0, sekkyoCnt = 0, sawTrueEnd = false, kizPt = 0;
    const log = [];
    const konetaAfter = {}; KONETA.forEach(k => konetaAfter[k.after] = k);

    ROUNDS.forEach((round, r) => {
      const pick = chosen.rounds[r];
      if (!pick) return;
      const bIdx = 'ABCD'.indexOf(pick.b), sIdx = 'ABCD'.indexOf(pick.s);
      const b = round.bodies[bIdx], s = round.subjects[sIdx];
      let cls = this.pairClass(round, bIdx, sIdx);
      const pair = cls === 'super' ? { conv: 1.40, unsub: 0.55 }
        : cls === 'tsuri' ? C.PAIR.tsuri
        : C.PAIR.katasuka === undefined ? C.PAIR.neutral
        : C.PAIR[cls === 'match' ? 'match' : cls === 'katasuka' ? 'katasuka' : 'neutral'];
      if (cls === 'tsuri') tsuriCnt++;
      if (b.tone === 'ego') egoCnt++;
      // 村上宗嗣度の材料: 正直に書いた通数／上から言った通数（件名も数える）
      if (b.tone === 'honest' && !b.hiddenTone) { honestCnt++; kizPt += C.KIZ_PT_HONEST; }
      if (b.tone === 'ego' || s.tone === 'ego') sekkyoCnt++;

      // 開封率
      let open = C.SUBJ_OPEN[s.t] * (1 + stim * C.STIM_OPEN) * (1 - r * C.FATIGUE);
      open = Math.min(0.9, Math.max(0.05, open));
      // 成約率（成長は逓減系＝後半に爆発しない）
      let conv = C.BODY_CONV[b.t] * pair.conv
        * (1 + rikai / 220) * (1 + trust / 260) * (1 + expect / 240);
      // ラウンド特殊
      if (round.special === 'r11_recall') {
        if (b.t === 'A') conv *= (rikai >= C.R11_RIKAI ? 1.50 : 0.90);
        if (b.t === 'B') conv *= 0.55;          // 価格の不安は既に解けている＝空振り
        if (b.t === 'C') conv *= 1.15;
      }
      // 👑: 直前の小ネタで正解したときだけ出る選択肢。選べば成約率が上がる
      const cr = round.crown;
      if (cr && chosen.koneta && chosen.koneta[cr.from] === cr.pick
        && (cr.slot === 'bodies' ? b.t : s.t) === cr.item.t) conv *= C.CROWN_CONV;
      let trueEnd = false;
      if (round.special === 'r12_true_end' && b.t === 'D') {
        if (pick.s === 'D' && rikai >= C.R12_RIKAI) { conv *= 2.05; trueEnd = true; sawTrueEnd = true; }
        else conv *= 0.85;
      }
      // 解除率
      let uRate = C.UNSUB_BASE[b.t] * pair.unsub * (1 + stim * C.STIM_UNSUB);
      if (trueEnd) uRate *= 0.5;

      const listBefore = list;
      const dBuy = Math.round(list * open * conv);
      let dUnsub = Math.round(list * uRate);
      dUnsub = Math.min(dUnsub, Math.max(0, list - dBuy));   // リストは0未満にならない
      list = list - dBuy - dUnsub;
      /* アップセル: この通で買った人のうち、¥2,000,000へ進む割合。
         いま積み上がっている信用と顧客理解でしか動かない＝煽って買わせても進まない。
         （trust/rikai はこの通の増分を足す前の値＝ここまでに積んだぶん） */
      let upRate = C.UP.base + trust * C.UP.trust + rikai * C.UP.rikai;
      if (cls === 'tsuri') upRate += C.UP.tsuri;
      if (b.tone === 'hype' || b.hiddenTone) upRate += C.UP.hype;
      if (b.tone === 'ego') upRate += C.UP.ego;
      // 疲れているほど、200万円の決断は後押しできない
      upRate *= C.MENTAL.upMin + (1 - C.MENTAL.upMin) * (mental / 100);
      upRate = Math.max(C.UP.min, Math.min(C.UP.max, upRate));
      const dUp = Math.round(dBuy * upRate);
      buyers += dBuy; upsells += dUp; unsub += dUnsub;
      sales += dBuy * C.UNIT + dUp * C.UPSELL;

      // 信用・顧客理解の増減（本文の型＋件名の型＋整合で決まる）
      const fx = C.FX[b.t];
      const dTrust = fx.trust + (s.tone === 'ego' ? C.EGO_TRUST : 0) + (cls === 'tsuri' ? -8 : 0);
      const dRikai = fx.rikai + (cls === 'super' ? 3 : 0);
      trust += dTrust;
      rikai += dRikai;
      expect += fx.expect + (cls === 'tsuri' ? -10 : 0);
      let dStim = fx.stim + C.SUBJ_STIM[s.t];
      if (dStim > 0 && calm > 0) { calm--; dStim = 0; }      // システマ: 刺激上昇を1回打ち消す
      stim = Math.max(0, stim + dStim);

      /* メンタル。正直に書けば少し戻り、煽り・上から・釣りで削れる。
         解除がまとまって出た通も刺さる。💀を選んでいれば追加で削れる */
      const M = C.MENTAL;
      const killed = this.isKill(b, mental) || this.isKill(s, mental);
      let dM = -M.drain + (M.tone[b.tone] || 0);
      if (cls === 'tsuri') dM += M.tsuri;
      if (dUnsub > listBefore * M.burnAt) dM += M.burn;
      if (killed) dM += M.kill;
      const mentalBefore = mental;
      mental = Math.max(0, Math.min(100, mental + dM));

      log.push({ id: round.id, cls, open, conv, dBuy, dUp, upRate, dUnsub, list, sales, trueEnd,
        mental, mentalBefore, dM, dTrust, dRikai, killed, bType: b.t, sType: s.t });

      // ラウンド後の小ネタ
      const k = konetaAfter[round.id];
      if (k && chosen.koneta && chosen.koneta[k.id]) {
        const c1 = k.choices.find(c => c.key === chosen.koneta[k.id]);
        const good = c1.good;
        // メンタルの増減は選択ごとに持つ（未指定なら正解/不正解の既定値）
        mental = Math.max(0, Math.min(100, mental + (c1.mental != null ? c1.mental
          : good ? C.MENTAL.konetaGood : C.MENTAL.konetaBad)));
        kizPt += c1.kizPt || 0;
        // 続きの小さな選択（あるものだけ）
        const c2 = k.then && chosen.koneta[k.id + '_2']
          ? k.then.choices.find(c => c.key === chosen.koneta[k.id + '_2']) : null;
        if (c2) {
          kizPt += c2.kizPt || 0;
          mental = Math.max(0, Math.min(100, mental + (c2.mental != null ? c2.mental
            : c2.good ? C.MENTAL.konetaThen : -C.MENTAL.konetaThen)));
        }
        if (k.effect === 'calm') {
          if (good) { kizukai++; calm++; } else stim += 0.05;
          if (c2 && c2.good) kizukai++;              // 返信した＝相手を放置しない
        }
        if (k.effect === 'kizukai') { if (good) kizukai++; else badKoneta++; }
        if (k.effect === 'ise') {
          if (good) { kizukai++; rikai += 8; } else { stim += 0.10; badKoneta++; }
        }
        if (k.effect === 'shuchu') {
          if (good) { calm++; expect += 8; } else stim += 0.06;   // 集中＝刺激を1回打ち消す
        }
        if (k.effect === 'gyaku' && good) { calm++; expect += 4; }
      }
    });

    // 顧客満足（焼いたリストの割合と信用から）
    const satisfy = Math.max(0, Math.min(100,
      Math.round(100 - (unsub / C.LIST0) * 180 + Math.min(10, trust / 8))));
    const win = sales > C.HISTORIC;
    // 総合ランク: 表（史実超え）と裏（リストを焼かない）の両立
    let rank;
    if (win && unsub <= C.RANK_S.unsub && satisfy >= C.RANK_S.satisfy) rank = 'S';
    else if (win && unsub <= C.RANK_A.unsub) rank = 'A';
    else if (win) rank = 'B';
    else if (sales >= 450000000) rank = 'C';
    else rank = 'D';
    /* 村上宗嗣度: 減点法ではなく積み上げ。「村上宗嗣ならこう書いた」への一致率。
       100点は簡単には出ない。売上が出ていても、やり方が違えば伸びない。 */
    const M = C.MUNE;
    let munedo = 0;
    munedo += honestCnt * M.honest;                        // 正直に書いた通数（12通ぶん）
    munedo += Math.min(M.rikaiCap, Math.max(0, rikai) * M.rikai);   // 顧客理解
    munedo += Math.min(M.trustCap, Math.max(0, trust) * M.trust);   // 思いやり
    munedo += kizukai * M.kizukai;                          // 気遣い（小ネタ）
    if (sawTrueEnd) munedo += M.trueEnd;                    // 買わなかった人への最後の一通
    munedo -= tsuriCnt * M.tsuri;                           // 釣り
    munedo -= sekkyoCnt * M.sekkyo;                         // 上から言った
    munedo -= badKoneta * M.badKoneta;
    munedo -= Math.min(M.burnCap, unsub / (C.LIST0 * M.burnUnit));  // 焼いたリスト
    munedo = Math.max(0, Math.min(100, Math.round(munedo)));
    return { sales, buyers, upsells, unsub, list, mental, trust, rikai, expect, stim, kizukai, kizPt, satisfy,
      win, rank, munedo, tsuriCnt, egoCnt, honestCnt, sekkyoCnt, badKoneta, trueEnd: sawTrueEnd, log };
  },
};

if (typeof module !== 'undefined') { module.exports.Econ = Econ; }
if (typeof document === 'undefined') { /* nodeテスト時はUI部を読まない */ } else {

/* ================= UI ================= */
const $ = s => document.querySelector(s);
// 自動テスト: ?autotest[&policy=worst|hype] タイマー非依存で全編走行
const FAST = location.search.includes('autotest');
const POLICY = location.search.includes('policy=worst') ? 'worst'
  : location.search.includes('policy=hype') ? 'hype' : 'best';
const wait = ms => FAST ? Promise.resolve() : new Promise(r => setTimeout(r, ms));
const SAVE_KEY = 'munetsugu_save_v5';

// 進行: opening → keisho → R1..R12（小ネタはラウンド直後に挟む）→ result → ranks → ending
const FLOW = ['opening', 'keisho'];
ROUNDS.forEach(r => { FLOW.push(r.id); const k = KONETA.find(x => x.after === r.id); if (k) FLOW.push(k.id); });
FLOW.push('result', 'verdict', 'ranks', 'ending');

let S = load() || freshState();
function freshState(meta) {
  return { beat: 0, rounds: [], koneta: {}, pending: null,
    best: meta ? meta.best : null, clears: meta ? meta.clears : 0 };
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }
function chosen() { return { rounds: S.rounds, koneta: S.koneta }; }

/* ---- 絵 ---- */
let artKey = null, artRaf = null;
function art(key) {
  const wrap = $('#artwrap');
  if (!key || typeof ART === 'undefined' || typeof ART[key] !== 'function') {
    artKey = null; wrap.style.display = 'none';
    if (artRaf) { cancelAnimationFrame(artRaf); artRaf = null; }
    return;
  }
  const same = artKey === key;
  artKey = key; wrap.style.display = 'block';
  if (same || artRaf) return;
  const ctx = $('#art').getContext('2d');
  const loop = () => {
    artRaf = requestAnimationFrame(loop);
    if (!artKey) return;
    useCtx(ctx); ctx.clearRect(0, 0, 360, 200);
    try { ART[artKey](ctx); } catch (e) {}
  };
  loop();
}
/* 史実ペースの目安。王道（全A×A）の累計カーブを史実総額に正規化したもの。
   上回っていれば笑い、大きく下回れば不安な顔になる */
const PACE = (() => {
  const kon = {}; KONETA.forEach(k => kon[k.id] = k.choices.find(c => c.good).key);
  const ref = Econ.simulate({ rounds: ROUNDS.map(() => ({ b: 'A', s: 'A' })), koneta: kon });
  return ref.log.map(l => l.sales * CONF.HISTORIC / ref.sales);
})();
/* 顔はメンタルで決まる。売上ペースは「圧勝」の判定にだけ使う。
   ＝リストを焼いて売上だけ出ていても、顔は曇る */
function moodKey() {
  const done = S.rounds.filter(Boolean).length;
  if (!done) return 'face_calm';
  const m = HUD.mental, pace = HUD.sales / Math.max(1, PACE[done - 1]);
  if (m >= 85 && pace >= 1.0) return 'face_joy';
  if (m >= 70) return 'face_smile';
  if (m >= 50) return 'face_calm';
  if (m >= 30) return 'face_worry';
  if (m >= 12) return 'face_pale';
  return 'face_cry';
}
const BEAT_ART = { opening: 'face_normal', keisho: 'lp_page',
  K2: 'phone_flip', K3: 'letter_note', K5: 'phone_flip', K8: 'books',
  result: 'result_bg', verdict: 'result_bg', ranks: 'result_bg', ending: 'epilogue_sky' };
/* セールス中は部屋を出さない。売上のペースで変わる顔だけを見せる */
function beatArt(beat) { return BEAT_ART[beat] || moodKey(); }
/* 絵の時刻を進める。ラウンド＝1時間なので、9:00→20:00と移り、
   小ネタは直前のラウンドの時刻を引き継ぐ */
function syncArtHour(beat) {
  const round = ROUNDS.find(r => r.id === beat);
  if (round) return setArtHour(parseInt(round.clock, 10));
  const k = KONETA.find(x => x.id === beat);
  if (k) {
    const prev = ROUNDS.find(r => r.id === k.after);
    if (prev) return setArtHour(parseInt(prev.clock, 10));
  }
  if (['result', 'verdict', 'ranks'].includes(beat)) setArtHour(18);
  if (['opening', 'keisho'].includes(beat)) setArtHour(6);   // まだ朝5時55分
}

/* ---- HUD ---- */
const stage = () => $('#stage');
const choicesEl = () => $('#choices');
function fmtYen(n) { return '¥' + Math.round(n).toLocaleString('ja-JP'); }
/* HUD用: 1億2345万6789円 形式（ぱっと見で桁が分かる） */
function fmtYenKanji(n) {
  n = Math.max(0, Math.round(n));
  const oku = Math.floor(n / 100000000), man = Math.floor((n % 100000000) / 10000), en = n % 10000;
  let out = '';
  if (oku > 0) out += oku.toLocaleString('ja-JP') + '億';
  if (man > 0) out += man + '万';
  if (en > 0 || out === '') out += en;
  return out + '円';
}
function fmtNum(n) { return Math.round(n).toLocaleString('ja-JP'); }
/* 時刻ではなく残り時間を出す。セールス終了は18:00（史実と同じ12時間） */
function remainLabel(clock) {
  const left = 18 - parseInt(clock, 10);
  return left > 0 ? `セールス終了まで、あと${left}時間` : 'セールス終了';
}
let HUD = { sales: 0, buyers: 0, upsells: 0, list: CONF.LIST0, unsub: 0,
  mental: CONF.MENTAL.start, trust: 0, rikai: 0 };
let atTitle = false;      // メニューから戻ってきたタイトル表示中（セーブは消さない）
function paintHud(clock) {
  const beat = FLOW[S.beat];
  const inGame = !atTitle && !['opening', 'keisho', 'verdict', 'ranks', 'ending'].includes(beat);
  $('#hud').style.display = inGame ? '' : 'none';
  $('#timebar').style.display = inGame ? '' : 'none';
  $('#menu-btn').style.display = inGame ? '' : 'none';
  if (!inGame) return;
  if (artKey && artKey.startsWith('face_') && artKey !== 'face_normal') art(moodKey());
  if (clock) {
    const cEl = $('#hud-clock');
    cEl.textContent = remainLabel(clock);
    cEl.classList.toggle('urgent', 18 - parseInt(clock, 10) <= 3);
  }
  $('#hud-sales').textContent = fmtYenKanji(HUD.sales);
  const remain = CONF.HISTORIC - HUD.sales;
  const rEl = $('#hud-remain');
  rEl.textContent = remain > 0 ? `史実まで、あと ${fmtYenKanji(remain)}` : `史実超え +${fmtYenKanji(-remain)}`;
  rEl.classList.toggle('gold', remain <= 20000000);
  $('#hud-buyers').textContent = `フロント ${fmtNum(HUD.buyers)}本`;
  $('#hud-upsell').textContent = `アップセル ${fmtNum(HUD.upsells)}本`;
  $('#hud-list').textContent = `${fmtNum(HUD.list)}人`;
  // 見込み客ゲージ（体力）。買われたぶんも解除されたぶんも削れる
  const cap = CONF.LIST0;
  $('#gauge-fill').style.width = Math.max(0, Math.min(100, HUD.list / cap * 100)) + '%';
  // 緑が残りのメンタル。削れたぶんは見込み客ゲージと同じく赤で残る
  const pct = (v, max) => Math.max(0, Math.min(100, v / max * 100)) + '%';
  $('#mental-fill').style.width = pct(HUD.mental, 100);
  $('#trust-fill').style.width = pct(HUD.trust, CONF.TRUST_MAX);
  $('#rikai-fill').style.width = pct(HUD.rikai, CONF.RIKAI_MAX);
}
function syncHudTo(roundIdx) {   // roundIdx ラウンドまで適用済みの状態にHUDを合わせる
  const sim = Econ.simulate({ rounds: S.rounds.slice(0, roundIdx), koneta: S.koneta });
  HUD = { sales: sim.sales, buyers: sim.buyers, upsells: sim.upsells, list: sim.list,
    unsub: sim.unsub, mental: roundIdx ? sim.mental : CONF.MENTAL.start,
    trust: sim.trust, rikai: sim.rikai };
}
let tweenRaf = null;
function tween(from, to, dur, onStep) {
  return new Promise(res => {
    if (FAST || from === to) { onStep(to); return res(); }
    const t0 = performance.now();
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      onStep(from + (to - from) * e);
      if (p < 1) tweenRaf = requestAnimationFrame(step); else res();
    };
    tweenRaf = requestAnimationFrame(step);
  });
}

/* ---- タイプライター＋タップ送り ---- */
let typing = false, skipType = false;
function showLines(lines, opts = {}) {
  return new Promise(res => {
    stage().innerHTML = '';
    choicesEl().innerHTML = '';
    const box = document.createElement('div');
    box.className = 'textbox' + (opts.cls ? ' ' + opts.cls : '');
    stage().appendChild(box);
    if (FAST) {
      for (const line of lines) {
        const p = document.createElement('div');
        p.className = 'tline' + (String(line).startsWith('※') ? ' tag' : '');
        p.textContent = line || ' ';
        box.appendChild(p);
      }
      return Promise.resolve().then(res);
    }
    let i = 0;
    typing = true; skipType = false;
    const nextLine = () => {
      if (i >= lines.length) {
        typing = false;
        if (opts.noTap) return res();
        tapToContinue(res);
        return;
      }
      const line = lines[i++];
      const p = document.createElement('div');
      p.className = 'tline' + (String(line).startsWith('※') ? ' tag' : '');
      box.appendChild(p);
      typeText(p, String(line), () => setTimeout(nextLine, line === '' ? 40 : 110));
    };
    nextLine();
  });
}
function typeText(el, text, done) {
  let j = 0;
  const tick = () => {
    if (skipType) { el.textContent = text; return done(); }
    el.textContent = text.slice(0, ++j);
    if (j % 3 === 0) Sfx.play('talk');
    if (j < text.length) setTimeout(tick, 20); else done();
  };
  if (text === '') { el.innerHTML = '&nbsp;'; return done(); }
  tick();
}
function tapToContinue(res) {
  if (FAST) return Promise.resolve().then(res);
  const hint = document.createElement('div');
  hint.className = 'taphint'; hint.textContent = '▼';
  stage().appendChild(hint);
  const h = () => { document.removeEventListener('pointerdown', h); hint.remove(); res(); };
  setTimeout(() => document.addEventListener('pointerdown', h), 120);
}
document.addEventListener('pointerdown', () => { if (typing) skipType = true; });

/* ---- 選択肢（表示順シャッフル） ---- */
let seed = 20090928;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function shuffled(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/* 直前のタップ（送り）がそのまま選択肢を押してしまう事故を防ぐ。
   pointerdown で画面が切り替わり、指を離した pointerup で click が飛ぶため */
function guardTaps() {
  const box = choicesEl();
  box.classList.add('guard');
  setTimeout(() => box.classList.remove('guard'), 350);
}
const REDO = { redo: true };
function pickChoice(items, label, toText, opts = {}) {
  return new Promise(res => {
    if (FAST) {
      let want = POLICY === 'best' ? 'A' : POLICY === 'hype' ? 'B' : 'D';
      // 真エンドはautotestのbestで踏む（R12はD×D）
      const isR12 = ROUNDS[11].bodies === items || ROUNDS[11].subjects === items;
      if (POLICY === 'best' && isR12) want = 'D';
      const it = items.find(x => (x.t || x.key) === want) || items[0];
      console.log('[autotest]', label, (it.t || it.key));
      return Promise.resolve().then(() => res(it));
    }
    choicesEl().innerHTML = '';
    if (label) {
      const lab = document.createElement('div');
      lab.className = 'choice-label'; lab.textContent = label;
      choicesEl().appendChild(lab);
    }
    shuffled(items).forEach(it => {
      const b = document.createElement('button');
      // 👑＝小ネタで正解すると出る／💀＝いまのメンタルでは特に刺さる
      const kill = !it.crown && Econ.isKill(it, HUD.mental);
      b.className = 'choice' + (it.crown ? ' crown' : kill ? ' kill' : '');
      b.textContent = (it.crown ? '👑 ' : kill ? '💀 ' : '') + toText(it);
      b.onclick = () => { choicesEl().innerHTML = ''; res(it); };
      choicesEl().appendChild(b);
    });
    if (opts.redo) {
      const b = document.createElement('button');
      b.className = 'choice redo';
      b.textContent = opts.redo;
      b.onclick = () => { choicesEl().innerHTML = ''; res(REDO); };
      choicesEl().appendChild(b);
    }
    guardTaps();
  });
}

/* ================= ビート実装 ================= */
async function runBeat() {
  save();
  const beat = FLOW[S.beat];
  syncArtHour(beat);
  art(beatArt(beat));
  paintHud();
  const round = ROUNDS.find(r => r.id === beat);
  if (round) return runRound(round);
  const koneta = KONETA.find(k => k.id === beat);
  if (koneta) return runKoneta(koneta);
  switch (beat) {
    case 'opening': return runOpening();
    case 'keisho': return runKeisho();
    case 'result': return runResult();
    case 'verdict': return runVerdict();
    case 'ranks': return runRanks();
    case 'ending': return runEnding();
  }
}
function next() { S.beat++; S.pending = null; save(); runBeat(); }

async function runOpening() { return showTitle(); }

/* タイトル。途中まで進んでいれば「つづきから」が出る。
   メニューから呼ばれたときもセーブは消さない＝いつでも続きに戻れる */
async function showTitle() {
  const O = TEXTS.opening;
  atTitle = true;
  setArtHour(6); art('face_normal'); paintHud();
  stage().innerHTML = `<div class="title-wrap">
    <div class="game-title">${O.title}</div>
    <div class="game-sub">${O.sub}</div></div>`;
  choicesEl().innerHTML = '';
  const canContinue = S.beat > 1 && FLOW[S.beat];
  const pick = await new Promise(res => {
    if (FAST) return Promise.resolve().then(() => res('new'));
    const mk = (label, act) => {
      const b = document.createElement('button');
      b.className = 'choice next-btn';
      b.textContent = label;
      b.onclick = () => res(act);
      choicesEl().appendChild(b);
    };
    if (canContinue) mk(O.btnCont, 'cont');
    mk(O.btnNew, 'new');
    guardTaps();
  });
  atTitle = false;
  choicesEl().innerHTML = '';
  if (pick === 'new') {
    const meta = { best: S.best, clears: S.clears };
    S = freshState(meta); S.beat = FLOW.indexOf('keisho'); save();
  }
  runBeat();
}

/* 右上の☰。いまはトップに戻るだけ。セーブは残るので、つづきからで戻れる */
function openMenu() {
  if (document.querySelector('.menu-pop')) return;
  const O = TEXTS.opening;
  const pop = document.createElement('div');
  pop.className = 'menu-pop';
  pop.innerHTML = `<button class="choice" data-a="top">${O.menuTop}</button>
    <button class="choice" data-a="close">${O.menuClose}</button>`;
  document.querySelector('#app').appendChild(pop);
  pop.onclick = e => {
    const a = e.target.dataset && e.target.dataset.a;
    if (!a) return;
    pop.remove();
    Sfx.play('ui');
    if (a === 'top') { save(); showTitle(); }
  };
}

/* 継承の説明。1ページずつ「次へ」ボタンで送る（誤タップで飛ばさないため） */
async function runKeisho() {
  for (const page of TEXTS.opening.keisho) {
    await showLines(page, { cls: 'dim', noTap: true });
    if (FAST) continue;
    await new Promise(res => {
      choicesEl().innerHTML = '';
      const b = document.createElement('button');
      b.className = 'choice next-btn';
      b.textContent = TEXTS.opening.next;
      b.onclick = () => { choicesEl().innerHTML = ''; Sfx.play('ui'); res(); };
      choicesEl().appendChild(b);
      guardTaps();
    });
  }
  next();
}

function composeMail(idx, subjText, withBody) {
  // メルマガ作成画面。件名選択前は件名行に、選択後は本文の書き出し位置に
  // カーソルが点滅する（＝ここから先を、選択肢が書く）
  const mail = document.createElement('div');
  mail.className = 'mail';
  const subjRow = subjText
    ? `<div class="mail-subj">件名: ${subjText}</div>`
    : `<div class="mail-subj">件名: <span class="cursor">▎</span></div>`;
  const bodyRow = withBody
    ? `<div class="mail-text"><span class="cursor">▎</span></div>`
    : '';
  mail.innerHTML = `<div class="mail-bar">${TEXTS.send.compose} — 第${idx + 1}通</div>
    <div class="mail-body">${subjRow}${bodyRow}</div>`;
  return mail;
}

/* 直前の小ネタで正解していたら、その回の選択肢を1つだけ👑に差し替える。
   件名側か本文側かは round.crown.slot が持つ */
function withCrown(round, slot) {
  const cr = round.crown;
  if (!cr || cr.slot !== slot || S.koneta[cr.from] !== cr.pick) return round[slot];
  return round[slot].map(x => (x.t === cr.item.t ? cr.item : x));
}

async function runRound(round) {
  const idx = ROUNDS.indexOf(round);
  syncHudTo(idx); paintHud(round.clock);
  // 復帰: このラウンドが選択済みなら結果表示から
  if (S.rounds[idx]) return showSendResult(round, idx);

  // 1. 読者からの質問（独立ページ。無いラウンドは状況ナレーション）
  if (round.question) {
    await showLines([`【第${idx + 1}通】 ${round.clock}`, '', '読者から質問が届いた。', '',
      `「${round.question}」`]);
  } else {
    await showLines([`【第${idx + 1}通】 ${round.clock}`, '', ...round.situation]);
  }
  // 2〜3. メルマガ作成＋件名 → 本文。本文の画面から件名へ戻れる
  let subj, body;
  for (;;) {
    stage().innerHTML = ''; choicesEl().innerHTML = '';
    stage().appendChild(composeMail(idx, null, false));
    subj = await pickChoice(withCrown(round, 'subjects'), '件名を選ぶ', s => `「${s.text}」`);
    stage().innerHTML = ''; stage().appendChild(composeMail(idx, subj.text, true));
    body = await pickChoice(withCrown(round, 'bodies'), null, b => b.text,
      { redo: '← 件名を選び直す' });
    if (body !== REDO) break;
    Sfx.play('ui');
  }

  S.rounds[idx] = { b: body.t, s: subj.t };
  S.pending = { round: round.id }; save();       // コミット（結果表示から再開）
  showSendResult(round, idx);
}

async function showSendResult(round, idx) {
  const simBefore = Econ.simulate({ rounds: S.rounds.slice(0, idx), koneta: S.koneta });
  const simAfter = Econ.simulate({ rounds: S.rounds.slice(0, idx + 1), koneta: S.koneta });
  const step = simAfter.log[simAfter.log.length - 1];
  const pick = S.rounds[idx];

  // 送信演出
  stage().innerHTML = `<div class="send-wrap">
    <div class="send-subject">「${round.subjects['ABCD'.indexOf(pick.s)].text}」</div>
    <div class="send-state">送信中……</div>
    <div class="send-open"></div><div class="send-buy"></div><div class="send-upsell"></div>
    <div class="send-unsub"></div><div class="send-mental"></div>
    <div class="send-sales"></div></div>`;
  choicesEl().innerHTML = '';
  Sfx.play('ui');
  await wait(700);
  // 開封率
  stage().querySelector('.send-state').textContent = '送信完了';
  const openEl = stage().querySelector('.send-open');
  await tween(0, step.open * 100, 900, v => { openEl.textContent = `開封率 ${v.toFixed(1)}%`; });
  Sfx.play('correct');
  await wait(300);
  const buyEl = stage().querySelector('.send-buy');
  await tween(0, step.dBuy, 700, v => { buyEl.textContent = `フロント +${fmtNum(v)}本`; });
  HUD.buyers = simAfter.buyers; paintHud();
  // アップセル: 買った人のうち何人が¥2,000,000へ進んだか（信用がなければ0人）
  await wait(500);
  const upEl = stage().querySelector('.send-upsell');
  if (step.dUp > 0) {
    Sfx.play('rank');
    await tween(0, step.dUp, 800, v => { upEl.textContent = `アップセル +${fmtNum(v)}本`; });
  } else {
    upEl.innerHTML = `アップセル 0本<span class="up-note">（誰も進まなかった）</span>`;
    Sfx.play('miss');
  }
  HUD.upsells = simAfter.upsells; paintHud();
  await wait(step.dUnsub > 0 ? 800 : 200);
  // 少し遅れて解除（画面を赤くする）
  const gauge = $('#gauge-list');
  if (step.dUnsub > 0) {
    Sfx.play('unsub');
    document.body.classList.add('flash-red');
    setTimeout(() => document.body.classList.remove('flash-red'), FAST ? 0 : 700);
    const unEl = stage().querySelector('.send-unsub');
    gauge.classList.add('draining');
    HUD.unsub = simAfter.unsub;
    // 解除の数字と見込み客ゲージを同時に走らせる＝減っているのが目で分かる
    await Promise.all([
      tween(0, step.dUnsub, 800, v => { unEl.textContent = `メルマガ解除 −${fmtNum(v)}人`; }),
      tween(simBefore.list, simAfter.list, 800, v => { HUD.list = v; paintHud(); }),
    ]);
    gauge.classList.remove('draining');
  }
  HUD.list = simAfter.list; HUD.unsub = simAfter.unsub;
  // メンタル・信用・顧客理解の増減を1行にまとめて出す
  const dM = step.mental - step.mentalBefore;
  const rows = [['メンタル', dM, 'g-mental'], ['信用', step.dTrust, 'g-trust'],
    ['顧客理解', step.dRikai, 'g-rikai']].filter(x => Math.round(x[1]) !== 0);
  if (rows.length) {
    const mf = $('#mental-fill');
    mf.style.outline = `1px solid var(--${rows[0][1] < 0 ? 'red' : 'green'})`;
    Sfx.play(rows[0][1] < 0 ? 'miss' : 'correct');
    stage().querySelector('.send-mental').appendChild(statTag(rows));
    const t0 = { m: HUD.mental, t: HUD.trust, r: HUD.rikai };
    await tween(0, 1, 700, t => {
      HUD.mental = t0.m + dM * t;
      HUD.trust = t0.t + step.dTrust * t;
      HUD.rikai = t0.r + step.dRikai * t;
      paintHud();
    });
    setTimeout(() => { mf.style.outline = ''; }, FAST ? 0 : 500);
  }
  HUD.mental = step.mental;
  HUD.trust = simAfter.trust; HUD.rikai = simAfter.rikai; paintHud();
  // 今回の売上（解除の下。1通ぶんの成果をここで締める）
  const dSales = simAfter.sales - simBefore.sales;
  const salesEl = stage().querySelector('.send-sales');
  await wait(300);
  Sfx.play('rank');
  await tween(0, dSales, 900, v => { salesEl.textContent = `今回の売上 ${fmtYenKanji(v)}`; });
  // そのあとで総売上に積み上がる（HUDのカウンターが猛烈に回る）
  await wait(450);
  Sfx.play('cash');
  await tween(simBefore.sales, simAfter.sales, 1500, v => { HUD.sales = v; paintHud(); });
  await wait(400);
  await new Promise(r => tapToContinue(r));

  // 顧客の声（購入者 → 未購入者 → 解除した人 の3ページ）
  const v = voicesFor(round, pick, step);
  await showLines(['購入者の声', '', ...v.buy.map(t => `「${t}」`)]);
  await showLines([v.stayHead, '', ...v.stay.map(t => `「${t}」`)]);
  if (v.out.length) await showLines(['メルマガ解除した人の声', '', ...v.out.map(t => `「${t}」`)], { cls: 'unsub-voice' });
  else await showLines(['メルマガ解除した人の声', '', '——今回は、ひとりも出ていない。']);
  next();
}

/* 声の組み立て: ラウンド固有の声が先頭、残りを共通プールで3本まで埋める。
   プールの取り出し位置はラウンド番号でずらす＝12通のあいだ同じ声が並ばない */
function voicesFor(round, pick, step) {
  const v = round.voices || {};
  const byType = v[pick.b] || {};
  const rIdx = ROUNDS.indexOf(round);
  const three = (specific, pool) => {
    const arr = [];
    if (specific) arr.push(specific);
    const n = pool.length;
    // ラウンドごとに開始位置をずらす（ずらし幅2が12ラウンドで一番よく散る）
    for (let i = 0; i < n; i++) {
      if (arr.length >= 3) break;
      const t = pool[(rIdx * 2 + i) % n];
      if (t && !arr.includes(t)) arr.push(t);
    }
    return arr.slice(0, 3);
  };
  const buy = step.trueEnd && v.trueEnd
    ? three(v.trueEnd.buy, VOICE_POOL.buy[pick.b])
    : three(byType.buy, VOICE_POOL.buy[pick.b]);
  /* 伊勢さんに「聞いてみます」と答えたうえで、実際に第6通で買わない理由を聞いた場合だけ、
     本音の返信が返ってくる。ここで出る不安が、そのまま第11通の答えになる */
  const kiku = round.special === 'r6_combo' && pick.b === 'A' && S.koneta.K4 === 'B' && v.kiku;
  const stay = kiku ? v.kiku.slice(0, 3) : three(byType.stay, VOICE_POOL.stay[pick.b]);
  // 解除は1人でも出たら声を出す（少ないときは1本だけ＝重くしない）
  let out = [];
  if (step.dUnsub > 0) {
    const first = (step.cls === 'tsuri' && v.tsuri) ? v.tsuri.out : byType.out;
    out = three(first, VOICE_POOL.out[pick.b]).filter(Boolean).slice(0, step.dUnsub > 30 ? 3 : 1);
  }
  return { buy, stay, out, stayHead: kiku ? '返信が届いた' : '未購入者の声' };
}

/* メンタルが動いたことを、その場で見せる。原因（選択）の直後に出さないと
   何で減ったのか分からなくなる */
async function showMentalDelta(b4) {
  const before = { mental: b4.mental != null ? b4.mental : b4, trust: b4.trust, rikai: b4.rikai };
  syncHudTo(S.rounds.filter(Boolean).length);   // いまの小ネタまで含めて再計算
  const after = { mental: HUD.mental, trust: HUD.trust, rikai: HUD.rikai };
  const rows = [['メンタル', after.mental - before.mental, 'g-mental'],
    ['信用', after.trust - (before.trust || 0), 'g-trust'],
    ['顧客理解', after.rikai - (before.rikai || 0), 'g-rikai']]
    .filter(x => before[{ 'メンタル': 'mental', '信用': 'trust', '顧客理解': 'rikai' }[x[0]]] != null)
    .filter(x => Math.round(x[1]) !== 0);
  if (!rows.length) { paintHud(); return; }
  Object.assign(HUD, before);
  stage().appendChild(statTag(rows));
  const mf = $('#mental-fill');
  const down = rows[0][1] < 0;
  mf.style.outline = `1px solid var(--${down ? 'red' : 'green'})`;
  Sfx.play(down ? 'miss' : 'correct');
  await tween(0, 1, 600, t => {
    HUD.mental = before.mental + (after.mental - before.mental) * t;
    HUD.trust = before.trust + (after.trust - before.trust) * t;
    HUD.rikai = before.rikai + (after.rikai - before.rikai) * t;
    paintHud();
  });
  Object.assign(HUD, after); paintHud();
  setTimeout(() => { mf.style.outline = ''; }, FAST ? 0 : 500);
}
/* 「メンタル −5　信用 +6　顧客理解 +5」。増減は必ず数字で見せる。
   0のものは出さない＝動いたものだけが並ぶ */
function statTag(list) {
  const el = document.createElement('div');
  el.className = 'mental-tag';
  el.innerHTML = list.filter(x => Math.round(x[1]) !== 0).map(([name, d, cls]) =>
    `<span class="${cls} ${d < 0 ? 'down' : 'up'}">${name} ${d > 0 ? '+' : '−'}${Math.abs(Math.round(d))}</span>`
  ).join('　');
  return el;
}
function mentalTag(d) { return statTag([['メンタル', d, 'g-mental']]); }

/* 小ネタ。1つ5〜15秒で終わらせる。続きの選択（then）を持つものだけ2段になる */
function konetaPick(list) {
  return new Promise(res => {
    if (FAST) return Promise.resolve().then(() => res(list.find(x => x.good) || list[0]));
    choicesEl().innerHTML = '';
    shuffled(list).forEach(it => {
      const b = document.createElement('button');
      b.className = 'choice'; b.textContent = it.text;
      b.onclick = () => { choicesEl().innerHTML = ''; res(it); };
      choicesEl().appendChild(b);
    });
    guardTaps();
  });
}
async function runKoneta(k) {
  // 小ネタでもHUDと表情を直前のラウンドの状態に合わせる（?jumpでも正しく出す）
  const prev = ROUNDS.find(r => r.id === k.after);
  syncHudTo(S.rounds.filter(Boolean).length);
  paintHud(prev ? prev.clock : null);
  art(beatArt(k.id));
  await showLines(k.intro);
  const c = await konetaPick(k.choices);
  const m0 = { mental: HUD.mental, trust: HUD.trust, rikai: HUD.rikai };
  S.koneta[k.id] = c.key; save();
  Sfx.play(c.good ? 'correct' : 'miss');
  if (k.effect === 'calm' && c.good) art('face_breath');      // システマ呼吸
  if (k.effect === 'story' && c.good) art('books');           // 少年時代の一冊
  if (k.effect === 'gyaku' && c.good) art('face_red');        // 逆立ち腕立て20回
  /* 反応 →（あれば）読者の反応 → メンタルの増減、をタップで飛ばされない順に出す。
     増減のタグは、いま読んでいるページの下に足してからタップを待つ */
  await showLines(c.reaction, c.feedback ? {} : { noTap: true });
  if (c.feedback) {
    await showLines(['読者の反応', '', ...c.feedback.map(t => `「${t}」`)], { noTap: true });
  }
  await showMentalDelta(m0);
  await new Promise(r => tapToContinue(r));
  // 気遣いポイントは、ここで初めて画面に出る
  if (k.showKizPt) {
    const pt = Econ.simulate(chosen()).kizPt;
    await showLines(['', `本日の気遣いポイント：${pt}`], { cls: 'center kizpt' });
  }
  if (k.then) {
    await showLines(k.then.intro);
    const c2 = await konetaPick(k.then.choices);
    const m1 = { mental: HUD.mental, trust: HUD.trust, rikai: HUD.rikai };
    S.koneta[k.id + '_2'] = c2.key; save();
    Sfx.play(c2.good ? 'correct' : 'miss');
    await showLines(c2.reaction, { noTap: true });
    await showMentalDelta(m1);
    await new Promise(r => tapToContinue(r));
  }
  art(beatArt(FLOW[S.beat]));
  next();
}

async function runResult() {
  const sim = Econ.simulate(chosen());
  $('#hud-clock').textContent = 'セールス終了';
  $('#hud-clock').classList.add('urgent');
  // 最後の購入が入り、カウンター停止
  stage().innerHTML = `<div class="lastcount"><div class="lc-clock">18:00</div><div class="lc-num"></div></div>`;
  choicesEl().innerHTML = '';
  if (!FAST) Sfx.rush(true, 100);
  const numEl = stage().querySelector('.lc-num');
  await tween(Math.max(0, sim.sales - 12000000), sim.sales, 2600, v => {
    numEl.textContent = fmtYen(v); HUD.sales = v; paintHud();
  });
  Sfx.rush(false);
  await wait(800);
  const diff = sim.sales - CONF.HISTORIC;
  Sfx.play(sim.win ? 'win' : 'lose');
  stage().innerHTML = `<div class="result-wrap ${sim.win ? 'win' : 'lose'}">
    <div class="res-num">${fmtYen(sim.sales)}</div>
    <div class="res-label">史実 ${fmtYen(CONF.HISTORIC)}　${diff >= 0 ? '+' : '−'}${fmtYen(Math.abs(diff)).slice(1)}</div>
    <div class="res-break">フロント ${fmtNum(sim.buyers)}本 ${fmtYenKanji(sim.buyers * CONF.UNIT)}
      ／ アップセル ${fmtNum(sim.upsells)}本 ${fmtYenKanji(sim.upsells * CONF.UPSELL)}</div>
    <div class="res-copy">${sim.win ? TEXTS.result.win : TEXTS.result.lose}</div></div>`;
  await wait(900);
  await new Promise(r => tapToContinue(r));
  next();
}

/* 勝敗の宣告。評価画面の前に、超えたか超えなかったかだけを見せる */
async function runVerdict() {
  const sim = Econ.simulate(chosen());
  const E = TEXTS.ending;
  choicesEl().innerHTML = '';
  if (sim.win) {
    art('epilogue_sky');
    Sfx.play('clear');
    stage().innerHTML = `<div class="clear-wrap">
      <div class="game-clear">${E.clear}</div>
      <div class="clear-sub">${E.clearSub}</div></div>`;
  } else {
    Sfx.play('lose');
    stage().innerHTML = `<div class="clear-wrap">
      <div class="game-over">${E.notYet}</div>
      <div class="notyet-lines">${E.notYetLines.filter(Boolean).join('<br>')}</div>
      <div class="clear-sub">${E.notYetSub}</div></div>`;
  }
  await wait(1600);
  await new Promise(r => tapToContinue(r));
  next();
}

async function runRanks() {
  const sim = Econ.simulate(chosen());
  const r = t => sim[t];
  // 各評価も辛口。Sは「村上宗嗣ならこう書いた」に届いたときだけ出す
  const copyRank = sim.tsuriCnt === 0 && sim.egoCnt === 0 && sim.honestCnt >= 10 ? 'S'
    : sim.tsuriCnt === 0 && sim.egoCnt <= 1 ? 'A' : sim.tsuriCnt <= 1 ? 'B' : 'C';
  const rikaiRank = sim.rikai >= 68 ? 'SS' : sim.rikai >= 50 ? 'S' : sim.rikai >= 32 ? 'A'
    : sim.rikai >= 16 ? 'B' : 'C';
  const omoiRank = sim.trust >= 68 ? 'SS' : sim.trust >= 48 ? 'S' : sim.trust >= 28 ? 'A'
    : sim.trust >= 12 ? 'B' : 'C';
  const kizRank = sim.kizukai >= 3 ? 'S' : sim.kizukai === 2 ? 'B' : sim.kizukai === 1 ? 'C' : 'D';
  const salesRank = sim.win ? 'S' : sim.sales >= 500000000 ? 'A' : sim.sales >= 400000000 ? 'B' : 'C';
  const rows = [
    ['売上', salesRank], ['コピー', copyRank], ['顧客理解', rikaiRank], ['思いやり', omoiRank],
    ['気遣い', `${kizRank}（${fmtNum(sim.kizPt)}pt）`], ['フロント', `${fmtNum(sim.buyers)}本`],
    ['アップセル', `${fmtNum(sim.upsells)}本`],
    ['メルマガ解除', `${fmtNum(sim.unsub)}人`], ['顧客満足', `${sim.satisfy}%`],
  ];
  stage().innerHTML = `<div class="ranks"><div class="res-label">RESULT</div>
    <div class="rank-rows"></div>
    <div class="munedo hidden">
      <div class="sogo">総合　<span class="sogo-rank">${sim.rank}</span></div>
      <div class="munedo-main">村上宗嗣度　${sim.munedo}%</div>
      <div class="munedo-sub"></div></div></div>`;
  choicesEl().innerHTML = '';
  const rowsEl = stage().querySelector('.rank-rows');
  for (const [k, v] of rows) {
    const row = document.createElement('div');
    row.className = 'rank-row';
    row.innerHTML = `<span>${k}</span><span class="rank-v">${v}</span>`;
    rowsEl.appendChild(row);
    Sfx.play('rank');
    await wait(380);
  }
  await wait(500);
  const mune = stage().querySelector('.munedo');
  mune.classList.remove('hidden');
  // 「5億超えたのにBなの？」の一言
  if (sim.rank === 'B') mune.querySelector('.munedo-sub').textContent = TEXTS.result.rankB_note;
  else if (sim.rank === 'S') mune.querySelector('.munedo-sub').textContent = '——リストを焼かず、記録を超えました。';
  Sfx.play(sim.rank === 'S' ? 'win' : 'ui');
  if (!S.best || 'SABCD'.indexOf(sim.rank) < 'SABCD'.indexOf(S.best)) S.best = sim.rank;
  save();
  await new Promise(r => tapToContinue(r));
  next();
}

/* 史実 5億6490万円を超えたときだけ GAME CLEAR。
   超えていなければ記録は破られていない＝もう一度挑戦してもらう */
async function runEnding() {
  const sim = Econ.simulate(chosen());
  const E = TEXTS.ending;
  choicesEl().innerHTML = '';
  if (sim.win) {
    S.clears++; save();
    if (FAST) { window.__cleared = true; console.log('[autotest] __CLEAR__'); }
    art('epilogue_sky');
    // 行動することについて、本人の言葉で締める
    for (const page of E.message) await showLines(page, { cls: 'center' });
    stage().innerHTML = `<div class="clear-wrap">
      <div class="shime">${E.shime[0]}</div>
      <div class="shime big">${E.shime[1]}</div></div>`;
    await wait(900);
  } else {
    art('result_bg');
    stage().innerHTML = `<div class="clear-wrap">
      <div class="notyet-lines">${E.retryLead}</div></div>`;
    await wait(600);
  }

  if (FAST) return;
  await new Promise(res => {
    choicesEl().innerHTML = '';
    const b = document.createElement('button');
    b.className = 'choice next-btn top-btn';
    b.textContent = E.toTop;
    b.onclick = res;
    choicesEl().appendChild(b);
    guardTaps();
  });
  // 周回データ（最高ランク・クリア回数）だけ引き継いでタイトルへ
  const meta = { best: S.best, clears: S.clears };
  S = freshState(meta);
  save(); showTitle();
}

/* ---- 起動 ---- */
window.addEventListener('load', () => {
  Sfx.init();
  $('#menu-btn').onclick = e => { e.stopPropagation(); openMenu(); };
  if (location.search.includes('reset')) { localStorage.removeItem(SAVE_KEY); S = freshState(); }
  const jm = location.search.match(/jump=([A-Za-z0-9]+)/);
  if (jm && FLOW.includes(jm[1])) {
    S = freshState();
    const idx = FLOW.indexOf(jm[1]);
    // 直行: それまでのラウンドは全A×A・小ネタは全good で埋める
    for (let i = 0; i < ROUNDS.length; i++) {
      if (FLOW.indexOf(ROUNDS[i].id) < idx) S.rounds[i] = { b: 'A', s: 'A' };
    }
    KONETA.forEach(k => { if (FLOW.indexOf(k.id) < idx) S.koneta[k.id] = k.choices.find(c => c.good).key; });
    S.beat = idx;
  }
  runBeat();
});
}
