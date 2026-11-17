// Hash router for the four surfaces, with a filterable, sortable, paged board.
// The header never rebuilds; only #app is replaced per route, so navigation is
// instant and the search box keeps focus. window.__shotReady flips false while a
// route loads and true once its data is on screen, for screenshot tooling.

import { leaderboard as fetchBoard, listBounties, oneBounty, profile as fetchProfile } from './api.js';
import { boardPage, bountyCard, bountyPage, leaderboardPage, profilePage } from './views.js';

const app = document.getElementById('app');
const searchInput = document.getElementById('q');
const BOARD_PAGE = 12;
const LEADER_PAGE = 25;

const state = { query: '', category: 'All', sort: 'pot', page: 1, lbPage: 1 };
let boardCache = null;

function fail(message) {
  app.innerHTML = `<div class="notice" role="alert"><strong>Could not load this page.</strong> ${message} <a href="#/">Back to the board</a>.</div>`;
}

function pager(page, pages, onPage) {
  if (pages <= 1) return '';
  return `<nav class="pager" aria-label="Pages">
    <button type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>&larr; Previous</button>
    <span>Page ${page} of ${pages}</span>
    <button type="button" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Next &rarr;</button>
  </nav>`;
}

function wirePager(container, onPage) {
  container.querySelectorAll('.pager button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => onPage(Number(btn.dataset.page)));
  });
}

function filteredBoard(items) {
  const q = state.query.trim().toLowerCase();
  let list = items.filter((b) => (state.category === 'All' || b.category === state.category));
  if (q) list = list.filter((b) => `${b.title} ${b.description ?? ''} ${b.category ?? ''}`.toLowerCase().includes(q));
  const by = {
    pot: (a, b) => Number(b.potUsd ?? b.rewardAmount) - Number(a.potUsd ?? a.rewardAmount),
    deadline: (a, b) => new Date(a.deadline) - new Date(b.deadline),
    entries: (a, b) => b.submissionCount - a.submissionCount,
  }[state.sort];
  return [...list].sort(by);
}

async function renderBoard() {
  if (!boardCache) boardCache = await listBounties();
  const items = boardCache.items ?? [];
  const cats = ['All', ...new Set(items.map((b) => b.category).filter(Boolean))];
  const list = filteredBoard(items);
  const pages = Math.max(1, Math.ceil(list.length / BOARD_PAGE));
  state.page = Math.min(state.page, pages);
  const slice = list.slice((state.page - 1) * BOARD_PAGE, state.page * BOARD_PAGE);
  app.innerHTML = `<div class="toolbar" role="group" aria-label="Board controls">
      <div class="chips">${cats.map((c) => `<button type="button" class="chip" data-cat="${c}" aria-pressed="${c === state.category}">${c}</button>`).join('')}</div>
      <label>Sort <select id="sort">
        <option value="pot" ${state.sort === 'pot' ? 'selected' : ''}>Biggest pot</option>
        <option value="deadline" ${state.sort === 'deadline' ? 'selected' : ''}>Ending soonest</option>
        <option value="entries" ${state.sort === 'entries' ? 'selected' : ''}>Most entries</option>
      </select></label>
    </div>` + boardPage(slice.map(bountyCard).join(''), list.length)
    + pager(state.page, pages);
  app.querySelectorAll('.chip').forEach((chip) => chip.addEventListener('click', () => {
    state.category = chip.dataset.cat; state.page = 1; renderBoard();
  }));
  app.querySelector('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderBoard(); });
  wirePager(app, (p) => { state.page = p; renderBoard(); });
  document.title = 'make.fun bounties';
}

async function renderBounty(slug) {
  const b = await oneBounty(slug);
  app.innerHTML = bountyPage(b);
  document.title = `${b.title} | make.fun bounties`;
}

async function renderLeaderboard(slug) {
  const data = await fetchBoard(slug);
  const entries = data.entries ?? [];
  const pages = Math.max(1, Math.ceil(entries.length / LEADER_PAGE));
  state.lbPage = Math.min(state.lbPage, pages);
  const slice = entries.slice((state.lbPage - 1) * LEADER_PAGE, state.lbPage * LEADER_PAGE);
  app.innerHTML = leaderboardPage(data, slice) + pager(state.lbPage, pages);
  wirePager(app, (p) => { state.lbPage = p; renderLeaderboard(slug); });
  document.title = `${data.competition?.title ?? 'Leaderboard'} leaderboard | make.fun bounties`;
}

async function renderProfile(handle) {
  const p = await fetchProfile(handle);
  app.innerHTML = profilePage(p);
  document.title = `@${p.handle} | make.fun bounties`;
}

async function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  try {
    const lb = hash.match(/^#\/bounty\/([^/]+)\/leaderboard$/);
    const bounty = hash.match(/^#\/bounty\/([^/]+)$/);
    const prof = hash.match(/^#\/profile\/([^/]+)$/);
    if (lb) { state.lbPage = 1; await renderLeaderboard(decodeURIComponent(lb[1])); }
    else if (bounty) await renderBounty(decodeURIComponent(bounty[1]));
    else if (prof) await renderProfile(decodeURIComponent(prof[1]));
    else await renderBoard();
  } catch (err) {
    fail(err.message);
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

searchInput.addEventListener('input', () => {
  state.query = searchInput.value;
  state.page = 1;
  if ((location.hash || '#/') === '#/') renderBoard();
  else location.hash = '#/';
});
searchInput.closest('form').addEventListener('submit', (e) => {
  e.preventDefault();
  state.query = searchInput.value;
  state.page = 1;
  location.hash = '#/';
  renderBoard();
});

window.addEventListener('hashchange', render);
render();
