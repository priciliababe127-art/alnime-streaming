import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const otakuSlug = searchParams.get('otaku'); 
  const ep = searchParams.get('ep') || '1';

  if (!otakuSlug || otakuSlug === 'undefined') {
    return NextResponse.json({ error: "Slug tidak valid" }, { status: 400 });
  }

  // Format baku URL episode Otakudesu
  // Contoh: rezero-kara-hajimeru-isekai-seikatsu-4th-episode-1-sub-indo
  const episodeSlug = `${otakuSlug}-episode-${ep}-sub-indo`;

  // ==============================================================================
  // JALAN TOL KOMUNITAS: Menggunakan 3 API Publik Terkuat
  // ==============================================================================
  const publicApis = [
    `https://otakudesu-unofficial-api.vercel.app/v1/episode/${episodeSlug}`,
    `https://otakudesu-anime-api.vercel.app/api/v1/episode/${episodeSlug}`,
    `https://nya-otakudesu.vercel.app/api/v1/detail/${episodeSlug}`
  ];

  for (const apiUrl of publicApis) {
    try {
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(4500) });
      if (!res.ok) continue; // Jika API ini mati/diblokir, lompat ke API berikutnya
      
      const json = await res.json();
      let streamUrl = null;

      // Mendeteksi berbagai format JSON dari masing-masing pembuat API
      if (json?.data?.stream_url) streamUrl = json.data.stream_url;
      else if (json?.stream_url) streamUrl = json.stream_url;
      else if (json?.data?.iframe) streamUrl = json.data.iframe;
      
      // Jika berhasil mendapatkan link (biasanya iframe Desustream), langsung kirim!
      if (streamUrl) {
         if (streamUrl.startsWith('//')) streamUrl = 'https:' + streamUrl;
         return NextResponse.json({ url: streamUrl });
      }
    } catch (e) {
      continue;
    }
  }

  // ==============================================================================
  // RENCANA CADANGAN: SCRAPING MANDIRI JIKA SEMUA API PUBLIK MATI
  // ==============================================================================
  try {
    const backupTarget = `https://otakudesu.cloud/episode/${episodeSlug}/`;
    const bypassUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(backupTarget)}`;
    
    const res = await fetch(bypassUrl, { signal: AbortSignal.timeout(5000) });
    const json = await res.json();
    const html = json.contents || '';

    const embedRegex = /(?:https?:)?\/\/(?:desustream\.[a-z]+|filemoon\.[a-z]+|streamwish\.[a-z]+|vidhide\.[a-z]+|mp4upload\.com|dood\.[a-z]+|yourupload\.com)\/(?:e|embed|watch|v|beta\/stream)\/[a-zA-Z0-9_-]+/i;
    const match = html.match(embedRegex);

    if (match) {
      let finalUrl = match[0];
      if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
      return NextResponse.json({ url: finalUrl });
    }
  } catch (e) {
    // Abaikan dan biarkan turun ke pesan error bawah
  }

  return NextResponse.json({ error: "Semua API publik dan Scraping Cadangan gagal menembus server." }, { status: 404 });
}