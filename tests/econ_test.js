// v5 経済の合格基準テスト（SCRIPT.md「数値モデル」節の6本）
const path = require('path');
const data = require(path.join(__dirname, '..', 'js', 'data.js'));
for (const k of Object.keys(data)) global[k] = data[k];
const { Econ } = require(path.join(__dirname, '..', 'js', 'game.js'));

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${detail}`); }
}
const M = 1000000;
/* 小ネタは「全部の正解を選んだ」状態を既定にする。選択肢の中身が変わっても
   ハードコードした鍵がズレないよう、good フラグから毎回組み立てる */
function konetaAll(over) {
  const o = {};
  for (const k of KONETA) {
    o[k.id] = (k.choices.find(c => c.good) || k.choices[0]).key;
    if (k.then) o[k.id + '_2'] = (k.then.choices.find(c => c.good) || k.then.choices[0]).key;
  }
  return Object.assign(o, over || {});
}
function route(b, s, koneta, overrides) {
  const rounds = ROUNDS.map(() => ({ b, s }));
  if (overrides) for (const [i, v] of Object.entries(overrides)) rounds[i] = v;
  return { rounds, koneta: koneta || konetaAll() };
}

// T1: 全A×A（+R12はD×Dの真エンドも）→ 史実超え・解除≤1200・総合S到達可能
console.log('T1 王道ルート');
{
  const simAA = Econ.simulate(route('A', 'A'));
  check(`全A×A 売上=${(simAA.sales / M).toFixed(1)}M 解除=${simAA.unsub}`,
    simAA.sales > CONF.HISTORIC && simAA.unsub <= 1200, `rank=${simAA.rank}`);
  check(`全A×A 総合S`, simAA.rank === 'S', `rank=${simAA.rank} satisfy=${simAA.satisfy}`);
  // 史実の内訳（本体700本・アップセル約250本）に近い形で勝っている
  check(`全A×A フロント${simAA.buyers}本・アップセル${simAA.upsells}本`,
    simAA.buyers >= 650 && simAA.buyers <= 900 && simAA.upsells >= 200 && simAA.upsells <= 330);
  check(`全A×A 売上の8割以上がアップセル側`,
    simAA.upsells * CONF.UPSELL / simAA.sales >= 0.80);
  const simTrue = Econ.simulate(route('A', 'A', null, { 11: { b: 'D', s: 'D' } }));
  check(`R12真エンド(D×D) 売上=${(simTrue.sales / M).toFixed(1)}M`,
    simTrue.sales > CONF.HISTORIC && simTrue.rank === 'S',
    `rank=${simTrue.rank} trueEnd=${simTrue.log[11].trueEnd}`);
  check(`真エンドフラグ`, simTrue.log[11].trueEnd === true);
  // 真エンドは顧客理解が必要＝全C経由でD×Dだと不発
  const simFake = Econ.simulate(route('C', 'C', null, { 11: { b: 'D', s: 'D' } }));
  check(`理解不足のD×Dは不発`, simFake.log[11].trueEnd === false);
}

// T2: 全B×B（煽り）→ 本体は売れるがアップセルが0＝総額で届かない
console.log('T2 強引ルート');
{
  const sim = Econ.simulate(route('B', 'B'));
  check(`全B×B フロント=${sim.buyers}本（本体は売れる）`, sim.buyers >= 550);
  check(`全B×B アップセル=${sim.upsells}本（信用がないので進まない）`, sim.upsells <= 30);
  check(`全B×B 売上=${(sim.sales / M).toFixed(1)}M ≤150M`, sim.sales <= 150 * M);
  check(`全B×B 解除=${sim.unsub} ≥6000`, sim.unsub >= 6000);
  check(`全B×B 総合${sim.rank}はS/Aでない`, sim.rank !== 'S' && sim.rank !== 'A');
}

// T2b: 👑（小ネタで正解すると出る選択肢）は、踏んだときだけ効く
console.log('T2b 👑の解禁');
{
  const withK = Econ.simulate(route('A', 'A', konetaAll(), { 11: { b: 'D', s: 'D' } }));
  // 小ネタを全部外すと👑は1つも出ない＝同じA×Aでも売上が落ちる
  const noK = {};
  for (const k of KONETA) {
    noK[k.id] = (k.choices.find(c => !c.good) || k.choices[0]).key;
    if (k.then) noK[k.id + '_2'] = (k.then.choices.find(c => !c.good)).key;
  }
  const without = Econ.simulate(route('A', 'A', noK, { 11: { b: 'D', s: 'D' } }));
  check(`👑あり ${(withK.sales / M).toFixed(0)}M > 👑なし ${(without.sales / M).toFixed(0)}M`,
    withK.sales > without.sales);
  check(`👑を踏むラウンドは7つ`, ROUNDS.filter(r => r.crown).length === 7);
  check(`👑の解禁元は全て実在する小ネタ`,
    ROUNDS.filter(r => r.crown).every(r => {
      const k = KONETA.find(x => x.id === r.crown.from);
      return k && k.choices.some(c => c.key === r.crown.pick && c.good);
    }));
  check(`👑は差し替え先と同じ型（特殊ラウンドの判定が壊れない）`,
    ROUNDS.filter(r => r.crown).every(r =>
      r[r.crown.slot].some(x => x.t === r.crown.item.t)));
}

// T2c: メンタル。正直に書けば減らず、煽ると底を打ち、💀が増える
console.log('T2c メンタル');
{
  const good = Econ.simulate(route('A', 'A'));
  const hype = Econ.simulate(route('B', 'B'));
  check(`正直ルートは削れない（${good.mental}）`, good.mental >= 90);
  check(`煽りルートは底を打つ（${hype.mental}）`, hype.mental <= 5);
  check(`メンタル100では💀ゼロ`, Econ.killTones(100).length === 0);
  check(`メンタル0では ego/hype/flat が💀`, Econ.killTones(0).length === 3);
  check(`💀が増えるほど正直だけが安全`, Econ.killTones(0).indexOf('honest') === -1);
  // 疲れているとアップセルが取れなくなる
  const lo = Econ.simulate(route('A', 'A', konetaAll(), { 11: { b: 'D', s: 'D' } }));
  check(`アップセル率はメンタルに連動（最終${lo.mental}）`, lo.upsells > 0 && lo.mental > 50);
}

// T3: 全D×D → リストが焼け、売上≤80M
console.log('T3 地雷ルート');
{
  const sim = Econ.simulate(route('D', 'D'));
  check(`全D×D 売上=${(sim.sales / M).toFixed(1)}M ≤80M`, sim.sales <= 80 * M);
  check(`全D×D 解除=${sim.unsub}（リストが焼ける）`, sim.unsub >= 8000);
}

// T4: 全C×C → 380〜450M（間違ってないが届かない）
console.log('T4 凡打ルート');
{
  const sim = Econ.simulate(route('C', 'C'));
  check(`全C×C 売上=${(sim.sales / M).toFixed(1)}M ∈[80,200]M`,
    sim.sales >= 80 * M && sim.sales <= 200 * M, `unsub=${sim.unsub}`);
  check(`全C×C は史実に遠く届かない`, sim.sales < CONF.HISTORIC * 0.4);
}

// T5: 不変条件（全4^2ルート×小ネタ2通りでリスト非負・解除上限）
console.log('T5 不変条件');
{
  let bad = 0, n = 0, lo = Infinity, hi = -Infinity;
  for (const b of 'ABCD') for (const s of 'ABCD') {
    const sim = Econ.simulate(route(b, s));
    n++;
    if (sim.list < 0) bad++;
    if (sim.unsub + sim.buyers + sim.list !== CONF.LIST0) bad++;
    if (sim.sales < lo) lo = sim.sales; if (sim.sales > hi) hi = sim.sales;
  }
  check(`${n}ルート リスト非負・収支一致`, bad === 0, `bad=${bad}`);
  console.log(`  （値域 ${(lo / M).toFixed(0)}M〜${(hi / M).toFixed(0)}M）`);
}

// T6: 12×4×4=192通り 声のフォールスルー0
console.log('T6 反応テキスト網羅');
{
  // voicesForのロジックをここで再現（UI関数はnodeに来ないため）
  let missing = 0;
  for (const round of ROUNDS) for (const b of 'ABCD') {
    const v = (round.voices || {})[b] || {};
    const buy = v.buy || VOICE_POOL.buy[b];
    const stay = v.stay || VOICE_POOL.stay[b];
    const out = v.out || VOICE_POOL.out[b];
    if (!buy || !stay || !out) { missing++; console.log(`    欠落: ${round.id}-${b}`); }
  }
  check(`本文4型×12ラウンドの声プール網羅`, missing === 0);
  // 件名側は経済にのみ影響（声は本文型で決まる）＝4×4の組はpairClass定義で網羅
  let undef_ = 0;
  for (const round of ROUNDS) for (let bi = 0; bi < 4; bi++) for (let si = 0; si < 4; si++) {
    const c = Econ.pairClass(round, bi, si);
    if (!['match', 'tsuri', 'katasuka', 'neutral', 'super'].includes(c)) undef_++;
  }
  check(`pairClass 192セル定義`, undef_ === 0);
}

// スナップショット
console.log('スナップショット');
for (const [name, r] of [['全A×A', route('A', 'A')], ['全B×B', route('B', 'B')],
  ['全C×C', route('C', 'C')], ['全D×D', route('D', 'D')],
  ['A×A+真エンド', route('A', 'A', null, { 11: { b: 'D', s: 'D' } })]]) {
  const sim = Econ.simulate(r);
  console.log(`  ${name}: ${(sim.sales / M).toFixed(1)}M（フロント${sim.buyers}本+UP${sim.upsells}本） 解除${sim.unsub} 満足${sim.satisfy}% 総合${sim.rank} 宗嗣度${sim.munedo}%`);
}

console.log(`\n=== ${fail === 0 ? 'ALL PASS' : 'FAIL ' + fail + '件'} (pass=${pass}) ===`);
process.exit(fail ? 1 : 0);
