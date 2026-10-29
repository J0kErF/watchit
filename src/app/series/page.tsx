import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { getTitle } from "@/lib/titles";

interface PageProps<T extends string = string> {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface EpisodeItem {
  season?: number;
  season_number?: number;
  episode?: number;
  episode_number?: number;
  [key: string]: unknown;
}

interface TitleDetails {
  id: string | number;
  title: string;
  type?: 'movie' | 'tv';
  episodes?: EpisodeItem[];
  [key: string]: unknown;
}

export async function generateMetadata({ params }: PageProps<"/watch/[id]">): Promise<Metadata> {
  const resolvedParams = await params;
  const title = (await getTitle(resolvedParams.id)) as TitleDetails | null;
  return title ? { title: `Watch ${title.title}` } : {};
}

export default function WatchPage(props: PageProps<"/watch/[id]">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-black flex items-center justify-center text-slate-500">Loading player...</div>}>
      <WatchView {...props} />
    </Suspense>
  );
}

async function WatchView({ params, searchParams }: PageProps<"/watch/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const title = (await getTitle(id)) as TitleDetails | null;
  
  if (!title) {
    notFound();
  }

  // Safely determine media type (movie vs tv)
  const hasEpisodes = Array.isArray(title.episodes) && title.episodes.length > 0;
  const mediaType: 'movie' | 'tv' = title.type === 'tv' || hasEpisodes ? 'tv' : 'movie';

  // Calculate episode index from search query
  const rawEp = query.ep;
  const requestedEp = Number(Array.isArray(rawEp) ? rawEp[0] : rawEp) || 0;
  const epIndex = hasEpisodes && title.episodes 
    ? Math.min(Math.max(requestedEp, 0), title.episodes.length - 1) 
    : 0;

  // Extract season and episode numbers safely with unknown narrowing (Zero 'any')
  const currentEpisode: EpisodeItem | undefined = title.episodes?.[epIndex];
  
  const seasonNum = 
    typeof currentEpisode?.season === 'number' ? currentEpisode.season :
    typeof currentEpisode?.season_number === 'number' ? currentEpisode.season_number : 1;

  const episodeNum = 
    typeof currentEpisode?.episode === 'number' ? currentEpisode.episode :
    typeof currentEpisode?.episode_number === 'number' ? currentEpisode.episode_number : (epIndex + 1);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-4">
        <div className="flex items-center justify-between text-white px-2">
          <h1 className="text-xl font-bold tracking-tight">{title.title}</h1>
          {mediaType === 'tv' && (
            <span className="text-sm text-slate-400 font-medium">
              Season {seasonNum} • Episode {episodeNum}
            </span>
          )}
        </div>

        <VideoPlayer 
          key={`${title.id}-${mediaType}-${seasonNum}-${episodeNum}`}
          mediaId={title.id} 
          mediaType={mediaType} 
          season={seasonNum} 
          episode={episodeNum} 
        />
      </div>
    </main>
  );
}