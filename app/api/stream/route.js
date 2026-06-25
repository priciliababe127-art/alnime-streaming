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
  // ARSITEKTUR "KUDA TROYA" (Bypass Cloudflare via SEO Whitelist)
  // ==========================================================================
  async function fetchWithTrojan(url) {
    // --- LAYER 1: GOOGLEBOT SPOOFING (Tamu VIP) ---
    // Kita menyamar menjadi robot Google. Cloudflare sangat takut memblokir IP/User-Agent Google.
    try {
      const r1 = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'X-Forwarded-For': '66.249.66.1', // Ini adalah IP asli milik satelit Google!
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(4000),
        cache: 'no-store'
      });
      if (r1.status === 200) {
        const html = await r1.text();
        if (!html.includes('Just a moment...')) return html; // Pastikan bukan halaman loading Cloudflare
      }
    } catch (e) { /* Diam saja */ }

    // --- LAYER 2: BINGBOT SPOOFING (Tamu VIP Kedua) ---
    try {
      const r2 = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
          'X-Forwarded-For': '40.77.167.1', // IP Microsoft Bing
        },
        signal: AbortSignal.timeout(4000),
        cache: 'no-store'
      });
      if (r2.status === 200) {
        const html = await r2.text();
        if (!html.includes('Just a moment...')) return html;
      }
    } catch (e) { /* Diam saja */ }

    // --- LAYER 3: CODETABS PROXY (Proxy Khusus Developer) ---
    try {
      const r3 = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, { 
        signal: AbortSignal.timeout(4500) 
      });
      if (r3.status === 200) return await r3.text();
    } catch (e) {}

    throw new Error("Semua penyamaran ditolak oleh Cloudflare Otakudesu.");
  }

  try {
    const html = await fetchWithTrojan(targetUrl);

    // REGEX DIPERLUAS: Menambahkan format "/beta/stream/" milik server utama Otakudesu
    const embedRegex = /(?:https?:)?\/\/(?:desustream\.[a-z]+|filemoon\.[a-z]+|streamwish\.[a-z]+|vidhide\.[a-z]+|mp4upload\.com|dood\.[a-z]+|yourupload\.com)\/(?:e|embed|watch|v|beta\/stream)\/[a-zA-Z0-9_-]+/i;
    const match = html.match(embedRegex);

    if (match) {
      let finalUrl = match[0];
      if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
      return NextResponse.json({ url: finalUrl });
    }

    const greedyIframe = html.match(/<iframe[^>]+src="([^"]+(?:stream|embed|watch|file|dood|vid|moon|wish|upload)[^"]*)"/i);
    if (greedyIframe && greedyIframe[1]) {
      let iframeUrl = greedyIframe[1];
      if (iframeUrl.startsWith('//')) iframeUrl = 'https:' + iframeUrl;
      return NextResponse.json({ url: iframeUrl });
    }

    return NextResponse.json({ error: "Berhasil menyusup, tapi tidak ada link video di halaman tersebut." }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}