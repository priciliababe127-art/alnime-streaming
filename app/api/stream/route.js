import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const otakuSlug = searchParams.get('otaku'); 
  const ep = searchParams.get('ep') || '1';

  if (!otakuSlug || otakuSlug === 'undefined') {
    return NextResponse.json({ error: "Slug tidak valid" }, { status: 400 });
  }

  // ==============================================================================
  // TAHAP 1: SISTEM INTELIJEN (Menerjemahkan Slug Alien menjadi Judul Asli)
  // ==============================================================================
  let realTitle = otakuSlug.replace(/-/g, ' '); // Judul darurat jika intelijen gagal
  
  try {
    // 1. Membaca database animeapi.json di dalam server Vercel
    const dbPath = path.join(process.cwd(), 'data', 'animeapi.json');
    const dbData = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbData);
    
    // 2. Mencari Jikan ID dari slug Otakudesu
    let jikanId = Object.keys(db).find(key => db[key] === otakuSlug);
    
    if (jikanId) {
      // 3. Menghubungi Jikan API untuk meminta nama asli
      const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${jikanId}`);
      const jikanData = await jikanRes.json();
      if (jikanData?.data?.title) {
        realTitle = jikanData.data.title; // Dapatkan judul asli! (Misal: "Haikyuu!!")
      }
    }
  } catch (e) {
    console.log("Intelijen gagal, memakai judul darurat:", e.message);
  }

  // ==============================================================================
  // TAHAP 2: BERBURU DI GOMUNIME DENGAN NAMA ASLI
  // ==============================================================================
  const targetDomain = 'https://gomunime.vip';
  
  // Sekarang pencariannya sangat akurat: "Haikyuu!! Episode 1"
  const searchKeyword = `${realTitle} Episode ${ep}`;
  const searchUrl = `${targetDomain}/?s=${encodeURIComponent(searchKeyword)}`;

  try {
    // 1. MENCARI ARTIKEL EPISODE DI GOMUNIME
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store'
    });

    const searchHtml = await searchRes.text();

    // Regex mencari link hasil pencarian pertama
    const linkMatch = searchHtml.match(/<a[^>]+href="(https:\/\/gomunime\.vip\/[^"]+episode[^"]+)"/i) || 
                      searchHtml.match(/<a[^>]+href="(https:\/\/gomunime\.vip\/[^"]+)"[^>]*bookmark/i);
    
    if (!linkMatch || !linkMatch[1]) {
      return NextResponse.json({ error: `Pencarian "${searchKeyword}" kosong di server alternatif.` }, { status: 404 });
    }

    const episodeUrl = linkMatch[1];

    // 2. MEMBUKA ARTIKEL EPISODE
    const episodeRes = await fetch(episodeUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store'
    });

    const episodeHtml = await episodeRes.text();

    // 3. MENGGALI LINK VIDEO
    const embedRegex = /(?:https?:)?\/\/(?:desustream\.[a-z]+|filemoon\.[a-z]+|streamwish\.[a-z]+|vidhide\.[a-z]+|mp4upload\.com|dood\.[a-z]+|yourupload\.com|ok\.ru\/videoembed|gounlimited\.to|streamtape\.[a-z]+)\/(?:e|embed|watch|v|video)\/[a-zA-Z0-9_-]+/i;
    const match = episodeHtml.match(embedRegex);

    if (match) {
      let finalUrl = match[0];
      if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
      return NextResponse.json({ url: finalUrl });
    }

    const greedyIframe = episodeHtml.match(/<iframe[^>]+src="([^"]+)"/i);
    if (greedyIframe && greedyIframe[1]) {
      let iframeUrl = greedyIframe[1];
      if (iframeUrl.startsWith('//')) iframeUrl = 'https:' + iframeUrl;
      // Jangan sampai mengira video YouTube (iklan) sebagai anime
      if (!iframeUrl.includes('youtube') && !iframeUrl.includes('facebook')) {
         return NextResponse.json({ url: iframeUrl });
      }
    }

    return NextResponse.json({ error: "Artikel ditemukan, tapi video kosong." }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: "Server Gomunime menolak koneksi." }, { status: 502 });
  }
}