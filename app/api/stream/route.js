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

  // Bersihkan judul dari sisa-sisa Otakudesu
  // Contoh: "solo-leveling-s2-sub-indo" -> "solo leveling s2"
  const cleanTitle = otakuSlug.replace(/-/g, ' ').replace(/sub indo/i, '').trim();
  
  // Kita menargetkan Gomunime (Salah satu web streaming WP yang aman dari penjagaan ketat)
  const targetDomain = 'https://gomunime.vip';
  const searchUrl = `${targetDomain}/?s=${encodeURIComponent(cleanTitle + " Episode " + ep)}`;

  try {
    // 1. MENCARI EPISODE DI GOMUNIME
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://google.com/'
      },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store'
    });

    if (!searchRes.ok) throw new Error("Gagal mengakses server Gomunime");
    const searchHtml = await searchRes.text();

    // Mencari link artikel episode di hasil pencarian
    // Regex ini menangkap struktur kotak hasil pencarian khas WordPress anime
    const linkMatch = searchHtml.match(/<a href="(https:\/\/gomunime\.vip\/[^"]+episode-[^"]+)"/i);
    
    let episodeUrl = '';
    if (linkMatch && linkMatch[1]) {
      episodeUrl = linkMatch[1];
    } else {
      return NextResponse.json({ error: `Episode ${ep} tidak ditemukan di server alternatif.` }, { status: 404 });
    }

    // 2. MASUK KE HALAMAN EPISODE UNTUK MENCURI VIDEO
    const episodeRes = await fetch(episodeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': searchUrl
      },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store'
    });

    const episodeHtml = await episodeRes.text();

    // 3. MENGGALI HARTA KARUN (LINK VIDEO)
    // Mencari link iFrame yang disembunyikan di dalam elemen HTML
    const embedRegex = /(?:https?:)?\/\/(?:desustream\.[a-z]+|filemoon\.[a-z]+|streamwish\.[a-z]+|vidhide\.[a-z]+|mp4upload\.com|dood\.[a-z]+|yourupload\.com|ok\.ru\/videoembed|gounlimited\.to)\/(?:e|embed|watch|v|video)\/[a-zA-Z0-9_-]+/i;
    const match = episodeHtml.match(embedRegex);

    if (match) {
      let finalUrl = match[0];
      if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
      return NextResponse.json({ url: finalUrl });
    }

    // Jika Gomunime menggunakan metode iFrame langsung
    const greedyIframe = episodeHtml.match(/<iframe[^>]+src="([^"]+)"/i);
    if (greedyIframe && greedyIframe[1]) {
      let iframeUrl = greedyIframe[1];
      if (iframeUrl.startsWith('//')) iframeUrl = 'https:' + iframeUrl;
      
      // Filter iframe iklan yang tidak penting
      if (!iframeUrl.includes('youtube') && !iframeUrl.includes('facebook')) {
         return NextResponse.json({ url: iframeUrl });
      }
    }

    return NextResponse.json({ error: "Halaman berhasil dibedah, tapi video kosong." }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: "Koneksi ke server alternatif terputus: " + err.message }, { status: 502 });
  }
}