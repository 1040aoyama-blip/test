const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('./wardrobe.js');

// 名前の並びからフォルダ ID を探す
function idOf(state, ...names) {
  let list = state.folders;
  let node = null;
  for (const n of names) {
    node = list.find((f) => f.name === n);
    if (!node) return null;
    list = node.children;
  }
  return node.id;
}
// 名前の並びのフォルダを（なければ作って）返す
function ensure(state, ...names) {
  let parent = '';
  for (let i = 0; i < names.length; i++) {
    const id = idOf(state, ...names.slice(0, i + 1)) || W.addFolder(state, parent, names[i]).id;
    parent = id;
  }
  return parent;
}
const item = (name, folder = '', seasons = [], colors = [], tags = [], createdAt = 0) =>
  W.normalizeItem({ id: name, name, folder, seasons, colors, tags, createdAt });
const names = (list) => list.map((it) => it.name);
const treeShape = (folders) => folders.map((f) => (f.children.length ? [f.name, treeShape(f.children)] : f.name));

test('季節は春夏秋冬の順に並べ替え、重複と不明値を除く', () => {
  assert.deepEqual(W.sortSeasons(['冬', '春', '冬', '梅雨', '秋']), ['春', '秋', '冬']);
});

test('既定のフォルダ構成', () => {
  const s = W.emptyState();
  assert.deepEqual(treeShape(s.folders), [
    ['トップス', ['Tシャツ', 'シャツ', 'ニット', 'パーカー']],
    ['アウター', ['ジャケット', 'コート']],
    ['ボトムス', ['ジーンズ', 'スラックス', 'コットンパンツ']],
    'ワンピース', 'シューズ', '小物',
  ]);
});

test('フォルダは何段でも作れ、件数は下の段を含む', () => {
  const s = W.emptyState();
  const skinny = ensure(s, 'ボトムス', 'ジーンズ', 'スキニー');
  const vintage = ensure(s, 'ボトムス', 'ジーンズ', 'ワイド', 'ヴィンテージ');
  s.items = [item('A', skinny), item('B', vintage), item('C', idOf(s, 'ボトムス', 'ジーンズ')), item('D')];
  const t = W.buildFolderTree(s.items, s.folders);
  const bottoms = t.folders.find((f) => f.name === 'ボトムス');
  const jeans = bottoms.children.find((f) => f.name === 'ジーンズ');
  assert.equal(t.total, 4);
  assert.equal(t.uncategorized, 1);
  assert.equal(bottoms.count, 3);
  assert.equal(jeans.count, 3);
  assert.deepEqual(jeans.children.map((c) => [c.name, c.count]), [['スキニー', 1], ['ワイド', 1]]);
  assert.equal(jeans.children[1].children[0].count, 1);
});

test('フォルダを選ぶと下の段のアイテムも含めて絞り込む', () => {
  const s = W.emptyState();
  const skinny = ensure(s, 'ボトムス', 'ジーンズ', 'スキニー');
  const index = W.indexFolders(s.folders);
  const a = item('黒スキニー', skinny, ['春'], ['黒'], ['お気に入り']);
  assert.ok(W.matchesFilter(a, { folder: idOf(s, 'ボトムス') }, index));
  assert.ok(W.matchesFilter(a, { folder: idOf(s, 'ボトムス', 'ジーンズ') }, index));
  assert.ok(W.matchesFilter(a, { folder: skinny }, index));
  assert.ok(!W.matchesFilter(a, { folder: idOf(s, 'ボトムス', 'スラックス') }, index));
  assert.ok(!W.matchesFilter(a, { folder: W.UNFILED }, index));
  assert.ok(W.matchesFilter(item('X'), { folder: W.UNFILED }, index));
  assert.ok(W.matchesFilter(a, { color: '黒' }, index));
  assert.ok(!W.matchesFilter(a, { color: '白' }, index));
  assert.ok(W.matchesFilter(a, { query: 'お気に' }, index));
  assert.ok(W.matchesFilter(a, { query: 'スキニー' }, index), 'フォルダ名でも検索できる');
  assert.ok(!W.matchesFilter(a, { query: 'ダウン' }, index));
});

