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

  // Judul darurat jika Jikan gagal
  let realTitle = otakuSlug.replace(/-/g, ' '); 
  
  try {
    const dbPath = path.join(process.cwd(), 'data', 'animeapi.json');
    const dbData = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbData);
    
    let jikanId = Object.keys(db).find(key => db[key] === otakuSlug);
    
    if (jikanId) {
      const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${jikanId}`);
      const jikanData = await jikanRes.json();
      if (jikanData?.data?.title) {
        // TAHAP PEMBERSIHAN JUDUL (Sangat Penting!)
        // 1. Hapus tanda baca seperti ( : , ! , - ) menjadi spasi
        let cleanTitle = jikanData.data.title.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
        
        // 2. Ambil maksimal 4 kata pertama saja agar pencarian WordPress tidak pusing
        // Contoh: "Re Zero kara Hajimeru Isekai Seikatsu" -> Menjadi: "Re Zero kara Hajimeru"
        const titleWords = cleanTitle.split(' ');
        if (titleWords.length > 4) {
          cleanTitle = titleWords.slice(0, 4).join(' ');
        }
        
        realTitle = cleanTitle;
      }
    }
  } catch (e) {
    console.log("Sistem intelijen gagal:", e.message);
  }

  // ==============================================================================
  // TARGET BARU: GOMUNIME.TOP
  // ==============================================================================
  const targetDomain = 'https://gomunime.top';
  
  // Pencarian menjadi: "Re Zero kara Hajimeru Episode 1"
  const searchKeyword = `${realTitle} Episode ${ep}`;
  const searchUrl = `${targetDomain}/?s=${encodeURIComponent(searchKeyword)}`;

  try {
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store'
    });

    const searchHtml = await searchRes.text();

    // REGEX ANTI-BADAI: Menangkap domain gomunime apapaun (.vip, .top, .cam, dll)
    const linkRegex = /<a[^>]+href="(https:\/\/gomunime\.[a-z]+\/[^"]+episode[^"]+)"/i;
    const fallbackRegex = /<a[^>]+href="(https:\/\/gomunime\.[a-z]+\/[^"]+)"[^>]*bookmark/i;
    
    let linkMatch = searchHtml.match(linkRegex) || searchHtml.match(fallbackRegex);
    
    if (!linkMatch || !linkMatch[1]) {
      return NextResponse.json({ error: `Pencarian "${searchKeyword}" kosong di Gomunime.` }, { status: 404 });
    }

    const episodeUrl = linkMatch[1];

    // MEMBUKA ARTIKEL EPISODE GOMUNIME
    const episodeRes = await fetch(episodeUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store'
    });

    const episodeHtml = await episodeRes.text();

    // EKSTRAKSI LINK VIDEO
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
      
      if (!iframeUrl.includes('youtube') && !iframeUrl.includes('facebook') && !iframeUrl.includes('twitter')) {
         return NextResponse.json({ url: iframeUrl });
      }
    }

    return NextResponse.json({ error: "Artikel ditemukan, tapi video kosong." }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: "Gagal terhubung ke Gomunime: " + err.message }, { status: 502 });
  }
}