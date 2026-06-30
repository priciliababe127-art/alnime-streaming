import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const malId = searchParams.get('id'); 
  const ep = searchParams.get('ep') || '1';

  try {
    // 1. Ambil Judul
    const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
    const jikanData = await jikanRes.json();
    const title = jikanData?.data?.title || jikanData?.data?.title_english;

    // 2. Search (Base: /api/v2/hianime/search)
    const searchRes = await fetch(`https://hianime-omega.vercel.app/api/v2/hianime/search?q=${encodeURIComponent(title)}`);
    const searchData = await searchRes.json();
    const animeId = searchData?.data?.animes?.[0]?.id;

    if (!animeId) return NextResponse.json({ error: "Anime tidak ditemukan" }, { status: 404 });

    // 3. Episodes (Base: /api/v2/hianime/anime/{id}/episodes)
    const epRes = await fetch(`https://hianime-omega.vercel.app/api/v2/hianime/anime/${animeId}/episodes`);
    const epData = await epRes.json();
    const episode = epData?.data?.episodes?.find(e => e.number == ep);
    
    if (!episode) return NextResponse.json({ error: "Episode tidak ditemukan" }, { status: 404 });

    // 4. Sources (Base: /api/v2/hianime/episode/sources)
    const streamRes = await fetch(`https://hianime-omega.vercel.app/api/v2/hianime/episode/sources?animeEpisodeId=${episode.episodeId}`);
    const streamData = await streamRes.json();

    const watchUrl = streamData?.data?.sources?.find(s => s.url)?.url;

    if (!watchUrl) return NextResponse.json({ error: "Link streaming gagal" }, { status: 500 });

    return NextResponse.json({ title, episode: ep, url: watchUrl });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}