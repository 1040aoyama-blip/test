(function () {
  'use strict';

  const STORAGE_KEY = 'stock-portfolio-v1';
  const P = window.Portfolio;
  const $ = (id) => document.getElementById(id);

  const TYPE_LABELS = { buy: '買い', sell: '売り', dividend: '配当' };
  const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#0891b2', '#db2777', '#ca8a04', '#4b5563'];

  let state = load();

  // ---------- 永続化 ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return P.parseState(raw);
    } catch (e) {
      console.warn('保存データを読み込めませんでした', e);
    }
    return { transactions: [], prices: {} };
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('保存に失敗しました', e);
    }
  }

  function commit() {
    save();
    render();
  }

  // ---------- 書式 ----------
  const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });
  const num = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 });
  const pct = new Intl.NumberFormat('ja-JP', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtYen = (v) => yen.format(v);
  const fmtSigned = (v) => (v > 0 ? '+' : '') + yen.format(v);
  const fmtSignedPct = (v) => (v > 0 ? '+' : '') + pct.format(v);
  const tone = (v) => (v > 0 ? 'pos' : v < 0 ? 'neg' : '');

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') node.className = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c != null) node.append(c);
    }
    return node;
  }

  // ---------- 描画 ----------
  function render() {
    const result = P.summarize(state.transactions, state.prices);
    renderSummary(result.totals);
    renderErrors(result.errors);
    renderHoldings(result.open);
    renderChart(result.open);
    renderHistory();
    renderClosed(result.closed);
    renderSymbolList();
  }

  function renderSummary(t) {
    const items = [
      ['評価額', fmtYen(t.marketValue), ''],
      ['取得額', fmtYen(t.cost), ''],
      ['評価損益', `${fmtSigned(t.unrealized)}`, tone(t.unrealized), fmtSignedPct(t.unrealizedPct)],
      ['実現損益', fmtSigned(t.realized), tone(t.realized)],
      ['受取配当', fmtYen(t.dividends), ''],
      ['トータルリターン', fmtSigned(t.totalReturn), tone(t.totalReturn)],
    ];
    $('summary').replaceChildren(
      ...items.map(([label, value, cls, sub]) =>
        el('div', { class: 'stat' },
          el('div', { class: 'stat-label' }, label),
          el('div', { class: `stat-value ${cls}` }, value),
          sub ? el('div', { class: `stat-sub ${cls}` }, sub) : null)
      )
    );
  }

  function renderErrors(errors) {
    const box = $('errors');
    box.hidden = errors.length === 0;
    box.replaceChildren(
      el('strong', {}, '計算から除外された取引があります:'),
      el('ul', {}, ...errors.map((e) => el('li', {}, e.message)))
    );
  }

  function renderHoldings(rows) {
    $('holdings-empty').hidden = rows.length > 0;
    $('holdings-body').replaceChildren(
      ...rows.map((r) =>
        el('tr', {},
          el('td', {},
            el('div', { class: 'sym' }, r.symbol),
            r.name ? el('div', { class: 'sym-name' }, r.name) : null),
          el('td', { class: 'num' }, num.format(r.shares)),
          el('td', { class: 'num' }, num.format(r.avgCost)),
          el('td', { class: 'num' }, priceCell(r)),
          el('td', { class: 'num' }, fmtYen(r.marketValue)),
          el('td', { class: `num ${tone(r.unrealized)}` },
            el('div', {}, fmtSigned(r.unrealized)),
            el('div', { class: 'sub' }, fmtSignedPct(r.unrealizedPct))),
          el('td', { class: 'num' }, pct.format(r.weight)))
      )
    );
  }

  function priceCell(r) {
    const btn = el('button', {
      type: 'button',
      class: 'price-btn' + (r.hasPrice ? '' : ' missing'),
      title: r.hasPrice ? '株価を更新' : '株価未設定（取得単価で評価中）',
      onclick: () => editPrice(btn, r),
    }, r.hasPrice ? num.format(r.price) : '未設定');
    return btn;
  }

  function editPrice(btn, r) {
    const input = el('input', {
      type: 'number', min: '0', step: 'any', class: 'price-input',
      'aria-label': `${r.symbol} の現在値`,
    });
    input.value = r.hasPrice ? r.price : '';
    let done = false;
    const finish = (apply) => {
      if (done) return;
      done = true;
      const v = parseFloat(input.value);
      if (apply && Number.isFinite(v) && v >= 0) {
        state.prices[r.symbol] = { ...(state.prices[r.symbol] || {}), price: v, updatedAt: new Date().toISOString() };
        commit();
      } else {
        render();
      }
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
    btn.replaceWith(input);
    input.focus();
    input.select();
  }

  function renderChart(rows) {
    const box = $('chart');
    if (rows.length === 0 || rows.every((r) => r.marketValue <= 0)) {
      box.replaceChildren(el('p', { class: 'empty' }, 'データがありません'));
      return;
    }

    // 上位7銘柄 + その他
    const top = rows.slice(0, COLORS.length - 1);
    const rest = rows.slice(COLORS.length - 1);
    const slices = top.map((r) => ({ label: r.name || r.symbol, value: r.marketValue, weight: r.weight }));
    if (rest.length) {
      slices.push({
        label: 'その他',
        value: rest.reduce((a, r) => a + r.marketValue, 0),
        weight: rest.reduce((a, r) => a + r.weight, 0),
      });
    }

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', '資産配分のドーナツチャート');
    const R = 80, C = 2 * Math.PI * R;
    let offset = 0;
    slices.forEach((s, i) => {
      const len = s.weight * C;
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', '100');
      circle.setAttribute('cy', '100');
      circle.setAttribute('r', String(R));
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', COLORS[i]);
      circle.setAttribute('stroke-width', '32');
      circle.setAttribute('stroke-dasharray', `${len} ${C - len}`);
      circle.setAttribute('stroke-dashoffset', String(-offset));
      circle.setAttribute('transform', 'rotate(-90 100 100)');
      const title = document.createElementNS(NS, 'title');
      title.textContent = `${s.label}: ${pct.format(s.weight)}`;
      circle.append(title);
      svg.append(circle);
      offset += len;
    });

    const legend = el('ul', { class: 'legend' },
      ...slices.map((s, i) =>
        el('li', {},
          el('span', { class: 'swatch', style: `background:${COLORS[i]}` }),
          el('span', { class: 'legend-label' }, s.label),
          el('span', { class: 'legend-value' }, pct.format(s.weight))))
    );
    box.replaceChildren(svg, legend);
  }

  function renderHistory() {
    const list = [...state.transactions].reverse().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    $('history-empty').hidden = list.length > 0;
    $('history-body').replaceChildren(
      ...list.map((tx) => {
        const isDiv = tx.type === 'dividend';
        const amount = isDiv ? tx.amount : tx.shares * tx.price;
        return el('tr', {},
          el('td', {}, tx.date),
          el('td', {}, el('span', { class: `badge ${tx.type}` }, TYPE_LABELS[tx.type])),
          el('td', {}, tx.symbol),
          el('td', { class: 'num' }, isDiv ? '-' : num.format(tx.shares)),
          el('td', { class: 'num' }, isDiv ? '-' : num.format(tx.price)),
          el('td', { class: 'num' }, fmtYen(amount)),
          el('td', { class: 'num' }, fmtYen(tx.fee || 0)),
          el('td', { class: 'num' },
            el('button', {
              type: 'button', class: 'btn-link',
              onclick: () => removeTransaction(tx.id),
            }, '削除')));
      })
    );
  }

  function renderClosed(rows) {
    const closed = rows.filter((r) => r.realized !== 0 || r.dividends !== 0);
    $('closed-section').hidden = closed.length === 0;
    $('closed-body').replaceChildren(
      ...closed.map((r) =>
        el('tr', {},
          el('td', {}, r.name ? `${r.symbol} ${r.name}` : r.symbol),
          el('td', { class: `num ${tone(r.realized)}` }, fmtSigned(r.realized)),
          el('td', { class: 'num' }, fmtYen(r.dividends))))
    );
  }

  function renderSymbolList() {
    $('symbol-list').replaceChildren(
      ...Object.keys(state.prices).sort().map((s) =>
        el('option', { value: s }, state.prices[s].name || ''))
    );
  }

  // ---------- 操作 ----------
  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function removeTransaction(id) {
    if (!confirm('この取引を削除しますか？')) return;
    state.transactions = state.transactions.filter((t) => t.id !== id);
    commit();
  }

  const form = $('tx-form');

  function syncFormType() {
    const isDiv = form.type.value === 'dividend';
    form.querySelector('.trade-only').hidden = isDiv;
    form.querySelector('.dividend-only').hidden = !isDiv;
  }

  form.type.addEventListener('change', syncFormType);

  form.symbol.addEventListener('change', () => {
    const info = state.prices[P.normalizeSymbol(form.symbol.value)];
    if (info && info.name && !form.name.value) form.name.value = info.name;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    const type = f.type.value;
    const symbol = P.normalizeSymbol(f.symbol.value);
    const tx = { id: newId(), type, date: f.date.value, symbol, fee: parseFloat(f.fee.value) || 0 };
    if (type === 'dividend') {
      tx.amount = parseFloat(f.amount.value);
    } else {
      tx.shares = parseFloat(f.shares.value);
      tx.price = parseFloat(f.price.value);
    }

    const err = P.validateTransaction(tx);
    if (err) {
      $('form-error').textContent = err;
      return;
    }
    // 売却前に保有数を確認
    if (type === 'sell') {
      const check = P.computeHoldings(state.transactions.concat(tx)).errors.find((x) => x.id === tx.id);
      if (check) {
        $('form-error').textContent = check.message;
        return;
      }
    }
    $('form-error').textContent = '';

    state.transactions.push(tx);
    const info = state.prices[symbol] || {};
    const name = f.name.value.trim() || info.name || '';
    // 売買時の単価を、株価未設定の銘柄の初期現在値として使う
    const price = typeof info.price === 'number' ? info.price : type !== 'dividend' ? tx.price : undefined;
    state.prices[symbol] = { ...info, name, ...(price !== undefined ? { price } : {}) };
    commit();

    form.reset();
    f.date.value = today();
    f.type.value = type;
    syncFormType();
    f.symbol.focus();
  });

  function today() {
    const d = new Date();
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d - off).toISOString().slice(0, 10);
  }

  // ---------- インポート / エクスポート ----------
  $('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `portfolio-${today()}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $('import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const next = P.parseState(await file.text());
      if (!confirm('現在のデータを読み込んだデータで置き換えますか？')) return;
      state = next;
      commit();
    } catch (err) {
      alert(`インポートに失敗しました: ${err.message}`);
    }
  });

  $('sample-btn').addEventListener('click', () => {
    if (state.transactions.length && !confirm('現在のデータをサンプルデータで置き換えますか？')) return;
    state = sampleData();
    commit();
  });

  function sampleData() {
    const t = (type, date, symbol, shares, price, fee = 0) => ({ id: newId(), type, date, symbol, shares, price, fee });
    return {
      transactions: [
        t('buy', '2025-01-15', '7203', 100, 2650, 55),
        t('buy', '2025-02-03', '6758', 100, 3200, 55),
        t('buy', '2025-03-10', '9984', 100, 8400, 99),
        t('buy', '2025-04-22', '7203', 100, 2400, 55),
        t('buy', '2025-05-12', '8306', 300, 1650, 55),
        { id: newId(), type: 'dividend', date: '2025-06-25', symbol: '7203', amount: 9000, fee: 1828 },
        t('sell', '2025-08-20', '9984', 100, 9800, 99),
        t('buy', '2025-09-01', '4063', 100, 5200, 55),
      ],
      prices: {
        '7203': { name: 'トヨタ自動車', price: 2820 },
        '6758': { name: 'ソニーグループ', price: 3450 },
        '9984': { name: 'ソフトバンクグループ', price: 9800 },
        '8306': { name: '三菱UFJフィナンシャル・グループ', price: 1890 },
        '4063': { name: '信越化学工業', price: 4980 },
      },
    };
  }

  // ---------- 起動 ----------
  form.date.value = today();
  syncFormType();
  render();
})();
