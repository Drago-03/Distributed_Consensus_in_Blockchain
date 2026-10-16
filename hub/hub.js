// Presentation hub. Renders decks.json (written by scripts/build-site.mjs), so a new
// PPTs/<Topic>/<Deck>/deck.json shows up here without touching this file.

const $ = (sel) => document.querySelector(sel);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  kebab: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12ZM8 13h8v-2H8v2Zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10Z"/></svg>',
  code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4Zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4Z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"/></svg>',
  template: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H5V5h14v14ZM7 7h10v2H7V7Zm0 4h10v2H7v-2Zm0 4h7v2H7v-2Z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h8v8H3V3Zm2 2v4h4V5H5Zm8-2h8v8h-8V3Zm2 2v4h4V5h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Zm8-2h8v8h-8v-8Zm2 2v4h4v-4h-4Z"/></svg>',
  list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v2H3V5Zm0 6h18v2H3v-2Zm0 6h18v2H3v-2Z"/></svg>',
  sortAz: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.94 4.66h-4.72l2.36-2.36 2.36 2.36Zm-4.69 14.71h4.66l-2.33 2.33-2.33-2.33ZM6.1 6.27 1.6 17.73h1.84l.92-2.45h5.11l.92 2.45h1.84L7.74 6.27H6.1Zm-1.13 7.37 1.94-5.18 1.94 5.18H4.97Zm10.76 2.5h6.12v1.59h-8.53v-1.29l5.92-8.56h-5.88v-1.6h8.3v1.26l-5.93 8.6Z"/></svg>',
  sortTime: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7Z"/></svg>',
  blank:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#3ed6c5" d="M21 6h6v15h-6z"/><path fill="#ffb547" d="M27 21h15v6H27z"/><path fill="#ff5a4e" d="M21 27h6v15h-6z"/><path fill="#8c7dff" d="M6 21h15v6H6z"/><path fill="#ece7dc" d="M21 21h6v6h-6z"/></svg>',
};

// ── Per-viewer preferences (best effort: storage may be unavailable) ──
const PREF_KEY = 'decks-hub-prefs';
const prefs = (() => {
  try {
    return { view: 'grid', sort: 'updated', ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') };
  } catch {
    return { view: 'grid', sort: 'updated' };
  }
})();
const savePrefs = () => {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({ view: prefs.view, sort: prefs.sort }));
  } catch {
    /* ignore */
  }
};

const state = { q: '', topic: '', decks: [], repo: '' };

const shortDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, sameYear ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric' });
};
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
const length = (d) => [d.slides && `${d.slides} slides`, d.minutes && `~${d.minutes} min`].filter(Boolean).join(' · ');
const absUrl = (path) => new URL(path, location.href).href;
const repoUrl = (path = '') => (state.repo ? `https://github.com/${state.repo}${path}` : '#');

