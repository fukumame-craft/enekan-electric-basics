(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ENEKAN = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = '1.2.0';
  const CATEGORIES = {
    theory: '電気・電子理論',
    control: '自動制御',
    measurement: '電気計測',
    information: '情報処理'
  };

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function round(value, digits = 3) {
    const p = 10 ** digits;
    return Math.round((value + Number.EPSILON) * p) / p;
  }
  function fmt(value, digits = 3) {
    if (!Number.isFinite(value)) return String(value);
    const v = round(value, digits);
    return Number.isInteger(v) ? String(v) : String(v).replace(/0+$/, '').replace(/\.$/, '');
  }
  function normalizeUnit(unit) {
    return String(unit || '')
      .trim().toLowerCase()
      .replace(/\s+/g, '')
      .replace(/ω/g, 'ohm')
      .replace(/Ω/g, 'ohm')
      .replace(/μ/g, 'u')
      .replace(/µ/g, 'u')
      .replace(/°/g, 'deg');
  }
  function parseNumber(value) {
    const text = String(value ?? '').replace(/,/g, '').trim();
    const m = text.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);
    return m ? Number(m[0]) : NaN;
  }
  function checkNumeric(input, expected, tolerance, unitInput, acceptedUnits, requireUnit) {
    const n = parseNumber(input);
    if (!Number.isFinite(n)) return { correct: false, reason: '数値を読み取れない' };
    const absTol = Math.max(Math.abs(expected) * tolerance, 1e-9);
    if (Math.abs(n - expected) > absTol) return { correct: false, reason: '数値が許容範囲外' };
    if (requireUnit) {
      const u = normalizeUnit(unitInput);
      const ok = acceptedUnits.map(normalizeUnit).includes(u);
      if (!ok) return { correct: false, reason: '単位が違う、または未入力' };
    }
    return { correct: true, reason: '' };
  }
  function svgCircuit(kind) {
    const common = 'viewBox="0 0 520 180" role="img" aria-label="回路図"';
    if (kind === 'seriesRLC') return `<svg ${common}><line x1="55" y1="90" x2="115" y2="90"/><rect x="115" y="70" width="70" height="40"/><text x="142" y="96">R</text><line x1="185" y1="90" x2="215" y2="90"/><path d="M215 90 q15 -30 30 0 q15 -30 30 0 q15 -30 30 0" fill="none"/><text x="255" y="55">L</text><line x1="305" y1="90" x2="340" y2="90"/><line x1="340" y1="65" x2="340" y2="115"/><line x1="365" y1="65" x2="365" y2="115"/><text x="345" y="50">C</text><line x1="365" y1="90" x2="455" y2="90"/><circle cx="55" cy="90" r="28" fill="none"/><path d="M38 90 q8 -15 17 0 q8 15 17 0" fill="none"/><text x="25" y="145">交流電源</text></svg>`;
    if (kind === 'feedback') return `<svg ${common}><text x="20" y="97">r</text><line x1="40" y1="90" x2="90" y2="90"/><circle cx="105" cy="90" r="15" fill="none"/><text x="100" y="83">+</text><text x="99" y="105">−</text><line x1="120" y1="90" x2="165" y2="90"/><rect x="165" y="62" width="95" height="56"/><text x="198" y="96">G(s)</text><line x1="260" y1="90" x2="345" y2="90"/><text x="352" y="96">y</text><line x1="325" y1="90" x2="325" y2="145"/><line x1="325" y1="145" x2="105" y2="145"/><line x1="105" y1="145" x2="105" y2="105"/></svg>`;
    if (kind === 'transformer') return `<svg ${common}><circle cx="70" cy="90" r="28" fill="none"/><path d="M53 90 q8 -15 17 0 q8 15 17 0" fill="none"/><line x1="98" y1="60" x2="145" y2="60"/><line x1="98" y1="120" x2="145" y2="120"/><path d="M145 55 q20 10 0 20 q20 10 0 20 q20 10 0 20" fill="none"/><path d="M245 55 q-20 10 0 20 q-20 10 0 20 q-20 10 0 20" fill="none"/><line x1="245" y1="60" x2="300" y2="60"/><line x1="245" y1="120" x2="300" y2="120"/><rect x="300" y="55" width="75" height="70"/><text x="327" y="96">ZL</text><text x="150" y="35">N1</text><text x="225" y="35">N2</text></svg>`;
    if (kind === 'meters') return `<svg ${common}><circle cx="75" cy="90" r="28" fill="none"/><text x="67" y="97">E</text><line x1="103" y1="90" x2="165" y2="90"/><circle cx="185" cy="90" r="20" fill="none"/><text x="179" y="97">A</text><line x1="205" y1="90" x2="320" y2="90"/><rect x="320" y="65" width="75" height="50"/><text x="342" y="96">負荷</text><line x1="395" y1="90" x2="450" y2="90"/><line x1="450" y1="90" x2="450" y2="145"/><line x1="450" y1="145" x2="75" y2="145"/><line x1="75" y1="145" x2="75" y2="118"/><circle cx="285" cy="125" r="20" fill="none"/><text x="279" y="132">V</text><line x1="285" y1="105" x2="285" y2="90"/><line x1="285" y1="145" x2="285" y2="145"/></svg>`;
    return '';
  }
  function steps(condition, target, formula, substitution, calculation, unit, answer, trap) {
    return [
      { label: '1. 問題文から読み取る条件', text: condition },
      { label: '2. 何を求める問題か', text: target },
      { label: '3. 使用する公式', text: formula },
      { label: '4. 数値代入', text: substitution },
      { label: '5. 計算', text: calculation },
      { label: '6. 単位', text: unit || '無次元' },
      { label: '7. 答え', text: answer },
      { label: '8. 間違いやすい点', text: trap }
    ];
  }
  function uniqueChoices(list) {
    return [...new Set(list.filter(Boolean))];
  }
  function buildNumericOptions(answer, unit, digits = 3) {
    const correct = `${fmt(answer, digits)}${unit ? ' ' + unit : ''}`;
    const abs = Math.abs(answer);
    const scale = abs >= 10 ? Math.max(1, abs * 0.1) : Math.max(0.05, abs * 0.2 || 0.2);
    const rawCandidates = [
      answer * 1.1,
      answer * 0.9,
      answer * 1.2,
      answer * 0.8,
      answer + scale,
      answer - scale,
      answer + scale * 2,
      answer - scale * 2,
      answer * 10,
      answer / 10,
      abs,
      -abs
    ].filter(v => Number.isFinite(v));

    const formatted = uniqueChoices(rawCandidates.map(v => `${fmt(v, digits)}${unit ? ' ' + unit : ''}`)).filter(v => v !== correct);
    const options = [correct];
    for (const item of formatted) {
      if (options.length >= 4) break;
      options.push(item);
    }
    let step = scale || 1;
    while (options.length < 4) {
      step += Math.max(scale * 0.5, 0.1);
      const extra = `${fmt(answer + step, digits)}${unit ? ' ' + unit : ''}`;
      if (!options.includes(extra)) options.push(extra);
    }
    return shuffle(options.slice(0, 4));
  }
  function numericQuestion(meta, data) {
    const numericAnswer = round(data.answer, data.digits ?? 6);
    const answerText = `${fmt(data.answer, data.digits ?? 3)}${data.unit ? ' ' + data.unit : ''}`;
    return {
      ...meta,
      type: 'choice',
      questionKind: 'calculation',
      prompt: data.prompt,
      diagram: data.diagram || '',
      options: buildNumericOptions(numericAnswer, data.unit || '', data.digits ?? 3),
      answer: answerText,
      answerText,
      numericAnswer,
      unit: data.unit || '',
      acceptedUnits: data.acceptedUnits || (data.unit ? [data.unit] : []),
      requireUnit: data.requireUnit ?? Boolean(data.unit),
      tolerance: data.tolerance ?? 0.01,
      hint: data.hint,
      formula: data.formula,
      clue: data.clue,
      steps: data.steps
    };
  }
  function choiceQuestion(meta, data) {
    const options = shuffle(data.options);
    return {
      ...meta,
      type: 'choice',
      questionKind: 'knowledge',
      prompt: data.prompt,
      diagram: data.diagram || '',
      options,
      answer: data.answer,
      answerText: data.answer,
      unit: '', acceptedUnits: [], requireUnit: false, tolerance: 0,
      hint: data.hint,
      formula: data.formula || '知識・判定問題',
      clue: data.clue,
      steps: data.steps
    };
  }
  function meta(id, category, subcategory, title, frequency, priority, difficulty, weak, sourceYears) {
    return { id, category, subcategory, title, frequency, priority, difficulty, weak, sourceYears };
  }

  const PATTERNS = [];
  function add(m, generator) { PATTERNS.push({ ...m, generate: () => ({ ...generator(), patternId: m.id, category: m.category, subcategory: m.subcategory, title: m.title, frequency: m.frequency, priority: m.priority, difficulty: m.difficulty, weak: m.weak, sourceYears: m.sourceYears }) }); }

  // 電気・電子理論
  add(meta('T01','theory','直流回路','合成抵抗とオームの法則',3,'B','易',false,['基礎補強']), () => {
    const r1=randInt(2,12), r2=randInt(2,12), v=pick([12,24,48,100]);
    const rp=r1*r2/(r1+r2), i=v/rp;
    return numericQuestion({}, {prompt:`抵抗 ${r1} Ω と ${r2} Ω を並列接続し、${v} V を加えた。電源電流を求めよ。`,answer:i,unit:'A',acceptedUnits:['A','ampere'],digits:3,hint:'並列は「積÷和」、その後 I=V/R。',formula:'R = R₁R₂/(R₁+R₂), I=V/R',clue:'「並列接続」から、まず合成抵抗を積÷和で求める。',steps:steps(`R₁=${r1} Ω、R₂=${r2} Ω、V=${v} V。`,'電源電流 I。','R=R₁R₂/(R₁+R₂)、I=V/R。',`R=${r1}×${r2}/(${r1}+${r2})=${fmt(rp)} Ω、I=${v}/${fmt(rp)}。`,`I=${fmt(i)}。`,'A',`${fmt(i)} A。`,'並列抵抗を R₁+R₂ としない。')});
  });
  add(meta('T02','theory','交流回路','直列RLCの複素インピーダンス',8,'A','標準',true,['H30','R01','R03','R04','R05','R06','R07']), () => {
    const r=randInt(4,20), xl=randInt(6,30), xc=randInt(2,25); const x=xl-xc, z=Math.hypot(r,x);
    return numericQuestion({}, {prompt:`直列回路で R=${r} Ω、X_L=${xl} Ω、X_C=${xc} Ω である。合成インピーダンスの大きさ |Z| を求めよ。`,diagram:svgCircuit('seriesRLC'),answer:z,unit:'Ω',acceptedUnits:['Ω','ohm'],digits:3,hint:'Z=R+j(XL−XC)。実部と虚部は三平方で合成する。',formula:'Z=R+j(XL−XC), |Z|=√(R²+(XL−XC)²)',clue:'「R・L・Cの直列」「インピーダンスの大きさ」が合図。',steps:steps(`R=${r} Ω、X_L=${xl} Ω、X_C=${xc} Ω。`,'|Z|。','Z=R+j(X_L−X_C)、|Z|=√(R²+X²)。',`X=${xl}−${xc}=${x} Ω、|Z|=√(${r}²+${x}²)。`,`|Z|=√${r*r+x*x}=${fmt(z)}。`,'Ω',`${fmt(z)} Ω。`,'XLとXCは同方向に足さず、符号を反対にする。')});
  });
  add(meta('T03','theory','共振','直列共振のコンデンサ',3,'B','標準',false,['H30','R04']), () => {
    const f=pick([50,60,100,200]), l=pick([0.05,0.08,0.1,0.2]); const w=2*Math.PI*f, c=1/(w*w*l), u=c*1e6;
    return numericQuestion({}, {prompt:`周波数 ${f} Hz、インダクタンス ${l} H の直列RLC回路を共振させる。必要な静電容量 C を求めよ。`,diagram:svgCircuit('seriesRLC'),answer:u,unit:'μF',acceptedUnits:['μF','uF'],digits:3,hint:'共振では ωL=1/(ωC)。',formula:'C=1/(ω²L), ω=2πf',clue:'「共振させる」から XL=XC。',steps:steps(`f=${f} Hz、L=${l} H。`,'共振用 C。','ω=2πf、C=1/(ω²L)。',`ω=2π×${f}=${fmt(w)} rad/s、C=1/(${fmt(w)}²×${l})。`,`C=${fmt(c,9)} F=${fmt(u)} μF。`,'μF',`${fmt(u)} μF。`,'Hzをそのままωに入れず、2πを掛ける。')});
  });
  add(meta('T04','theory','複素数・並列回路','RとCの並列合成',6,'A','標準',true,['R04','R05','R06']), () => {
    const r=pick([10,20,25,40]), xc=pick([10,20,25,50]);
    const re=r*xc*xc/(r*r+xc*xc), im=-(r*r*xc)/(r*r+xc*xc), mag=Math.hypot(re,im);
    return numericQuestion({}, {prompt:`抵抗 R=${r} Ω と容量リアクタンス X_C=${xc} Ω のコンデンサを並列接続した。合成インピーダンスの大きさを求めよ。`,answer:mag,unit:'Ω',acceptedUnits:['Ω','ohm'],digits:3,hint:'ZC=−jXC。並列は Z=RZC/(R+ZC)。',formula:'Z=R(−jXC)/(R−jXC)',clue:'「並列」「コンデンサ」から複素数の積÷和。',steps:steps(`R=${r} Ω、Z_C=−j${xc} Ω。`,'並列合成 |Z|。','Z=RZ_C/(R+Z_C)。',`Z=${r}(−j${xc})/(${r}−j${xc})。`,`有理化すると Z=${fmt(re)}${im<0?'−':'+'}j${fmt(Math.abs(im))} Ω、|Z|=${fmt(mag)}。`,'Ω',`${fmt(mag)} Ω。`,'コンデンサの虚数符号は −j。')});
  });
  add(meta('T05','theory','交流ブリッジ','交流ブリッジの平衡条件',3,'B','標準',true,['R04','R06']), () => {
    const z1=randInt(4,12), z2=randInt(4,12), z3=randInt(5,15); const z4=z2*z3/z1;
    return numericQuestion({}, {prompt:`交流ブリッジが平衡している。腕のインピーダンスの大きさが Z₁=${z1} Ω、Z₂=${z2} Ω、Z₃=${z3} Ω のとき、Z₄ を求めよ（すべて同相成分とする）。`,answer:z4,unit:'Ω',acceptedUnits:['Ω','ohm'],digits:3,hint:'対向する腕の積が等しい。',formula:'Z₁Z₄=Z₂Z₃',clue:'「ブリッジが平衡」「検流計に電流が流れない」が合図。',steps:steps(`Z₁=${z1}、Z₂=${z2}、Z₃=${z3} Ω、平衡。`,'Z₄。','Z₁Z₄=Z₂Z₃。',`Z₄=${z2}×${z3}/${z1}。`,`Z₄=${fmt(z4)}。`,'Ω',`${fmt(z4)} Ω。`,'隣り合う腕同士ではなく、対向積を等しくする。')});
  });
  add(meta('T06','theory','三相交流','三相有効電力',8,'A','易',false,['H30','R01','R02','R03','R04','R05','R06','R07']), () => {
    const v=pick([200,400,440,6600]), i=randInt(5,50), pf=pick([0.6,0.7,0.8,0.9]); const p=Math.sqrt(3)*v*i*pf/1000;
    return numericQuestion({}, {prompt:`平衡三相回路で線間電圧 ${v} V、線電流 ${i} A、力率 ${pf} である。有効電力を求めよ。`,answer:p,unit:'kW',acceptedUnits:['kW'],digits:3,hint:'線間電圧と線電流が与えられた三相電力は √3VIcosφ。',formula:'P=√3 V_L I_L cosφ',clue:'「平衡三相」「線間電圧」「線電流」が合図。',steps:steps(`V_L=${v} V、I_L=${i} A、cosφ=${pf}。`,'三相有効電力 P。','P=√3V_LI_Lcosφ。',`P=√3×${v}×${i}×${pf} W。`,`P=${fmt(p)} kW。`,'kW',`${fmt(p)} kW。`,'三相だから3倍ではなく、線間値を使う式では√3。')});
  });
  add(meta('T07','theory','三相交流・力率改善','進相コンデンサ容量',4,'A','標準',true,['R01','R03','R07']), () => {
    const v=pick([200,400]), f=pick([50,60]), q=pick([3000,4800,6000,9000]); const w=2*Math.PI*f; const c=q/(3*w*v*v)*1e6;
    return numericQuestion({}, {prompt:`線間電圧 ${v} V、周波数 ${f} Hz の三相回路に、Δ結線コンデンサで ${q} var の進み無効電力を与える。1相当たりの静電容量を求めよ。`,answer:c,unit:'μF',acceptedUnits:['μF','uF'],digits:3,hint:'Δ結線では各相に線間電圧がかかり、Q=3ωCV²。',formula:'C=Q/(3ωV_L²)',clue:'「Δ結線コンデンサ」「力率改善」「無効電力」が合図。',steps:steps(`V_L=${v} V、f=${f} Hz、Q=${q} var、Δ結線。`,'1相当たり C。','Q=3ωCV_L²、ω=2πf。',`C=${q}/(3×2π×${f}×${v}²)。`,`C=${fmt(c)} μF。`,'μF',`${fmt(c)} μF。`,'Y結線式と混同しない。Δでは相電圧=線間電圧。')});
  });
  add(meta('T08','theory','三相交流','Δ－Y等価変換',5,'A','易',false,['R01','R04','R06']), () => {
    const zd=pick([6,9,12,15,18,24]); const zy=zd/3;
    return numericQuestion({}, {prompt:`各相 ${zd} Ω の平衡Δ結線負荷を、等価なY結線に変換する。Y結線1相のインピーダンスを求めよ。`,answer:zy,unit:'Ω',acceptedUnits:['Ω','ohm'],digits:3,hint:'平衡Δ→Yは1/3。',formula:'Z_Y=Z_Δ/3',clue:'「平衡Δを等価Yへ」が合図。',steps:steps(`Z_Δ=${zd} Ω。`,'Z_Y。','Z_Y=Z_Δ/3。',`Z_Y=${zd}/3。`,`Z_Y=${fmt(zy)}。`,'Ω',`${fmt(zy)} Ω。`,'√3で割るのは電圧・電流関係。インピーダンス変換は3。')});
  });
  add(meta('T09','theory','三相交流・フェーザ','線電流のベクトル差',7,'A','標準',true,['H30','R01','R02','R04','R05','R06']), () => {
    const i=pick([5,10,20,30]); const line=Math.sqrt(3)*i;
    return numericQuestion({}, {prompt:`平衡Δ結線負荷の各相電流の大きさが ${i} A である。線電流の大きさを求めよ。`,answer:line,unit:'A',acceptedUnits:['A'],digits:3,hint:'線電流は120°ずれた相電流のベクトル差。大きさは√3倍。',formula:'I_L=√3 I_Δ',clue:'「Δ結線」「相電流から線電流」が合図。',steps:steps(`I_Δ=${i} A、平衡Δ。`,'線電流 I_L。','I_L=√3I_Δ。',`I_L=√3×${i}。`,`I_L=${fmt(line)}。`,'A',`${fmt(line)} A。`,'相電流を単純に2倍しない。ベクトル差なので√3倍。')});
  });
  add(meta('T10','theory','三相電力測定','二電力計法',4,'B','標準',true,['R05','R06']), () => {
    const w1=randInt(3,12), w2=randInt(1,w1); const p=w1+w2, q=Math.sqrt(3)*(w1-w2);
    return numericQuestion({}, {prompt:`二電力計法で W₁=${w1} kW、W₂=${w2} kW を示した。三相負荷の無効電力を求めよ。`,answer:q,unit:'kvar',acceptedUnits:['kvar','kVAr'],digits:3,hint:'有効電力は和、無効電力は√3×差。',formula:'P=W₁+W₂, Q=√3(W₁−W₂)',clue:'「二電力計法」「2台の指示値」が合図。',steps:steps(`W₁=${w1} kW、W₂=${w2} kW。`,'無効電力 Q。','Q=√3(W₁−W₂)。',`Q=√3×(${w1}−${w2})。`,`Q=${fmt(q)} kvar。`,'kvar',`${fmt(q)} kvar。`,'有効電力は和、無効電力は差。')});
  });
  add(meta('T11','theory','変圧器','理想変圧器の電圧比',3,'A','易',true,['R02','R07']), () => {
    const n1=pick([100,200,400,600]), n2=pick([20,50,100,150]), v1=pick([100,200,400]); const v2=v1*n2/n1;
    return numericQuestion({}, {prompt:`理想変圧器で一次巻数 ${n1}、二次巻数 ${n2}、一次電圧 ${v1} V である。二次電圧を求めよ。`,diagram:svgCircuit('transformer'),answer:v2,unit:'V',acceptedUnits:['V'],digits:3,hint:'電圧比=巻数比。',formula:'V₁/V₂=N₁/N₂',clue:'「理想変圧器」「巻数」が合図。',steps:steps(`N₁=${n1}、N₂=${n2}、V₁=${v1} V。`,'V₂。','V₂=V₁N₂/N₁。',`V₂=${v1}×${n2}/${n1}。`,`V₂=${fmt(v2)}。`,'V',`${fmt(v2)} V。`,'一次・二次の巻数比を逆にしない。')});
  });
  add(meta('T12','theory','変圧器','負荷インピーダンスの一次換算',3,'A','標準',true,['R02','R07']), () => {
    const a=pick([2,3,4,5]), z2=pick([4,8,10,12,20]); const z1=a*a*z2;
    return numericQuestion({}, {prompt:`理想変圧器の巻数比 a=N₁/N₂=${a}、二次負荷 ${z2} Ω である。一次側から見た負荷インピーダンスを求めよ。`,diagram:svgCircuit('transformer'),answer:z1,unit:'Ω',acceptedUnits:['Ω','ohm'],digits:3,hint:'インピーダンスは巻数比の2乗で換算。',formula:'Z₁=a²Z₂',clue:'「一次側から見た」「負荷インピーダンス」が合図。',steps:steps(`a=${a}、Z₂=${z2} Ω。`,'一次換算 Z₁。','Z₁=a²Z₂。',`Z₁=${a}²×${z2}。`,`Z₁=${z1}。`,'Ω',`${z1} Ω。`,'電圧比と違い、インピーダンスは2乗。')});
  });
  add(meta('T13','theory','相互インダクタンス','相互誘導電圧',3,'A','標準',true,['R02','R07']), () => {
    const f=pick([50,60]), m=pick([0.01,0.02,0.05,0.1]), i=pick([1,2,3,5]); const v=2*Math.PI*f*m*i;
    return numericQuestion({}, {prompt:`相互インダクタンス M=${m} H の結合コイルで、一次電流の実効値が ${i} A、周波数 ${f} Hz である。二次側の相互誘導電圧の大きさを求めよ。`,answer:v,unit:'V',acceptedUnits:['V'],digits:3,hint:'大きさは ωMI。符号はドットと電流向きで決まる。',formula:'|V_M|=ωMI, ω=2πf',clue:'「相互インダクタンス」「jωM」が合図。覚え方は「1・2のリーミミーリ」。',steps:steps(`M=${m} H、I=${i} A、f=${f} Hz。`,'相互誘導電圧の大きさ。','|V_M|=ωMI。',`|V_M|=2π×${f}×${m}×${i}。`,`|V_M|=${fmt(v)}。`,'V',`${fmt(v)} V。`,'大きさ問題ではjを数値として掛けない。jは90°位相を示す。')});
  });
  add(meta('T14','theory','交流回路','RC直列の最大電力条件',2,'C','標準',false,['R04']), () => {
    const xc=pick([5,10,20,25]), v=pick([50,100,200]); const r=xc, p=v*v/(2*xc);
    return numericQuestion({}, {prompt:`実効値 ${v} V の交流電源に、可変抵抗 R と容量リアクタンス X_C=${xc} Ω を直列接続した。Rの消費電力が最大となる R を求めよ。`,answer:r,unit:'Ω',acceptedUnits:['Ω','ohm'],digits:3,hint:'P=V²R/(R²+XC²) をRで最大化すると R=XC。',formula:'最大条件 R=X_C',clue:'「可変抵抗の電力が最大」が合図。',steps:steps(`V=${v} V、X_C=${xc} Ω、R可変。`,'最大電力時のR。','P=V²R/(R²+X_C²)、dP/dR=0。',`X_C²−R²=0。`,`R=X_C=${xc}。`,'Ω',`${xc} Ω。`,'最大電力値ではなく、そのときの抵抗値を聞いている。')});
  });

  add(meta('T15','theory','静電気','コンデンサに蓄えられるエネルギー',1,'C','易',false,['範囲補完']), () => {
    const c=pick([1,2,5,10,20,50]), v=pick([10,20,50,100,200]); const w=0.5*c*1e-6*v*v*1000;
    return numericQuestion({}, {prompt:`静電容量 C=${c} μF のコンデンサを ${v} V まで充電した。蓄えられる静電エネルギーを求めよ。`,answer:w,unit:'mJ',acceptedUnits:['mJ'],digits:4,hint:'W=CV²/2。μFをFへ直してから計算する。',formula:'W=1/2 CV²',clue:'「コンデンサに蓄えられるエネルギー」が合図。',steps:steps(`C=${c} μF=${c}×10⁻⁶ F、V=${v} V。`,'静電エネルギーW。','W=CV²/2。',`W=0.5×${c}×10⁻⁶×${v}² J。`,`W=${fmt(w,4)} mJ。`,'mJ',`${fmt(w,4)} mJ。`,'μFの10⁻⁶と、JからmJへの10³を混同しない。')});
  });
  add(meta('T16','theory','磁気回路','起磁力と磁束',1,'C','易',false,['範囲補完']), () => {
    const n=pick([100,200,500,1000]), i=pick([0.2,0.5,1,2]), rm=pick([1e5,2e5,5e5,1e6]); const phi=n*i/rm*1000;
    return numericQuestion({}, {prompt:`巻数 N=${n}、電流 I=${i} A のコイルが、磁気抵抗 ℜ=${rm.toExponential(0)} A/Wb の磁気回路に巻かれている。磁束 Φ を求めよ。`,answer:phi,unit:'mWb',acceptedUnits:['mWb'],digits:4,hint:'電気回路のI=V/Rに対応し、磁束=起磁力/磁気抵抗。',formula:'F=NI, Φ=F/ℜ=NI/ℜ',clue:'「巻数・電流・磁気抵抗」から磁気回路のオーム則。',steps:steps(`N=${n}、I=${i} A、ℜ=${rm.toExponential(0)} A/Wb。`,'磁束Φ。','Φ=NI/ℜ。',`Φ=${n}×${i}/${rm.toExponential(0)} Wb。`,`Φ=${fmt(phi,4)} mWb。`,'mWb',`${fmt(phi,4)} mWb。`,'磁気抵抗を掛けず、起磁力NIを磁気抵抗で割る。')});
  });
  add(meta('T17','theory','電磁誘導','ファラデーの誘導起電力',2,'B','易',false,['範囲補完']), () => {
    const n=pick([50,100,200,500]), dphi=pick([0.2,0.5,1,2,5]), dt=pick([5,10,20,50,100]); const e=n*dphi/dt;
    return numericQuestion({}, {prompt:`${n} 回巻きコイルを貫く磁束が ${dt} ms の間に ${dphi} mWb 変化した。誘導起電力の大きさを求めよ。`,answer:e,unit:'V',acceptedUnits:['V'],digits:4,hint:'大きさはNΔΦ/Δt。mWb/msはWb/sと同じ倍率でVになる。',formula:'|e|=N|ΔΦ|/Δt',clue:'「磁束が時間とともに変化」「巻数」が合図。',steps:steps(`N=${n}、ΔΦ=${dphi} mWb、Δt=${dt} ms。`,'誘導起電力の大きさ。','|e|=N|ΔΦ|/Δt。',`|e|=${n}×${dphi}/${dt}。`,`|e|=${fmt(e,4)} V。`,'V',`${fmt(e,4)} V。`,'レンツの法則のマイナスは向きを表す。大きさ問題では正値で答える。')});
  });
  add(meta('T18','theory','過渡現象','RC回路の時定数',2,'B','易',false,['範囲補完']), () => {
    const r=pick([1,2,5,10,20,50]), c=pick([1,2,5,10,20,50,100]); const tau=r*c;
    return numericQuestion({}, {prompt:`抵抗 R=${r} kΩ、静電容量 C=${c} μF の直列RC回路がある。充電電圧が最終値の約63.2%に達する時間を求めよ。`,answer:tau,unit:'ms',acceptedUnits:['ms'],digits:3,hint:'63.2%に達する時刻は1時定数。kΩ×μF=ms。',formula:'τ=RC',clue:'「最終値の63.2%」「時定数」が合図。',steps:steps(`R=${r} kΩ、C=${c} μF。`,'1時定数τ。','τ=RC。',`τ=${r}×${c} kΩ・μF。`,`τ=${tau} ms。`,'ms',`${tau} ms。`,'5τはほぼ充電完了、63.2%は1τ。')});
  });

  // 自動制御
  add(meta('C01','control','ブロック線図','負帰還の閉ループゲイン',7,'A','易',false,['H30','R01','R03','R04','R05','R06','R07']), () => {
    const g=randInt(2,20), h=pick([0.1,0.2,0.5,1]); const t=g/(1+g*h);
    return numericQuestion({}, {prompt:`前向きゲイン G=${g}、フィードバックゲイン H=${h} の負帰還系の閉ループゲインを求めよ。`,diagram:svgCircuit('feedback'),answer:t,unit:'',requireUnit:false,digits:3,hint:'負帰還は分母が1+GH。',formula:'T=G/(1+GH)',clue:'加算点の戻り側が「−」なら負帰還。',steps:steps(`G=${g}、H=${h}、負帰還。`,'閉ループゲインT。','T=G/(1+GH)。',`T=${g}/(1+${g}×${h})。`,`T=${fmt(t)}。`,'無次元',`${fmt(t)}。`,'負帰還なのに1−GHとしない。')});
  });
  add(meta('C02','control','外乱','外乱から出力への伝達',7,'A','標準',true,['H30','R01','R03','R05','R06','R07']), () => {
    const g=randInt(2,10), k=randInt(1,6); const t=g/(1+g*k);
    return numericQuestion({}, {prompt:`単位フィードバック系で、制御対象ゲイン G=${g}、制御器ゲイン K=${k}。外乱 d は制御対象の直前に加わる。外乱 d から出力 y への定常ゲインを求めよ。`,diagram:svgCircuit('feedback'),answer:t,unit:'',requireUnit:false,digits:3,hint:'外乱入力から見た前向き要素はG、ループゲインはKG。',formula:'Y/D=G/(1+KG)',clue:'「外乱が制御対象の直前に加わる」から、分子にGが残る。',steps:steps(`G=${g}、K=${k}、外乱はプラント直前。`,'Y/D。','Y/D=G/(1+KG)。',`Y/D=${g}/(1+${k}×${g})。`,`Y/D=${fmt(t)}。`,'無次元',`${fmt(t)}。`,'目標値からの伝達 K G/(1+KG) と混同しない。')});
  });
  add(meta('C03','control','最終値定理','一次遅れのステップ最終値',6,'A','易',false,['R01','R02','R05','R06']), () => {
    const k=randInt(1,10), a=randInt(1,8), amp=randInt(1,5); const y=amp*k/a;
    return numericQuestion({}, {prompt:`G(s)=${k}/(s+${a}) の系に大きさ ${amp} の単位ステップ形入力を加える。出力の最終値を求めよ。`,answer:y,unit:'',requireUnit:false,digits:3,hint:'Y(s)=G(s)×amp/s、最終値は lim[sY(s)]。',formula:'y(∞)=lim(s→0)sY(s)',clue:'「十分時間が経過」「最終値」が合図。',steps:steps(`G(s)=${k}/(s+${a})、R(s)=${amp}/s。`,'y(∞)。','y(∞)=lim sG(s)R(s)。',`lim s×${k}/(s+${a})×${amp}/s。`,`y(∞)=${amp}×${k}/${a}=${fmt(y)}。`,'無次元',`${fmt(y)}。`,'安定系であることを確認してから最終値定理を使う。')});
  });
  add(meta('C04','control','定常偏差','タイプ1系のランプ偏差',5,'A','標準',true,['H30','R05','R06']), () => {
    const k=pick([2,4,5,10,20]); const e=1/k;
    return numericQuestion({}, {prompt:`単位フィードバックで開ループ伝達関数 G(s)=${k}/s のタイプ1系がある。単位ランプ入力に対する定常偏差を求めよ。`,answer:e,unit:'',requireUnit:false,digits:3,hint:'速度定数 Kv=lim sG(s)=K、ランプ偏差=1/Kv。',formula:'e_ss=1/K_v, K_v=lim(s→0)sG(s)',clue:'「単位ランプ」「タイプ1」が合図。',steps:steps(`G(s)=${k}/s、単位フィードバック、ランプ入力。`,'定常偏差e_ss。','K_v=lim sG(s)、e_ss=1/K_v。',`K_v=${k}、e_ss=1/${k}。`,`e_ss=${fmt(e)}。`,'無次元',`${fmt(e)}。`,'ステップ入力ならタイプ1系の偏差は0。ランプと区別する。')});
  });
  add(meta('C05','control','極と安定性','極の位置による応答判定',7,'A','易',true,['H30','R01','R04','R05','R06','R07']), () => {
    const cases=[
      {p:'−2±j3',a:'減衰しながら振動して安定',opts:['発散する','振動せず一定振幅','減衰しながら振動して安定','単調に発散']},
      {p:'−4, −1',a:'振動せず単調に収束して安定',opts:['振動せず単調に収束して安定','持続振動','発散振動','不安定']},
      {p:'1±j2',a:'振幅が増えながら振動して不安定',opts:['振動せず収束','振幅が増えながら振動して不安定','持続振動','臨界安定']}
    ]; const c=pick(cases);
    return choiceQuestion({}, {prompt:`閉ループ極が ${c.p} のとき、応答として最も適切なものを選べ。`,options:c.opts,answer:c.a,hint:'実部が安定・発散、虚部が振動の有無を決める。',formula:'実部<0:収束、実部>0:発散、虚部≠0:振動',clue:'極の「実部」と「虚部」を別々に読む。',steps:steps(`極=${c.p}。`,'安定性と応答形。','実部の符号で収束/発散、虚部で振動。','極の実部・虚部を確認。',c.a,'判定問題',c.a,'虚部があるだけで不安定とは限らない。')});
  });
  add(meta('C06','control','ラウスの安定判別','三次式の安定条件',5,'A','標準',true,['H30','R04','R07']), () => {
    const a=randInt(2,8), b=randInt(2,10), max=a*b-1; const k=randInt(1,Math.max(1,max));
    return numericQuestion({}, {prompt:`特性方程式 s³+${a}s²+${b}s+K=0 が安定となる K の上限値を求めよ（K>0）。`,answer:a*b,unit:'',requireUnit:false,digits:3,hint:'三次式 s³+a s²+b s+c は a>0,b>0,c>0, ab>c。',formula:'0<K<ab',clue:'「三次特性方程式」「安定となる範囲」が合図。ラウス表の左端を確認する。',steps:steps(`a=${a}、b=${b}、c=K。`,'安定範囲の上限。','三次式の条件 ab>K。',`K<${a}×${b}。`,`K<${a*b}。上限値は${a*b}。`,'無次元',`${a*b}。`,'等号は安定限界で、厳密な安定ではない。')});
  });
  add(meta('C07','control','二次遅れ','固有角周波数と減衰係数',5,'A','標準',true,['H30','R05','R06']), () => {
    const wn=pick([2,4,5,10]), z=pick([0.2,0.4,0.5,0.7]); const a=2*z*wn, b=wn*wn;
    return numericQuestion({}, {prompt:`特性多項式 s²+${fmt(a)}s+${b} を標準形 s²+2ζωₙs+ωₙ² と比較する。減衰係数 ζ を求めよ。`,answer:z,unit:'',requireUnit:false,digits:3,hint:'定数項からωn、s項からζ。',formula:'ωₙ=√b, ζ=a/(2ωₙ)',clue:'「標準二次系」「s²+as+b」が合図。',steps:steps(`a=${fmt(a)}、b=${b}。`,'ζ。','ωₙ=√b、ζ=a/(2ωₙ)。',`ωₙ=√${b}=${wn}、ζ=${fmt(a)}/(2×${wn})。`,`ζ=${z}。`,'無次元',`${z}。`,'aをそのままζとしない。a=2ζωn。')});
  });
  add(meta('C08','control','二次遅れ','オーバーシュート率',3,'B','難',true,['H30','R05']), () => {
    const z=pick([0.3,0.4,0.5,0.6,0.7]); const mp=Math.exp(-Math.PI*z/Math.sqrt(1-z*z))*100;
    return numericQuestion({}, {prompt:`標準二次系の減衰係数が ζ=${z} である。ステップ応答の最大オーバーシュート率を求めよ。`,answer:mp,unit:'%',acceptedUnits:['%'],digits:2,hint:'Mp=exp(−πζ/√(1−ζ²))×100%。',formula:'M_p=e^(−πζ/√(1−ζ²))×100%',clue:'「最大オーバーシュート」「減衰係数」が合図。',steps:steps(`ζ=${z}。`,'最大オーバーシュート率。','M_p=e^(−πζ/√(1−ζ²))×100。',`M_p=e^(−π×${z}/√(1−${z}²))×100。`,`M_p=${fmt(mp,2)}。`,'%',`${fmt(mp,2)} %。`,'指数の外に×100を付け忘れない。')});
  });
  add(meta('C09','control','ラプラス変換','部分分数分解',4,'B','標準',false,['R07']), () => {
    const a=randInt(1,5), b=randInt(a+1,a+6); const A=1/(b-a), B=-1/(b-a);
    return numericQuestion({}, {prompt:`Y(s)=1/((s+${a})(s+${b})) を A/(s+${a})+B/(s+${b}) と部分分数分解する。係数 A を求めよ。`,answer:A,unit:'',requireUnit:false,digits:4,hint:`s=−${a} を代入するとAだけ残る。`,formula:'A=1/(b−a)',clue:'異なる一次因子の積は、各因子ごとに分ける。',steps:steps(`Y(s)=1/((s+${a})(s+${b}))。`,'係数A。','1=A(s+b)+B(s+a)。',`s=−${a} とすると 1=A(${b}−${a})。`,`A=1/${b-a}=${fmt(A,4)}。`,'無次元',`${fmt(A,4)}。`,'AとBの符号を逆にしない。')});
  });
  add(meta('C10','control','周波数応答','一次遅れのゲイン',3,'B','標準',false,['R02','R04']), () => {
    const t=pick([0.1,0.2,0.5,1]), w=pick([1,2,5,10]); const mag=1/Math.sqrt(1+(w*t)**2);
    return numericQuestion({}, {prompt:`一次遅れ G(s)=1/(1+${t}s) に角周波数 ω=${w} rad/s の正弦波を入力する。ゲイン |G(jω)| を求めよ。`,answer:mag,unit:'',requireUnit:false,digits:4,hint:'s=jωを代入し、複素数の大きさを取る。',formula:'|G(jω)|=1/√(1+(ωT)²)',clue:'「周波数応答」「s=jω」が合図。',steps:steps(`T=${t} s、ω=${w} rad/s。`,'|G(jω)|。','|G|=1/√(1+(ωT)²)。',`|G|=1/√(1+(${w}×${t})²)。`,`|G|=${fmt(mag,4)}。`,'無次元',`${fmt(mag,4)}。`,'jωを実数ωとして足さず、絶対値で平方和を取る。')});
  });
  add(meta('C11','control','ボード線図','極と傾き',3,'B','易',false,['R02','R04']), () => {
    const n=randInt(1,3), slope=-20*n; const ans=`${slope} dB/dec`;
    return choiceQuestion({}, {prompt:`折点周波数より十分高い領域で、一次極を ${n} 個もつ伝達関数のゲイン線図の傾きはどれか。`,options:[ans,`${20*n} dB/dec`,`${-10*n} dB/dec`,'0 dB/dec'],answer:ans,hint:'一次極1個につき−20 dB/dec。',formula:'極: −20 dB/dec/個、零点: +20 dB/dec/個',clue:'「高周波側の傾き」「極の個数」が合図。',steps:steps(`一次極${n}個。`,'高周波側の傾き。','1極当たり−20 dB/dec。',`−20×${n}。`,ans,'dB/dec',ans,'零点はプラス、極はマイナス。')});
  });
  add(meta('C12','control','PID制御','PID各動作の識別',3,'B','易',false,['R03']), () => {
    const c=pick([
      {q:'定常偏差を除去するために特に有効な動作',a:'積分動作',o:['比例動作','積分動作','微分動作','オンオフ動作']},
      {q:'誤差の変化速度を見て先回りし、減衰を高める動作',a:'微分動作',o:['比例動作','積分動作','微分動作','二位置動作']},
      {q:'現在の誤差に比例した操作量を出す基本動作',a:'比例動作',o:['比例動作','積分動作','微分動作','予測動作']}
    ]);
    return choiceQuestion({}, {prompt:`PID制御について、「${c.q}」はどれか。`,options:c.o,answer:c.a,hint:'P=現在、I=過去の累積、D=変化の速さ。',formula:'u=Kp e + Ki∫e dt + Kd de/dt',clue:'問題文の「偏差をなくす」「先回り」「比例」を拾う。',steps:steps(c.q,'該当するPID動作。','PID各項の役割。','文中の機能を対応付ける。',c.a,'知識問題',c.a,'IとDの役割を逆にしない。')});
  });

  add(meta('C13','control','正帰還','正帰還の閉ループゲイン',2,'B','易',false,['範囲補完']), () => {
    const g=pick([2,3,4,5]), h=pick([0.05,0.1,0.15]); const loop=g*h;
    const t=g/(1-loop);
    return numericQuestion({}, {prompt:`前向きゲイン G=${g}、フィードバックゲイン H=${h} の正帰還系がある（GH<1）。閉ループゲインを求めよ。`,answer:t,unit:'',requireUnit:false,digits:4,hint:'正帰還は分母が1−GH。',formula:'T=G/(1−GH)',clue:'加算点の戻り側が「＋」なら正帰還。',steps:steps(`G=${g}、H=${h}、正帰還、GH=${fmt(loop)}<1。`,'閉ループゲインT。','T=G/(1−GH)。',`T=${g}/(1−${g}×${h})。`,`T=${fmt(t,4)}。`,'無次元',`${fmt(t,4)}。`,'負帰還の1+GHと逆。GHが1へ近づくとゲインが大きくなり不安定化しやすい。')});
  });

  // 電気計測
  add(meta('M01','measurement','直流電力測定','電圧計内側接続の誤差',3,'A','標準',true,['R02','R06']), () => {
    const v=pick([10,20,50,100]), i=pick([0.2,0.5,1,2]), rv=pick([1000,2000,5000,10000]); const p=v*i-v*v/rv;
    return numericQuestion({}, {prompt:`直流電力測定で、電圧計を負荷と並列、電流計をその外側に接続した。指示値 V=${v} V、I=${i} A、電圧計内部抵抗 r_v=${rv} Ω。負荷の真の消費電力を求めよ。`,diagram:svgCircuit('meters'),answer:p,unit:'W',acceptedUnits:['W'],digits:3,hint:'電流計は負荷電流＋電圧計電流を読む。VIから電圧計消費電力を引く。',formula:'P_L=VI−V²/r_v',clue:'電流計が分岐より電源側なら「電圧計電流も含む」。',steps:steps(`V=${v} V、I=${i} A、r_v=${rv} Ω。`,'負荷の真の電力。','P_L=VI−V²/r_v。',`P_L=${v}×${i}−${v}²/${rv}。`,`P_L=${fmt(p)}。`,'W',`${fmt(p)} W。`,'VIをそのまま負荷電力にすると、電圧計の消費分だけ大きい。')});
  });
  add(meta('M02','measurement','直流電力測定','電流計内側接続の誤差',3,'A','標準',true,['R02','R06']), () => {
    const v=pick([10,20,50,100]), i=pick([0.2,0.5,1,2]), ra=pick([0.05,0.1,0.2,0.5]); const p=v*i-ra*i*i;
    return numericQuestion({}, {prompt:`直流電力測定で、電流計を負荷と直列、電圧計を電流計と負荷の全体に並列接続した。指示値 V=${v} V、I=${i} A、電流計内部抵抗 r_a=${ra} Ω。負荷の真の消費電力を求めよ。`,diagram:svgCircuit('meters'),answer:p,unit:'W',acceptedUnits:['W'],digits:3,hint:'電圧計は負荷電圧＋電流計電圧降下を読む。VIから電流計損失を引く。',formula:'P_L=VI−r_aI²',clue:'電圧計が電流計まで含んで接続されているかを見る。',steps:steps(`V=${v} V、I=${i} A、r_a=${ra} Ω。`,'負荷の真の電力。','P_L=VI−r_aI²。',`P_L=${v}×${i}−${ra}×${i}²。`,`P_L=${fmt(p)}。`,'W',`${fmt(p)} W。`,'VIには電流計の銅損が含まれる。')});
  });
  add(meta('M03','measurement','計器の精度・誤差','階級と最大許容誤差',4,'A','易',false,['R03','R05']), () => {
    const fs=pick([100,150,300,600]), cls=pick([0.2,0.5,1,1.5]); const err=fs*cls/100;
    return numericQuestion({}, {prompt:`フルスケール ${fs} V、階級 ${cls} 級の指示計器がある。最大許容絶対誤差を求めよ。`,answer:err,unit:'V',acceptedUnits:['V'],digits:3,hint:'階級はフルスケールに対する百分率。',formula:'最大誤差=フルスケール×階級/100',clue:'「階級」「フルスケール」が合図。指示値に掛けない。',steps:steps(`FS=${fs} V、階級=${cls}%。`,'最大絶対誤差。','Δ=FS×class/100。',`Δ=${fs}×${cls}/100。`,`Δ=${fmt(err)}。`,'V',`±${fmt(err)} V。`,'測定値ではなくフルスケールに対する誤差。')});
  });
  add(meta('M04','measurement','A/D変換','ADCの分解能',4,'A','易',false,['R03','R06']), () => {
    const n=pick([8,10,12,16]), fs=pick([5,10,20]); const lsb=fs/(2**n)*1000;
    return numericQuestion({}, {prompt:`入力範囲 0～${fs} V の ${n} bit A/D変換器がある。1 LSBの電圧幅を求めよ。`,answer:lsb,unit:'mV',acceptedUnits:['mV'],digits:4,hint:'量子化区間数は2^n。',formula:'ΔV=V_FS/2^n',clue:'「n bit」「分解能」「1 LSB」が合図。',steps:steps(`V_FS=${fs} V、n=${n} bit。`,'1 LSB。','ΔV=V_FS/2^n。',`ΔV=${fs}/${2**n} V。`,`ΔV=${fmt(lsb,4)} mV。`,'mV',`${fmt(lsb,4)} mV。`,'2nではなく2のn乗。')});
  });
  add(meta('M05','measurement','デジタル計測','量子化雑音の実効値',3,'B','標準',false,['R06']), () => {
    const d=pick([0.01,0.02,0.05,0.1,0.2]); const rms=d/Math.sqrt(12);
    return numericQuestion({}, {prompt:`量子化幅 ΔV=${d} V、量子化誤差が −ΔV/2～+ΔV/2 に一様分布するとする。量子化雑音の実効値を求めよ。`,answer:rms,unit:'V',acceptedUnits:['V'],digits:5,hint:'一様分布の分散はΔ²/12。実効値は標準偏差。',formula:'V_q,rms=ΔV/√12',clue:'「一様分布」「−Δ/2～+Δ/2」が合図。',steps:steps(`ΔV=${d} V。`,'量子化雑音RMS。','V_q=ΔV/√12。',`V_q=${d}/√12。`,`V_q=${fmt(rms,5)}。`,'V',`${fmt(rms,5)} V。`,'分散Δ²/12と実効値Δ/√12を混同しない。')});
  });
  add(meta('M06','measurement','サンプリング','ナイキスト周波数',4,'A','易',false,['R03','R05','R07']), () => {
    const f=pick([50,100,200,500,1000]); const fs=2*f;
    return numericQuestion({}, {prompt:`最高周波数 ${f} Hz を含む信号をエイリアシングなく標本化する。理論上必要な最小サンプリング周波数を求めよ。`,answer:fs,unit:'Hz',acceptedUnits:['Hz'],digits:3,hint:'標本化定理では最高周波数の2倍より高くする。',formula:'f_s ≥ 2f_max',clue:'「エイリアシングなく」「最高周波数」が合図。',steps:steps(`f_max=${f} Hz。`,'最小f_s。','f_s≥2f_max。',`f_s≥2×${f}。`,`境界値は${fs}。`,'Hz',`${fs} Hz以上。`,'実機では余裕を持って2倍より高くする。')});
  });
  add(meta('M07','measurement','オシロスコープ','時間軸から周波数',3,'B','易',false,['H30','R05']), () => {
    const div=pick([2,2.5,4,5]), ms=pick([0.1,0.2,0.5,1,2]); const t=div*ms/1000, f=1/t;
    return numericQuestion({}, {prompt:`オシロスコープの時間軸が ${ms} ms/div、1周期が ${div} div で表示された。周波数を求めよ。`,answer:f,unit:'Hz',acceptedUnits:['Hz'],digits:3,hint:'周期=ms/div×div。秒へ直してf=1/T。',formula:'T=(time/div)×div, f=1/T',clue:'「時間軸」「1周期が何div」が合図。',steps:steps(`${ms} ms/div、1周期=${div} div。`,'周波数f。','T=${ms}×${div} ms、f=1/T。',`T=${fmt(div*ms)} ms=${fmt(t,6)} s。`,`f=1/${fmt(t,6)}=${fmt(f)}。`,'Hz',`${fmt(f)} Hz。`,'msをsへ直さず逆数を取らない。')});
  });
  add(meta('M08','measurement','交流測定','正弦波の実効値',4,'A','易',false,['R07']), () => {
    const peak=pick([10,20,50,100,200]); const rms=peak/Math.sqrt(2);
    return numericQuestion({}, {prompt:`正弦波電圧の最大値が ${peak} V である。実効値を求めよ。`,answer:rms,unit:'V',acceptedUnits:['V'],digits:3,hint:'正弦波の実効値=最大値/√2。',formula:'V_rms=V_m/√2',clue:'「正弦波」「最大値」「実効値」が合図。',steps:steps(`V_m=${peak} V。`,'V_rms。','V_rms=V_m/√2。',`V_rms=${peak}/√2。`,`V_rms=${fmt(rms)}。`,'V',`${fmt(rms)} V。`,'平均値2Vm/πと混同しない。')});
  });
  add(meta('M09','measurement','センサ・変換器','センサ原理の識別',4,'B','易',false,['H30','R02','R04','R05']), () => {
    const c=pick([
      {q:'異種金属の接点間の温度差による起電力を利用する',a:'熱電対',o:['熱電対','測温抵抗体','ひずみゲージ','圧電センサ']},
      {q:'金属線の電気抵抗が温度で変化する性質を利用する',a:'測温抵抗体',o:['熱電対','測温抵抗体','ホール素子','フォトダイオード']},
      {q:'金属箔の伸び縮みによる抵抗変化をブリッジで測る',a:'ひずみゲージ',o:['熱電対','ひずみゲージ','圧電センサ','サーミスタ']},
      {q:'機械的な力で結晶に電荷が生じる現象を利用する',a:'圧電センサ',o:['測温抵抗体','圧電センサ','電磁流量計','光電センサ']}
    ]);
    return choiceQuestion({}, {prompt:`次の説明に対応するセンサを選べ。「${c.q}」`,options:c.o,answer:c.a,hint:'起電力=熱電対、抵抗温度=RTD、抵抗ひずみ=ゲージ、電荷=圧電。',formula:'センサの変換原理',clue:'問題文の「起電力・抵抗・電荷」の語を拾う。',steps:steps(c.q,'センサ名称。','変換原理を対応させる。','キーワードで識別。',c.a,'知識問題',c.a,'測る対象ではなく、変換原理で見分ける。')});
  });

  add(meta('M10','measurement','有効数字','指定桁への丸め',1,'C','易',false,['範囲補完']), () => {
    const c=pick([
      {value:'12.345',digits:3,answer:'12.3',options:['12.3','12.34','12.4','123']},
      {value:'0.004567',digits:3,answer:'0.00457',options:['0.00457','0.00456','0.0457','0.0046']},
      {value:'98765',digits:3,answer:'9.88×10⁴',options:['9.88×10⁴','9.87×10⁴','9.8765×10⁴','988']},
      {value:'3.14159',digits:4,answer:'3.142',options:['3.142','3.141','3.14','3.1416']}
    ]);
    return choiceQuestion({}, {prompt:`数値 ${c.value} を有効数字 ${c.digits} 桁に丸めたものを選べ。`,options:c.options,answer:c.answer,hint:'最初の0でない数字から桁数を数え、次の桁を四捨五入する。',formula:'有効数字：最初の0でない数字から数える',clue:'「有効数字○桁」が合図。小数点以下○桁とは別。',steps:steps(`元の値=${c.value}、有効数字${c.digits}桁。`,'指定桁に丸めた値。','最初の0でない桁から数える。','残す最終桁の次を四捨五入。',c.answer,'表記に従う',c.answer,'小数点以下の桁数と混同しない。末尾0が有効な場合は表記にも意味がある。')});
  });
  add(meta('M11','measurement','D/A変換','理想DACの出力電圧',2,'B','標準',false,['範囲補完']), () => {
    const n=pick([8,10,12]), vref=pick([2.5,5,10]), d=pick([16,32,64,100,128,200]); const max=2**n-1; const code=Math.min(d,max); const v=code*vref/(2**n);
    return numericQuestion({}, {prompt:`${n} bitの理想D/A変換器で、1 LSBを V_ref/2^${n} と定義する。V_ref=${vref} V、入力コード D=${code} のとき出力電圧を求めよ。`,answer:v,unit:'V',acceptedUnits:['V'],digits:5,hint:'問題文で1LSBの定義を確認し、D倍する。',formula:'V_out=D×V_ref/2^n',clue:'「D/A変換」「入力コード」「1 LSB」が合図。',steps:steps(`n=${n} bit、V_ref=${vref} V、D=${code}。`,'出力電圧V_out。','V_out=D×V_ref/2^n。',`V_out=${code}×${vref}/${2**n}。`,`V_out=${fmt(v,5)} V。`,'V',`${fmt(v,5)} V。`,'2^nと2^n−1のどちらを使うかは、問題文の1LSB定義に従う。')});
  });

  // 情報処理
  add(meta('I01','information','二進数','十進数から二進数',2,'C','易',false,['R01','R04']), () => {
    const n=randInt(5,63), ans=n.toString(2);
    const distractors=[];
    for (const d of [n+1,n-1,n+2,n-2,n+3]) {
      const value=Math.max(1,d).toString(2);
      if (value!==ans && !distractors.includes(value)) distractors.push(value);
      if (distractors.length===3) break;
    }
    return choiceQuestion({}, {prompt:`十進数 ${n} を二進数で表したものを選べ。`,options:[ans,...distractors],answer:ans,hint:'2のべき乗へ分解する。',formula:'十進数=Σ(bit×2^桁)',clue:'「二進数で表す」が合図。',steps:steps(`十進数${n}。`,'二進表現。','2のべき乗へ分解。',`${n}を2進変換。`,ans,'2進数',ans,'桁の重みは右から1,2,4,8…。')});
  });
  add(meta('I02','information','論理回路','NANDの出力',2,'C','易',false,['R01']), () => {
    const a=randInt(0,1), b=randInt(0,1), y=Number(!(a&&b));
    return choiceQuestion({}, {prompt:`NAND回路に A=${a}、B=${b} を入力した。出力Yを選べ。`,options:['0','1','不定','ハイインピーダンス'],answer:String(y),hint:'ANDを計算してから反転。',formula:'Y=¬(A・B)',clue:'NANDはAND＋NOT。',steps:steps(`A=${a}、B=${b}。`,'NAND出力。','Y=¬(A・B)。',`A・B=${a*b}、反転。`,String(y),'論理値',String(y),'ORと混同しない。')});
  });
  add(meta('I03','information','情報量','必要ビット数',2,'C','易',false,['R03','R06']), () => {
    const levels=pick([8,16,32,64,128,256,1024]); const bits=Math.log2(levels);
    return numericQuestion({}, {prompt:`${levels} 種類の状態を重複なく表現するために必要な最小ビット数を求めよ。`,answer:bits,unit:'bit',acceptedUnits:['bit','bits'],digits:0,hint:'2^n ≥ 状態数。',formula:'n=ceil(log₂N)',clue:'「何種類を表現」「最小ビット数」が合図。',steps:steps(`状態数N=${levels}。`,'最小n。','2^n≥N。',`2^${bits}=${levels}。`,`n=${bits}。`,'bit',`${bits} bit。`,'状態数そのものをビット数にしない。')});
  });
  add(meta('I04','information','情報システム','情報処理の基礎知識',2,'C','易',false,['H30','R02','R03','R04','R05','R06','R07']), () => {
    const c=pick([
      {q:'同じデータを複数ディスクへ書き込み冗長化する方式',a:'ミラーリング',o:['ストライピング','ミラーリング','キャッシュ','デフラグ']},
      {q:'機密性・完全性・可用性の三要素のうち、許可された利用者だけがアクセスできる性質',a:'機密性',o:['完全性','可用性','機密性','保守性']},
      {q:'標本化周波数が不足すると発生する、偽の低周波成分',a:'エイリアシング',o:['エイリアシング','量子化','パリティ','スプーリング']},
      {q:'IPv4アドレスを自動的に割り当てるプロトコル',a:'DHCP',o:['HTTP','FTP','DHCP','SMTP']}
    ]);
    return choiceQuestion({}, {prompt:`情報処理について、「${c.q}」に該当するものを選べ。`,options:c.o,answer:c.a,hint:'用語と役割を1対1で整理する。',formula:'情報処理用語',clue:'定義文の中心語を拾う。',steps:steps(c.q,'該当用語。','定義との対応。','選択肢を役割で比較。',c.a,'知識問題',c.a,'似た用語は目的で区別する。')});
  });


  // 頻出テーマの知識問題（計算パターンと分けて反復）
  add(meta('K01','theory','交流回路','RLCの虚数符号',7,'A','易',false,['H30','R01','R03','R04','R05','R06','R07']), () => {
    return choiceQuestion({}, {prompt:'直列RLC回路の合成インピーダンスとして正しい式を選べ。',options:['Z=R+j(XL−XC)','Z=R+j(XL+XC)','Z=R−j(XL+XC)','Z=R+XL−XC'],answer:'Z=R+j(XL−XC)',hint:'コイルは+j、コンデンサは−j。',formula:'Z=R+j(XL−XC)',clue:'RLC直列では、LとCのリアクタンスは逆符号。',steps:steps('直列RLC。','合成インピーダンスの式。','Z=R+j(XL−XC)。','Lは+j、Cは−j。','Z=R+j(XL−XC)。','Ω','Z=R+j(XL−XC)。','XLとXCを同符号で足さない。')});
  });
  add(meta('K02','theory','三相交流','Y結線の線間電圧',7,'A','易',false,['H30','R01','R03','R04','R05','R06','R07']), () => {
    return choiceQuestion({}, {prompt:'平衡三相Y結線で、線間電圧VLと相電圧VPの関係として正しいものを選べ。',options:['VL=√3VP','VL=VP','VL=VP/√3','VL=3VP'],answer:'VL=√3VP',hint:'Y結線の電圧は線間が√3倍。',formula:'VL=√3VP',clue:'Y結線・線間電圧・相電圧が合図。',steps:steps('平衡三相Y結線。','線間電圧と相電圧の関係。','VL=√3VP。','ベクトル差で√3倍。','VL=√3VP。','V','VL=√3VP。','電流はY結線でIL=IP。')});
  });
  add(meta('K03','theory','複素電力','複素電力の符号',6,'A','易',false,['R01','R03','R04','R05','R06','R07']), () => {
    return choiceQuestion({}, {prompt:'誘導性負荷の複素電力S=P+jQについて、無効電力Qの符号はどうなるか。',options:['正','負','0','力率によらず不定'],answer:'正',hint:'誘導性は遅れ、Qは正。',formula:'S=P+jQ',clue:'誘導性・遅れ力率ならQ>0。',steps:steps('誘導性負荷。','Qの符号。','S=P+jQ。','遅れ力率ではQ>0。','正。','var','正。','容量性負荷はQ<0。')});
  });
  add(meta('K04','theory','変圧器','インピーダンス換算',5,'A','易',true,['R02','R07']), () => {
    return choiceQuestion({}, {prompt:'理想変圧器で、二次側インピーダンスZ2を一次側へ換算する式を選べ。巻数比はa=N1/N2とする。',options:['Z1=a²Z2','Z1=aZ2','Z1=Z2/a','Z1=Z2/a²'],answer:'Z1=a²Z2',hint:'インピーダンスは巻数比の2乗。',formula:'Z1=a²Z2',clue:'変圧器のインピーダンス換算は比の2乗。',steps:steps('理想変圧器、a=N1/N2。','一次換算インピーダンス。','Z1=a²Z2。','電圧比と電流比の積で2乗。','Z1=a²Z2。','Ω','Z1=a²Z2。','電圧比と同じa倍ではない。')});
  });
  add(meta('K05','theory','相互インダクタンス','相互項の符号',5,'A','標準',true,['R02','R07']), () => {
    return choiceQuestion({}, {prompt:'結合コイルの相互誘導項の符号を決める主な情報はどれか。',options:['ドット極性と電流方向','巻線抵抗だけ','周波数だけ','コイルの外形だけ'],answer:'ドット極性と電流方向',hint:'同名端へ同時に流入するかを見る。',formula:'相互項は±jωM',clue:'ドット極性と電流の向きでプラス・マイナスを決める。',steps:steps('結合コイル。','相互項の符号判断。','±jωM。','ドットと電流方向を確認。','ドット極性と電流方向。','知識問題','ドット極性と電流方向。','Mの大きさだけでは符号は決まらない。')});
  });
  add(meta('K06','control','ブロック線図','負帰還の分母',7,'A','易',false,['H30','R01','R03','R04','R05','R06','R07']), () => {
    return choiceQuestion({}, {prompt:'前向き伝達G、フィードバック伝達Hの負帰還系の閉ループ伝達関数を選べ。',options:['G/(1+GH)','G/(1−GH)','GH/(1+G)','1/(G+H)'],answer:'G/(1+GH)',hint:'負帰還は分母が1+GH。',formula:'T=G/(1+GH)',clue:'戻り側の符号が−なら分母は1+GH。',steps:steps('負帰還系。','閉ループ伝達関数。','T=G/(1+GH)。','ループゲインはGH。','G/(1+GH)。','知識問題','G/(1+GH)。','正帰還の1−GHと逆。')});
  });
  add(meta('K07','control','外乱','外乱経路の分子',7,'A','標準',true,['H30','R01','R03','R05','R06','R07']), () => {
    return choiceQuestion({}, {prompt:'制御対象Gの直前に外乱dが加わる負帰還系で、dから出力yへの伝達関数の分子に残る要素はどれか。',options:['G','K','KG','1'],answer:'G',hint:'外乱が入った後、出力までに通る要素を見る。',formula:'Y/D=G/(1+KG)',clue:'外乱位置から出力までの経路が分子。',steps:steps('外乱は制御対象Gの直前。','外乱から出力への分子。','Y/D=G/(1+KG)。','外乱はGを通って出力へ届く。','G。','知識問題','G。','目標値経路のKGと混同しない。')});
  });
  add(meta('K08','control','極と安定性','極の実部と応答',7,'A','易',true,['H30','R01','R04','R05','R06','R07']), () => {
    return choiceQuestion({}, {prompt:'閉ループ極が−2±j3のとき、応答として最も適切なものを選べ。',options:['減衰しながら振動する','振幅が増えながら振動する','振動せず発散する','一定振幅で持続振動する'],answer:'減衰しながら振動する',hint:'実部が負なら減衰、虚部があれば振動。',formula:'実部<0で安定、虚部≠0で振動',clue:'実部と虚部を別々に読む。',steps:steps('極=−2±j3。','応答の形。','実部<0、虚部≠0。','減衰＋振動。','減衰しながら振動する。','知識問題','減衰しながら振動する。','虚部があるだけで不安定ではない。')});
  });
  add(meta('K09','control','ラウスの安定判別','ラウス表の判定箇所',5,'A','易',true,['H30','R04','R07']), () => {
    return choiceQuestion({}, {prompt:'ラウス表で右半平面の根の個数を判定するとき、主に確認する箇所はどれか。',options:['第1列の符号変化','最上段の係数和','最終列の絶対値','対角成分の積'],answer:'第1列の符号変化',hint:'左端の列を見る。',formula:'第1列の符号変化数=右半平面根の個数',clue:'ラウス表では左端、つまり第1列を見る。',steps:steps('ラウス表。','不安定根の個数。','第1列の符号変化数。','左端を上から確認。','第1列の符号変化。','知識問題','第1列の符号変化。','行全体ではなく第1列を見る。')});
  });
  add(meta('K10','control','最終値定理','最終値定理の使用条件',6,'A','標準',false,['R01','R02','R05','R06']), () => {
    return choiceQuestion({}, {prompt:'最終値定理を安全に使うための条件として最も適切なものを選べ。',options:['sY(s)の極が原点を除き左半平面にある','Y(s)に必ず積分器がある','入力が正弦波である','閉ループ極に右半平面根がある'],answer:'sY(s)の極が原点を除き左半平面にある',hint:'最終値が存在する安定な応答で使う。',formula:'lim y(t)=lim sY(s)',clue:'不安定系や持続振動では最終値が存在しない。',steps:steps('最終値定理。','使用条件。','sY(s)の極を確認。','原点以外は左半平面。','sY(s)の極が原点を除き左半平面にある。','知識問題','sY(s)の極が原点を除き左半平面にある。','式だけ当てはめず安定性を確認する。')});
  });
  add(meta('K11','measurement','直流電力測定','接続誤差の見分け方',5,'A','標準',true,['R02','R06']), () => {
    return choiceQuestion({}, {prompt:'直流電力測定で、電流計が負荷電流と電圧計電流の両方を読む接続の場合、VIから差し引くべきものはどれか。',options:['電圧計の消費電力V²/rv','電流計の損失raI²','負荷の無効電力','何も引かない'],answer:'電圧計の消費電力V²/rv',hint:'電流計が余分に読んでいる電流の行き先を見る。',formula:'PL=VI−V²/rv',clue:'電流計が電圧計電流まで含むなら、電圧計消費分を引く。',steps:steps('電流計が負荷電流＋電圧計電流を測定。','VIに含まれる余分な電力。','V²/rv。','電圧計の消費電力を差し引く。','電圧計の消費電力V²/rv。','W','電圧計の消費電力V²/rv。','接続位置で引く損失が変わる。')});
  });
  add(meta('K12','measurement','サンプリング','標本化定理の意味',5,'A','易',false,['R03','R05','R07']), () => {
    return choiceQuestion({}, {prompt:'最高周波数fmaxの信号を理論上エイリアシングなく標本化する条件を選べ。',options:['fs≥2fmax','fs≥fmax/2','fs=fmax','fs≤2fmax'],answer:'fs≥2fmax',hint:'最高周波数の2倍以上。',formula:'fs≥2fmax',clue:'エイリアシング防止・最高周波数が合図。',steps:steps('最高周波数fmax。','必要な標本化周波数。','fs≥2fmax。','ナイキスト条件。','fs≥2fmax。','Hz','fs≥2fmax。','実機では境界より余裕を取る。')});
  });

  const FORMULAS = [
    {category:'電気・電子理論',title:'直列RLC',formula:'Z=R+j(ωL−1/ωC)',symbols:'R:抵抗[Ω]、L:インダクタンス[H]、C:静電容量[F]、ω:角周波数[rad/s]',condition:'正弦波定常状態・直列回路',clue:'R・L・Cが直列、jωを含む',mistake:'XLとXCを同符号で足さない',patterns:['T02','T03']},
    {category:'電気・電子理論',title:'三相有効電力',formula:'P=√3V_LI_Lcosφ',symbols:'V_L:線間電圧[V]、I_L:線電流[A]',condition:'平衡三相・線間値',clue:'線間電圧、線電流、力率',mistake:'3倍と√3倍を混同しない',patterns:['T06','T10']},
    {category:'電気・電子理論',title:'相互インダクタンス',formula:'V₁=jωL₁I₁±jωMI₂、V₂=±jωMI₁+jωL₂I₂',symbols:'M:相互インダクタンス[H]',condition:'結合コイル・ドット極性に従う',clue:'結合コイル、相互、jωM',mistake:'符号はドットと電流向きで決定。覚え方「1・2のリーミミーリ」',patterns:['T13']},
    {category:'電気・電子理論',title:'理想変圧器',formula:'V₁/V₂=N₁/N₂、Z₁=(N₁/N₂)²Z₂',symbols:'N:巻数、Z:インピーダンス[Ω]',condition:'理想変圧器',clue:'巻数比、一次換算・二次換算',mistake:'インピーダンスは比の2乗',patterns:['T11','T12']},
    {category:'自動制御',title:'負帰還伝達関数',formula:'G_cl=G/(1+GH)',symbols:'G:前向き伝達、H:フィードバック伝達',condition:'負帰還',clue:'加算点の戻り側が−',mistake:'負帰還は分母が1+GH',patterns:['C01','C02']},
    {category:'自動制御',title:'最終値定理',formula:'lim y(t)=lim sY(s)',symbols:'s:ラプラス演算子',condition:'sY(s)の極が左半平面（原点を除く）',clue:'十分時間後、定常値、最終値',mistake:'不安定系へ使わない',patterns:['C03','C04']},
    {category:'自動制御',title:'二次標準形',formula:'s²+2ζωₙs+ωₙ²',symbols:'ζ:減衰係数、ωₙ:固有角周波数[rad/s]',condition:'二次遅れ系',clue:'極、オーバーシュート、立上り時間',mistake:'s係数はζではなく2ζωₙ',patterns:['C05','C07','C08']},
    {category:'自動制御',title:'角速度の関係',formula:'ω=v/r=θ/t',symbols:'v:周速度[m/s]、r:半径[m]、θ:角度[rad]、t:時間[s]',condition:'回転運動',clue:'半径・周速度・角度',mistake:'覚え方「アヴちゃんと手下」',patterns:[]},
    {category:'電気計測',title:'直流電力測定誤差',formula:'電圧計電流を含む: P=VI−V²/r_v、電流計電圧降下を含む: P=VI−r_aI²',symbols:'r_v:電圧計内部抵抗、r_a:電流計内部抵抗',condition:'電圧計・電流計の接続位置を確認',clue:'真の負荷電力、内部抵抗、接続図',mistake:'どちらの計器損失をVIから引くかを図で判定',patterns:['M01','M02']},
    {category:'電気計測',title:'標本化定理',formula:'f_s≥2f_max',symbols:'f_s:標本化周波数[Hz]',condition:'帯域制限信号',clue:'サンプリング、エイリアシング',mistake:'実務では境界値ぴったりでなく余裕を取る',patterns:['M06']},
    {category:'電気・電子理論',title:'静電エネルギー',formula:'W=CV²/2',symbols:'C:静電容量[F]、V:電圧[V]、W:エネルギー[J]',condition:'コンデンサの充電状態',clue:'蓄えられるエネルギー',mistake:'μFをFへ換算する',patterns:['T15']},
    {category:'電気・電子理論',title:'磁気回路のオーム則',formula:'Φ=NI/ℜ',symbols:'N:巻数、I:電流[A]、ℜ:磁気抵抗[A/Wb]、Φ:磁束[Wb]',condition:'磁気回路',clue:'巻数・電流・磁気抵抗',mistake:'起磁力NIを磁気抵抗で割る',patterns:['T16']},
    {category:'電気・電子理論',title:'電磁誘導',formula:'|e|=N|ΔΦ|/Δt',symbols:'N:巻数、Φ:磁束[Wb]、t:時間[s]',condition:'磁束が時間変化する',clue:'磁束変化・巻数・誘導起電力',mistake:'マイナス符号は向き、大きさ問題では正値',patterns:['T17']},
    {category:'電気・電子理論',title:'RC時定数',formula:'τ=RC',symbols:'R:抵抗[Ω]、C:静電容量[F]、τ:時定数[s]',condition:'一次のRC過渡応答',clue:'63.2%、時定数、充放電',mistake:'約99.3%は5τ、63.2%は1τ',patterns:['T18']},
    {category:'自動制御',title:'正帰還伝達関数',formula:'G_cl=G/(1−GH)',symbols:'G:前向き伝達、H:フィードバック伝達',condition:'正帰還',clue:'加算点の戻り側が＋',mistake:'負帰還の1+GHと区別する',patterns:['C13']},
    {category:'電気計測',title:'D/A変換',formula:'V_out=D×V_ref/2^n（1LSB=V_ref/2^nの場合）',symbols:'D:入力コード、n:ビット数、V_ref:基準電圧[V]',condition:'問題文のLSB定義に従う',clue:'D/A、入力コード、基準電圧',mistake:'2^nか2^n−1かを勝手に決めない',patterns:['M11']}
  ];

  const ANALYSIS_SUMMARY = {
    years:['令和7','令和6','令和5','令和4','令和3','令和2','令和元','平成30'],
    priority:[
      {theme:'複素インピーダンス・フェーザ',years:8,importance:'最優先',patterns:5},
      {theme:'三相交流・複素電力・力率',years:8,importance:'最優先',patterns:5},
      {theme:'ブロック線図・閉ループ・外乱',years:7,importance:'最優先',patterns:4},
      {theme:'極・安定性・二次応答・定常値',years:7,importance:'最優先',patterns:6},
      {theme:'変圧器・相互インダクタンス',years:2,importance:'苦手補強',patterns:3},
      {theme:'直流電力測定の接続誤差',years:2,importance:'苦手補強',patterns:2},
      {theme:'A/D・標本化・デジタル計測',years:4,importance:'高',patterns:4},
      {theme:'計器精度・波形測定・センサ',years:5,importance:'中',patterns:4},
      {theme:'情報処理知識',years:8,importance:'低～中（テーマ分散）',patterns:4},
      {theme:'範囲補完（静電・磁気・誘導・過渡・正帰還・D/A・有効数字）',years:'低頻度',importance:'補完',patterns:7}
    ]
  };

  function generateById(id) {
    const p=PATTERNS.find(x=>x.id===id);
    if (!p) throw new Error(`Unknown pattern: ${id}`);
    return p.generate();
  }
  const FREQUENT_PATTERNS = PATTERNS.filter(p => p.priority === 'A');
  function getPatternKind(pattern) {
    if (!pattern.questionKind) pattern.questionKind = pattern.generate().questionKind;
    return pattern.questionKind;
  }
  function selectPatterns(filters={}) {
    return FREQUENT_PATTERNS.filter(p => {
      if (filters.category && p.category!==filters.category) return false;
      if (filters.subcategory && p.subcategory!==filters.subcategory) return false;
      if (filters.kind && getPatternKind(p)!==filters.kind) return false;
      if (filters.weakOnly && !p.weak) return false;
      if (filters.ids && !filters.ids.includes(p.id)) return false;
      return true;
    });
  }
  function buildQuiz(count, filters={}, weighted=false) {
    let pool=selectPatterns(filters);
    if (!pool.length) pool=PATTERNS;
    const result=[];
    for (let i=0;i<count;i++) {
      let p;
      if (weighted) {
        const expanded=[];
        pool.forEach(x=>{ const w=x.priority==='A'?5:x.priority==='B'?3:1; for(let k=0;k<w;k++) expanded.push(x); });
        p=pick(expanded);
      } else p=pick(pool);
      result.push(p.generate());
    }
    return result;
  }

  return { VERSION, CATEGORIES, PATTERNS: FREQUENT_PATTERNS, ALL_PATTERNS: PATTERNS, FORMULAS, ANALYSIS_SUMMARY, generateById, selectPatterns, buildQuiz, checkNumeric, normalizeUnit, parseNumber, fmt, shuffle };
});
