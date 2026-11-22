const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('./wardrobe.js');

const item = (name, category, seasons = [], colors = [], tags = [], subcategory = '') =>
  W.normalizeItem({ id: name, name, category, subcategory, seasons, colors, tags });

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

test('フィルタ: カテゴリ・色・キーワード', () => {
  const a = item('黒スキニー', 'ボトムス', ['春'], ['黒'], ['お気に入り'], 'ジーンズ');
  assert.ok(W.matchesFilter(a, { category: 'ボトムス' }));
  assert.ok(!W.matchesFilter(a, { category: 'トップス' }));
  assert.ok(W.matchesFilter(a, { category: 'ボトムス', subcategory: 'ジーンズ' }));
  assert.ok(!W.matchesFilter(a, { category: 'ボトムス', subcategory: 'スラックス' }));
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

const state = (items) => {
  const s = W.emptyState();
  s.items = items;
  return s;
};

test('既定のフォルダは大カテゴリー＋サブフォルダ（ボトムスにジーンズ・スラックス・コットンパンツ）', () => {
  const s = W.emptyState();
  assert.deepEqual(s.categories, ['トップス', 'アウター', 'ボトムス', 'ワンピース', 'シューズ', '小物']);
  assert.deepEqual(s.subcategories.ボトムス.slice(0, 3), ['ジーンズ', 'スラックス', 'コットンパンツ']);
});

test('フォルダツリーは空のフォルダも含み、大カテゴリーの件数はサブフォルダ分を含む', () => {
  const t = W.buildFolderTree(
    [item('A', 'ボトムス', [], [], [], 'ジーンズ'), item('B', 'ボトムス'), item('C', 'トップス', [], [], [], 'ニット'), item('D', '')],
    ['トップス', 'ボトムス', 'シューズ'],
    { トップス: ['ニット'], ボトムス: ['ジーンズ', 'スラックス'] },
  );
  assert.equal(t.total, 4);
  assert.equal(t.uncategorized, 1);
  assert.deepEqual(t.folders.map((f) => [f.name, f.count, f.children.map((c) => `${c.name}:${c.count}`)]), [
    ['トップス', 1, ['ニット:1']],
    ['ボトムス', 2, ['ジーンズ:1', 'スラックス:0']],
    ['シューズ', 0, []],
  ]);
});

test('旧形式のデータは大カテゴリーの中へ移行する', () => {
  const s = W.parseState({
    categories: ['ニット', 'パンツ', 'スラックス', '帽子'],
    subcategories: { パンツ: ['ジーンズ', 'ショートパンツ'], ニット: ['カーディガン'], 帽子: ['キャップ'] },
    items: [
      { id: '1', name: 'ウール', category: 'スラックス' },
      { id: '2', name: 'デニム', category: 'パンツ', subcategory: 'ジーンズ' },
      { id: '3', name: '羽織', category: 'ニット', subcategory: 'カーディガン' },
      { id: '4', name: 'キャップ', category: '帽子', subcategory: 'キャップ' },
    ],
  });
  assert.equal(s.layout, 'folders-2');
  assert.ok(s.categories.includes('帽子'));
  assert.ok(!s.categories.includes('ニット'));
  assert.ok(s.subcategories.ボトムス.includes('ショートパンツ'));
  assert.deepEqual(s.subcategories.帽子, ['キャップ']);
  assert.deepEqual(s.items.map((it) => [it.category, it.subcategory]), [
    ['ボトムス', 'スラックス'], ['ボトムス', 'ジーンズ'], ['トップス', 'ニット'], ['帽子', 'キャップ'],
  ]);
  assert.deepEqual(s.items[2].tags, ['カーディガン']);
});

test('新形式のデータはそのまま読み込む（移行は1回だけ）', () => {
  const once = W.parseState({ categories: ['ニット'], items: [{ id: '1', name: 'a', category: 'ニット' }] });
  const twice = W.parseState(JSON.parse(JSON.stringify(once)));
  assert.deepEqual(twice, once);
});

test('フォルダの追加・名前変更・並べ替え・削除', () => {
  const s = state([item('A', 'ボトムス', [], [], [], 'ジーンズ'), item('B', 'ボトムス')]);
  assert.equal(W.addFolder(s, 'ボトムス', 'ショートパンツ'), null);
  assert.match(W.addFolder(s, 'ボトムス', 'ジーンズ'), /同じ名前/);
  assert.match(W.addFolder(s, '', ' '), /入力/);
  assert.equal(W.addFolder(s, '', 'ルームウェア'), null);
  assert.equal(s.categories.at(-1), 'ルームウェア');

  assert.equal(W.renameFolder(s, 'ボトムス', 'ジーンズ', 'デニム'), null);
  assert.equal(s.items[0].subcategory, 'デニム');
  assert.equal(W.renameFolder(s, '', 'ボトムス', 'パンツ類'), null);
  assert.deepEqual([s.items[0].category, s.items[1].category], ['パンツ類', 'パンツ類']);
  assert.ok(s.subcategories.パンツ類.includes('デニム'));
  assert.equal(s.subcategories.ボトムス, undefined);

  W.moveFolder(s, '', 'パンツ類', -1);
  assert.equal(s.categories.indexOf('パンツ類'), 1);

  W.deleteFolder(s, 'パンツ類', 'デニム');
  assert.equal(s.items[0].subcategory, '');
  assert.equal(s.items[0].category, 'パンツ類');
  W.deleteFolder(s, '', 'パンツ類');
  assert.equal(s.items[0].category, '');
  assert.ok(!s.categories.includes('パンツ類'));
});

test('季節で分けない並びは、早い季節順・同じなら名前順で、重複しない', () => {
  const sorted = W.sortBySeason([
    item('ダウン', 'アウター', ['冬']),
    item('ベルト', '小物'),
    item('カーディガン', 'トップス', ['春', '秋']),
    item('Tシャツ', 'トップス', ['夏']),
    item('アンサンブル', 'トップス', ['春']),
  ]);
  assert.deepEqual(sorted.map((it) => it.name), ['アンサンブル', 'カーディガン', 'Tシャツ', 'ダウン', 'ベルト']);
});

test('スカートは既定のフォルダにない。以前の版で保存した空のスカートは取り除き、中身があれば残す', () => {
  assert.ok(!W.emptyState().subcategories.ボトムス.includes('スカート'));
  const base = { layout: 'folders', categories: ['ボトムス'], subcategories: { ボトムス: ['ジーンズ', 'スカート'] } };
  const empty = W.parseState({ ...base, items: [{ id: '1', name: 'a', category: 'ボトムス', subcategory: 'ジーンズ' }] });
  assert.deepEqual(empty.subcategories.ボトムス, ['ジーンズ']);
  const used = W.parseState({ ...base, items: [{ id: '1', name: 'プリーツ', category: 'ボトムス', subcategory: 'スカート' }] });
  assert.deepEqual(used.subcategories.ボトムス, ['ジーンズ', 'スカート']);
  // 旧形式の既定カテゴリーに空のスカートがあっても作らない
  const legacy = W.parseState({ categories: ['ニット', 'スカート'], items: [] });
  assert.ok(!legacy.subcategories.ボトムス.includes('スカート'));
});

test('季節ごとの表示では、各季節の中をフォルダ一覧の順（大カテゴリー→サブフォルダ→名前）に並べる', () => {
  const cats = ['トップス', 'ボトムス'];
  const subs = { トップス: ['Tシャツ', 'ニット'], ボトムス: ['ジーンズ', 'スラックス', 'コットンパンツ'] };
  const secs = W.groupBySeason([
    item('チノ', 'ボトムス', ['春'], [], [], 'コットンパンツ'),
    item('ベルト', '', ['春']),
    item('ウール', 'ボトムス', ['春'], [], [], 'スラックス'),
    item('ボトムス直下', 'ボトムス', ['春']),
    item('リネン', 'ボトムス', ['春'], [], [], 'スラックス'),
    item('ケーブル', 'トップス', ['春'], [], [], 'ニット'),
    item('白T', 'トップス', ['春'], [], [], 'Tシャツ'),
    item('501', 'ボトムス', ['春'], [], [], 'ジーンズ'),
  ], W.folderComparator(cats, subs));
  assert.deepEqual(secs[0].items.map((it) => it.name), ['白T', 'ケーブル', '501', 'ウール', 'リネン', 'チノ', 'ボトムス直下', 'ベルト']);
});
