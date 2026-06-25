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

  // ==========================================================================
  // RENCANA C: MESIN ROULETTE (Mencari domain yang masih hidup)
  // ==========================================================================
  // Jika .blog diblokir Kominfo, dia akan melompat ke .cloud, lalu .cam, dst.
  const DOMAINS = ['otakudesu.cloud', 'otakudesu.cam', 'otakudesu.wiki', 'otakudesu.cc', 'otakudesu.blog'];

  async function findVideo() {
    for (const domain of DOMAINS) {
      const targetUrl = `https://${domain}/episode/${otakuSlug}-episode-${ep}-sub-indo/`;

      // 3 Pasukan Penyerbu untuk tiap domain
      const proxies = [
        { name: 'Direct', url: targetUrl },
        { name: 'Codetabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}` },
        { name: 'AllOrigins', url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}` }
      ];

      for (const proxy of proxies) {
        try {
          const res = await fetch(proxy.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Referer': 'https://google.com/'
            },
            signal: AbortSignal.timeout(3500), // Jangan kelamaan, langsung ganti kalau lemot
            cache: 'no-store'
          });

          let html = '';
          if (proxy.name === 'AllOrigins') {
            const json = await res.json();
            html = json.contents || '';
          } else {
            html = await res.text();
          }

          // Jika HTML kosong atau terdeteksi gembok Cloudflare, BUANG! Lanjut ke proxy/domain lain.
          if (!html || html.includes('Just a moment...') || html.includes('Cloudflare')) {
            continue; 
          }

          // REGEX PENYAPU RANJAU
          const embedRegex = /(?:https?:)?\/\/(?:desustream\.[a-z]+|filemoon\.[a-z]+|streamwish\.[a-z]+|vidhide\.[a-z]+|mp4upload\.com|dood\.[a-z]+|yourupload\.com)\/(?:e|embed|watch|v|beta\/stream)\/[a-zA-Z0-9_-]+/i;
          const match = html.match(embedRegex);

          if (match) {
            let finalUrl = match[0];
            if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
            return finalUrl; // BERHASIL DITEMUKAN!
          }

          const greedyIframe = html.match(/<iframe[^>]+src="([^"]+(?:stream|embed|watch|file|dood|vid|moon|wish|upload)[^"]*)"/i);
          if (greedyIframe && greedyIframe[1]) {
            let iframeUrl = greedyIframe[1];
            if (iframeUrl.startsWith('//')) iframeUrl = 'https:' + iframeUrl;
            return iframeUrl; // BERHASIL DITEMUKAN!
          }

        } catch (e) {
          // Abaikan error (Timeout/500), mesin akan terus berputar ke proxy berikutnya
          continue;
        }
      }
    }
    
    // Jika semua 5 Domain x 3 Proxy (15 kombinasi) gagal total:
    throw new Error("Semua 5 domain Otakudesu mati atau diblokir permanen oleh Cloudflare.");
  }

  try {
    const videoUrl = await findVideo();
    return NextResponse.json({ url: videoUrl });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}