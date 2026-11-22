// 洋服管理アプリのデータ操作ロジック（DOM非依存）
(function (root) {
  'use strict';

  const SEASONS = ['春', '夏', '秋', '冬'];
  const NO_SEASON = '季節未設定';
  const NO_CATEGORY = '未分類';
  // データ形式の目印。これがないデータは旧形式（フラットなカテゴリー）として移行する
  // folders-2: 既定のサブフォルダから「スカート」を外した版
  const LAYOUT = 'folders-2';

  // 大カテゴリー（フォルダ）とその中のサブフォルダ
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

  // 入力値を正規化したアイテムを返す
  function normalizeItem(input) {
    return {
      id: String(input.id || ''),
      name: String(input.name || '').trim(),
      category: String(input.category || '').trim(),
      subcategory: input.category ? String(input.subcategory || '').trim() : '',
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

  // フォルダツリー: { total, folders: [{ name, count, children: [{ name, count }] }], uncategorized }
  // フォルダは中身が空でも表示する。フォルダ一覧にない分類のアイテムは末尾にフォルダとして足す
  function buildFolderTree(items, categories, subcategories) {
    const folders = categories.map((name) => ({
      name, count: 0, children: ((subcategories || {})[name] || []).map((n) => ({ name: n, count: 0 })),
    }));
    const byName = new Map(folders.map((f) => [f.name, f]));
    let uncategorized = 0;
    for (const it of items) {
      if (!it.category) { uncategorized++; continue; }
      let f = byName.get(it.category);
      if (!f) { f = { name: it.category, count: 0, children: [] }; folders.push(f); byName.set(f.name, f); }
      f.count++;
      if (it.subcategory) {
        let ch = f.children.find((c) => c.name === it.subcategory);
        if (!ch) { ch = { name: it.subcategory, count: 0 }; f.children.push(ch); }
        ch.count++;
      }
    }
    return { total: items.length, folders, uncategorized };
  }

  // ---------- フォルダ操作（state を直接変更し、エラーメッセージか null を返す） ----------
  // parent が '' なら大カテゴリー、それ以外はその大カテゴリーの中のサブフォルダ
  function siblings(state, parent) {
    if (!parent) return state.categories;
    return state.subcategories[parent] || (state.subcategories[parent] = []);
  }
  function cleanupEmpty(state, parent) {
    if (parent && state.subcategories[parent] && !state.subcategories[parent].length) delete state.subcategories[parent];
  }
  function addFolder(state, parent, name) {
    const v = String(name || '').trim();
    if (!v) return 'フォルダ名を入力してください';
    if (parent && !state.categories.includes(parent)) return '親フォルダが見つかりません';
    const list = siblings(state, parent);
    if (list.includes(v)) { cleanupEmpty(state, parent); return '同じ名前のフォルダがあります'; }
    list.push(v);
    return null;
  }
  function renameFolder(state, parent, oldName, newName) {
    const v = String(newName || '').trim();
    if (!v) return 'フォルダ名を入力してください';
    if (v === oldName) return null;
    const list = siblings(state, parent);
    const i = list.indexOf(oldName);
    if (i < 0) { cleanupEmpty(state, parent); return 'フォルダが見つかりません'; }
    if (list.includes(v)) return '同じ名前のフォルダがあります';
    list[i] = v;
    if (!parent) {
      if (state.subcategories[oldName]) {
        state.subcategories[v] = state.subcategories[oldName];
        delete state.subcategories[oldName];
      }
      for (const it of state.items) if (it.category === oldName) it.category = v;
    } else {
      for (const it of state.items) if (it.category === parent && it.subcategory === oldName) it.subcategory = v;
    }
    return null;
  }
  // 大カテゴリーを消すと中のアイテムは未分類に、サブフォルダを消すと中のアイテムは親フォルダの直下に移る
  function deleteFolder(state, parent, name) {
    if (!parent) {
      state.categories = state.categories.filter((c) => c !== name);
      delete state.subcategories[name];
      for (const it of state.items) if (it.category === name) { it.category = ''; it.subcategory = ''; }
    } else {
      if (state.subcategories[parent]) state.subcategories[parent] = state.subcategories[parent].filter((c) => c !== name);
      cleanupEmpty(state, parent);
      for (const it of state.items) if (it.category === parent && it.subcategory === name) it.subcategory = '';
    }
    return null;
  }
  function moveFolder(state, parent, name, dir) {
    const list = siblings(state, parent);
    const i = list.indexOf(name);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) { cleanupEmpty(state, parent); return null; }
    [list[i], list[j]] = [list[j], list[i]];
    return null;
  }
  function countInFolder(items, parent, name) {
    return items.filter((it) => (parent ? it.category === parent && it.subcategory === name : it.category === name)).length;
  }

  function matchesFilter(item, filter) {
    const f = filter || {};
    if (f.category && (item.category || NO_CATEGORY) !== f.category) return false;
    if (f.subcategory && item.subcategory !== f.subcategory) return false;
    if (f.color && !item.colors.includes(f.color)) return false;
    if (f.query) {
      const q = f.query.trim().toLowerCase();
      if (q) {
        const hay = [item.name, item.category, item.subcategory, item.memo, ...item.colors, ...item.tags, ...item.seasons].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
    }
    return true;
  }

  // 春→夏→秋→冬→季節未設定 の順のセクションに分ける。
  // 複数の季節を持つアイテムはそれぞれの季節に表示する。
  // フォルダ一覧の並び順（大カテゴリー → サブフォルダ）で比べる。同じ場所なら名前順。
  // 一覧にない分類は後ろ、未分類は最後。サブフォルダなし（大カテゴリー直下）はそのサブフォルダ群の後ろ
  function folderComparator(categories, subcategories) {
    const big = (it) => {
      if (!it.category) return Infinity;
      const i = categories.indexOf(it.category);
      return i < 0 ? categories.length : i;
    };
    const sub = (it) => {
      const list = (subcategories || {})[it.category] || [];
      if (!it.subcategory) return list.length + 1;
      const i = list.indexOf(it.subcategory);
      return i < 0 ? list.length : i;
    };
    return (a, b) => big(a) - big(b)
      || (big(a) === categories.length && a.category !== b.category ? a.category.localeCompare(b.category, 'ja') : 0)
      || sub(a) - sub(b)
      || (a.subcategory !== b.subcategory ? a.subcategory.localeCompare(b.subcategory, 'ja') : 0)
      || a.name.localeCompare(b.name, 'ja');
  }

  // 季節で分けないときの並び: フォルダ順、同じフォルダの中は一番早い季節（春→夏→秋→冬→未設定）の順、さらに名前順。各アイテムは1回だけ
  function sortByFolder(items, categories, subcategories) {
    const byFolder = folderComparator(categories, subcategories);
    const first = (it) => (it.seasons.length ? SEASONS.indexOf(it.seasons[0]) : SEASONS.length);
    const sameFolder = (a, b) => a.category === b.category && a.subcategory === b.subcategory;
    return items.slice().sort((a, b) => (sameFolder(a, b) ? first(a) - first(b) || a.name.localeCompare(b.name, 'ja') : byFolder(a, b)));
  }

  // compare を渡すと各季節の中をその順に並べる（省略時は名前順）
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

  function parseState(raw) {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || !Array.isArray(data.items)) throw new Error('items がありません');
    const items = data.items.map((it) => {
      const err = validateItem(it);
      if (err) throw new Error(`不正なアイテム: ${err}`);
      return normalizeItem(it);
    });
    let categories = uniqStrings(Array.isArray(data.categories) ? data.categories : DEFAULT_CATEGORIES);
    let subcategories = {};
    if (data.subcategories && typeof data.subcategories === 'object') {
      for (const [k, v] of Object.entries(data.subcategories)) {
        const list = uniqStrings(Array.isArray(v) ? v : []);
        if (String(k).trim() && list.length) subcategories[String(k).trim()] = list;
      }
    }
    if (data.layout === 'folders') removeEmptySkirt(subcategories, items);
    else if (data.layout !== LAYOUT) ({ categories, subcategories } = migrateToFolders(categories, subcategories, items));
    const colors = Array.isArray(data.colors)
      ? data.colors.filter((c) => c && String(c.name || '').trim()).map((c) => ({ name: String(c.name).trim(), hex: /^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : '#cccccc' }))
      : DEFAULT_COLORS.map((c) => ({ ...c }));
    return { layout: LAYOUT, items, categories, subcategories, colors };
  }

  // 「ボトムス › スカート」が空なら取り除く（アイテムが入っていれば残す）
  function removeEmptySkirt(subcategories, items) {
    const list = subcategories['ボトムス'];
    if (!list || !list.includes('スカート')) return;
    if (items.some((it) => it.category === 'ボトムス' && it.subcategory === 'スカート')) return;
    subcategories['ボトムス'] = list.filter((c) => c !== 'スカート');
    if (!subcategories['ボトムス'].length) delete subcategories['ボトムス'];
  }

  // 旧形式（Tシャツ・ニット・パンツなどが同列のカテゴリー）を、大カテゴリー＋サブフォルダの形に移す。
  // 例: ニット → トップス / ニット、パンツ / ジーンズ → ボトムス / ジーンズ。
  // 旧形式で「ニット / カーディガン」のように付けていた細分類は、消えないようにタグとして残す。
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
    return { layout: LAYOUT, items: [], categories: DEFAULT_CATEGORIES.slice(), subcategories: cloneSubcategories(DEFAULT_SUBCATEGORIES), colors: DEFAULT_COLORS.map((c) => ({ ...c })) };
  }

  const api = {
    SEASONS, NO_SEASON, NO_CATEGORY, DEFAULT_CATEGORIES, DEFAULT_SUBCATEGORIES, DEFAULT_COLORS,
    normalizeItem, validateItem, buildFolderTree, matchesFilter, groupBySeason, folderComparator, sortByFolder, parseState, emptyState, sortSeasons,
    addFolder, renameFolder, deleteFolder, moveFolder, countInFolder,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Wardrobe = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
