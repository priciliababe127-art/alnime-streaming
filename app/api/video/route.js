// Lokasi file: app/api/video/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // Kita HANYA menerima MAL ID (Angka) dan Episode
  const malId = searchParams.get('id'); 
  const ep = searchParams.get('ep') || '1';

  if (!malId) {
    return NextResponse.json({ error: "MAL ID (KTP Anime) wajib disertakan!" }, { status: 400 });
  }

  try {
    // ==============================================================================
    // LANGKAH 1: IDENTIFIKASI GLOBAL VIA JIKAN (MYANIMELIST)
    // ==============================================================================
    // Kita tanya ke database dunia: "Anime ID ini judul Jepangnya apa?"
    const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
    const jikanData = await jikanRes.json();

    if (!jikanData?.data) {
      return NextResponse.json({ error: "Anime tidak ditemukan di database MyAnimeList dunia." }, { status: 404 });
    }

    const officialTitle = jikanData.data.title;
    
    // Pembersih Super Akurat (Hanya mengambil 3 kata pertama alfanumerik)
    const cleanQuery = officialTitle.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 3).join(' ');

    // ==============================================================================
    // LANGKAH 2: AGREGATOR API (Mencuri dari API Publik Komunitas, BUKAN Scraping Web)
    // ==============================================================================
    // Kita menembak REST API (JSON murni), bukan membedah HTML!
    // Ini kebal Cloudflare karena server pembuat API ini yang akan berurusan dengan Cloudflare, bukan kita.
    
    const communityApiUrl = `https://otakudesu-unofficial-api.vercel.app/v1/search/${encodeURIComponent(cleanQuery)}`;
    
    const searchRes = await fetch(communityApiUrl, { signal: AbortSignal.timeout(6000) });
    const searchData = await searchRes.json();

    if (!searchData?.data || searchData.data.length === 0) {
       return NextResponse.json({ error: `Video untuk '${cleanQuery}' belum tersedia di server komunitas Indo.` }, { status: 404 });
    }

    // Ambil anime hasil pencarian teratas
    const targetAnimeSlug = searchData.data[0].slug; // Contoh: "rezero-s4-sub-indo"

    // ==============================================================================
    // LANGKAH 3: AMBIL LINK VIDEO DARI API (Tanpa Regex!)
    // ==============================================================================
    // Langsung tembak ke endpoint episode spesifik di API komunitas
    const episodeSlug = `${targetAnimeSlug.replace('-sub-indo', '')}-episode-${ep}-sub-indo`;
    const videoApiUrl = `https://otakudesu-unofficial-api.vercel.app/v1/episode/${episodeSlug}`;

    const videoRes = await fetch(videoApiUrl, { signal: AbortSignal.timeout(6000) });
    const videoData = await videoRes.json();

    if (videoData?.data?.stream_url) {
       return NextResponse.json({ 
         title: officialTitle,
         episode: ep,
         url: videoData.data.stream_url 
       });
    }

    return NextResponse.json({ error: "Sistem berhasil terhubung, namun link video kosong dari pusat." }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: "Sistem Hybrid mengalami gangguan koneksi: " + err.message }, { status: 500 });
  }
}