import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const otakuSlug = searchParams.get('otaku'); 
  const ep = searchParams.get('ep') || '1';

  if (!otakuSlug || otakuSlug === 'undefined') {
    return NextResponse.json({ error: "Slug Otaku tidak valid" }, { status: 400 });
  }

  const targetUrl = `https://otakudesu.blog/episode/${otakuSlug}-episode-${ep}-sub-indo/`;

  // ==========================================================================
  // ARSITEKTUR "CALO TIKET" (3 LAYER WATERFALL BYPASS)
  // ==========================================================================
  async function fetchLikeAMadman(url) {
    const fakeHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://google.com/'
    };

    // --- LAYER 1: TEMBAK LANGSUNG (Siapa tahu Cloudflare sedang lengah) ---
    try {
      const r1 = await fetch(url, { headers: fakeHeaders, signal: AbortSignal.timeout(3500), cache: 'no-store' });
      if (r1.status === 200) return await r1.text();
    } catch (e) { /* Diam saja, turun ke Calo 1 */ }

    // --- LAYER 2: VIA ALL-ORIGINS API (Calo Kelas Kakap - 90% Tembus CF) ---
    try {
      const r2 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(4500) });
      const data2 = await r2.json();
      if (data2?.contents && !data2.contents.includes('Cloudflare')) {
        return data2.contents;
      }
    } catch (e) { /* Diam saja, turun ke Calo 2 */ }

    // --- LAYER 3: VIA CORSPROXY.IO (Calo Jalur Udara) ---
    try {
      const r3 = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { headers: fakeHeaders, signal: AbortSignal.timeout(4500) });
      if (r3.status === 200) return await r3.text();
    } catch (e) {}

    throw new Error("Seluruh rute calo diblokir oleh sistem keamanan target.");
  }

  try {
    const html = await fetchLikeAMadman(targetUrl);

    // REGEX KELAS SUPER (Menjaring desustream, mp4upload, filemoon, your-upload)
    const embedRegex = /(?:https?:)?\/\/(?:desustream\.[a-z]+|filemoon\.[a-z]+|streamwish\.[a-z]+|vidhide\.[a-z]+|mp4upload\.com|dood\.[a-z]+|yourupload\.com)\/(?:e|embed|watch|v)\/[a-zA-Z0-9_-]+/i;
    const match = html.match(embedRegex);

    if (match) {
      let finalUrl = match[0];
      if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
      return NextResponse.json({ url: finalUrl });
    }

    // Fallback Iframe paling rakus
    const greedyIframe = html.match(/<iframe[^>]+src="([^"]+(?:stream|embed|watch|file|dood|vid|moon|wish|upload)[^"]*)"/i);
    if (greedyIframe && greedyIframe[1]) {
      let iframeUrl = greedyIframe[1];
      if (iframeUrl.startsWith('//')) iframeUrl = 'https:' + iframeUrl;
      return NextResponse.json({ url: iframeUrl });
    }

    return NextResponse.json({ error: "Halaman berhasil dicuri, tapi tidak ada rute video di dalamnya" }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 }); // 502: Bad Gateway
  }
}