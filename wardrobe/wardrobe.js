// 洋服管理アプリのデータ操作ロジック（DOM非依存）
(function (root) {
  'use strict';

  const SEASONS = ['春', '夏', '秋', '冬'];
  const NO_SEASON = '季節未設定';
  const NO_CATEGORY = '未分類';
  // フォルダ一覧で「未分類」を選んだときの目印（フォルダ ID と重ならない値）
  const UNFILED = ':unfiled';

  // データ形式の目印。tree-1: フォルダを何段でも入れ子にできる形（アイテムはフォルダ ID を持つ）
  const LAYOUT = 'tree-1';

  // 最初のフォルダ構成
  const DEFAULT_CATEGORIES = ['トップス', 'アウター', 'ボトムス', 'ワンピース', 'シューズ', '小物'];
  const DEFAULT_SUBCATEGORIES = {
    トップス: ['Tシャツ', 'シャツ', 'ニット', 'パーカー'],
    アウター: ['ジャケット', 'コート'],
    ボトムス: ['ジーンズ', 'スラックス', 'コットンパンツ'],
  };
  // 旧形式のカテゴリー → 移行先の大カテゴリー
  const LEGACY_PARENT = {
    Tシャツ: 'トップス', シャツ: 'トップス', ニット: 'トップス', パーカー: 'トップス',
    ジャケット: 'アウター', コート: 'アウター',
    パンツ: 'ボトムス', スラックス: 'ボトムス', ジーンズ: 'ボトムス', コットンパンツ: 'ボトムス', スカート: 'ボトムス',
  };
  const cloneSubcategories = (src) => Object.fromEntries(Object.entries(src).map(([k, v]) => [k, v.slice()]));
  const DEFAULT_COLORS = [
    { name: '白', hex: '#ffffff' },
    { name: '黒', hex: '#1f1f1f' },
    { name: 'グレー', hex: '#9ca3af' },
    { name: 'ネイビー', hex: '#1e3a5f' },
    { name: 'ベージュ', hex: '#d8c3a5' },
    { name: 'ブラウン', hex: '#7c4a2d' },
    { name: 'カーキ', hex: '#7a7a4a' },
    { name: '青', hex: '#3b82f6' },
    { name: '赤', hex: '#dc2626' },
    { name: '緑', hex: '#16a34a' },
    { name: '黄', hex: '#eab308' },
    { name: 'ピンク', hex: '#f472b6' },
  ];

  function uniqStrings(list) {
    const out = [];
    for (const v of list || []) {
      const s = String(v).trim();
      if (s && !out.includes(s)) out.push(s);
    }
    return out;
  }

  function sortSeasons(seasons) {
    return uniqStrings(seasons).filter((s) => SEASONS.includes(s)).sort((a, b) => SEASONS.indexOf(a) - SEASONS.indexOf(b));
  }

  // 入力値を正規化したアイテムを返す（folder はフォルダ ID、'' は未分類）
  function normalizeItem(input) {
    return {
      id: String(input.id || ''),
      name: String(input.name || '').trim(),
      folder: String(input.folder || ''),
      seasons: sortSeasons(input.seasons),
      colors: uniqStrings(input.colors),
      tags: uniqStrings(input.tags),
      memo: String(input.memo || '').trim(),
      createdAt: Number(input.createdAt) || 0,
    };
  }

  // エラーメッセージ（問題なければ null）
  function validateItem(item) {
    if (!item || typeof item !== 'object') return 'アイテムの形式が不正です';
    if (!item.id) return 'IDがありません';
    if (!String(item.name || '').trim()) return '名前を入力してください';
    if (item.seasons && !Array.isArray(item.seasons)) return '季節の形式が不正です';
    for (const s of item.seasons || []) {
      if (!SEASONS.includes(s)) return `不明な季節です: ${s}`;
    }
    if (item.colors && !Array.isArray(item.colors)) return '色の形式が不正です';
    if (item.tags && !Array.isArray(item.tags)) return 'タグの形式が不正です';
    return null;
  }

  // ---------- フォルダツリー ----------
  // state.folders = [{ id, name, children: [...] }]（何段でも入れ子にできる）

  let idSeq = 0;
  function newFolderId() {
    idSeq += 1;
    return 'f' + Date.now().toString(36) + idSeq.toString(36) + Math.random().toString(36).slice(2, 6);
  }
  // 移行で作るフォルダは、どの端末で移行しても同じ ID になるように名前の並びから作る
  const pathId = (path) => 'p:' + path.map(encodeURIComponent).join('/');

  // ID → { node, parent（親ノードか null）, siblings（属する配列）, path（名前の配列）, ids（ID の配列）, depth, key（並び順の配列） }
  function indexFolders(folders) {
    const map = new Map();
    const walk = (list, parent, path, ids, key) => {
      list.forEach((node, i) => {
        const info = { node, parent, siblings: list, path: [...path, node.name], ids: [...ids, node.id], depth: path.length, key: [...key, i] };
        map.set(node.id, info);
        walk(node.children, node, info.path, info.ids, info.key);
      });
    };
    walk(folders, null, [], [], []);
    return map;
  }

  // folderId のフォルダ（またはその下の段）に入っているか
  function isInFolder(index, itemFolder, folderId) {
    const info = index.get(itemFolder);
    return !!info && info.ids.includes(folderId);
  }

  // 一覧表示用: [{ id, name, count（下の段を含む）, children }] と、全件数・未分類件数
  function buildFolderTree(items, folders) {
    const index = indexFolders(folders);
    const own = new Map();
    let uncategorized = 0;
    for (const it of items) {
      const info = index.get(it.folder);
      if (!info) { uncategorized++; continue; }
      for (const id of info.ids) own.set(id, (own.get(id) || 0) + 1);
    }
    const map = (list) => list.map((n) => ({ id: n.id, name: n.name, count: own.get(n.id) || 0, children: map(n.children) }));
    return { total: items.length, folders: map(folders), uncategorized };
  }

  function validName(name) {
    const v = String(name || '').trim();
    return v ? { v } : { error: 'フォルダ名を入力してください' };
  }
  const nameTaken = (list, name, exceptId) => list.some((n) => n.name === name && n.id !== exceptId);

  // parentId が '' ならいちばん上の段に作る。{ id } か { error } を返す
  function addFolder(state, parentId, name, id) {
    const { v, error } = validName(name);
    if (error) return { error };
    let list = state.folders;
    if (parentId) {
      const info = indexFolders(state.folders).get(parentId);
      if (!info) return { error: '親フォルダが見つかりません' };
      list = info.node.children;
    }
    if (nameTaken(list, v)) return { error: '同じ場所に同じ名前のフォルダがあります' };
    const node = { id: id || newFolderId(), name: v, children: [] };
    list.push(node);
    return { id: node.id };
  }

  function renameFolder(state, id, name) {
    const { v, error } = validName(name);
    if (error) return error;
    const info = indexFolders(state.folders).get(id);
    if (!info) return 'フォルダが見つかりません';
    if (nameTaken(info.siblings, v, id)) return '同じ場所に同じ名前のフォルダがあります';
    info.node.name = v;
    return null;
  }

  // 別のフォルダの中へ移す（newParentId が '' ならいちばん上の段へ）。移した先の末尾に入る
  function relocateFolder(state, id, newParentId) {
    const index = indexFolders(state.folders);
    const info = index.get(id);
    if (!info) return 'フォルダが見つかりません';
    if ((info.parent ? info.parent.id : '') === newParentId) return null;
    let target = state.folders;
    if (newParentId) {
      const dest = index.get(newParentId);
      if (!dest) return '移動先のフォルダが見つかりません';
      if (dest.ids.includes(id)) return 'フォルダを自分自身やその中には移動できません';
      target = dest.node.children;
    }
    if (nameTaken(target, info.node.name)) return '移動先に同じ名前のフォルダがあります';
    info.siblings.splice(info.siblings.indexOf(info.node), 1);
    target.push(info.node);
    return null;
  }

  // 同じ段の中で上下に並べ替える
  function moveFolder(state, id, dir) {
    const info = indexFolders(state.folders).get(id);
    if (!info) return null;
    const list = info.siblings;
    const i = list.indexOf(info.node);
    const j = i + dir;
    if (j < 0 || j >= list.length) return null;
    [list[i], list[j]] = [list[j], list[i]];
    return null;
  }

  // フォルダとその下の段をまとめて消す。中のアイテムは消したフォルダの親へ（いちばん上の段なら未分類へ）移る
  function deleteFolder(state, id) {
    const index = indexFolders(state.folders);
    const info = index.get(id);
    if (!info) return null;
    const dest = info.parent ? info.parent.id : '';
    for (const it of state.items) if (isInFolder(index, it.folder, id)) it.folder = dest;
    info.siblings.splice(info.siblings.indexOf(info.node), 1);
    return null;
  }

  // 下の段も含めた件数
  function countInFolder(items, folders, id) {
    const index = indexFolders(folders);
    return items.filter((it) => isInFolder(index, it.folder, id)).length;
  }
  // 下の段のフォルダの数
  function countSubfolders(node) {
    return node.children.reduce((n, c) => n + 1 + countSubfolders(c), 0);
  }

  // ---------- 絞り込み・並べ替え ----------
  // filter.folder: '' = すべて、UNFILED = 未分類、それ以外 = そのフォルダ（下の段を含む）
  function matchesFilter(item, filter, index) {
    const f = filter || {};
    if (f.folder === UNFILED) {
      if (index.has(item.folder)) return false;
    } else if (f.folder && !isInFolder(index, item.folder, f.folder)) {
      return false;
    }
    if (f.color && !item.colors.includes(f.color)) return false;
    if (f.query) {
      const q = f.query.trim().toLowerCase();
      if (q) {
        const info = index.get(item.folder);
        const hay = [item.name, ...(info ? info.path : []), item.memo, ...item.colors, ...item.tags, ...item.seasons].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
    }
    return true;
  }

  // フォルダ一覧の並び（上の段 → 下の段）で比べる。同じフォルダなら名前順。
  // フォルダの直下のアイテムは、その中の下の段のアイテムより後ろ。未分類は最後
  function folderKey(index, it) {
    const info = index.get(it.folder);
    return info ? [...info.key, Infinity] : [Infinity];
  }
  function compareKeys(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = i < a.length ? a[i] : -1;
      const y = i < b.length ? b[i] : -1;
      if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
  }
  function folderComparator(index) {
    return (a, b) => compareKeys(folderKey(index, a), folderKey(index, b)) || a.name.localeCompare(b.name, 'ja');
  }

  // 季節で分けないときの並び: フォルダ順、同じフォルダの中は一番早い季節（春→夏→秋→冬→未設定）の順、さらに名前順。各アイテムは1回だけ
  function sortByFolder(items, index) {
    const first = (it) => (it.seasons.length ? SEASONS.indexOf(it.seasons[0]) : SEASONS.length);
    return items.slice().sort((a, b) => compareKeys(folderKey(index, a), folderKey(index, b))
      || first(a) - first(b) || a.name.localeCompare(b.name, 'ja'));
  }

  // 新しく登録したものが先。登録日時のない旧データは末尾（保存されている並びの後ろのものほど新しいとみなす）
  function sortByRegistration(items) {
    return items.map((it, i) => [it, i]).sort(([a, i], [b, j]) => (b.createdAt || 0) - (a.createdAt || 0) || j - i).map(([it]) => it);
  }

  // 春→夏→秋→冬→季節未設定 の順のセクションに分ける。
  // 複数の季節を持つアイテムはそれぞれの季節に表示する。compare を渡すと各季節の中をその順に並べる
  function groupBySeason(items, compare) {
    const sections = SEASONS.map((s) => ({ season: s, items: [] }));
    const none = { season: NO_SEASON, items: [] };
    for (const it of items) {
      if (!it.seasons.length) {
        none.items.push(it);
        continue;
      }
      for (const s of it.seasons) sections[SEASONS.indexOf(s)].items.push(it);
    }
    const order = compare || ((a, b) => a.name.localeCompare(b.name, 'ja'));
    const result = [...sections, none].filter((sec) => sec.items.length);
    for (const sec of result) sec.items.sort(order);
    return result;
  }

  // ---------- 読み込み・移行 ----------
  function parseFolders(list, seen) {
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const n of list) {
      if (!n || typeof n !== 'object') continue;
      const name = String(n.name || '').trim();
      const id = String(n.id || '');
      if (!name || !id || seen.has(id) || out.some((o) => o.name === name)) continue;
      seen.add(id);
      out.push({ id, name, children: parseFolders(n.children, seen) });
    }
    return out;
  }

  // 大カテゴリー＋サブフォルダの形（categories / subcategories）を入れ子のツリーにする
  function toTree(categories, subcategories) {
    return categories.map((c) => ({
      id: pathId([c]), name: c,
      children: (subcategories[c] || []).map((s) => ({ id: pathId([c, s]), name: s, children: [] })),
    }));
  }

  function parseState(raw) {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || !Array.isArray(data.items)) throw new Error('items がありません');
    for (const it of data.items) {
      const err = validateItem(it);
      if (err) throw new Error(`不正なアイテム: ${err}`);
    }
    let folders;
    let items;
    if (data.layout === LAYOUT) {
      folders = parseFolders(data.folders, new Set());
      items = data.items.map(normalizeItem);
    } else {
      ({ folders, items } = migrateLegacy(data));
    }
    const colors = Array.isArray(data.colors)
      ? data.colors.filter((c) => c && String(c.name || '').trim()).map((c) => ({ name: String(c.name).trim(), hex: /^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : '#cccccc' }))
      : DEFAULT_COLORS.map((c) => ({ ...c }));
    return { layout: LAYOUT, items, folders, colors };
  }

  // 以前の形式（category / subcategory を名前で持つ）からの移行
  function migrateLegacy(data) {
    const legacyItems = data.items.map((it) => ({
      ...normalizeItem(it),
      category: String(it.category || '').trim(),
      subcategory: it.category ? String(it.subcategory || '').trim() : '',
    }));
    let categories = uniqStrings(Array.isArray(data.categories) ? data.categories : DEFAULT_CATEGORIES);
    let subcategories = {};
    if (data.subcategories && typeof data.subcategories === 'object') {
      for (const [k, v] of Object.entries(data.subcategories)) {
        const list = uniqStrings(Array.isArray(v) ? v : []);
        if (String(k).trim() && list.length) subcategories[String(k).trim()] = list;
      }
    }
    if (data.layout === 'folders') removeEmptySkirt(subcategories, legacyItems);
    else if (data.layout !== 'folders-2') ({ categories, subcategories } = migrateToFolders(categories, subcategories, legacyItems));
    // 一覧にない分類を持つアイテムのためにフォルダを足す
    for (const it of legacyItems) {
      if (!it.category) continue;
      if (!categories.includes(it.category)) categories.push(it.category);
      if (it.subcategory) {
        const list = subcategories[it.category] || (subcategories[it.category] = []);
        if (!list.includes(it.subcategory)) list.push(it.subcategory);
      }
    }
    const folders = toTree(categories, subcategories);
    const items = legacyItems.map(({ category, subcategory, ...rest }) => normalizeItem({
      ...rest,
      folder: category ? pathId(subcategory ? [category, subcategory] : [category]) : '',
    }));
    return { folders, items };
  }

  function removeEmptySkirt(subcategories, items) {
    const list = subcategories['ボトムス'];
    if (!list || !list.includes('スカート')) return;
    if (items.some((it) => it.category === 'ボトムス' && it.subcategory === 'スカート')) return;
    subcategories['ボトムス'] = list.filter((c) => c !== 'スカート');
    if (!subcategories['ボトムス'].length) delete subcategories['ボトムス'];
  }
  function migrateToFolders(oldCategories, oldSubcategories, items) {
    const categories = DEFAULT_CATEGORIES.slice();
    const subcategories = cloneSubcategories(DEFAULT_SUBCATEGORIES);
    const addChild = (parent, child) => {
      const list = subcategories[parent] || (subcategories[parent] = []);
      if (!list.includes(child)) list.push(child);
    };
    const used = uniqStrings([...oldCategories, ...items.map((it) => it.category)]);
    for (const c of used) {
      const parent = LEGACY_PARENT[c];
      if (c === 'パンツ') for (const sub of oldSubcategories[c] || []) addChild(parent, sub);
      // 中身のない旧カテゴリーは、既定のサブフォルダにあるものだけ残す（例: 空のスカートは作らない）
      else if (parent) { if (items.some((it) => it.category === c)) addChild(parent, c); }
      else {
        if (!categories.includes(c)) categories.push(c);
        for (const sub of oldSubcategories[c] || []) addChild(c, sub);
      }
    }
    for (const it of items) {
      const parent = LEGACY_PARENT[it.category];
      if (!parent) continue;
      if (it.category === 'パンツ') {
        if (it.subcategory) addChild(parent, it.subcategory);
      } else {
        if (it.subcategory && !it.tags.includes(it.subcategory)) it.tags.push(it.subcategory);
        it.subcategory = it.category;
        addChild(parent, it.category);
      }
      it.category = parent;
    }
    return { categories, subcategories };
  }

  function emptyState() {
    return {
      layout: LAYOUT, items: [],
      folders: toTree(DEFAULT_CATEGORIES, cloneSubcategories(DEFAULT_SUBCATEGORIES)),
      colors: DEFAULT_COLORS.map((c) => ({ ...c })),
    };
  }

  const api = {
    SEASONS, NO_SEASON, NO_CATEGORY, UNFILED, DEFAULT_COLORS,
    normalizeItem, validateItem, sortSeasons,
    indexFolders, isInFolder, buildFolderTree, countInFolder, countSubfolders,
    addFolder, renameFolder, relocateFolder, moveFolder, deleteFolder,
    matchesFilter, folderComparator, sortByFolder, sortByRegistration, groupBySeason,
    parseState, emptyState,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Wardrobe = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
