import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1';

// ==============================================================================
// GANTI TULISAN DI BAWAH DENGAN URL GOOGLE SCRIPT YANG KAMU DAPATKAN TADI!
// ==============================================================================
const GOOGLE_PROXY_URL = "https://script.google.com/macros/s/AKfycbwZl0qCM-dVHy_XaCpRvuIimI088DMLOj1VjFSjnbGlq5s11RT8i_RxFLasx2094AfYmQ/exec"; 

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const otakuSlug = searchParams.get('otaku'); 
  const ep = searchParams.get('ep') || '1';

  if (!otakuSlug || otakuSlug === 'undefined') {
    return NextResponse.json({ error: "Slug Otaku tidak valid" }, { status: 400 });
  }

  // Kita kembali ke Otakudesu .cloud karena itu domain utama yang paling lengkap
  const targetUrl = `https://otakudesu.cloud/episode/${otakuSlug}-episode-${ep}-sub-indo/`;
  
  // Membungkus targetUrl ke dalam Proxy Google
  const fetchUrl = `${GOOGLE_PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;

  try {
    // Vercel meminta tolong ke Google Script
    const res = await fetch(fetchUrl, {
      signal: AbortSignal.timeout(8000), // Kita beri waktu 8 detik untuk Google bekerja
      cache: 'no-store'
    });

    const html = await res.text();

    if (html.includes('ERROR_PROXY')) {
      throw new Error("Proxy Google gagal mengambil halaman.");
    }
    if (html.includes('Just a moment...') || html.includes('Cloudflare')) {
      throw new Error("Bahkan Google diblokir oleh Cloudflare (Sangat Jarang Terjadi).");
    }

    // REGEX PENCURI VIDEO
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

    return NextResponse.json({ error: "Halaman terbaca oleh Google, tapi tidak ada link video." }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}