test('フォルダの追加・名前変更・並べ替え・削除', () => {
  const s = W.emptyState();
  const jeans = idOf(s, 'ボトムス', 'ジーンズ');
  assert.match(W.addFolder(s, jeans, ' ').error, /入力/);
  const skinny = W.addFolder(s, jeans, 'スキニー').id;
  assert.match(W.addFolder(s, jeans, 'スキニー').error, /同じ名前/);
  assert.ok(W.addFolder(s, idOf(s, 'ボトムス', 'スラックス'), 'スキニー').id, '別の場所なら同じ名前でもよい');
  s.items = [item('A', skinny), item('B', jeans)];

  assert.equal(W.renameFolder(s, jeans, 'デニム'), null);
  assert.equal(idOf(s, 'ボトムス', 'デニム', 'スキニー'), skinny, '名前を変えても中身はそのまま');
  assert.match(W.renameFolder(s, jeans, 'スラックス'), /同じ名前/);

  W.moveFolder(s, jeans, 1);
  assert.deepEqual(treeShape(s.folders)[2][1].map((x) => (Array.isArray(x) ? x[0] : x)), ['スラックス', 'デニム', 'コットンパンツ']);

  // ボトムス › デニム を消すと、中（スキニーを含む）のアイテムはボトムスの直下へ
  W.deleteFolder(s, jeans);
  assert.equal(idOf(s, 'ボトムス', 'デニム'), null);
  assert.deepEqual(s.items.map((it) => it.folder), [idOf(s, 'ボトムス'), idOf(s, 'ボトムス')]);
  // いちばん上の段を消すと未分類へ
  W.deleteFolder(s, idOf(s, 'ボトムス'));
  assert.deepEqual(s.items.map((it) => it.folder), ['', '']);
});

test('フォルダを別のフォルダの中へ移せる（中身ごと）。自分の中や同名のある場所へは移せない', () => {
  const s = W.emptyState();
  const jeans = idOf(s, 'ボトムス', 'ジーンズ');
  const skinny = W.addFolder(s, jeans, 'スキニー').id;
  s.items = [item('A', skinny)];
  assert.match(W.relocateFolder(s, jeans, skinny), /自分自身/);
  assert.match(W.relocateFolder(s, jeans, jeans), /自分自身/);
  assert.equal(W.relocateFolder(s, jeans, idOf(s, 'アウター')), null);
  assert.equal(idOf(s, 'アウター', 'ジーンズ', 'スキニー'), skinny);
  assert.equal(idOf(s, 'ボトムス', 'ジーンズ'), null);
  assert.ok(W.isInFolder(W.indexFolders(s.folders), skinny, idOf(s, 'アウター')));
  assert.equal(W.relocateFolder(s, jeans, ''), null);
  assert.equal(s.folders.at(-1).name, 'ジーンズ');
  W.addFolder(s, '', 'コート');
  assert.match(W.relocateFolder(s, idOf(s, 'アウター', 'コート'), ''), /同じ名前/);
});

test('季節ごとの表示では、各季節の中をフォルダ一覧の順に並べる（直下のアイテムは下の段の後ろ）', () => {
  const s = W.emptyState();
  const f = (...p) => ensure(s, ...p);
  const secs = W.groupBySeason([
    item('チノ', f('ボトムス', 'コットンパンツ'), ['春']),
    item('ベルト', '', ['春']),
    item('ウール', f('ボトムス', 'スラックス'), ['春']),
    item('ボトムス直下', f('ボトムス'), ['春']),
    item('ジーンズ直下', f('ボトムス', 'ジーンズ'), ['春']),
    item('スキニー', f('ボトムス', 'ジーンズ', 'スキニー'), ['春']),
    item('ケーブル', f('トップス', 'ニット'), ['春']),
    item('白T', f('トップス', 'Tシャツ'), ['春']),
  ], W.folderComparator(W.indexFolders(s.folders)));
  assert.deepEqual(names(secs[0].items), ['白T', 'ケーブル', 'スキニー', 'ジーンズ直下', 'ウール', 'チノ', 'ボトムス直下', 'ベルト']);
});

test('複数季節のアイテムはそれぞれの季節に表示され、空の季節は省略される', () => {
  const secs = W.groupBySeason([item('カーディガン', '', ['春', '秋']), item('ベルト')]);
  assert.deepEqual(secs.map((x) => x.season), ['春', '秋', '季節未設定']);
});

test('季節で分けない表示は、フォルダ順→同じフォルダ内は早い季節順→名前順', () => {
  const s = W.emptyState();
  const f = (...p) => ensure(s, ...p);
  const sorted = W.sortByFolder([
    item('ウール', f('ボトムス', 'スラックス'), ['秋', '冬']),
    item('リネン', f('ボトムス', 'スラックス'), ['春', '夏']),
    item('501', f('ボトムス', 'ジーンズ'), ['春', '秋']),
    item('ダウン', f('アウター'), ['冬']),
    item('白T', f('トップス', 'Tシャツ'), ['夏']),
  ], W.indexFolders(s.folders));
  assert.deepEqual(names(sorted), ['白T', 'ダウン', '501', 'リネン', 'ウール']);
});

