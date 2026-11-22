const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('./wardrobe.js');

const item = (name, category, seasons = [], colors = [], tags = []) =>
  W.normalizeItem({ id: name, name, category, seasons, colors, tags });

test('季節は春夏秋冬の順に並べ替え、重複と不明値を除く', () => {
  assert.deepEqual(W.sortSeasons(['冬', '春', '冬', '梅雨', '秋']), ['春', '秋', '冬']);
});

test('季節ごとのセクションは春→夏→秋→冬→未設定の順', () => {
  const secs = W.groupBySeason([
    item('ダウン', 'コート', ['冬']),
    item('リネンシャツ', 'シャツ', ['夏']),
    item('ベルト', '小物'),
    item('カーディガン', 'ニット', ['秋', '春']),
  ]);
  assert.deepEqual(secs.map((s) => s.season), ['春', '夏', '秋', '冬', '季節未設定']);
});

test('複数季節のアイテムはそれぞれの季節に表示され、空の季節は省略される', () => {
  const secs = W.groupBySeason([item('カーディガン', 'ニット', ['春', '秋'])]);
  assert.deepEqual(secs.map((s) => s.season), ['春', '秋']);
  assert.equal(secs[0].items[0].name, 'カーディガン');
  assert.equal(secs[1].items[0].name, 'カーディガン');
});

test('タブはカテゴリ定義順で、アイテムのあるカテゴリだけを件数つきで出す', () => {
  const tabs = W.buildTabs(
    [item('A', 'ジーンズ'), item('B', 'スラックス'), item('C', 'スラックス'), item('D', '帽子'), item('E', '')],
    ['スラックス', 'ジーンズ', 'ニット'],
  );
  assert.deepEqual(
    tabs.map((t) => [t.label, t.count]),
    [['すべて', 5], ['スラックス', 2], ['ジーンズ', 1], ['帽子', 1], ['未分類', 1]],
  );
});

test('フィルタ: カテゴリ・色・キーワード', () => {
  const a = item('黒スキニー', 'ジーンズ', ['春'], ['黒'], ['お気に入り']);
  assert.ok(W.matchesFilter(a, { category: 'ジーンズ' }));
  assert.ok(!W.matchesFilter(a, { category: 'ニット' }));
  assert.ok(W.matchesFilter(a, { color: '黒' }));
  assert.ok(!W.matchesFilter(a, { color: '白' }));
  assert.ok(W.matchesFilter(a, { query: 'お気に' }));
  assert.ok(!W.matchesFilter(a, { query: 'ダウン' }));
  assert.ok(W.matchesFilter(item('X', ''), { category: '未分類' }));
});

test('バリデーション', () => {
  assert.equal(W.validateItem({ id: '1', name: '  ' }), '名前を入力してください');
  assert.match(W.validateItem({ id: '1', name: 'a', seasons: ['梅雨'] }), /不明な季節/);
  assert.equal(W.validateItem({ id: '1', name: 'a', seasons: ['春'] }), null);
});

test('parseState は不正データを拒否し、カテゴリ未指定なら既定値を使う', () => {
  assert.throws(() => W.parseState('{}'));
  assert.throws(() => W.parseState({ items: [{ id: '1', name: '' }] }));
  const s = W.parseState({ items: [{ id: '1', name: 'T', seasons: ['夏', '春'] }] });
  assert.deepEqual(s.items[0].seasons, ['春', '夏']);
  assert.deepEqual(s.categories, W.DEFAULT_CATEGORIES);
  assert.equal(s.colors.length, W.DEFAULT_COLORS.length);
});
