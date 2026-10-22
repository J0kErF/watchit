# WatchIt

A serverless streaming site for movies and TV series. Titles come from [TMDB](https://www.themoviedb.org) and play in an embedded player. There's no video hosting and no database.

Built with Next.js 16 (App Router, Cache Components) and Tailwind CSS 4.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## How it works

- `/api/search` and `/api/title/[id]` are serverless route handlers.
- My List, Continue Watching and resume position are stored in the viewer's browser (`localStorage`). There are no accounts.

## Titles (TMDB + embed player)

- `src/lib/tmdb.ts` is the only title source. It builds every row (Top 10 today, Trending, New series, New releases, Popular, Top rated, Coming soon and genre rows from `/discover`), search, and title pages from the TMDB API, cached with `"use cache"` (lists for hours, title details for days). Ids look like `tmdb-movie-278` and `tmdb-tv-1399`.
- The home, Movies and Series pages share `src/components/Browse.tsx`: a billboard for today's top trending title (with its TMDB logo art when there is one), then rows. A title appears in at most two rows per page.
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
