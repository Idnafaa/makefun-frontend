// Small, dependency-free helpers for showing API values.

/** Escape text for safe insertion into HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** A dollar amount ('1000.00', 0.5, null) as '$1,000' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
  });
}

/** A micro-unit rate (0..1_000_000) as a percent with one decimal. */
export function pct(micro) {
  const n = Number(micro);
  return Number.isFinite(n) ? `${(n / 10000).toFixed(1)}%` : '—';
}

/** An ISO deadline as a short UTC date + time. */
export function when(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

/** Time until a deadline: '2d 4h left', '35m left', '12s left', or 'ended'. */
export function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  if (mins > 0) return `${mins}m left`;
  return `${Math.floor(ms / 1000)}s left`;
}

/** Whether a bounty still takes entries: its deadline, not its status alone. */
export function stillOpen(bounty) {
  return new Date(bounty.deadline).getTime() > Date.now();
}

/** The reward as it stands now: base prize plus entry fees paid into the pot. */
export function pot(bounty) {
  return money(bounty.potUsd ?? bounty.rewardAmount);
}
