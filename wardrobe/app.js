(function () {
  'use strict';

  const STORAGE_KEY = 'wardrobe-v1';
  const W = window.Wardrobe;
  const $ = (id) => document.getElementById(id);
  const SEASON_COLORS = { 春: 'var(--spring)', 夏: 'var(--summer)', 秋: 'var(--autumn)', 冬: 'var(--winter)' };

  let state = load();
  let view = { category: '', color: '', query: '' };
  let draft = null; // 編集中のアイテム

  // ---------- 永続化 ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return W.parseState(raw);
    } catch (e) {
      console.warn('保存データを読み込めませんでした', e);
    }
    return W.emptyState();
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { console.warn('保存に失敗しました', e); }
  }
  function commit() { save(); render(); }

  // ---------- 小さなDOMヘルパー ----------
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'style') node.style.cssText = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) if (c != null && c !== false) node.append(c);
    return node;
  }
  const colorHex = (name) => (state.colors.find((c) => c.name === name) || {}).hex || '#cccccc';
  const swatch = (name) => el('span', { class: 'swatch', style: `background:${colorHex(name)}` });
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- 一覧描画 ----------
  function render() {
    const tabs = W.buildTabs(state.items, state.categories);
    if (!tabs.some((t) => t.key === view.category)) view.category = '';
    if (view.color && !state.colors.some((c) => c.name === view.color)) view.color = '';

    $('tabs').replaceChildren(...tabs.map((t) => el('button', {
      class: 'tab', role: 'tab', 'aria-selected': String(t.key === view.category),
      onclick: () => { view.category = t.key; render(); },
    }, t.label, el('span', { class: 'count' }, String(t.count)))));

    $('color-filter').replaceChildren(
      el('button', { class: 'chip', 'aria-pressed': String(!view.color), onclick: () => { view.color = ''; render(); } }, 'すべての色'),
      ...state.colors.map((c) => el('button', {
        class: 'chip', 'aria-pressed': String(view.color === c.name),
        onclick: () => { view.color = view.color === c.name ? '' : c.name; render(); },
      }, swatch(c.name), c.name)),
    );

    const items = state.items.filter((it) => W.matchesFilter(it, view));
    const list = $('list');
    if (!state.items.length) {
      list.replaceChildren(el('div', { class: 'empty' },
        el('p', null, 'まだアイテムがありません。'),
        el('button', { class: 'primary', onclick: () => openItem() }, '＋ 最初のアイテムを追加'),
      ));
      return;
    }
    if (!items.length) {
      list.replaceChildren(el('p', { class: 'empty' }, '条件に合うアイテムがありません。'));
      return;
    }
    list.replaceChildren(...W.groupBySeason(items).map((sec) => el('section', { class: 'season', 'data-season': sec.season },
      el('h2', null, sec.season, el('span', { class: 'count' }, `${sec.items.length}点`)),
      el('div', { class: 'grid' }, sec.items.map(card)),
    )));
  }

  function card(it) {
    return el('button', { class: 'card', type: 'button', onclick: () => openItem(it), title: 'クリックで編集' },
      el('span', { class: 'name' }, it.name),
      el('span', { class: 'meta' },
        !view.category && el('span', { class: 'chip' }, it.category || W.NO_CATEGORY),
        it.seasons.length > 0 && el('span', { class: 'season-dots' }, it.seasons.map((s) => el('span', { class: 'season-dot', style: `background:${SEASON_COLORS[s]}` }, s))),
        it.colors.map((c) => el('span', { class: 'chip' }, swatch(c), c)),
        it.tags.map((t) => el('span', { class: 'chip' }, '#' + t)),
      ),
      it.memo && el('span', { class: 'memo' }, it.memo),
    );
  }

  // ---------- 追加・編集ダイアログ ----------
  function openItem(item) {
    draft = item
      ? { ...item, seasons: [...item.seasons], colors: [...item.colors], tags: [...item.tags] }
      : { id: '', name: '', category: view.category && view.category !== W.NO_CATEGORY ? view.category : '', seasons: [], colors: [], tags: [], memo: '' };
    $('item-dialog-title').textContent = item ? 'アイテム編集' : 'アイテム追加';
    $('f-name').value = draft.name;
    $('f-memo').value = draft.memo;
    $('f-delete').hidden = !item;
    $('f-error').hidden = true;
    renderDraft();
    $('item-dialog').showModal();
    $('f-name').focus();
  }

  function toggle(list, v) {
    const i = list.indexOf(v);
    if (i >= 0) list.splice(i, 1); else list.push(v);
  }

  function renderDraft() {
    $('f-category').replaceChildren(...state.categories.map((c) => el('button', {
      type: 'button', class: 'chip', 'aria-pressed': String(draft.category === c),
      onclick: () => { draft.category = draft.category === c ? '' : c; renderDraft(); },
    }, c)));
    $('f-seasons').replaceChildren(...W.SEASONS.map((s) => el('button', {
      type: 'button', class: 'chip', 'aria-pressed': String(draft.seasons.includes(s)),
      onclick: () => { toggle(draft.seasons, s); renderDraft(); },
    }, s)), el('button', {
      type: 'button', class: 'chip', onclick: () => { draft.seasons = draft.seasons.length === 4 ? [] : [...W.SEASONS]; renderDraft(); },
    }, draft.seasons.length === 4 ? '全解除' : 'オールシーズン'));
    $('f-colors').replaceChildren(...state.colors.map((c) => el('button', {
      type: 'button', class: 'chip', 'aria-pressed': String(draft.colors.includes(c.name)),
      onclick: () => { toggle(draft.colors, c.name); renderDraft(); },
    }, swatch(c.name), c.name)));
    $('f-tags').replaceChildren(...draft.tags.map((t) => el('span', { class: 'chip' }, '#' + t,
      el('button', { type: 'button', class: 'x', 'aria-label': `${t} を外す`, onclick: () => { toggle(draft.tags, t); renderDraft(); } }, '×'))));
  }

  function addCategory(name) {
    const v = name.trim();
    if (!v) return '';
    if (!state.categories.includes(v)) { state.categories.push(v); save(); }
    return v;
  }
  function addColor(name, hex) {
    const v = name.trim();
    if (!v) return '';
    if (!state.colors.some((c) => c.name === v)) { state.colors.push({ name: v, hex }); save(); }
    return v;
  }

  $('f-add-category').addEventListener('click', () => {
    const v = addCategory($('f-new-category').value);
    if (v) { draft.category = v; $('f-new-category').value = ''; renderDraft(); }
  });
  $('f-add-color').addEventListener('click', () => {
    const v = addColor($('f-new-color').value, $('f-new-color-hex').value);
    if (v) { if (!draft.colors.includes(v)) draft.colors.push(v); $('f-new-color').value = ''; renderDraft(); }
  });
  function addTagFromInput() {
    for (const t of $('f-new-tag').value.split(/[,、]/)) {
      const v = t.trim().replace(/^#/, '');
      if (v && !draft.tags.includes(v)) draft.tags.push(v);
    }
    $('f-new-tag').value = '';
    renderDraft();
  }
  $('f-add-tag').addEventListener('click', addTagFromInput);
  // 入力欄で Enter を押したときにフォーム送信せず「追加」として扱う
  for (const [input, btn] of [['f-new-category', 'f-add-category'], ['f-new-color', 'f-add-color'], ['f-new-tag', 'f-add-tag']]) {
    $(input).addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); $(btn).click(); }
    });
  }

  $('item-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('f-new-tag').value.trim()) addTagFromInput();
    const item = W.normalizeItem({
      ...draft,
      id: draft.id || newId(),
      createdAt: draft.createdAt || Date.now(),
      name: $('f-name').value,
      memo: $('f-memo').value,
    });
    const err = W.validateItem(item);
    if (err) { $('f-error').textContent = err; $('f-error').hidden = false; return; }
    const i = state.items.findIndex((x) => x.id === item.id);
    if (i >= 0) state.items[i] = item; else state.items.push(item);
    $('item-dialog').close();
    commit();
  });
  $('f-cancel').addEventListener('click', () => $('item-dialog').close());
  $('f-delete').addEventListener('click', () => {
    if (!confirm(`「${draft.name}」を削除しますか？`)) return;
    state.items = state.items.filter((x) => x.id !== draft.id);
    $('item-dialog').close();
    commit();
  });

  // ---------- タグ管理 ----------
  function renderSettings() {
    const usedCat = (c) => state.items.filter((it) => it.category === c).length;
    const usedColor = (c) => state.items.filter((it) => it.colors.includes(c)).length;
    $('s-categories').replaceChildren(...state.categories.map((c, i) => el('li', null,
      el('span', { class: 'label' }, c, el('span', { class: 'used' }, `${usedCat(c)}点`)),
      el('button', { type: 'button', disabled: i === 0, 'aria-label': '上へ', onclick: () => moveCategory(i, -1) }, '↑'),
      el('button', { type: 'button', disabled: i === state.categories.length - 1, 'aria-label': '下へ', onclick: () => moveCategory(i, 1) }, '↓'),
      el('button', { type: 'button', class: 'danger', onclick: () => removeCategory(c) }, '削除'),
    )));
    $('s-colors').replaceChildren(...state.colors.map((c) => el('li', null,
      el('span', { class: 'label' }, swatch(c.name), c.name, el('span', { class: 'used' }, `${usedColor(c.name)}点`)),
      el('button', { type: 'button', class: 'danger', onclick: () => removeColor(c.name) }, '削除'),
    )));
  }
  function moveCategory(i, d) {
    const cats = state.categories;
    [cats[i], cats[i + d]] = [cats[i + d], cats[i]];
    commit(); renderSettings();
  }
  function removeCategory(c) {
    const n = state.items.filter((it) => it.category === c).length;
    if (n && !confirm(`「${c}」は${n}点のアイテムで使われています。削除すると、それらは「${W.NO_CATEGORY}」になります。よろしいですか？`)) return;
    state.categories = state.categories.filter((x) => x !== c);
    for (const it of state.items) if (it.category === c) it.category = '';
    commit(); renderSettings();
  }
  function removeColor(name) {
    const n = state.items.filter((it) => it.colors.includes(name)).length;
    if (n && !confirm(`「${name}」は${n}点のアイテムで使われています。削除するとアイテムからも外れます。よろしいですか？`)) return;
    state.colors = state.colors.filter((x) => x.name !== name);
    for (const it of state.items) it.colors = it.colors.filter((x) => x !== name);
    commit(); renderSettings();
  }
  $('btn-settings').addEventListener('click', () => { renderSettings(); $('settings-dialog').showModal(); });
  $('s-close').addEventListener('click', () => $('settings-dialog').close());
  $('s-add-category').addEventListener('click', () => {
    if (addCategory($('s-new-category').value)) { $('s-new-category').value = ''; commit(); renderSettings(); }
  });
  $('s-add-color').addEventListener('click', () => {
    if (addColor($('s-new-color').value, $('s-new-color-hex').value)) { $('s-new-color').value = ''; commit(); renderSettings(); }
  });
  for (const [input, btn] of [['s-new-category', 's-add-category'], ['s-new-color', 's-add-color']]) {
    $(input).addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); $(btn).click(); } });
  }

  // ---------- その他 ----------
  $('btn-add').addEventListener('click', () => openItem());
  $('search').addEventListener('input', (e) => { view.query = e.target.value; render(); });

  $('btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `wardrobe-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('file-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const next = W.parseState(await file.text());
      if (!confirm(`${next.items.length}点のアイテムを読み込みます。現在のデータは置き換えられます。よろしいですか？`)) return;
      state = next; commit();
    } catch (err) {
      alert('読み込めませんでした: ' + err.message);
    }
  });
  $('btn-sample').addEventListener('click', () => {
    if (state.items.length && !confirm('現在のデータをサンプルデータで置き換えます。よろしいですか？')) return;
    const s = W.emptyState();
    const add = (name, category, seasons, colors, tags = [], memo = '') => s.items.push(W.normalizeItem({ id: newId(), name, category, seasons, colors, tags, memo, createdAt: Date.now() }));
    add('ウールスラックス', 'スラックス', ['秋', '冬'], ['グレー'], ['仕事用']);
    add('リネンスラックス', 'スラックス', ['春', '夏'], ['ベージュ']);
    add('センタープレススラックス', 'スラックス', ['春', '秋'], ['黒'], ['仕事用']);
    add('セルビッジジーンズ', 'ジーンズ', ['春', '秋', '冬'], ['ネイビー'], ['お気に入り'], '購入 2024年');
    add('ホワイトデニム', 'ジーンズ', ['夏'], ['白']);
    add('ケーブルニット', 'ニット', ['冬'], ['白']);
    add('ハイゲージニット', 'ニット', ['春', '秋'], ['ネイビー', '黒']);
    add('テーラードジャケット', 'ジャケット', ['春', '秋'], ['ネイビー'], ['仕事用']);
    add('デニムジャケット', 'ジャケット', ['春'], ['青']);
    add('ステンカラーコート', 'コート', ['秋', '冬'], ['ベージュ']);
    add('無地Tシャツ', 'Tシャツ', ['夏'], ['白', '黒']);
    state = s; commit();
    for (const d of document.querySelectorAll('details.menu')) d.open = false;
  });
  // メニュー外クリックで閉じる
  document.addEventListener('click', (e) => {
    for (const d of document.querySelectorAll('details.menu')) if (!d.contains(e.target)) d.open = false;
  });

  render();
})();
