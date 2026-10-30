'use client';

import { useEffect, useRef, useState } from 'react';
import type HlsType from 'hls.js';

interface VideoPlayerProps {
  mediaId: string | number;
  mediaType?: 'movie' | 'tv';
  season?: string | number;
  episode?: string | number;
}

interface ExtractResponse {
  success?: boolean;
  streamUrl?: string;
  embedFallback?: string;
  error?: string;
}

export default function VideoPlayer({ 
  mediaId, 
  mediaType = 'movie', 
  season = 1, 
  episode = 1 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [embedFallback, setEmbedFallback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStream() {
      if (!mediaId) return;
      setLoading(true);
      setError(null);

      try {
        let endpoint = `/api/extract?id=${mediaId}&type=${mediaType}`;
        if (mediaType === 'tv') {
          endpoint += `&s=${season}&e=${episode}`;
        }

        const res = await fetch(endpoint);
        const data = (await res.json()) as ExtractResponse;

        if (!isMounted) return;

        if (data.success) {
          if (data.streamUrl) {
            setStreamUrl(data.streamUrl);
          } else if (data.embedFallback) {
            setEmbedFallback(data.embedFallback);
          }
        } else {
          setError(data.error || 'Failed to resolve stream link.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('Failed to load stream:', err);
        setError('Network error occurred while fetching stream.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchStream();

    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType, season, episode]);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    let hlsInstance: HlsType | null = null;
    const videoElement = videoRef.current;

    import('hls.js').then((HlsModule) => {
      const Hls = HlsModule.default;
      if (Hls.isSupported()) {
        hlsInstance = new Hls();
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(videoElement);
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = streamUrl;
      }
    });

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [streamUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center aspect-video w-full bg-slate-950 rounded-xl text-slate-400 space-y-3 shadow-2xl">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Resolving secure video stream...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center aspect-video w-full bg-slate-950 rounded-xl text-red-400 p-6 text-center shadow-2xl">
        <p className="font-semibold mb-1">Playback Error</p>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  // If the extractor fell back to an embed URL, render it in an iframe
  if (embedFallback) {
    return (
      <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl">
        <iframe
          src={embedFallback}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        controls
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
}