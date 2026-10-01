const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('./portfolio.js');

const buy = (date, symbol, shares, price, fee = 0) => ({ id: `${date}-${symbol}-b`, type: 'buy', date, symbol, shares, price, fee });
const sell = (date, symbol, shares, price, fee = 0) => ({ id: `${date}-${symbol}-s`, type: 'sell', date, symbol, shares, price, fee });

test('移動平均法で平均取得単価を計算する', () => {
  const { holdings } = P.computeHoldings([
    buy('2025-01-01', 'AAA', 100, 1000),
    buy('2025-02-01', 'AAA', 100, 2000),
  ]);
  assert.equal(holdings[0].shares, 200);
  assert.equal(holdings[0].cost, 300000);
});

test('売却で実現損益を計上し、残りの取得単価は維持する', () => {
  const { holdings } = P.computeHoldings([
    buy('2025-01-01', 'AAA', 100, 1000),
    buy('2025-02-01', 'AAA', 100, 2000),
    sell('2025-03-01', 'AAA', 50, 2500, 100),
  ]);
  const h = holdings[0];
  assert.equal(h.shares, 150);
  assert.equal(h.cost / h.shares, 1500);
  assert.equal(h.realized, 50 * 2500 - 100 - 50 * 1500);
});

test('取引は日付順に処理される（入力順に依存しない）', () => {
  const { holdings, errors } = P.computeHoldings([
    sell('2025-03-01', 'AAA', 100, 1200),
    buy('2025-01-01', 'AAA', 100, 1000),
  ]);
  assert.equal(errors.length, 0);
  assert.equal(holdings[0].shares, 0);
  assert.equal(holdings[0].realized, 20000);
});

test('保有数を超える売却はエラーとして除外する', () => {
  const { holdings, errors } = P.computeHoldings([
    buy('2025-01-01', 'AAA', 10, 1000),
    sell('2025-02-01', 'AAA', 20, 1000),
  ]);
  assert.equal(errors.length, 1);
  assert.equal(holdings[0].shares, 10);
});

test('summarize は評価損益・構成比・配当を集計する', () => {
  const r = P.summarize(
    [
      buy('2025-01-01', 'AAA', 100, 1000),
      buy('2025-01-01', 'BBB', 100, 1000),
      { id: 'd', type: 'dividend', date: '2025-06-01', symbol: 'AAA', amount: 5000, fee: 1000 },
    ],
    { AAA: { price: 1500, name: 'A社' }, BBB: { price: 500 } }
  );
  assert.equal(r.totals.marketValue, 200000);
  assert.equal(r.totals.unrealized, 0);
  assert.equal(r.totals.dividends, 4000);
  assert.equal(r.totals.totalReturn, 4000);
  assert.equal(r.open[0].symbol, 'AAA');
  assert.equal(r.open[0].name, 'A社');
  assert.equal(r.open[0].weight, 0.75);
});

test('株価未設定の銘柄は取得単価で評価する', () => {
  const r = P.summarize([buy('2025-01-01', 'AAA', 10, 1000, 10)], {});
  assert.equal(r.open[0].hasPrice, false);
  assert.equal(r.open[0].unrealized, 0);
});

test('validateTransaction は不正な入力を検出する', () => {
  assert.equal(P.validateTransaction(buy('2025-01-01', 'AAA', 1, 1)), null);
  assert.ok(P.validateTransaction(buy('2025-01-01', '', 1, 1)));
  assert.ok(P.validateTransaction(buy('2025-01-01', 'AAA', 0, 1)));
  assert.ok(P.validateTransaction(buy('', 'AAA', 1, 1)));
  assert.ok(P.validateTransaction({ type: 'dividend', date: '2025-01-01', symbol: 'AAA', amount: 0 }));
});

test('parseState は不正なデータを拒否する', () => {
  assert.throws(() => P.parseState('{}'));
  assert.throws(() => P.parseState({ transactions: [{ type: 'x' }], prices: {} }));
  const ok = P.parseState({ transactions: [buy('2025-01-01', 'AAA', 1, 1)], prices: {} });
  assert.equal(ok.transactions.length, 1);
});
