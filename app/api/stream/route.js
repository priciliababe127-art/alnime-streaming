import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const otakuSlug = searchParams.get('otaku'); 
  const ep = searchParams.get('ep') || '1';

  if (!otakuSlug || otakuSlug === 'undefined') {
    return NextResponse.json({ error: "Kunci Otaku tidak ditemukan di database lokal" }, { status: 400 });
  }

  const targetUrl = `https://otakudesu.blog/episode/${otakuSlug}-episode-${ep}-sub-indo/`;

  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(4500)
    });

    if (!res.ok) throw new Error(`Web target menolak (HTTP ${res.status})`);

    const html = await res.text();

    // DETEKTIF SUPER: Menangkap segala jenis link Video Hosting yang ramah Iframe (Tanpa CORS)
    const embedRegex = /(?:https?:)?\/\/(?:filemoon\.[a-z]+|streamwish\.[a-z]+|vidhide\.[a-z]+|mp4upload\.com|dood\.[a-z]+)\/(?:e|embed)\/[a-zA-Z0-9_-]+/i;
    const match = html.match(embedRegex);

    if (match) {
      let finalUrl = match[0];
      if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
      return NextResponse.json({ url: finalUrl });
    }

    // Fallback darurat jika tidak ketemu link embed
    const iframeFallback = html.match(/<iframe[^>]+src="([^"]+)"/i);
    if (iframeFallback && iframeFallback[1]) {
      return NextResponse.json({ url: iframeFallback[1] });
    }

    return NextResponse.json({ error: "Tidak ada link stream aktif yang ditemukan" }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}