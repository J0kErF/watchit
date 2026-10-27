# Jawy (جوّي)

A serverless streaming site for movies and TV series. Titles come from [TMDB](https://www.themoviedb.org) and play in an embedded player. There's no video hosting and no database.

Built with Next.js 16 (App Router, Cache Components) and Tailwind CSS 4.

## Brand

The logo, icons and colors live in `public/brand` (wordmark, Arabic wordmark, bilingual lockup and app icon, for dark and light backgrounds). The signature is the shadda (ّ) that sits on the و of جوّي, drawn over the w in the Latin wordmark and used alone as the app icon. `src/components/Logo.tsx` draws the same wordmark inline. Favicon, Apple icon, web app icons and the social card are in `src/app` and `public/icons`.

| Color | Hex | Use |
| --- | --- | --- |
| Night | `#110E1A` | Background |
| Sand | `#F6F0E4` | Text, wordmark |
| Saffron | `#FFB238` | Accent, shadda, app icon |
| Ember | `#D97F06` | Shadda on light backgrounds |

Display type is Alexandria (also the face behind the Arabic wordmark); body text is Geist.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm test           # unit tests (Vitest)
```

## How it works

- `/api/search`, `/api/title/[id]`, `/api/category` (Load more) and `/api/new-episodes` are serverless route handlers.
- My List, Continue Watching and resume position are stored in the viewer's browser (`localStorage`). There are no accounts.
- **English, Arabic and Hebrew.** The navbar switch sets the `jawy-lang` cookie. `src/lib/i18n.ts` holds the Arabic and Hebrew strings, keyed by the English text (anything missing falls back to English; a test checks both tables translate the same strings); server components call `t(lang, …)` with `getLang()`, client components `useT()`. TMDB titles, overviews and genres come in the chosen language, with the English overview when there's no translation. An inline script sets `<html lang dir>` from the cookie before first paint, and layouts use logical classes (`start`/`end`, `ms`/`me`) so they mirror in right-to-left. APIs take the language as a `lang` query parameter, not the cookie, so shared caches keep languages apart.
- **Categories.** Hovering Movies or Series in the navbar lists the categories in `src/lib/categories.ts` (genres, anime, plus Arabic, Turkish, Korean, Indian and Spanish). Each has a page at `/movies/{slug}` or `/series/{slug}` with sort (popular, newest, top rated), a decade filter and Load more. Some have subcategories (`?sub=`): Arabic by country (Egyptian, Syrian, Lebanese), and horror movies by subgenre (supernatural, slasher, zombies, found footage and more, from TMDB keywords). Horror movies have no vote minimum, so every one TMDB lists can be reached.
- **Kids mode.** The Kids button in the navbar sets the `jawy-kids` cookie (`src/lib/kids.ts`). Browse pages switch to kids rows, /discover lists keep to US kids ratings (G, PG, TV-Y, TV-Y7, TV-G), search and recommendations keep family titles, and title and watch pages of anything else show a message instead. Titles without a US rating (most Arabic and Turkish ones) are left out.
- **Watched episodes.** Episodes can be marked watched one by one or a season at a time, with a progress bar per season; the player marks an episode once nine tenths of it has played. Kept in `localStorage` by season and episode number.
- **Install as an app.** `src/app/manifest.ts`, `public/sw.js` (registered in production; it only adds an offline page) and an Install app button in the footer, or the Add to Home Screen steps on iPhone.
- **Search engines.** `/sitemap.xml` lists the browse and category pages and the most popular titles; `/robots.txt` leaves out the player, APIs and admin. Title pages share their artwork and poster as the link preview.
- **Title pages** show the age rating (US when there is one) and a Trailer button that plays the official YouTube trailer from TMDB.
- **Live search.** The navbar field suggests titles while typing; Enter opens the full results.
- **New episode badge.** My List and Continue Watching mark series whose latest episode aired after the viewer last watched (or saved) them.

## Titles (TMDB + embed player)

- `src/lib/tmdb.ts` is the only title source. It builds every row (Top 10 today, Trending, New series, New releases, Popular, Top rated, Coming soon and genre rows from `/discover`), search, and title pages from the TMDB API, cached with `"use cache"` (lists for hours, title details for days). Ids look like `tmdb-movie-278` and `tmdb-tv-1399`.
- The home, Movies and Series pages share `src/components/Browse.tsx`: a billboard for today's top trending title (with its TMDB logo art when there is one), then rows. A title appears in at most two rows per page.
- Turkish and Arabic series rows (`getSeriesFrom`: new, airing this week, popular, top rated, on Netflix or Shahid in Saudi Arabia, Ramadan 2026, and Egyptian and Syrian & Lebanese series) come from `/discover/tv` (origin country TR, original language Arabic) and refresh every few hours. `getSeriesList` adds upcoming series, the best series of all time and anime. Episode lists of series still in production refresh hourly, so new weekly episodes show up the same day.
- Titles play in an iframe at `EMBED_BASE_URL/movie/{tmdbId}` (movies) or `EMBED_BASE_URL/tv/{tmdbId}/{season}/{episode}` (series). Change the paths with `EMBED_MOVIE_PATH` and `EMBED_TV_PATH` if your server uses a different layout. Every TMDB title is listed; whether it plays depends on the embed host. The embed host only answers safelisted sites, so add the production domain to its safelist.
- On the **Library** page (`/library`) a viewer can switch to their own library's embed domain, from the hosts in `EMBED_HOSTS`. The choice is a cookie that only the watch page reads.
- The player listens for the embed's `postMessage` playback updates to keep Continue Watching and resume working, accepting messages only from the embed's domain.

Environment variables:

| Name | Required | Purpose |
| --- | --- | --- |
| `TMDB_API_KEY` or `TMDB_READ_TOKEN` | One of them | TMDB v3 API key, or v4 API Read Access Token. Without either the site shows no titles. |
| `EMBED_BASE_URL` | No | Default embed host, `https://test.vc` if unset. |
| `EMBED_MOVIE_PATH` | No | Movie player path, `/movie/{id}` if unset. |
| `EMBED_TV_PATH` | No | Episode player path, `/tv/{id}/{season}/{episode}` if unset. |
| `EMBED_HOSTS` | No | Hosts viewers may switch to on the Library page, comma-separated; `*.example.com` allows subdomains. Defaults to the default host and its subdomains. |
| `SITE_URL` | No | The public address for the sitemap and link previews, e.g. `https://jawy.example`. Defaults to the Vercel production domain. |
| `ADMIN_PASSWORD` | For the admin portal | Password for `/admin`. Changing it signs everyone out. |
| `BLOB_READ_WRITE_TOKEN` | For the admin portal | Vercel Blob store that keeps the domains added in `/admin`. Set when the store is connected to the project. |

### Admin portal

`/admin` (not linked from the site) lets the owner add or remove the embed domains viewers can connect on the Library page, on top of the built-in `EMBED_HOSTS`. Changes apply at once on the server that made them and within about a minute everywhere else, with no redeploy. The list is stored in Vercel Blob at `admin/embed-hosts.json`. Sign-in sets a signed, 7-day, `httpOnly` cookie.

## Deploy

The site deploys to Vercel as-is with zero config:

```bash
npm i -g vercel
vercel
```
