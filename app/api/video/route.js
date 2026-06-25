import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const malId = searchParams.get('id'); 
  const ep = searchParams.get('ep') || '1';

  if (!malId) return NextResponse.json({ error: "MAL ID wajib disertakan!" }, { status: 400 });

  try {
    // ==============================================================================
    // LANGKAH 1: IDENTIFIKASI GLOBAL & TERJEMAHAN (JIKAN)
    // ==============================================================================
    const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`, { signal: AbortSignal.timeout(5000) });
    const jikanData = await jikanRes.json();
    
    if (!jikanData?.data) {
      return NextResponse.json({ error: "Anime tidak ditemukan di database MyAnimeList." }, { status: 404 });
    }

    // KUNCI SUKSES GLOBAL: Kita prioritaskan Judul Bahasa Inggris!
    const officialTitle = jikanData.data.title_english || jikanData.data.title;
    
    // Bersihkan judul: "Re:ZERO -Starting Life in Another World-" -> "Re ZERO Starting Life"
    const cleanQuery = officialTitle.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 4).join(' ');

    // ==============================================================================
    // LANGKAH 2: INVASI KE GOGOANIME (ANITAKU)
    // ==============================================================================
    const baseUrl = 'https://anitaku.pe'; // Domain resmi Gogoanime saat ini
    const searchUrl = `${baseUrl}/search.html?keyword=${encodeURIComponent(cleanQuery)}`;

    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(5000)
    });
    
    const searchHtml = await searchRes.text();

    // Mencari slug anime dari hasil pencarian (Contoh: /category/re-zero-season-3)
    const categoryMatch = searchHtml.match(/\/category\/([^"]+)/i);
    if (!categoryMatch) {
      return NextResponse.json({ error: `Pencarian global untuk "${cleanQuery}" belum tersedia.` }, { status: 404 });
    }

    const animeSlug = categoryMatch[1];

    // ==============================================================================
    // LANGKAH 3: AMBIL VIDEO EPISODE SPESIFIK
    // ==============================================================================
    // Format Gogoanime sangat baku: /judul-anime-episode-1
    const episodeUrl = `${baseUrl}/${animeSlug}-episode-${ep}`;
    
    const epRes = await fetch(episodeUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(5000)
    });
    
    const epHtml = await epRes.text();

    // ==============================================================================
    // LANGKAH 4: EKSTRAKSI IFRAME PLAYER (VIDSTREAMING / GOGO-PLAY)
    // ==============================================================================
    // Gogoanime menyimpan video mereka di server super cepat bernama embtaku/vidstreaming
    const iframeMatch = epHtml.match(/<iframe src="([^"]+)"/i);

    if (iframeMatch && iframeMatch[1]) {
      let finalUrl = iframeMatch[1];
      if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;

      return NextResponse.json({ 
        title: officialTitle,
        episode: ep,
        url: finalUrl,
        server: "Global (English Sub)"
      });
    }

    return NextResponse.json({ error: `Halaman episode ${ep} ditemukan, namun server video sedang offline.` }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: "Mesin Global mengalami gangguan: " + err.message }, { status: 500 });
  }
}