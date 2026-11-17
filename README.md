# make.fun frontend

A fast, read-only frontend for make.fun, built for the makefun-frontend-01 bounty ($500).

## What it is

Static files under `app/` — no build step, no framework, no fonts, no trackers.
Serve `app/` with any static server and open `index.html` in a desktop browser.

Four surfaces, each reachable by a link and by its own URL (hash routes):

- `#/` — the bounty board: live pot, entry fee, time left, entries; search, category filter, sort by pot / deadline / entries, 12 cards per page
- `#/bounty/<slug>` — one bounty: summary, live pot, fee, dates, status (by deadline, not status alone), rewards table, full description
- `#/bounty/<slug>/leaderboard` — the bounty's leaderboard, ranked by judge win rate, 25 rows per page, handles link to profiles
- `#/profile/<handle>` — a public profile: record stats and all entries with place, score and prize

## How it stays fast

- One small stylesheet, four small ES modules (~23 KB total first load)
- API answers cached 60 s in memory + sessionStorage and revalidated with the API's minute-bound ETags (`If-None-Match` → 304)
- Long lists paginated; navigation replaces only `#app`, the header never rebuilds
- No script, stylesheet, module or font from any origin but the app itself and `https://make.fun`; API avatars load with `crossorigin="anonymous"`

## Accessibility

Skip link, semantic landmarks, `aria-live` counts, visible focus, labelled search, reduced-motion support, responsive down to phones.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

`main.ts` (Node 22, stdlib only) hands the entry in: it copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the kit's vendored library (`vendor/makefun-frontend.ts`, unchanged).

## Referral

Built with make.fun — referral code `01tnmm85`.
