# WatchIt

A serverless streaming site for classic movies and TV series. Every title is public domain or openly licensed and streams straight from the [Internet Archive](https://archive.org), so there's no video hosting, no database and no API keys.

Built with Next.js 16 (App Router, Cache Components) and Tailwind CSS 4.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## How it works

- `src/lib/catalog.ts` lists the curated titles by Archive identifier. To add one, copy the identifier from `archive.org/details/<identifier>`, then set `kind` and `genres`.
- `src/lib/archive.ts` fetches metadata from the Archive and caches it with `"use cache"` (titles for a day, searches for an hour). It picks a browser-playable MP4 per video, turns multi-file TV items into episode lists, and refuses any item that isn't marked public domain or Creative Commons.
- Only catalog titles can be searched or played by default. Archive uploaders set license flags themselves, and some are wrong (copyrighted films marked public domain), so every title you add should be checked by hand. Setting `ARCHIVE_OPEN_SEARCH=true` also opens search and playback to the Archive's whole `feature_films` collection, which relies on those uploader flags.
- `/api/search` and `/api/title/[id]` are serverless route handlers.
- My List, Continue Watching and resume position are stored in the viewer's browser (`localStorage`). There are no accounts.

## Deploy

The site deploys to Vercel as-is with zero config:

```bash
npm i -g vercel
vercel
```
