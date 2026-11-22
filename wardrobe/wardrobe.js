// 洋服管理アプリのデータ操作ロジック（DOM非依存）
(function (root) {
  'use strict';

  const SEASONS = ['春', '夏', '秋', '冬'];
  const NO_SEASON = '季節未設定';
  const NO_CATEGORY = '未分類';

  const DEFAULT_CATEGORIES = ['Tシャツ', 'シャツ', 'ニット', 'パーカー', 'ジャケット', 'コート', 'スラックス', 'ジーンズ', 'スカート', 'ワンピース', 'シューズ', '小物'];
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

  // タブ一覧: [{ key, label, count }]。カテゴリ順は categories の順、未登録カテゴリは末尾
  function buildTabs(items, categories) {
    const counts = new Map();
    for (const it of items) {
      const c = it.category || NO_CATEGORY;
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    const order = uniqStrings(categories);
    for (const c of counts.keys()) {
      if (!order.includes(c) && c !== NO_CATEGORY) order.push(c);
    }
    if (counts.has(NO_CATEGORY)) order.push(NO_CATEGORY);
    const tabs = [{ key: '', label: 'すべて', count: items.length }];
    for (const c of order) {
      if (counts.has(c)) tabs.push({ key: c, label: c, count: counts.get(c) });
    }
    return tabs;
  }

  function matchesFilter(item, filter) {
    const f = filter || {};
    if (f.category && (item.category || NO_CATEGORY) !== f.category) return false;
    if (f.color && !item.colors.includes(f.color)) return false;
    if (f.query) {
      const q = f.query.trim().toLowerCase();
      if (q) {
        const hay = [item.name, item.category, item.memo, ...item.colors, ...item.tags, ...item.seasons].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
    }
    return true;
  }

  // 春→夏→秋→冬→季節未設定 の順のセクションに分ける。
  // 複数の季節を持つアイテムはそれぞれの季節に表示する。
  function groupBySeason(items) {
    const sections = SEASONS.map((s) => ({ season: s, items: [] }));
    const none = { season: NO_SEASON, items: [] };
    for (const it of items) {
      if (!it.seasons.length) {
        none.items.push(it);
        continue;
      }
      for (const s of it.seasons) sections[SEASONS.indexOf(s)].items.push(it);
    }
    const byName = (a, b) => a.name.localeCompare(b.name, 'ja');
    const result = [...sections, none].filter((sec) => sec.items.length);
    for (const sec of result) sec.items.sort(byName);
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
    const categories = uniqStrings(Array.isArray(data.categories) ? data.categories : DEFAULT_CATEGORIES);
    const colors = Array.isArray(data.colors)
      ? data.colors.filter((c) => c && String(c.name || '').trim()).map((c) => ({ name: String(c.name).trim(), hex: /^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : '#cccccc' }))
      : DEFAULT_COLORS.map((c) => ({ ...c }));
    return { items, categories, colors };
  }

  function emptyState() {
    return { items: [], categories: DEFAULT_CATEGORIES.slice(), colors: DEFAULT_COLORS.map((c) => ({ ...c })) };
  }

  const api = { SEASONS, NO_SEASON, NO_CATEGORY, DEFAULT_CATEGORIES, DEFAULT_COLORS, normalizeItem, validateItem, buildTabs, matchesFilter, groupBySeason, parseState, emptyState, sortSeasons };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Wardrobe = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
