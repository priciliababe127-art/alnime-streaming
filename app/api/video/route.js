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
    const title = jikanData?.data?.title;

    // 2. Cari Anime
    const searchRes = await fetch(`https://hianime-api-eta-eight.vercel.app/api/v2/hianime/search?q=${encodeURIComponent(title)}`);
    const searchData = await searchRes.json();
    const animeId = searchData?.data?.animes?.[0]?.id;

    if (!animeId) return NextResponse.json({ error: "Anime tidak ketemu di HiAnime", debug: searchData }, { status: 404 });

    // 3. Ambil Episode
    const epRes = await fetch(`https://hianime-api-eta-eight.vercel.app/api/v2/hianime/anime/${animeId}/episodes`);
    const epData = await epRes.json();
    const episode = epData?.data?.episodes?.find(e => e.number == ep);

    if (!episode) return NextResponse.json({ error: "Episode tidak ketemu", debug: epData }, { status: 404 });

    // 4. Ambil Source
    const streamRes = await fetch(`https://hianime-api-eta-eight.vercel.app/api/v2/hianime/episode/sources?animeEpisodeId=${episode.episodeId}`);
    const streamData = await streamRes.json();

    // KIRIM SEMUA DATA KE BROWSER SUPAYA KITA BISA LIHAT
    return NextResponse.json({
        data_debug: streamData,
        message: "Cek data_debug untuk melihat apa yang dikirim HiAnime"
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}