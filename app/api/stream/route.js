import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const otakuSlug = searchParams.get('otaku'); 
  const ep = searchParams.get('ep') || '1';

  // 1. Tentukan target (Gomunime.top)
  const targetDomain = 'https://gomunime.top';
  const cleanTitle = otakuSlug.replace(/-/g, ' ').replace(/sub indo/i, '').trim();
  const searchUrl = `${targetDomain}/?s=${encodeURIComponent(cleanTitle + " Episode " + ep)}`;

  try {
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(5000)
    });
    const html = await res.text();
    
    // Ambil link artikel
    const linkMatch = html.match(/<a[^>]+href="(https:\/\/gomunime\.top\/[^"]+episode[^"]+)"/i);
    if (!linkMatch) return NextResponse.json({ error: "Link episode tidak ditemukan" }, { status: 404 });

    // 2. Ambil halaman episode
    const epRes = await fetch(linkMatch[1], {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const epHtml = await epRes.text();

    // 3. PENCURIAN SOURCE (Ini bagian yang kita incar!)
    // Regex ini mencari tag <source src="..."> yang memiliki format googlevideo
    const sourceRegex = /<source[^>]+src="([^"]+googlevideo\.com[^"]+)"/i;
    const match = epHtml.match(sourceRegex);

    if (match && match[1]) {
      return NextResponse.json({ url: match[1] });
    }

    // Fallback jika tidak ketemu source: ambil iframe biasa
    const iframeRegex = /<iframe[^>]+src="([^"]+)"/i;
    const iframeMatch = epHtml.match(iframeRegex);
    if (iframeMatch && iframeMatch[1]) {
      return NextResponse.json({ url: iframeMatch[1] });
    }

    return NextResponse.json({ error: "Video source tidak ditemukan" }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}