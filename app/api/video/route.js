import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const malId = searchParams.get('id'); 
  const ep = searchParams.get('ep') || '1';

  // 1. Ambil Judul Asli dari Jikan (karena HiAnime butuh query teks)
  const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
  const jikanData = await jikanRes.json();
  const title = jikanData?.data?.title;

  if (!title) {
    return NextResponse.json({ error: "Anime tidak ditemukan" }, { status: 404 });
  }

  try {
    // 2. Cari Anime di API Pribadimu
    const searchRes = await fetch(`https://hianime-api-eta-eight.vercel.app/api/v2/hianime/search?q=${encodeURIComponent(title)}`);
    const searchData = await searchRes.json();
    
    const animeId = searchData?.data?.animes?.[0]?.id;
    if (!animeId) throw new Error("Gagal menemukan ID anime di HiAnime");

    // 3. Ambil daftar episode
    const epRes = await fetch(`https://hianime-api-eta-eight.vercel.app/api/v2/hianime/anime/${animeId}/episodes`);
    const epData = await epRes.json();
    
    // Cari episode yang sesuai (HiAnime biasanya pakai ID episode)
    const episode = epData?.data?.episodes?.find(e => e.number == ep);
    if (!episode) throw new Error("Episode tidak ditemukan");

    // 4. Ambil Link Streaming
    const streamRes = await fetch(`https://hianime-api-eta-eight.vercel.app/api/v2/hianime/episode/sources?animeEpisodeId=${episode.episodeId}`);
    const streamData = await streamRes.json();

    // HiAnime biasanya memberikan array server (sub/dub), kita ambil yang pertama
    const watchUrl = streamData?.data?.sources?.find(s => s.url)?.url;

    if (!watchUrl) throw new Error("Link stream tidak tersedia");

    return NextResponse.json({
      title: title,
      episode: ep,
      url: watchUrl,
      server: "HiAnime Engine"
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}