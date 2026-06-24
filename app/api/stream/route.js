import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1'; // Tetap mangkal di Singapura

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const otakuSlug = searchParams.get('otaku'); 
  const ep = searchParams.get('ep') || '1';

  if (!otakuSlug || otakuSlug === 'undefined') {
    return NextResponse.json({ error: "Parameter Otaku tidak valid" }, { status: 400 });
  }

  const targetUrl = `https://otakudesu.blog/episode/${otakuSlug}-episode-${ep}-sub-indo/`;

  try {
    const res = await fetch(targetUrl, {
      cache: 'no-store', // MEMATIKAN CACHE NEXT.JS (Wajib!)
      headers: { 
        // Menyamar menjadi Google Chrome Windows 11 Paling Valid di Dunia
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://google.com/', // Berbohong mengaku datang dari pencarian Google
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: AbortSignal.timeout(5500) // Waktu napas diperpanjang jadi 5.5 detik
    });

    // Tangkap jika Cloudflare memblokir (403 / 503)
    if (res.status === 403 || res.status === 503) {
      return NextResponse.json({ 
        error: "Akses dicegat oleh Cloudflare Otakudesu", 
        http_code: res.status 
      }, { status: res.status });
    }

    if (!res.ok) {
      return NextResponse.json({ 
        error: `Halaman tidak ditemukan di Otakudesu`, 
        http_code: res.status 
      }, { status: res.status });
    }

    const html = await res.text();

    // REGEX DIPERKUAT: Menambahkan "desustream", "yourupload", dan "sendvid"
    const embedRegex = /(?:https?:)?\/\/(?:desustream\.[a-z]+|filemoon\.[a-z]+|streamwish\.[a-z]+|vidhide\.[a-z]+|mp4upload\.com|dood\.[a-z]+|yourupload\.com)\/(?:e|embed|watch)\/[a-zA-Z0-9_-]+/i;
    const match = html.match(embedRegex);

    if (match) {
      let finalUrl = match[0];
      if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
      return NextResponse.json({ url: finalUrl });
    }

    // Fallback Iframe murni
    const iframeFallback = html.match(/<iframe[^>]+src="([^"]+)"/i);
    if (iframeFallback && iframeFallback[1]) {
      let iframeUrl = iframeFallback[1];
      if (iframeUrl.startsWith('//')) iframeUrl = 'https:' + iframeUrl;
      return NextResponse.json({ url: iframeUrl });
    }

    return NextResponse.json({ 
      error: "Halaman Otakudesu berhasil dibuka, tapi tidak ada tag Video di dalamnya" 
    }, { status: 404 });

  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.message.includes('timeout');
    return NextResponse.json({ 
      error: isTimeout ? "Otakudesu terlalu lambat merespon (Timeout)" : err.message
    }, { status: isTimeout ? 504 : 500 });
  }
}