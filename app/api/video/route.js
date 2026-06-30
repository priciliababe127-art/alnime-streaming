import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const malId = searchParams.get('id'); 
  const ep = searchParams.get('ep') || '1';

  if (!malId) return NextResponse.json({ error: "ID Anime hilang!" }, { status: 400 });

  try {
    // 1. Ambil Nama Anime via Jikan
    const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
    const jikanData = await jikanRes.json();
    const title = jikanData?.data?.title_english || jikanData?.data?.title;

    if (!title) throw new Error("Anime tidak ditemukan di database global.");

    // 2. Search di Server Omega
    const searchRes = await fetch(`https://hianime-omega.vercel.app/api/v2/hianime/search?q=${encodeURIComponent(title)}`);
    const searchData = await searchRes.json();
    
    const animeId = searchData?.data?.animes?.[0]?.id;
    if (!animeId) throw new Error("Anime tidak ada di database HiAnime.");

    // 3. Ambil Episode
    const epRes = await fetch(`https://hianime-omega.vercel.app/api/v2/hianime/anime/${animeId}/episodes`);
    const epData = await epRes.json();
    
    // Mencari episode berdasarkan nomor
    const episode = epData?.data?.episodes?.find(e => e.number == ep);
    if (!episode) throw new Error(`Episode ${ep} belum rilis.`);

    // 4. Ambil Sumber Video
    const streamRes = await fetch(`https://hianime-omega.vercel.app/api/v2/hianime/episode/sources?animeEpisodeId=${episode.episodeId}`);
    const streamData = await streamRes.json();

    const watchUrl = streamData?.data?.sources?.find(s => s.url)?.url;
    if (!watchUrl) throw new Error("Link video kosong dari server.");

    return NextResponse.json({
      title: title,
      episode: ep,
      url: watchUrl,
      server: "HiAnime Omega"
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}