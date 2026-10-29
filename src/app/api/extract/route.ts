import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'movie';
  const season = searchParams.get('s') || '1';
  const episode = searchParams.get('e') || '1';

  if (!id) {
    return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
  }

  try {
    // Switch target to a reliable upstream source (VidSrc) that supports clean parsing or direct embedding
    const targetUrl = type === 'movie' 
      ? `https://vidsrc.xyz/embed/movie?tmdb=${id}`
      : `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`;

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://vidsrc.xyz/',
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Provider responded with status ${res.status}` }, { status: res.status });
    }

    const html = await res.text();
    
    // Look for master playlist or iframe sources
    const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
    
    if (!m3u8Match) {
      // Fallback: If direct .m3u8 isn't exposed, pass the clean embed URL back for secure sandboxed iframe rendering
      return NextResponse.json({ 
        success: true, 
        embedFallback: targetUrl 
      });
    }

    return NextResponse.json({ 
      success: true, 
      streamUrl: m3u8Match[0] 
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to extract stream', details: errorMessage }, 
      { status: 500 }
    );
  }
}