test('登録順は新しいものが先。日時のない旧データは末尾（保存順の後ろほど新しい）', () => {
  const sorted = W.sortByRegistration([item('C', '', [], [], [], 300), item('旧1'), item('A', '', [], [], [], 100), item('旧2'), item('B', '', [], [], [], 200)]);
  assert.deepEqual(names(sorted), ['C', 'B', 'A', '旧2', '旧1']);
});

test('バリデーション', () => {
  assert.equal(W.validateItem({ id: '1', name: '  ' }), '名前を入力してください');
  assert.match(W.validateItem({ id: '1', name: 'a', seasons: ['梅雨'] }), /不明な季節/);
  assert.equal(W.validateItem({ id: '1', name: 'a', seasons: ['春'] }), null);
});

test('新しい形式の保存データはそのまま読み込める（何度読んでも同じ）', () => {
  const s = W.emptyState();
  const skinny = ensure(s, 'ボトムス', 'ジーンズ', 'スキニー');
  s.items = [item('A', skinny, ['夏', '春'])];
  const once = W.parseState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(once.items[0].seasons, ['春', '夏']);
  assert.deepEqual(W.parseState(JSON.parse(JSON.stringify(once))), once);
  assert.equal(idOf(once, 'ボトムス', 'ジーンズ', 'スキニー'), skinny);
  assert.throws(() => W.parseState('{}'));
  assert.throws(() => W.parseState({ items: [{ id: '1', name: '' }] }));
});

test('大カテゴリー＋サブフォルダ形式（前の版）の保存データを移行する', () => {
  const s = W.parseState({
    layout: 'folders-2',
    categories: ['トップス', 'ボトムス', '帽子'],
    subcategories: { トップス: ['ニット'], ボトムス: ['ジーンズ', 'スラックス'] },
    items: [
      { id: '1', name: 'デニム', category: 'ボトムス', subcategory: 'ジーンズ', seasons: ['春'] },
      { id: '2', name: 'ボトムス直下', category: 'ボトムス' },
      { id: '3', name: 'キャップ', category: '帽子' },
      { id: '4', name: 'ベルト' },
      { id: '5', name: '一覧にない分類', category: 'バッグ', subcategory: 'トート' },
    ],
  });
  assert.equal(s.layout, 'tree-1');
  assert.deepEqual(treeShape(s.folders), [['トップス', ['ニット']], ['ボトムス', ['ジーンズ', 'スラックス']], '帽子', ['バッグ', ['トート']]]);
  assert.deepEqual(s.items.map((it) => it.folder), [
    idOf(s, 'ボトムス', 'ジーンズ'), idOf(s, 'ボトムス'), idOf(s, '帽子'), '', idOf(s, 'バッグ', 'トート'),
  ]);
  assert.equal(s.items[0].category, undefined, '古い項目は残さない');
  // どの端末で移行しても同じ ID になる
  assert.equal(idOf(W.parseState({ layout: 'folders-2', categories: ['ボトムス'], subcategories: { ボトムス: ['ジーンズ'] }, items: [] }), 'ボトムス', 'ジーンズ'), idOf(s, 'ボトムス', 'ジーンズ'));
});

test('もっと古い形式（カテゴリーが同列）のデータも移行する', () => {
  const s = W.parseState({
    categories: ['ニット', 'パンツ', 'スラックス', 'スカート', '帽子'],
    subcategories: { パンツ: ['ジーンズ', 'ショートパンツ'], ニット: ['カーディガン'] },
    items: [
      { id: '1', name: 'ウール', category: 'スラックス' },
      { id: '2', name: 'デニム', category: 'パンツ', subcategory: 'ジーンズ' },
      { id: '3', name: '羽織', category: 'ニット', subcategory: 'カーディガン' },
    ],
  });
  assert.ok(idOf(s, 'ボトムス', 'ショートパンツ'));
  assert.equal(idOf(s, 'ボトムス', 'スカート'), null, '空のスカートは作らない');
  assert.ok(idOf(s, '帽子'));
  assert.deepEqual(s.items.map((it) => it.folder), [idOf(s, 'ボトムス', 'スラックス'), idOf(s, 'ボトムス', 'ジーンズ'), idOf(s, 'トップス', 'ニット')]);
  assert.deepEqual(s.items[2].tags, ['カーディガン']);
});

test('前の前の版（folders）で保存した空のスカートは取り除き、中身があれば残す', () => {
  const base = { layout: 'folders', categories: ['ボトムス'], subcategories: { ボトムス: ['ジーンズ', 'スカート'] } };
  const empty = W.parseState({ ...base, items: [] });
  assert.equal(idOf(empty, 'ボトムス', 'スカート'), null);
  const used = W.parseState({ ...base, items: [{ id: '1', name: 'プリーツ', category: 'ボトムス', subcategory: 'スカート' }] });
  assert.equal(used.items[0].folder, idOf(used, 'ボトムス', 'スカート'));
});