function highlight(text) {
  const safe = esc(text);
  if (!state.q) return safe;
  const q = esc(state.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${q})`, 'ig'), '<mark>$1</mark>');
}

function thumb(d, cls = '') {
  return d.thumbnail
    ? `<img class="${cls}" src="${esc(d.thumbnail)}" alt="" loading="lazy" decoding="async" width="1600" height="900">`
    : '';
}

// ── Template gallery ──────────────────────────────────────────
function renderTemplates() {
  const tpls = state.decks.filter((d) => d.template);
  const blank = `
    <li>
      <a class="tpl tpl-blank" href="${repoUrl('#using-this-as-a-template')}" target="_blank" rel="noopener">
        <span class="tpl-thumb">${ICON.blank}</span>
        <span class="tpl-name">Blank deck</span>
        <span class="tpl-sub">Start from the engine</span>
      </a>
    </li>`;
  $('#templates').innerHTML =
    blank +
    tpls
      .map(
        (d) => `
    <li>
      <button class="tpl" type="button" data-template="${esc(d.id)}" aria-haspopup="dialog">
        <span class="tpl-thumb">${thumb(d)}</span>
        <span class="tpl-name">${esc(d.title)}</span>
        <span class="tpl-sub">${esc(d.topic)}</span>
      </button>
    </li>`,
      )
      .join('');
  const limit = matchMedia('(max-width: 760px)').matches ? 4 : 6;
  $('#gallery-toggle').hidden = tpls.length + 1 <= limit;
}

// ── Presentations list ────────────────────────────────────────
function visibleDecks() {
  const q = state.q.toLowerCase();
  return state.decks
    .filter((d) => !state.topic || d.topic === state.topic)
    .filter((d) => !q || [d.title, d.topic, d.description, ...(d.tags || [])].join(' ').toLowerCase().includes(q))
    .sort((a, b) =>
      prefs.sort === 'title' ? a.title.localeCompare(b.title) : (b.updated || '').localeCompare(a.updated || ''),
    );
}

function renderDecks() {
  const list = visibleDecks();
  const root = $('#decks');
  root.className = `decks ${prefs.view === 'list' ? 'list' : ''}`;
  document.body.classList.toggle('list-view', prefs.view === 'list');
  root.innerHTML = list
    .map(
      (d) => `
    <article class="deck" role="listitem" style="--accent:${esc(d.accent || '#3ed6c5')}">
      <div class="deck-thumb">
        ${thumb(d)}
        ${d.slides ? `<span class="deck-badge">${esc(d.slides)} slides</span>` : ''}
        <span class="deck-play" aria-hidden="true"><span>${ICON.play}Play</span></span>
      </div>
      <div class="deck-info">
        <span class="deck-icon" aria-hidden="true"></span>
        <div class="deck-text">
          <a class="deck-title" href="${esc(d.url)}" title="${esc(d.description || d.title)}">${highlight(d.title)}</a>
          <span class="deck-sub">${d.slides ? `${esc(d.slides)} slides · ` : ''}Updated ${esc(shortDate(d.updated))}</span>
        </div>
        <span class="deck-col">${highlight(d.topic)}</span>
        <span class="deck-col">${esc(length(d))}</span>
        <span class="deck-col">${esc(fmtDate(d.updated))}</span>
        <button class="icon-btn kebab" type="button" data-menu="${esc(d.id)}" aria-haspopup="menu" aria-expanded="false" aria-label="More actions for ${esc(d.title)}">${ICON.kebab}</button>
      </div>
    </article>`,
    )
    .join('');

  const empty = $('#empty');
  empty.hidden = list.length > 0;
  if (!list.length) empty.textContent = state.q ? `No presentations match “${state.q}”.` : 'No presentations in this topic yet.';

  const list_ = prefs.view === 'list';
  const vt = $('#view-toggle');
  vt.innerHTML = list_ ? ICON.grid : ICON.list;
  vt.setAttribute('aria-label', list_ ? 'Grid view' : 'List view');
  vt.title = vt.getAttribute('aria-label');
  const st = $('#sort-toggle');
  const byTitle = prefs.sort === 'title';
  st.innerHTML = byTitle ? ICON.sortTime : ICON.sortAz;
  st.setAttribute('aria-label', byTitle ? 'Sort by last updated' : 'Sort by title');
  st.title = st.getAttribute('aria-label');
  $('#list-title').textContent = byTitle ? 'Presentations (A–Z)' : 'Recent presentations';
}

function renderTopics() {
  const topics = [...new Set(state.decks.map((d) => d.topic))].sort();
  $('#topic').innerHTML =
    '<option value="">All topics</option>' + topics.map((t) => `<option>${esc(t)}</option>`).join('');
}

// ── Toast ─────────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
async function copy(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
    toast(msg);
  } catch {
    toast('Copy failed: select and copy manually');
  }
}

// ── Kebab menu ────────────────────────────────────────────────
const menu = $('#menu');
let menuOwner = null;

function openMenu(btn, deck) {
  closeMenu();
  menuOwner = btn;
  btn.setAttribute('aria-expanded', 'true');
  menu.innerHTML = `
    <a role="menuitem" href="${esc(deck.url)}">${ICON.play}Play</a>
    <button role="menuitem" type="button" data-act="link">${ICON.link}Copy link</button>
    <hr>
    <a role="menuitem" href="${esc(deck.source)}" target="_blank" rel="noopener">${ICON.code}View source</a>
    ${deck.template ? `<button role="menuitem" type="button" data-act="template">${ICON.template}Use as template</button>` : ''}`;
  menu.hidden = false;
  const r = btn.getBoundingClientRect();
  const w = menu.offsetWidth;
  const h = menu.offsetHeight;
  menu.style.left = `${Math.max(8, Math.min(r.right - w, innerWidth - w - 8))}px`;
  menu.style.top = `${r.bottom + h + 8 > innerHeight ? r.top - h - 4 : r.bottom + 4}px`;
  menu.onclick = (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'link') copy(absUrl(deck.url), 'Link copied');
    if (act === 'template') openTemplate(deck);
    closeMenu(!act);
  };
  menu.querySelector('[role=menuitem]').focus();
}

function closeMenu(restoreFocus = false) {
  if (menu.hidden) return;
  menu.hidden = true;
  menuOwner?.setAttribute('aria-expanded', 'false');
  if (restoreFocus) menuOwner?.focus();
  menuOwner = null;
}

menu.addEventListener('keydown', (e) => {
  const items = [...menu.querySelectorAll('[role=menuitem]')];
  const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
  } else if (e.key === 'Escape' || e.key === 'Tab') {
    e.preventDefault();
    closeMenu(true);
  }
});

// ── Template dialog ───────────────────────────────────────────
const dialog = $('#tpl');

function openTemplate(d) {
  const repo = state.repo || 'OWNER/REPO';
  const cmd = `npx degit ${repo}/${d.path} my-deck`;
  dialog.querySelector('.dialog-body').innerHTML = `
    <div class="dialog-thumb">${thumb(d)}</div>
    <div class="dialog-content">
      <span class="dialog-kicker">${esc(d.topic)} · Template</span>
      <h3 id="tpl-title">${esc(d.title)}</h3>
      <p>${esc(d.description)}</p>
      <ul class="stats">
        ${d.slides ? `<li>${esc(d.slides)} slides</li>` : ''}
        ${d.steps ? `<li>${esc(d.steps)} steps</li>` : ''}
        ${d.minutes ? `<li>~${esc(d.minutes)} min</li>` : ''}
        ${(d.tags || []).slice(0, 3).map((t) => `<li>#${esc(t)}</li>`).join('')}
      </ul>
      <span class="code-label">Copy this deck into a new folder</span>
      <div class="code">
        <code>${esc(cmd)}</code>
        <button class="icon-btn" type="button" data-copy aria-label="Copy command" title="Copy command">${ICON.copy}</button>
      </div>
      <div class="actions">
        <a class="btn" href="${esc(d.source)}" target="_blank" rel="noopener">${ICON.code}View source</a>
        <a class="btn btn-primary" href="${esc(d.url)}">${ICON.play}Preview</a>
      </div>
    </div>`;
  dialog.querySelector('[data-copy]').onclick = () => copy(cmd, 'Command copied');
  dialog.showModal();
}

dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close(); // backdrop click
});

// ── Wiring ────────────────────────────────────────────────────
function bind() {
  const q = $('#q');
  q.addEventListener('input', () => {
    state.q = q.value.trim();
    renderDecks();
  });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      q.value = '';
      state.q = '';
      renderDecks();
      q.blur();
    }
  });
  $('#topic').addEventListener('change', (e) => {
    state.topic = e.target.value;
    renderDecks();
  });
  $('#view-toggle').addEventListener('click', () => {
    prefs.view = prefs.view === 'list' ? 'grid' : 'list';
    savePrefs();
    renderDecks();
  });
  $('#sort-toggle').addEventListener('click', () => {
    prefs.sort = prefs.sort === 'title' ? 'updated' : 'title';
    savePrefs();
    renderDecks();
  });
  $('#gallery-toggle').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    $('#templates').classList.toggle('expanded', open);
  });
  $('#templates').addEventListener('click', (e) => {
    const id = e.target.closest('[data-template]')?.dataset.template;
    const d = id && state.decks.find((x) => x.id === id);
    if (d) openTemplate(d);
  });
  $('#decks').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-menu]');
    if (!btn) return;
    e.preventDefault();
    if (menuOwner === btn) return closeMenu();
    openMenu(btn, state.decks.find((x) => x.id === btn.dataset.menu));
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('[data-menu]')) closeMenu();
  });
  addEventListener('resize', () => closeMenu());
  addEventListener('scroll', () => closeMenu(), { passive: true });
  document.addEventListener('keydown', (e) => {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement;
    if (e.key === '/' && !typing && !dialog.open) {
      e.preventDefault();
      q.focus();
    }
  });
}

async function init() {
  bind();
  try {
    const res = await fetch('decks.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    state.decks = data.decks || [];
    state.repo = data.repo || '';
  } catch {
    $('#error').hidden = false;
    renderDecks();
    $('#empty').hidden = true;
    return;
  }
  if (state.repo) {
    $('#repo-link').href = repoUrl();
    document.querySelectorAll('.foot a').forEach((a) => {
      a.href = a.href.replace(/github\.com\/[^/]+\/[^/]+/, `github.com/${state.repo}`);
    });
  }
  renderTopics();
  renderTemplates();
  renderDecks();
}

init();
