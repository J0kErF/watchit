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

## AI subtitles

Press **CC** in the player and pick a language (or "Original language").

1. `/api/subtitles` cuts the 30-second window being watched out of the video's audio with ffmpeg.
2. It transcribes the window with `openai/whisper-1` through Vercel AI Gateway.
3. It translates the cues with `google/gemini-3.5-flash-lite`.
4. The player loads them into a native text track one window ahead of playback, so they also show in fullscreen.

Results are stored in Vercel Runtime Cache, keyed by title, episode, window and language. Each window is paid for once per language. Silent films don't offer subtitles.

AI Gateway needs a card on the Vercel account. Until then the player shows "AI subtitles turn on once AI Gateway billing is enabled". To test locally, run `vercel env pull` to refresh the gateway token in `.env.local`, which expires.

## Deploy

The site deploys to Vercel as-is with zero config:

```bash
npm i -g vercel
vercel
```
