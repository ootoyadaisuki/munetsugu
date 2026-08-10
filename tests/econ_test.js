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
function route(b, s, koneta, overrides) {
  const rounds = ROUNDS.map(() => ({ b, s }));
  if (overrides) for (const [i, v] of Object.entries(overrides)) rounds[i] = v;
  return { rounds, koneta: koneta || { K1: 'B', K2: 'B', K3: 'B' } };
}

// T1: 全A×A（+R12はD×Dの真エンドも）→ 史実超え・解除≤1200・総合S到達可能
console.log('T1 王道ルート');
{
  const simAA = Econ.simulate(route('A', 'A'));
  check(`全A×A 売上=${(simAA.sales / M).toFixed(1)}M 解除=${simAA.unsub}`,
    simAA.sales > CONF.HISTORIC && simAA.unsub <= 1200, `rank=${simAA.rank}`);
  check(`全A×A 総合S`, simAA.rank === 'S', `rank=${simAA.rank} satisfy=${simAA.satisfy}`);
  const simTrue = Econ.simulate(route('A', 'A', null, { 11: { b: 'D', s: 'D' } }));
  check(`R12真エンド(D×D) 売上=${(simTrue.sales / M).toFixed(1)}M`,
    simTrue.sales > CONF.HISTORIC && simTrue.rank === 'S',
    `rank=${simTrue.rank} trueEnd=${simTrue.log[11].trueEnd}`);
  check(`真エンドフラグ`, simTrue.log[11].trueEnd === true);
  // 真エンドは顧客理解が必要＝全C経由でD×Dだと不発
  const simFake = Econ.simulate(route('C', 'C', null, { 11: { b: 'D', s: 'D' } }));
  check(`理解不足のD×Dは不発`, simFake.log[11].trueEnd === false);
}

// T2: 全B×B（強引）→ 高売上だが解除≥6000 → 総合はB以下
console.log('T2 強引ルート');
{
  const sim = Econ.simulate(route('B', 'B'));
  check(`全B×B 売上=${(sim.sales / M).toFixed(1)}M ∈[500,585]M`,
    sim.sales >= 500 * M && sim.sales <= 585 * M);
  check(`全B×B 解除=${sim.unsub} ≥6000`, sim.unsub >= 6000);
  check(`全B×B 総合${sim.rank}はS/Aでない`, sim.rank !== 'S' && sim.rank !== 'A');
}

// T3: 全D×D → リストが焼け、売上≤300M
console.log('T3 地雷ルート');
{
  const sim = Econ.simulate(route('D', 'D'));
  check(`全D×D 売上=${(sim.sales / M).toFixed(1)}M ≤300M`, sim.sales <= 300 * M);
  check(`全D×D 解除=${sim.unsub}（リストが焼ける）`, sim.unsub >= 8000);
}

// T4: 全C×C → 380〜450M（間違ってないが届かない）
console.log('T4 凡打ルート');
{
  const sim = Econ.simulate(route('C', 'C'));
  check(`全C×C 売上=${(sim.sales / M).toFixed(1)}M ∈[380,450]M`,
    sim.sales >= 380 * M && sim.sales <= 450 * M, `unsub=${sim.unsub}`);
}

// T5: 不変条件（全4^2ルート×小ネタ2通りでリスト非負・解除上限）
console.log('T5 不変条件');
{
  let bad = 0, n = 0, lo = Infinity, hi = -Infinity;
  for (const b of 'ABCD') for (const s of 'ABCD')
    for (const k2 of ['A', 'B']) {
      const sim = Econ.simulate(route(b, s, { K1: 'B', K2: k2, K3: 'B' }));
      n++;
      if (sim.list < 0) bad++;
      const cap = CONF.LIST0 + (k2 === 'A' ? CONF.OISHII_ADD : 0);
      if (sim.unsub + sim.buyers + sim.list !== cap) bad++;
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
  console.log(`  ${name}: ${(sim.sales / M).toFixed(1)}M 解除${sim.unsub} 満足${sim.satisfy}% 総合${sim.rank} 宗嗣度${sim.munedo}%`);
}

console.log(`\n=== ${fail === 0 ? 'ALL PASS' : 'FAIL ' + fail + '件'} (pass=${pass}) ===`);
process.exit(fail ? 1 : 0);
