// The four surfaces, each a function from live API data to HTML.
// Board cards link to bounty pages; bounty pages link to their leaderboard;
// handles link to profiles. Every route is also a URL (hash routes).

import { esc, money, pct, pot, stillOpen, timeLeft, when } from './format.js';

const bountyUrl = (slug) => `#/bounty/${encodeURIComponent(slug)}`;
const boardUrl = (slug) => `#/bounty/${encodeURIComponent(slug)}/leaderboard`;
const profileUrl = (handle) => `#/profile/${encodeURIComponent(handle)}`;

function feeLine(b) {
  return b.entryFeeUsd ? `<span>Fee ${money(b.entryFeeUsd)}</span>` : '<span>No entry fee</span>';
}

function statusLine(b) {
  return stillOpen(b)
    ? `<span class="open">Open · ${timeLeft(b.deadline)}</span>`
    : `<span class="closed">Closed · ${when(b.deadline)}</span>`;
}

/** One board card: reward/pot first, then fee, time left and entries. */
export function bountyCard(b) {
  return `<li class="card">
    <h3><a href="${bountyUrl(b.slug)}">${esc(b.title)}</a></h3>
    <div class="pot">${pot(b)}</div>
    <div class="meta">${feeLine(b)}${statusLine(b)}<span>${b.submissionCount} ${b.submissionCount === 1 ? 'entry' : 'entries'}</span></div>
    <div><span class="tag">${esc(b.category ?? '')}</span> ${(b.skills ?? []).slice(0, 3).map((s) => `<span class="tag">${esc(s)}</span>`).join(' ')}</div>
  </li>`;
}

/** The board: heading, count, then the page of cards. */
export function boardPage(cards, total) {
  return `<h1>Open bounties</h1>
  <p class="lede">Live bounties on make.fun. Pot is the prize plus entry fees paid in; time left counts down to the deadline.</p>
  <p aria-live="polite"><strong>${total}</strong> ${total === 1 ? 'bounty' : 'bounties'} showing</p>
  <ul class="grid">${cards}</ul>`;
}

/** One bounty's page: summary, facts, rewards table, rules text. */
export function bountyPage(b) {
  const rewards = Object.entries(b.rewards ?? {})
    .sort((a, c) => Number(a[0]) - Number(c[0]))
    .map(([place, amount]) => `<tr><td>${esc(place)}${place === '1' ? 'st' : place === '2' ? 'nd' : place === '3' ? 'rd' : 'th'}</td><td class="num">${money(amount)}</td></tr>`)
    .join('');
  return `<p><a class="back" href="#/">&larr; All bounties</a></p>
  <h1>${esc(b.title)}</h1>
  <p class="lede">${esc(b.summary ?? b.description ?? '')}</p>
  <dl class="facts">
    <div><dt>Live pot</dt><dd>${pot(b)}</dd></div>
    <div><dt>Entry fee</dt><dd>${b.entryFeeUsd ? money(b.entryFeeUsd) : 'Free'}</dd></div>
    <div><dt>Entries</dt><dd>${b.submissionCount}</dd></div>
    <div><dt>Status</dt><dd>${stillOpen(b) ? 'Open' : 'Closed'}</dd></div>
  </dl>
  <p class="meta">${statusLine(b)}<span>Deadline ${when(b.deadline)}</span><span class="tag">${esc(b.category ?? '')}</span></p>
  <p><a href="${boardUrl(b.slug)}">View the leaderboard &rarr;</a></p>
  ${rewards ? `<h2>Rewards</h2><table><thead><tr><th scope="col">Place</th><th scope="col" class="num">Prize</th></tr></thead><tbody>${rewards}</tbody></table>` : ''}
  <h2>About this bounty</h2>
  <p class="desc">${esc(b.description ?? '')}</p>`;
}

/** A bounty's leaderboard: ranked entries, paged. */
export function leaderboardPage(board, rows) {
  const title = board.competition?.title ?? board.title ?? 'Leaderboard';
  const body = rows.map((e) => `<tr>
      <td>${e.rank ?? '—'}</td>
      <td>${e.handle ? `<a href="${profileUrl(e.handle)}">${esc(e.handle)}</a>` : '—'}</td>
      <td>${esc(e.title ?? '')}</td>
      <td class="num">${pct(e.values?.judge)}</td>
      <td class="num">${e.values?.valid ? 'valid' : '—'}</td>
    </tr>`).join('');
  return `<p><a class="back" href="${bountyUrl(board.competition?.slug ?? '')}">&larr; Back to bounty</a></p>
  <h1>${esc(title)} — leaderboard</h1>
  <p class="lede">Ranked by judge win rate. ${board.entries?.length ?? rows.length} entries judged so far.</p>
  ${rows.length ? `<table>
    <thead><tr><th scope="col">#</th><th scope="col">Account</th><th scope="col">Entry</th><th scope="col" class="num">Win rate</th><th scope="col" class="num">Gate</th></tr></thead>
    <tbody>${body}</tbody>
  </table>` : '<p class="notice">No ranked entries yet.</p>'}`;
}

/** An account's public profile: record stats and its entries. */
export function profilePage(p) {
  const rec = p.record ?? {};
  const rows = (p.solutions ?? []).map((s) => `<tr>
      <td><a href="${bountyUrl(s.competition?.slug ?? '')}">${esc(s.competition?.title ?? s.competition?.slug ?? '')}</a></td>
      <td>${esc(s.title ?? '')}</td>
      <td class="num">${s.placement ?? '—'}</td>
      <td class="num">${s.score?.display ?? '—'}</td>
      <td class="num">${s.prize_usd ? money(s.prize_usd) : '—'}</td>
    </tr>`).join('');
  const avatar = p.avatar || p.image
    ? `<img class="avatar" crossorigin="anonymous" src="${esc(p.avatar || p.image)}" alt="">` : '';
  return `<div class="profile-head">${avatar}<div>
    <h1>${esc(p.display_name ?? p.handle)}</h1>
    <p class="lede">@${esc(p.handle)} · joined ${when(p.joined_at)}</p>
  </div></div>
  ${p.bio ? `<p class="desc">${esc(p.bio)}</p>` : ''}
  <div class="stats">
    <div><b>${rec.competitions_entered ?? 0}</b><span>entered</span></div>
    <div><b>${rec.competitions_placed ?? 0}</b><span>placed</span></div>
    <div><b>${rec.competitions_won ?? 0}</b><span>won</span></div>
    <div><b>${money(rec.prize_usd)}</b><span>prize money</span></div>
  </div>
  <h2>Entries</h2>
  ${rows.length ? `<table>
    <thead><tr><th scope="col">Bounty</th><th scope="col">Entry</th><th scope="col" class="num">Place</th><th scope="col" class="num">Score</th><th scope="col" class="num">Prize</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>` : '<p class="notice">No entries yet.</p>'}`;
}
