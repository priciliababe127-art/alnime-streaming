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

  // Bersihkan slug Otakudesu menjadi kata kunci pencarian biasa
  // Contoh: "solo-leveling-sub-indo" -> "solo leveling"
  const cleanKeyword = otakuSlug.replace(/-/g, ' ').replace(/sub indo/i, '').trim();
  const searchUrl = `https://anoboy.be/?s=${encodeURIComponent(cleanKeyword)}+episode+${ep}`;

  // ==========================================================================
  // FASE 1: MENCARI LINK EPISODE DI ANOBOY (SMART SEARCH)
  // ==========================================================================
  async function fetchHTML(url) {
    const proxies = [
      url, // Tembak langsung
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    ];

    for (const proxyUrl of proxies) {
      try {
        const res = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://google.com/'
          },
          signal: AbortSignal.timeout(4000),
          cache: 'no-store'
        });

        let html = '';
        if (proxyUrl.includes('allorigins')) {
          const json = await res.json();
          html = json.contents || '';
        } else {
          html = await res.text();
        }

        if (html && !html.includes('Just a moment...') && !html.includes('Cloudflare')) {
          return html;
        }
      } catch (e) { continue; }
    }
    throw new Error("Gagal menembus pertahanan Anoboy.");
  }

  try {
    // 1. Cari halamannya dulu
    const searchHtml = await fetchHTML(searchUrl);
    
    // Cari link artikel pertama dari hasil pencarian yang mengandung kata "Episode"
    const linkMatch = searchHtml.match(/<a href="(https:\/\/anoboy\.be\/[^"]+)"[^>]*title="[^"]*Episode/i);
    
    let episodeUrl = '';
    if (linkMatch && linkMatch[1]) {
      episodeUrl = linkMatch[1];
    } else {
      // Fallback: Ambil sembarang link artikel pertama di daftar pencarian
      const fallbackMatch = searchHtml.match(/<div class="home_index">.*?<a href="(https:\/\/anoboy\.be\/[^"]+)"/i);
      if (fallbackMatch && fallbackMatch[1]) {
        episodeUrl = fallbackMatch[1];
      } else {
        return NextResponse.json({ error: `Episode ${ep} tidak ditemukan di Anoboy.` }, { status: 404 });
      }
    }

    // ==========================================================================
    // FASE 2: MEMBEDAH HALAMAN EPISODE & MENCURI VIDEO
    // ==========================================================================
    const episodeHtml = await fetchHTML(episodeUrl);

    // REGEX SPESIAL ANOBOY (Biasanya mereka pakai youdbox, blogger, filemoon, dood)
    const embedRegex = /(?:https?:)?\/\/(?:youdbox\.[a-z]+|desustream\.[a-z]+|filemoon\.[a-z]+|streamwish\.[a-z]+|vidhide\.[a-z]+|mp4upload\.com|dood\.[a-z]+|yourupload\.com)\/(?:e|embed|watch|v)\/[a-zA-Z0-9_-]+/i;
    const match = episodeHtml.match(embedRegex);

    if (match) {
      let finalUrl = match[0];
      if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
      return NextResponse.json({ url: finalUrl });
    }

    // Fallback Iframe (Mencari tag Iframe Video di Anoboy)
    const greedyIframe = episodeHtml.match(/<iframe[^>]+src="([^"]+(?:stream|embed|watch|file|dood|vid|moon|wish|upload|youdbox)[^"]*)"/i);
    if (greedyIframe && greedyIframe[1]) {
      let iframeUrl = greedyIframe[1];
      if (iframeUrl.startsWith('//')) iframeUrl = 'https:' + iframeUrl;
      return NextResponse.json({ url: iframeUrl });
    }

    return NextResponse.json({ error: "Halaman Anoboy berhasil dibuka, tapi link video kosong." }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}