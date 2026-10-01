// ポートフォリオ計算ロジック（DOMに依存しない純粋関数）
// ブラウザでは window.Portfolio、Node では module.exports として利用できる。
(function (root) {
  'use strict';

  const TYPES = ['buy', 'sell', 'dividend'];

  function normalizeSymbol(symbol) {
    return String(symbol || '').trim().toUpperCase();
  }

  // 取引を検証し、問題があればエラーメッセージを返す（なければ null）
  function validateTransaction(tx) {
    if (!TYPES.includes(tx.type)) return '取引種別が不正です';
    if (!normalizeSymbol(tx.symbol)) return '銘柄コードを入力してください';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.date || '')) return '日付を入力してください';
    if (tx.type === 'dividend') {
      if (!(tx.amount > 0)) return '配当金額は0より大きい値を入力してください';
    } else {
      if (!(tx.shares > 0)) return '株数は0より大きい値を入力してください';
      if (!(tx.price >= 0)) return '単価は0以上の値を入力してください';
    }
    if (tx.fee != null && !(tx.fee >= 0)) return '手数料は0以上の値を入力してください';
    return null;
  }

  function sortTransactions(transactions) {
    // 日付順、同日は登録順を維持
    return transactions
      .map((tx, i) => ({ tx, i }))
      .sort((a, b) => (a.tx.date < b.tx.date ? -1 : a.tx.date > b.tx.date ? 1 : a.i - b.i))
      .map((x) => x.tx);
  }

  // 取引履歴から保有状況を計算する（移動平均法）。
  // 保有数を超える売却があった場合は errors に記録し、その取引は無視する。
  function computeHoldings(transactions) {
    const map = new Map();
    const errors = [];

    const get = (symbol) => {
      if (!map.has(symbol)) {
        map.set(symbol, { symbol, shares: 0, cost: 0, realized: 0, dividends: 0, fees: 0 });
      }
      return map.get(symbol);
    };

    for (const tx of sortTransactions(transactions)) {
      const symbol = normalizeSymbol(tx.symbol);
      const h = get(symbol);
      const fee = Number(tx.fee) || 0;

      if (tx.type === 'buy') {
        h.shares += tx.shares;
        h.cost += tx.shares * tx.price + fee;
        h.fees += fee;
      } else if (tx.type === 'sell') {
        if (tx.shares > h.shares + 1e-9) {
          errors.push({ id: tx.id, message: `${symbol}: 保有数(${h.shares})を超える売却です` });
          continue;
        }
        const avg = h.shares > 0 ? h.cost / h.shares : 0;
        const costOfSold = avg * tx.shares;
        h.realized += tx.shares * tx.price - fee - costOfSold;
        h.shares -= tx.shares;
        h.cost -= costOfSold;
        h.fees += fee;
        if (h.shares < 1e-9) {
          h.shares = 0;
          h.cost = 0;
        }
      } else if (tx.type === 'dividend') {
        h.dividends += tx.amount - fee;
        h.fees += fee;
      }
    }

    return { holdings: [...map.values()], errors };
  }

  // 現在値を適用して評価額・損益を算出する
  function summarize(transactions, prices) {
    const { holdings, errors } = computeHoldings(transactions);
    const rows = holdings.map((h) => {
      const avgCost = h.shares > 0 ? h.cost / h.shares : 0;
      const info = prices[h.symbol] || {};
      const hasPrice = typeof info.price === 'number' && info.price >= 0;
      const price = hasPrice ? info.price : avgCost;
      const marketValue = h.shares * price;
      const unrealized = marketValue - h.cost;
      return {
        ...h,
        name: info.name || '',
        avgCost,
        price,
        hasPrice,
        marketValue,
        unrealized,
        unrealizedPct: h.cost > 0 ? unrealized / h.cost : 0,
      };
    });

    const open = rows.filter((r) => r.shares > 0);
    const totals = {
      marketValue: sum(open, 'marketValue'),
      cost: sum(open, 'cost'),
      unrealized: sum(open, 'unrealized'),
      realized: sum(rows, 'realized'),
      dividends: sum(rows, 'dividends'),
    };
    totals.unrealizedPct = totals.cost > 0 ? totals.unrealized / totals.cost : 0;
    totals.totalReturn = totals.unrealized + totals.realized + totals.dividends;

    for (const r of open) {
      r.weight = totals.marketValue > 0 ? r.marketValue / totals.marketValue : 0;
    }

    open.sort((a, b) => b.marketValue - a.marketValue);
    const closed = rows.filter((r) => r.shares === 0);
    return { open, closed, totals, errors };
  }

  function sum(list, key) {
    return list.reduce((acc, x) => acc + x[key], 0);
  }

  // 保存データの読み込み時に形式を検証する
  function parseState(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    if (!data || !Array.isArray(data.transactions) || typeof data.prices !== 'object' || data.prices === null) {
      throw new Error('データ形式が正しくありません');
    }
    for (const tx of data.transactions) {
      const err = validateTransaction(tx);
      if (err) throw new Error(`不正な取引データ: ${err}`);
    }
    return { transactions: data.transactions, prices: data.prices };
  }

  const api = { validateTransaction, computeHoldings, summarize, parseState, normalizeSymbol };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Portfolio = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
