(() => {
  'use strict';

  const DATA = window.ENEKAN;
  if (!DATA) throw new Error('questions.js の読み込みに失敗した');

  const STORAGE_KEY = 'enekan-history-v1';
  const YEAR_DETAILS = [
    { year: '令和7年度（2025）', items: [
      '問題4：相互インダクタンス・理想変圧器の等価回路、平衡三相RL負荷、複素電力、力率改善用Δコンデンサ',
      '問題5：部分分数分解・逆ラプラス、外乱を含む負帰還、閉ループ伝達関数、極・ラウス安定判別、情報処理',
      '問題6：接地抵抗測定、測定法、正弦波の平均・二乗平均・実効値'
    ]},
    { year: '令和6年度（2024）', items: [
      '問題4：交流ブリッジの平衡、平衡・不平衡三相Δ負荷、複素電力とフェーザ',
      '問題5：外乱を含む帰還系、ステップ・ランプ入力の定常偏差、極・根軌跡・オーバーシュート、情報処理',
      '問題6：A/D変換と量子化雑音、直流電力測定の接続誤差、二電力計法'
    ]},
    { year: '令和5年度（2023）', items: [
      '問題4：並列複素インピーダンス、二電力計法、複素電力とフェーザ',
      '問題5：外乱を含むPD帰還、安定性、二次遅れ応答、情報処理',
      '問題6：精度・分解能、FFT・高調波・エイリアシング、センサ'
    ]},
    { year: '令和4年度（2022）', items: [
      '問題4：RC回路の最大電力、不平衡三相回路の重ね合わせ・Δ回路',
      '問題5：不安定プラントの比例帰還、安定条件・定常値、ボード線図、二進数・通信',
      '問題6：交流ブリッジ・変圧器ブリッジ、熱電対・測温抵抗体'
    ]},
    { year: '令和3年度（2021）', items: [
      '問題4：スイッチ切替を含むリアクタンス回路、三相力率改善',
      '問題5：演算増幅器によるPID、情報セキュリティ、記憶装置',
      '問題6：デジタルオシロスコープ、標本化定理、クランプメータのレンジ・精度'
    ]},
    { year: '令和2年度（2020）', items: [
      '問題4：理想変圧器・相互インダクタンス、負荷換算・電力、不平衡三相Δ負荷',
      '問題5：周波数応答・時間応答、ボード線図、正弦波定常応答、信頼性・プログラミング',
      '問題6：直流電力測定の接続誤差、ダイオード、温湿度計測'
    ]},
    { year: '令和元年度（2019）', items: [
      '問題4：フェーザを使う交流ブリッジ、三相回路のリアクトル・コンデンサ補償・複素電力',
      '問題5：多重ブロック線図、外乱、一次遅れ、極・根軌跡、論理・記憶装置',
      '問題6：SI単位、演算増幅器の反転・非反転回路'
    ]},
    { year: '平成30年度（2018）', items: [
      '問題4：直列RLC共振、不平衡三相回路',
      '問題5：外乱を含む帰還系と安定性、二次遅れ・減衰係数・オーバーシュート、情報処理',
      '問題6：オシロスコープ・リサージュ波形、温度センサ'
    ]}
  ];

  const state = {
    quiz: [],
    index: 0,
    mode: 'practice',
    answers: [],
    currentAnswered: false,
    timerId: null,
    examEndAt: 0,
    lastConfig: null,
    currentScreen: 'home',
    quizOrigin: 'home'
  };

  let history = loadHistory();
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function blankHistory() {
    return { attempts: [], streak: 0, bestStreak: 0, customMnemonics: [] };
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return blankHistory();
      const parsed = JSON.parse(raw);
      return {
        attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
        streak: Number(parsed.streak) || 0,
        bestStreak: Number(parsed.bestStreak) || 0,
        customMnemonics: Array.isArray(parsed.customMnemonics) ? parsed.customMnemonics : []
      };
    } catch (error) {
      console.warn('履歴の読み込みに失敗', error);
      return blankHistory();
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      toast('履歴を保存できなかった。ブラウザの保存領域を確認して。');
    }
  }

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function showScreen(name) {
    stopTimer();
    state.currentScreen = name;
    $$('.screen').forEach(el => el.classList.toggle('active', el.id === `screen-${name}`));
    const backButton = $('#backButton');
    if (backButton) backButton.hidden = name === 'home';
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (name === 'home') renderHome();
    if (name === 'practice') updatePracticePool();
    if (name === 'formulas') renderFormulas();
    if (name === 'records') renderRecords();
    if (name === 'analysis') renderAnalysis();
  }

  function goBack() {
    if (state.currentScreen === 'quiz') {
      showScreen(state.quizOrigin || 'home');
      return;
    }
    if (state.currentScreen === 'result') {
      showScreen('home');
      return;
    }
    showScreen('home');
  }

  function categoryLabel(key) {
    return DATA.CATEGORIES[key] || key;
  }

  function formatRate(correct, total) {
    return total ? `${Math.round(correct / total * 100)}%` : '―';
  }

  function summarizeAttempts(attempts = history.attempts) {
    const total = attempts.length;
    const correct = attempts.filter(a => a.correct).length;
    return { total, correct, wrong: total - correct, rate: total ? correct / total : 0 };
  }

  function addAttempt(q, correct, mode) {
    history.attempts.push({
      timestamp: new Date().toISOString(),
      patternId: q.patternId,
      category: q.category,
      subcategory: q.subcategory,
      title: q.title,
      questionKind: q.questionKind,
      correct: Boolean(correct),
      mode
    });
    if (correct) {
      history.streak += 1;
      history.bestStreak = Math.max(history.bestStreak, history.streak);
    } else {
      history.streak = 0;
    }
    if (history.attempts.length > 10000) history.attempts = history.attempts.slice(-10000);
    saveHistory();
  }

  function patternStats() {
    const map = new Map();
    DATA.PATTERNS.forEach(p => map.set(p.id, { pattern: p, attempts: 0, correct: 0, wrong: 0 }));
    history.attempts.forEach(a => {
      if (!map.has(a.patternId)) return;
      const row = map.get(a.patternId);
      row.attempts += 1;
      row.correct += a.correct ? 1 : 0;
      row.wrong += a.correct ? 0 : 1;
    });
    return [...map.values()];
  }

  function wrongPatternIds() {
    return [...new Set(history.attempts.filter(a => !a.correct).map(a => a.patternId))];
  }

  function autoWeakRows() {
    return patternStats()
      .filter(row => row.attempts >= 2 && row.correct / row.attempts < 0.7)
      .sort((a, b) => (a.correct / a.attempts) - (b.correct / b.attempts));
  }

  function renderHome() {
    const s = summarizeAttempts();
    const calculationCount = DATA.selectPatterns({ kind: 'calculation' }).length;
    const knowledgeCount = DATA.selectPatterns({ kind: 'knowledge' }).length;
    const termCount = DATA.PATTERNS.filter(p => /^N\d+$/.test(p.id)).length;
    $('#heroStats').innerHTML = `
      <span>計算 ${calculationCount}パターン</span>
      <span>知識 ${knowledgeCount}（単語 ${termCount}）</span>
      <span>正答率 ${formatRate(s.correct, s.total)}</span>
      <span>連続正解 ${history.streak}問</span>`;
  }

  function populateSelectors() {
    const category = $('#categorySelect');
    const formulaCategory = $('#formulaCategory');
    Object.entries(DATA.CATEGORIES).forEach(([key, label]) => {
      category.insertAdjacentHTML('beforeend', `<option value="${key}">${escapeHtml(label)}</option>`);
      formulaCategory.insertAdjacentHTML('beforeend', `<option value="${key}">${escapeHtml(label)}</option>`);
    });
    updateSubcategories();
  }

  function updateSubcategories() {
    const cat = $('#categorySelect').value;
    const values = [...new Set(DATA.PATTERNS.filter(p => !cat || p.category === cat).map(p => p.subcategory))].sort();
    $('#subcategorySelect').innerHTML = '<option value="">すべて</option>' + values.map(v => `<option>${escapeHtml(v)}</option>`).join('');
    updatePracticePool();
  }

  function practiceFilters() {
    return {
      category: $('#categorySelect').value || undefined,
      subcategory: $('#subcategorySelect').value || undefined,
      kind: $('#questionKindSelect')?.value || undefined,
      weakOnly: $('#weakOnly').checked
    };
  }

  function updatePracticePool() {
    const el = $('#poolCount');
    if (!el) return;
    const count = DATA.selectPatterns(practiceFilters()).length;
    el.textContent = count ? `${count}種類の問題パターンから生成する。` : '条件に合うパターンがないため、条件を少し広げて。';
  }

  function startQuiz(config) {
    const count = Number(config.count) || 10;
    let quiz;
    if (config.ids) {
      const usableIds = config.ids.filter(id => DATA.PATTERNS.some(p => p.id === id));
      if (!usableIds.length) {
        toast('復習できる間違いがまだない。まず問題を解いてみて。');
        return;
      }
      quiz = DATA.buildQuiz(count, { ids: usableIds }, false);
    } else {
      const pool = DATA.selectPatterns(config.filters || {});
      if (!pool.length) {
        toast('条件に合う問題がない。条件を広げて。');
        return;
      }
      quiz = DATA.buildQuiz(count, config.filters || {}, Boolean(config.weighted));
    }

    state.quizOrigin = state.currentScreen || 'home';
    state.quiz = quiz;
    state.index = 0;
    state.mode = config.mode || 'practice';
    state.answers = [];
    state.currentAnswered = false;
    state.lastConfig = structuredCloneSafe(config);
    showScreen('quiz');
    renderQuestion();
    if (state.mode === 'exam') startTimer(config.minutes || (count === 10 ? 15 : 30));
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function renderQuestion() {
    const q = state.quiz[state.index];
    if (!q) return finishQuiz();
    state.currentAnswered = false;
    const total = state.quiz.length;
    $('#quizModeLabel').textContent = state.mode === 'exam' ? '模擬テスト' : state.mode === 'review' ? '復習' : state.mode === 'random' ? 'ランダム' : '練習';
    $('#quizProgress').textContent = `${state.index + 1} / ${total}`;
    $('#progressBar').style.width = `${(state.index / total) * 100}%`;
    $('#questionCategory').textContent = `${q.questionKind === 'calculation' ? '計算問題' : '知識問題'} / ${categoryLabel(q.category)} / ${q.subcategory}`;
    $('#questionDifficulty').textContent = `難易度：${q.difficulty}`;
    $('#questionFrequency').textContent = `頻度指標：${q.frequency}`;
    $('#questionTitle').textContent = q.title;
    $('#questionPrompt').textContent = q.prompt;
    $('#questionDiagram').hidden = !q.diagram;
    $('#questionDiagram').innerHTML = q.diagram || '';
    $('#answerMessage').textContent = '';
    $('#answerMessage').className = 'answer-message';
    $('#explanationPanel').hidden = true;
    $('#quickHelp').hidden = true;
    $('#quickHelp').innerHTML = '';
    $('#submitAnswer').disabled = false;
    $('#submitAnswer').textContent = state.mode === 'exam' ? (state.index === total - 1 ? '採点する' : '次の問題') : '解答する';
    $('#practiceTools').hidden = state.mode === 'exam';
    $('#timerBox').hidden = state.mode !== 'exam';

    $('#choiceAnswer').hidden = false;
    $('#choiceAnswer').innerHTML = q.options.map((option, i) => `
      <label class="choice-option"><input type="radio" name="choice" value="${escapeAttr(option)}"><span>${String.fromCharCode(65 + i)}. ${escapeHtml(option)}</span></label>`).join('');
  }

  function readAnswer(q) {
    const checked = $('input[name="choice"]:checked');
    return checked ? { value: checked.value, unit: '' } : null;
  }

  function judge(q, answer) {
    if (!answer) return { correct: false, missing: true, reason: '答えを選択して。' };
    return { correct: answer.value === q.answer, reason: '' };
  }

  function handleAnswerSubmit(event) {
    event.preventDefault();
    const q = state.quiz[state.index];
    if (!q || state.currentAnswered) return;
    const raw = readAnswer(q);
    const result = judge(q, raw);
    if (result.missing) {
      $('#answerMessage').textContent = result.reason;
      $('#answerMessage').className = 'answer-message error';
      return;
    }

    state.answers[state.index] = { raw, correct: result.correct, reason: result.reason };
    state.currentAnswered = true;

    if (state.mode === 'exam') {
      state.index += 1;
      renderQuestion();
      return;
    }

    addAttempt(q, result.correct, state.mode);
    showExplanation(q, result.correct, raw, result.reason);
  }

  function compactExplanation(q) {
    if (q.questionKind === 'calculation') {
      const calculation = [q.steps[3]?.text, q.steps[4]?.text].filter(Boolean).join('\n');
      return [
        { label: '解法', text: `${q.clue}\n${q.formula}` },
        { label: '計算', text: calculation },
        { label: '注意', text: q.steps[7]?.text || '' }
      ];
    }
    return [
      { label: '根拠', text: `${q.clue}\n${q.formula}` },
      { label: '注意', text: q.steps[7]?.text || '' }
    ];
  }

  function showExplanation(q, correct, raw, reason = '') {
    $('#submitAnswer').disabled = true;
    $('#judgement').className = `judgement ${correct ? 'correct' : 'wrong'}`;
    $('#judgement').textContent = correct ? '○ 正解' : `× 不正解　正解：${q.answerText}${reason ? `（${reason}）` : ''}`;
    $('#explanationSteps').innerHTML = compactExplanation(q).map(step => `<div class="step compact-step"><strong>${escapeHtml(step.label)}</strong><p>${escapeHtml(step.text)}</p></div>`).join('');
    $('#nextButton').textContent = state.index === state.quiz.length - 1 ? '結果を見る' : '次の問題';
    $('#explanationPanel').hidden = false;
    $('#progressBar').style.width = `${((state.index + 1) / state.quiz.length) * 100}%`;
    $('#explanationPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function nextQuestion() {
    if (!state.currentAnswered) return;
    state.index += 1;
    renderQuestion();
  }

  function startTimer(minutes) {
    stopTimer();
    state.examEndAt = Date.now() + minutes * 60 * 1000;
    updateTimer();
    state.timerId = setInterval(updateTimer, 1000);
  }

  function updateTimer() {
    const remaining = Math.max(0, state.examEndAt - Date.now());
    const seconds = Math.ceil(remaining / 1000);
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    $('#timerText').textContent = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    if (remaining <= 0) {
      stopTimer();
      toast('制限時間になったため採点した。');
      finishQuiz();
    }
  }

  function stopTimer() {
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = null;
  }

  function finishQuiz() {
    stopTimer();
    if (state.mode === 'exam') {
      state.quiz.forEach((q, index) => {
        const item = state.answers[index];
        const correct = Boolean(item && item.correct);
        if (!item) state.answers[index] = { raw: null, correct: false, reason: '未解答' };
        addAttempt(q, correct, 'exam');
      });
    }
    renderResult();
    showScreen('result');
  }

  function renderResult() {
    const total = state.quiz.length;
    const correct = state.answers.filter(a => a && a.correct).length;
    const rate = total ? Math.round(correct / total * 100) : 0;
    $('#scoreCircle').textContent = `${correct}/${total}`;
    $('#resultSummary').textContent = `正答率 ${rate}%　不正解 ${total - correct}問`;

    const typeGroups = { calculation: { total: 0, correct: 0 }, knowledge: { total: 0, correct: 0 } };
    const groups = {};
    state.quiz.forEach((q, i) => {
      const key = categoryLabel(q.category);
      if (!groups[key]) groups[key] = { total: 0, correct: 0 };
      groups[key].total += 1;
      groups[key].correct += state.answers[i]?.correct ? 1 : 0;
      const kind = q.questionKind === 'knowledge' ? 'knowledge' : 'calculation';
      typeGroups[kind].total += 1;
      typeGroups[kind].correct += state.answers[i]?.correct ? 1 : 0;
    });
    $('#resultBreakdown').innerHTML = '<h2>問題種別</h2>' +
      barRow('計算問題', typeGroups.calculation.correct, typeGroups.calculation.total) +
      barRow('知識問題', typeGroups.knowledge.correct, typeGroups.knowledge.total) +
      '<h2 class="sub-result-title">分野別結果</h2>' +
      Object.entries(groups).map(([name, row]) => barRow(name, row.correct, row.total)).join('');

    if (state.mode === 'exam') {
      $('#examReview').innerHTML = state.quiz.map((q, i) => {
        const a = state.answers[i];
        const userText = a?.raw ? `${a.raw.value}${a.raw.unit ? ` ${a.raw.unit}` : ''}` : '未解答';
        return `<details class="review-item ${a?.correct ? 'correct' : 'wrong'}">
          <summary>${i + 1}. ${escapeHtml(q.title)} — ${a?.correct ? '正解' : '不正解'}</summary>
          <p><strong>自分の答え：</strong>${escapeHtml(userText)}　<strong>正解：</strong>${escapeHtml(q.answerText)}</p>
          <p><strong>🟦 見分け方：</strong>${escapeHtml(q.clue)}</p>
          ${compactExplanation(q).map(step => `<div class="step compact-step"><strong>${escapeHtml(step.label)}</strong><p>${escapeHtml(step.text)}</p></div>`).join('')}
        </details>`;
      }).join('');
    } else {
      $('#examReview').innerHTML = '';
    }
  }

  function barRow(label, correct, total) {
    const rate = total ? Math.round(correct / total * 100) : 0;
    return `<div class="bar-row"><span>${escapeHtml(label)}</span><div class="bar"><span style="width:${rate}%"></span></div><strong>${total ? `${rate}%` : '―'}</strong></div>`;
  }

  function renderFormulas() {
    const query = $('#formulaSearch').value.trim().toLowerCase();
    const cat = $('#formulaCategory').value;
    const activeIds = new Set(DATA.PATTERNS.map(p => p.id));
    const items = DATA.FORMULAS.filter(item => {
      const categoryKey = Object.entries(DATA.CATEGORIES).find(([, label]) => label === item.category)?.[0] || '';
      if (cat && categoryKey !== cat) return false;
      if (!item.patterns.some(id => activeIds.has(id))) return false;
      const haystack = `${item.category} ${item.title} ${item.formula} ${item.clue} ${item.mistake}`.toLowerCase();
      return !query || haystack.includes(query);
    });
    $('#formulaList').innerHTML = items.length ? items.map(item => `
      <article class="formula-card">
        <p class="eyebrow">${escapeHtml(item.category)}</p><h2>${escapeHtml(item.title)}</h2>
        <div class="formula-expression">${escapeHtml(item.formula)}</div>
        <div class="detail-grid">
          <div><strong>記号・単位</strong>${escapeHtml(item.symbols)}</div>
          <div><strong>使用条件</strong>${escapeHtml(item.condition)}</div>
          <div><strong>問題文での見分け方</strong>${escapeHtml(item.clue)}</div>
          <div><strong>よくある間違い</strong>${escapeHtml(item.mistake)}</div>
        </div>
        <div class="pattern-links">${item.patterns.filter(id => activeIds.has(id)).map(id => `<button class="pattern-link" data-pattern="${id}">${id}を練習</button>`).join('')}</div>
      </article>`).join('') : '<div class="panel">一致する公式がない。</div>';
    renderCustomMnemonics();
  }

  function renderCustomMnemonics() {
    const list = $('#customMnemonicList');
    list.innerHTML = history.customMnemonics.length ? history.customMnemonics.map(item => `
      <div class="custom-mnemonic"><span><strong>${escapeHtml(item.title)}</strong>：${escapeHtml(item.text)}</span><button class="text-button" data-delete-mnemonic="${item.id}">削除</button></div>`).join('') : '<p class="notice">登録した覚え方はこのブラウザ内に保存される。</p>';
  }

  function renderRecords() {
    const s = summarizeAttempts();
    $('#recordCards').innerHTML = [
      ['解答数', `${s.total}問`], ['正解数', `${s.correct}問`], ['正答率', formatRate(s.correct, s.total)], ['最高連続正解', `${history.bestStreak}問`]
    ].map(([label, value]) => `<div class="stat-card"><small>${label}</small><strong>${value}</strong></div>`).join('');

    const patternById = new Map(DATA.PATTERNS.map(p => [p.id, p]));
    const rowsWithKind = history.attempts.map(a => ({ ...a, resolvedKind: a.questionKind || patternById.get(a.patternId)?.questionKind || patternById.get(a.patternId)?.generate?.().questionKind }));
    const calcRows = rowsWithKind.filter(a => a.resolvedKind === 'calculation');
    const knowledgeRows = rowsWithKind.filter(a => a.resolvedKind === 'knowledge');
    $('#categoryStats').innerHTML =
      '<h3 class="record-subtitle">問題種別</h3>' +
      barRow('計算問題', calcRows.filter(a => a.correct).length, calcRows.length) +
      barRow('知識問題', knowledgeRows.filter(a => a.correct).length, knowledgeRows.length) +
      '<h3 class="record-subtitle">分野別</h3>' +
      Object.entries(DATA.CATEGORIES).map(([key, label]) => {
        const rows = history.attempts.filter(a => a.category === key);
        const c = rows.filter(a => a.correct).length;
        return barRow(label, c, rows.length);
      }).join('');

    const rows = patternStats().filter(r => r.attempts).sort((a, b) => (a.correct / a.attempts) - (b.correct / b.attempts));
    $('#patternStats').innerHTML = rows.length ? rows.map(row => `<tr><td>${row.pattern.id} ${escapeHtml(row.pattern.title)}</td><td>${row.attempts}</td><td>${row.correct}</td><td>${formatRate(row.correct, row.attempts)}</td></tr>`).join('') : '<tr><td colspan="4">まだ学習記録がない。</td></tr>';

    const weak = autoWeakRows();
    $('#autoWeakList').innerHTML = weak.length ? weak.map(row => `<button class="chip" data-pattern="${row.pattern.id}">${row.pattern.id} ${escapeHtml(row.pattern.title)}（${formatRate(row.correct, row.attempts)}）</button>`).join('') : '<p>2回以上解いて正答率70%未満のパターンを自動表示する。</p>';
  }

  function renderAnalysis() {
    const table = $('#analysisTable');
    const years = $('#yearAnalysis');
    if (!table || !years) return;
    table.innerHTML = DATA.ANALYSIS_SUMMARY.priority.map(row => `<tr><td>${escapeHtml(row.theme)}</td><td>${typeof row.years === 'number' ? `${row.years}/8` : escapeHtml(row.years)}</td><td>${escapeHtml(row.importance)}</td><td>${row.patterns}</td></tr>`).join('');
    years.innerHTML = YEAR_DETAILS.map(row => `<article class="year-card"><h3>${row.year}</h3><ul>${row.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article>`).join('');
  }

  function exportCsv() {
    const header = ['日時', '問題ID', '問題種別', '大分類', '小分類', '問題名', '結果', 'モード'];
    const rows = history.attempts.map(a => [a.timestamp, a.patternId, a.questionKind === 'knowledge' ? '知識問題' : '計算問題', categoryLabel(a.category), a.subcategory, a.title, a.correct ? '正解' : '不正解', a.mode]);
    const csv = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `電気の基礎_学習履歴_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvCell(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  function resetHistory() {
    const ok = window.confirm('学習履歴と登録した語呂をすべて削除する。この操作は元に戻せない。');
    if (!ok) return;
    history = blankHistory();
    saveHistory();
    renderRecords();
    renderHome();
    toast('学習履歴をリセットした。');
  }

  function updateNetworkBadge() {
    const badge = $('#networkBadge');
    if (!badge) return;
    if (navigator.onLine) {
      badge.textContent = 'オンライン';
      badge.classList.remove('offline');
    } else {
      badge.textContent = 'オフライン動作中';
      badge.classList.add('offline');
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js');
        registration.update().catch(() => {});
      } catch (error) {
        console.warn('Service Workerの登録に失敗', error);
      }
    });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function bindEvents() {
    $('#brandButton').addEventListener('click', () => showScreen('home'));
    $('#backButton').addEventListener('click', goBack);
    document.addEventListener('click', event => {
      const screenButton = event.target.closest('[data-screen]');
      if (screenButton) showScreen(screenButton.dataset.screen);

      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'calculation') startQuiz({ count: 10, filters: { kind: 'calculation' }, weighted: true, mode: 'practice' });
      if (action === 'knowledge') startQuiz({ count: 10, filters: { kind: 'knowledge' }, weighted: true, mode: 'practice' });
      if (action === 'random') startQuiz({ count: 10, filters: {}, weighted: false, mode: 'random' });
      if (action === 'wrong') {
        const ids = wrongPatternIds();
        startQuiz({ count: Math.min(Math.max(ids.length * 2, 5), 20), ids, mode: 'review' });
      }

      const examCount = event.target.closest('[data-exam-count]')?.dataset.examCount;
      if (examCount) startQuiz({ count: Number(examCount), filters: {}, weighted: true, mode: 'exam', minutes: Number(examCount) === 10 ? 15 : 30 });

      const patternId = event.target.closest('[data-pattern]')?.dataset.pattern;
      if (patternId) startQuiz({ count: 5, ids: [patternId], mode: 'practice' });

      const deleteId = event.target.closest('[data-delete-mnemonic]')?.dataset.deleteMnemonic;
      if (deleteId) {
        history.customMnemonics = history.customMnemonics.filter(item => item.id !== deleteId);
        saveHistory();
        renderCustomMnemonics();
      }
    });

    $('#categorySelect').addEventListener('change', updateSubcategories);
    $('#subcategorySelect').addEventListener('change', updatePracticePool);
    $('#frequentOnly')?.addEventListener('change', updatePracticePool);
    $('#questionKindSelect')?.addEventListener('change', updatePracticePool);
    $('#weakOnly').addEventListener('change', updatePracticePool);
    $('#practiceForm').addEventListener('submit', event => {
      event.preventDefault();
      startQuiz({ count: Number($('#questionCount').value), filters: practiceFilters(), weighted: $('#weightedRandom').checked, mode: 'practice' });
    });

    $('#answerForm').addEventListener('submit', handleAnswerSubmit);
    $('#nextButton').addEventListener('click', nextQuestion);
    $('#hintButton').addEventListener('click', () => {
      const q = state.quiz[state.index];
      $('#quickHelp').innerHTML = `<strong>ヒント</strong><br>${escapeHtml(q.hint)}`;
      $('#quickHelp').hidden = false;
    });
    $('#formulaButton').addEventListener('click', () => {
      const q = state.quiz[state.index];
      $('#quickHelp').innerHTML = `<strong>使用公式</strong><br>${escapeHtml(q.formula)}`;
      $('#quickHelp').hidden = false;
    });
    $('#retryButton').addEventListener('click', () => state.lastConfig && startQuiz(state.lastConfig));

    $('#formulaSearch').addEventListener('input', renderFormulas);
    $('#formulaCategory').addEventListener('change', renderFormulas);
    $('#mnemonicForm').addEventListener('submit', event => {
      event.preventDefault();
      history.customMnemonics.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title: $('#mnemonicTitle').value.trim(), text: $('#mnemonicText').value.trim() });
      saveHistory();
      event.target.reset();
      renderCustomMnemonics();
      toast('覚え方を登録した。');
    });
    $('#exportCsv').addEventListener('click', exportCsv);
    $('#resetHistory').addEventListener('click', resetHistory);
    window.addEventListener('online', updateNetworkBadge);
    window.addEventListener('offline', updateNetworkBadge);
  }

  function init() {
    $('#dataVersion').textContent = DATA.VERSION;
    populateSelectors();
    bindEvents();
    renderHome();
    renderAnalysis();
    updateNetworkBadge();
    registerServiceWorker();
  }

  init();
})();
