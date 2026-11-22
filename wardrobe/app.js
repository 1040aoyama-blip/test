(function () {
  'use strict';

  const STORAGE_KEY = 'wardrobe-v1';
  const W = window.Wardrobe;
  const $ = (id) => document.getElementById(id);
  const SEASON_COLORS = { 春: 'var(--spring)', 夏: 'var(--summer)', 秋: 'var(--autumn)', 冬: 'var(--winter)' };

  let state = load();
  let view = { category: '', subcategory: '', color: '', query: '' }; // category '' = すべてのアイテム
  let draft = null; // 編集中のアイテム

  // ---------- 永続化 ----------
  // 通常はブラウザの localStorage に保存する。
  // claude.ai で公開したページでは、アカウントごとの非公開ストレージ（db）に保存し、端末間で同期する。
  const remote = { ref: null, loading: false, timer: null, loadTimer: null, unsubscribe: null, writing: false, again: false, lastJSON: '' };

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
    if (remote.ref) {
      clearTimeout(remote.timer);
      remote.timer = setTimeout(flushRemote, 400);
    }
  }
  async function flushRemote() {
    if (remote.writing) { remote.again = true; return; }
    remote.writing = true;
    const json = JSON.stringify(state);
    try {
      if (json !== remote.lastJSON) {
        await remote.ref.set(JSON.parse(json));
        remote.lastJSON = json;
      }
      setStatus('');
    } catch (e) {
      if (e && e.code === 'invalid_argument') {
        // この人にはアカウントへの保存が許可されていない: ブラウザ保存に切り替える
        useLocalOnly();
        return;
      }
      setStatus(e && e.code === 'quota_exceeded' ? '保存容量の上限に達しました。不要なアイテムを削除してください。' : '保存できませんでした。通信状態を確認してください。');
    }
    remote.writing = false;
    if (remote.again && remote.ref) { remote.again = false; flushRemote(); }
  }
  function useLocalOnly() {
    if (remote.unsubscribe) remote.unsubscribe();
    clearTimeout(remote.timer);
    clearTimeout(remote.loadTimer);
    remote.ref = null;
    remote.unsubscribe = null;
    remote.loading = false;
    remote.writing = false;
    remote.again = false;
    setStatus('');
    render();
  }
  function setStatus(msg) {
    $('status').textContent = msg;
    $('status').hidden = !msg;
  }
  async function connectRemote() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      const uid = db && user ? await user.id() : null;
      if (!uid) return;
      // 閲覧のみの人はアカウントに保存できないので、ブラウザ保存のまま使う
      if ((await user.can('data.write')) === false) return;
      remote.ref = db.doc('data/users/' + uid + '/wardrobe');
    } catch (e) {
      console.warn('同期ストレージに接続できませんでした', e);
      return;
    }
    remote.loading = true;
    render();
    const timeout = remote.loadTimer = setTimeout(() => setStatus('データを読み込めていません。通信状態を確認してください。'), 10000);
    remote.unsubscribe = remote.ref.onSnapshot((snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (!snap.exists) {
        if (snap.metadata.fromCache) return;
        clearTimeout(timeout);
        remote.loading = false;
        // まだ何も保存されていない: この端末のデータがあれば引き継ぐ
        if (state.items.length) save();
        render();
        return;
      }
      if (!snap.metadata.fromCache) { clearTimeout(timeout); setStatus(''); }
      remote.loading = false;
      try {
        const next = W.parseState(snap.data());
        const json = JSON.stringify(next);
        remote.lastJSON = json;
        if (json !== JSON.stringify(state)) {
          state = next;
          try { localStorage.setItem(STORAGE_KEY, json); } catch (e) { /* 無視 */ }
        }
      } catch (e) {
        console.warn('保存データの形式が不正です', e);
      }
      render();
    }, (e) => {
      clearTimeout(timeout);
      if (e && e.code === 'invalid_argument') { useLocalOnly(); return; }
      remote.loading = false;
      setStatus('同期が切れました。ページを開き直すと再接続します。');
      render();
    });
  }
  function commit() { save(); render(); }

  // ---------- 確認ダイアログ（confirm/alert の代わり） ----------
  function ask(message, { ok = 'OK', cancel = 'キャンセル', danger = false } = {}) {
    return new Promise((resolve) => {
      const dlg = $('confirm-dialog');
      $('c-message').textContent = message;
      $('c-ok').textContent = ok;
      $('c-ok').className = danger ? 'danger-solid' : 'primary';
      $('c-cancel').hidden = !cancel;
      $('c-cancel').textContent = cancel || '';
      const done = (v) => { dlg.close(); resolve(v); };
      $('c-ok').onclick = () => done(true);
      $('c-cancel').onclick = () => done(false);
      dlg.oncancel = (e) => { e.preventDefault(); done(false); };
      dlg.showModal();
      $('c-ok').focus();
    });
  }
  const notice = (message) => ask(message, { cancel: null });

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

  // ---------- フォルダ一覧（サイドバー） ----------
  const COLLAPSED_KEY = 'wardrobe-collapsed';
  let collapsed = new Set();
  try { collapsed = new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY) || '[]')); } catch (e) { /* 無視 */ }
  function toggleCollapsed(name) {
    if (collapsed.has(name)) collapsed.delete(name); else collapsed.add(name);
    try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed])); } catch (e) { /* 無視 */ }
    render();
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function icon(kind) {
    const paths = {
      all: 'M4 5h16v3H4zM5 10h14v9H5zM10 13h4',
      folder: 'M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z',
      sub: 'M5 7h6l1.5 1.5H19v9H5z',
      none: 'M4 6h16v12H4zM8 10h8M8 14h5',
      caret: 'M9 6l6 6-6 6',
      more: 'M5 12h.01M12 12h.01M19 12h.01',
    };
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'icon icon-' + kind);
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', paths[kind]);
    svg.append(path);
    return svg;
  }

  function selectFolder(category, subcategory = '') {
    view.category = category;
    view.subcategory = subcategory;
    closeSidebar();
    render();
    window.scrollTo({ top: 0 });
  }
  const isSelected = (category, subcategory = '') => view.category === category && view.subcategory === subcategory;

  function folderRow({ level, label, count, iconKind, selected, onSelect, caret, onEdit }) {
    return el('div', { class: `folder-row level-${level}`, 'aria-current': selected ? 'true' : null },
      caret || el('span', { class: 'caret-space' }),
      el('button', { type: 'button', class: 'folder-link', onclick: onSelect },
        icon(iconKind), el('span', { class: 'folder-name' }, label), el('span', { class: 'folder-count' }, count ? String(count) : '')),
      onEdit ? el('button', { type: 'button', class: 'more', 'aria-label': `${label} を編集`, title: 'フォルダを編集', onclick: onEdit }, icon('more')) : el('span', { class: 'more-space' }),
    );
  }

  function renderSidebar(tree) {
    const rows = [el('li', null, folderRow({
      level: 0, label: 'すべてのアイテム', count: tree.total, iconKind: 'all',
      selected: isSelected(''), onSelect: () => selectFolder(''),
    }))];
    for (const f of tree.folders) {
      const open = !collapsed.has(f.name);
      const caret = f.children.length
        ? el('button', { type: 'button', class: 'caret', 'aria-expanded': String(open), 'aria-label': open ? `${f.name} を閉じる` : `${f.name} を開く`, onclick: () => toggleCollapsed(f.name) }, icon('caret'))
        : null;
      rows.push(el('li', null,
        folderRow({
          level: 1, label: f.name, count: f.count, iconKind: 'folder', caret,
          selected: isSelected(f.name), onSelect: () => selectFolder(f.name),
          onEdit: state.categories.includes(f.name) ? () => openFolder({ parent: '', name: f.name }) : null,
        }),
        f.children.length && open ? el('ul', { class: 'children' }, f.children.map((c) => el('li', null, folderRow({
          level: 2, label: c.name, count: c.count, iconKind: 'sub',
          selected: isSelected(f.name, c.name), onSelect: () => selectFolder(f.name, c.name),
          onEdit: (state.subcategories[f.name] || []).includes(c.name) ? () => openFolder({ parent: f.name, name: c.name }) : null,
        })))) : null,
      ));
    }
    if (tree.uncategorized) {
      rows.push(el('li', null, folderRow({
        level: 1, label: W.NO_CATEGORY, count: tree.uncategorized, iconKind: 'none',
        selected: isSelected(W.NO_CATEGORY), onSelect: () => selectFolder(W.NO_CATEGORY),
      })));
    }
    $('folder-tree').replaceChildren(el('ul', { class: 'tree' }, rows));
  }

  function openSidebar() {
    $('sidebar').classList.add('open');
    $('sidebar-backdrop').hidden = false;
    $('btn-folders').setAttribute('aria-expanded', 'true');
  }
  function closeSidebar() {
    $('sidebar').classList.remove('open');
    $('sidebar-backdrop').hidden = true;
    $('btn-folders').setAttribute('aria-expanded', 'false');
  }
  $('btn-folders').addEventListener('click', () => ($('sidebar').classList.contains('open') ? closeSidebar() : openSidebar()));
  $('sidebar-backdrop').addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('sidebar').classList.contains('open')) closeSidebar(); });

  // ---------- 一覧描画 ----------
  function render() {
    const tree = W.buildFolderTree(state.items, state.categories, state.subcategories);
    // 選択中のフォルダが消えていたら「すべてのアイテム」に戻す
    const folder = tree.folders.find((f) => f.name === view.category);
    if (view.category === W.NO_CATEGORY ? !tree.uncategorized : view.category && !folder) { view.category = ''; view.subcategory = ''; }
    if (view.subcategory && !(folder && folder.children.some((c) => c.name === view.subcategory))) view.subcategory = '';
    if (view.color && !state.colors.some((c) => c.name === view.color)) view.color = '';

    renderSidebar(tree);

    // 現在地（パンくず）
    const total = state.items.filter((it) => W.matchesFilter(it, { category: view.category, subcategory: view.subcategory })).length;
    const crumbs = [el('button', { type: 'button', class: 'crumb', onclick: () => selectFolder('') }, 'すべてのアイテム')];
    if (view.category) crumbs.push(el('span', { class: 'sep', 'aria-hidden': 'true' }, '›'), el('button', { type: 'button', class: 'crumb', onclick: () => selectFolder(view.category) }, view.category));
    if (view.subcategory) crumbs.push(el('span', { class: 'sep', 'aria-hidden': 'true' }, '›'), el('span', { class: 'crumb' }, view.subcategory));
    crumbs[crumbs.length - 1].setAttribute('aria-current', 'page');
    $('folder-title').replaceChildren(el('span', { class: 'crumbs' }, crumbs), el('span', { class: 'count' }, `${total}点`));

    // 大カテゴリーを開いているときは、中のサブフォルダへすぐ切り替えられるようにする
    const subs = folder && view.category !== W.NO_CATEGORY ? folder.children : [];
    $('subfolders').hidden = subs.length === 0;
    $('subfolders').replaceChildren(...(subs.length ? [
      el('button', { class: 'chip', 'aria-pressed': String(!view.subcategory), onclick: () => selectFolder(view.category) }, 'すべて', el('span', { class: 'count' }, String(folder.count))),
      ...subs.map((c) => el('button', {
        class: 'chip', 'aria-pressed': String(view.subcategory === c.name), onclick: () => selectFolder(view.category, c.name),
      }, c.name, el('span', { class: 'count' }, String(c.count)))),
    ] : []));

    $('color-filter').replaceChildren(
      el('button', { class: 'chip', 'aria-pressed': String(!view.color), onclick: () => { view.color = ''; render(); } }, 'すべての色'),
      ...state.colors.map((c) => el('button', {
        class: 'chip', 'aria-pressed': String(view.color === c.name),
        onclick: () => { view.color = view.color === c.name ? '' : c.name; render(); },
      }, swatch(c.name), c.name)),
    );

    const items = state.items.filter((it) => W.matchesFilter(it, view));
    const list = $('list');
    if (!state.items.length && remote.loading) {
      list.replaceChildren(el('p', { class: 'empty' }, '読み込み中…'));
      return;
    }
    if (!state.items.length) {
      list.replaceChildren(el('div', { class: 'empty' },
        el('p', null, 'まだアイテムがありません。登録した洋服はフォルダごとに、春・夏・秋・冬の順で並びます。'),
        el('div', { class: 'empty-actions' },
          el('button', { class: 'primary', onclick: () => openItem() }, '＋ 最初のアイテムを追加'),
          el('button', { onclick: loadSample }, 'サンプルで試す'),
        ),
      ));
      return;
    }
    if (!items.length) {
      const here = view.subcategory || view.category;
      list.replaceChildren(el('div', { class: 'empty' },
        el('p', null, total || !here ? '条件に合うアイテムがありません。' : `「${here}」にはまだアイテムがありません。`),
        !total && here && here !== W.NO_CATEGORY ? el('div', { class: 'empty-actions' },
          el('button', { class: 'primary', onclick: () => openItem() }, `＋ ${here}に追加`)) : null,
      ));
      return;
    }
    if (!splitBySeason) {
      list.replaceChildren(el('div', { class: 'grid' }, W.sortBySeason(items).map(card)));
      return;
    }
    list.replaceChildren(...W.groupBySeason(items).map((sec) => el('section', { class: 'season', 'data-season': sec.season },
      el('h2', null, sec.season, el('span', { class: 'count' }, `${sec.items.length}点`)),
      el('div', { class: 'grid' }, sec.items.map(card)),
    )));
  }

  // 季節ごとに分けて表示するか（この端末のブラウザに記憶）
  const SPLIT_KEY = 'wardrobe-split-by-season';
  let splitBySeason = true;
  try { splitBySeason = localStorage.getItem(SPLIT_KEY) !== '0'; } catch (e) { /* 無視 */ }
  $('season-switch').checked = splitBySeason;
  $('season-switch').addEventListener('change', (e) => {
    splitBySeason = e.target.checked;
    try { localStorage.setItem(SPLIT_KEY, splitBySeason ? '1' : '0'); } catch (err) { /* 無視 */ }
    render();
  });

  function card(it) {
    const where = !view.category
      ? [it.category || W.NO_CATEGORY, it.subcategory].filter(Boolean).join(' › ')
      : !view.subcategory ? it.subcategory : '';
    return el('button', { class: 'card', type: 'button', onclick: () => openItem(it), title: 'クリックで編集' },
      el('span', { class: 'name' }, it.name),
      el('span', { class: 'meta' },
        where && el('span', { class: 'chip folder-chip' }, where),
        it.seasons.length > 0 && el('span', { class: 'season-dots' }, it.seasons.map((s) => el('span', { class: 'season-dot', style: `background:${SEASON_COLORS[s]}` }, s))),
        it.colors.map((c) => el('span', { class: 'chip' }, swatch(c), c)),
        it.tags.map((t) => el('span', { class: 'chip' }, '#' + t)),
      ),
      it.memo && el('span', { class: 'memo' }, it.memo),
    );
  }

  // ---------- フォルダの追加・編集 ----------
  let folderDraft = null; // { parent, name } 編集時。追加時は { parent, name: '' , isNew: true }
  function openFolder({ parent = '', name = '', isNew = false }) {
    folderDraft = { parent, name, isNew };
    const big = !parent;
    $('folder-dialog-title').textContent = isNew ? '新しいフォルダ' : 'フォルダを編集';
    $('fd-name').value = name;
    $('fd-parent-field').hidden = !isNew;
    if (isNew) {
      $('fd-parent').replaceChildren(
        el('option', { value: '' }, 'なし（大カテゴリーとして作る）'),
        ...state.categories.map((c) => el('option', { value: c }, c)),
      );
      $('fd-parent').value = parent;
    }
    const siblings = big ? state.categories : (state.subcategories[parent] || []);
    const i = siblings.indexOf(name);
    $('fd-up').hidden = $('fd-down').hidden = isNew;
    $('fd-up').disabled = i <= 0;
    $('fd-down').disabled = i < 0 || i >= siblings.length - 1;
    $('fd-delete').hidden = isNew;
    $('fd-add-child').hidden = isNew || !big;
    $('fd-add-child').textContent = `＋ 「${name}」の中にサブフォルダを作る`;
    const n = isNew ? 0 : W.countInFolder(state.items, parent, name);
    $('fd-info').hidden = isNew;
    $('fd-info').textContent = isNew ? '' : `${parent ? parent + ' › ' : ''}${name}（${n}点）`;
    $('fd-error').hidden = true;
    closeSidebar();
    if (!$('folder-dialog').open) $('folder-dialog').showModal();
    $('fd-name').focus();
  }
  function folderError(msg) { $('fd-error').textContent = msg; $('fd-error').hidden = false; }

  $('folder-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = folderDraft;
    const name = $('fd-name').value.trim();
    if (d.isNew) {
      const parent = $('fd-parent').value;
      const err = W.addFolder(state, parent, name);
      if (err) return folderError(err);
      if (parent) collapsed.delete(parent);
      $('folder-dialog').close();
      commit();
      selectFolder(parent || name, parent ? name : '');
    } else {
      const err = W.renameFolder(state, d.parent, d.name, name);
      if (err) return folderError(err);
      if (!d.parent && collapsed.has(d.name)) { collapsed.delete(d.name); collapsed.add(name); }
      if (!d.parent && view.category === d.name) view.category = name;
      if (d.parent && view.category === d.parent && view.subcategory === d.name) view.subcategory = name;
      $('folder-dialog').close();
      commit();
    }
  });
  $('fd-cancel').addEventListener('click', () => $('folder-dialog').close());
  for (const [btn, dir] of [['fd-up', -1], ['fd-down', 1]]) {
    $(btn).addEventListener('click', () => {
      W.moveFolder(state, folderDraft.parent, folderDraft.name, dir);
      commit();
      openFolder(folderDraft);
    });
  }
  $('fd-add-child').addEventListener('click', () => openFolder({ parent: folderDraft.name, isNew: true }));
  $('fd-delete').addEventListener('click', async () => {
    const { parent, name } = folderDraft;
    const n = W.countInFolder(state.items, parent, name);
    const subs = !parent ? (state.subcategories[name] || []).length : 0;
    const detail = [
      subs ? `中のサブフォルダ${subs}個も削除されます。` : '',
      n ? (parent ? `中の${n}点のアイテムは「${parent}」の直下に移ります。` : `中の${n}点のアイテムは「${W.NO_CATEGORY}」に移ります。`) : '',
    ].join('');
    if (!(await ask(`フォルダ「${name}」を削除しますか？${detail ? '\n' + detail : ''}アイテム自体は削除されません。`, { ok: '削除', danger: true }))) return;
    W.deleteFolder(state, parent, name);
    $('folder-dialog').close();
    commit();
  });
  $('btn-new-folder').addEventListener('click', () => openFolder({
    parent: view.category && view.category !== W.NO_CATEGORY && state.categories.includes(view.category) && !view.subcategory ? view.category : '',
    isNew: true,
  }));

  // ---------- 追加・編集ダイアログ ----------
  function openItem(item) {
    draft = item
      ? { ...item, seasons: [...item.seasons], colors: [...item.colors], tags: [...item.tags] }
      : {
        id: '', name: '',
        category: view.category && view.category !== W.NO_CATEGORY ? view.category : '',
        subcategory: view.subcategory || '',
        seasons: [], colors: [], tags: [], memo: '',
      };
    if (!draft.subcategory) draft.subcategory = '';
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
    // 旧データなどで一覧にない分類が付いている場合も表示する
    const cats = draft.category && !state.categories.includes(draft.category) ? [...state.categories, draft.category] : state.categories;
    $('f-category').replaceChildren(...cats.map((c) => el('button', {
      type: 'button', class: 'chip', 'aria-pressed': String(draft.category === c),
      onclick: () => {
        draft.category = draft.category === c ? '' : c;
        if (!subsOf(draft.category).includes(draft.subcategory)) draft.subcategory = '';
        renderDraft();
      },
    }, c)));
    const subs = subsOf(draft.category);
    const shownSubs = draft.subcategory && !subs.includes(draft.subcategory) ? [...subs, draft.subcategory] : subs;
    $('f-subcategory-field').hidden = !draft.category;
    $('f-subcategory-label').textContent = `「${draft.category}」の中のサブフォルダ（任意）`;
    $('f-subcategory').replaceChildren(...shownSubs.map((c) => el('button', {
      type: 'button', class: 'chip', 'aria-pressed': String(draft.subcategory === c),
      onclick: () => { draft.subcategory = draft.subcategory === c ? '' : c; renderDraft(); },
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

  function subsOf(category) {
    return (category && state.subcategories[category]) || [];
  }
  // 入力欄からフォルダを作る。既にあればそれを選ぶ
  function ensureFolder(parent, name) {
    const v = name.trim();
    if (!v) return '';
    const list = parent ? subsOf(parent) : state.categories;
    if (!list.includes(v) && !W.addFolder(state, parent, v)) save();
    return v;
  }
  function addColor(name, hex) {
    const v = name.trim();
    if (!v) return '';
    if (!state.colors.some((c) => c.name === v)) { state.colors.push({ name: v, hex }); save(); }
    return v;
  }

  $('f-add-category').addEventListener('click', () => {
    const v = ensureFolder('', $('f-new-category').value);
    if (v) { draft.category = v; draft.subcategory = ''; $('f-new-category').value = ''; renderDraft(); render(); }
  });
  $('f-add-subcategory').addEventListener('click', () => {
    if (!draft.category) return;
    if (!state.categories.includes(draft.category)) ensureFolder('', draft.category);
    const v = ensureFolder(draft.category, $('f-new-subcategory').value);
    if (v) { draft.subcategory = v; $('f-new-subcategory').value = ''; renderDraft(); render(); }
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
  for (const [input, btn] of [['f-new-category', 'f-add-category'], ['f-new-subcategory', 'f-add-subcategory'], ['f-new-color', 'f-add-color'], ['f-new-tag', 'f-add-tag']]) {
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
  $('f-delete').addEventListener('click', async () => {
    if (!(await ask(`「${draft.name}」を削除しますか？`, { ok: '削除', danger: true }))) return;
    state.items = state.items.filter((x) => x.id !== draft.id);
    $('item-dialog').close();
    commit();
  });

  // ---------- 色の管理 ----------
  function renderSettings() {
    const usedColor = (c) => state.items.filter((it) => it.colors.includes(c)).length;
    $('s-colors').replaceChildren(...state.colors.map((c) => el('li', null,
      el('span', { class: 'label' }, swatch(c.name), c.name, el('span', { class: 'used' }, `${usedColor(c.name)}点`)),
      el('button', { type: 'button', class: 'danger', onclick: () => removeColor(c.name) }, '削除'),
    )));
  }
  async function removeColor(name) {
    const n = state.items.filter((it) => it.colors.includes(name)).length;
    if (n && !(await ask(`「${name}」は${n}点のアイテムで使われています。削除するとアイテムからも外れます。よろしいですか？`, { ok: '削除', danger: true }))) return;
    state.colors = state.colors.filter((x) => x.name !== name);
    for (const it of state.items) it.colors = it.colors.filter((x) => x !== name);
    commit(); renderSettings();
  }
  $('btn-settings').addEventListener('click', () => { closeMenus(); renderSettings(); $('settings-dialog').showModal(); });
  $('s-close').addEventListener('click', () => $('settings-dialog').close());
  $('s-add-color').addEventListener('click', () => {
    if (addColor($('s-new-color').value, $('s-new-color-hex').value)) { $('s-new-color').value = ''; commit(); renderSettings(); }
  });
  $('s-new-color').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); $('s-add-color').click(); } });

  // ---------- その他 ----------
  $('btn-add').addEventListener('click', () => openItem());
  $('search').addEventListener('input', (e) => { view.query = e.target.value; render(); });

  $('btn-export').addEventListener('click', async () => {
    closeMenus();
    const json = JSON.stringify(state, null, 2);
    const filename = `wardrobe-${new Date().toISOString().slice(0, 10)}.json`;
    const downloads = window.claude && window.claude.use ? await window.claude.use('downloads').catch(() => null) : null;
    if (downloads) {
      try { await downloads.save({ filename, data: json }); } catch (e) { /* 閲覧者がキャンセル */ }
      return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: filename });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('file-import').addEventListener('change', async (e) => {
    closeMenus();
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const next = W.parseState(await file.text());
      if (!(await ask(`${next.items.length}点のアイテムを読み込みます。現在のデータは置き換えられます。よろしいですか？`, { ok: '読み込む' }))) return;
      state = next; commit();
    } catch (err) {
      notice('読み込めませんでした: ' + err.message);
    }
  });
  $('btn-sample').addEventListener('click', () => { closeMenus(); loadSample(); });
  async function loadSample() {
    if (state.items.length && !(await ask('現在のデータをサンプルデータで置き換えます。よろしいですか？', { ok: '置き換える', danger: true }))) return;
    const s = W.emptyState();
    const add = (name, cat, seasons, colors, tags = [], memo = '') => {
      const [category, subcategory = ''] = cat.split('/');
      s.items.push(W.normalizeItem({ id: newId(), name, category, subcategory, seasons, colors, tags, memo, createdAt: Date.now() }));
    };
    add('ウールスラックス', 'ボトムス/スラックス', ['秋', '冬'], ['グレー'], ['仕事用']);
    add('リネンスラックス', 'ボトムス/スラックス', ['春', '夏'], ['ベージュ']);
    add('センタープレススラックス', 'ボトムス/スラックス', ['春', '秋'], ['黒'], ['仕事用']);
    add('セルビッジジーンズ', 'ボトムス/ジーンズ', ['春', '秋', '冬'], ['ネイビー'], ['お気に入り'], '購入 2024年');
    add('ホワイトデニム', 'ボトムス/ジーンズ', ['夏'], ['白']);
    add('ベージュのチノパン', 'ボトムス/コットンパンツ', ['春', '夏', '秋'], ['ベージュ']);
    add('ケーブルニット', 'トップス/ニット', ['冬'], ['白']);
    add('ハイゲージニット', 'トップス/ニット', ['春', '秋'], ['ネイビー', '黒']);
    add('無地Tシャツ', 'トップス/Tシャツ', ['夏'], ['白', '黒']);
    add('オックスフォードシャツ', 'トップス/シャツ', ['春', '秋'], ['白'], ['仕事用']);
    add('テーラードジャケット', 'アウター/ジャケット', ['春', '秋'], ['ネイビー'], ['仕事用']);
    add('デニムジャケット', 'アウター/ジャケット', ['春'], ['青']);
    add('ステンカラーコート', 'アウター/コート', ['秋', '冬'], ['ベージュ']);
    add('白スニーカー', 'シューズ', ['春', '夏', '秋'], ['白']);
    state = s; commit();
  }
  function closeMenus() {
    for (const d of document.querySelectorAll('details.menu')) d.open = false;
  }
  // メニュー外クリックで閉じる
  document.addEventListener('click', (e) => {
    for (const d of document.querySelectorAll('details.menu')) if (!d.contains(e.target)) d.open = false;
  });

  render();
  connectRemote();
})();
