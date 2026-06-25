import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1';

async function fetchSafeJSON(url) {
  try {
    // Timeout dipercepat jadi 4 detik!
    const res = await fetch(url, { signal: AbortSignal.timeout(4000), cache: 'no-store' });
    const text = await res.text();
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const malId = searchParams.get('id'); 
  const ep = searchParams.get('ep') || '1';

  if (!malId) return NextResponse.json({ error: "MAL ID wajib disertakan!" }, { status: 400 });

  try {
    // ==============================================================================
    // 1. CEK IDENTITAS GLOBAL (JIKAN)
    // ==============================================================================
    const jikanData = await fetchSafeJSON(`https://api.jikan.moe/v4/anime/${malId}`);
    if (!jikanData?.data?.title) {
      return NextResponse.json({ error: "Satelit Jikan tidak dapat menemukan ID ini." }, { status: 404 });
    }

    const officialTitle = jikanData.data.title;
    const cleanQuery = officialTitle.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 3).join(' ');

    // ==============================================================================
    // 2. SISTEM BALAPAN API (CONCURRENT RACING) - SUPER CEPAT!
    // ==============================================================================
    const communityApis = [
      'https://otakudesu-anime-api.vercel.app/api/v1',
      'https://nya-otakudesu.vercel.app/api/v1',
      'https://api-otakudesu-eta.vercel.app/api/v1',
      'https://otakudesu-unofficial-api.vercel.app/v1'
    ];

    // Fungsi misi untuk 1 API
    async function huntVideo(baseApi) {
      // a) Cari Judul
      const searchData = await fetchSafeJSON(`${baseApi}/search/${encodeURIComponent(cleanQuery)}`);
      let animes = searchData?.data || searchData?.search || searchData;
      if (!Array.isArray(animes) || animes.length === 0) throw new Error("Kosong");
      
      let targetSlug = animes[0].slug || animes[0].endpoint;
      if (!targetSlug) throw new Error("Tidak ada slug");
      targetSlug = targetSlug.replace('/anime/', '').replace('/', '');

      // b) Ambil Episode
      const episodeSlug = `${targetSlug.replace('-sub-indo', '')}-episode-${ep}-sub-indo`;
      const videoData = await fetchSafeJSON(`${baseApi}/episode/${episodeSlug}`);

      let streamUrl = videoData?.data?.stream_url || videoData?.stream_url || videoData?.data?.iframe;
      if (!streamUrl) throw new Error("Video kosong");

      if (streamUrl.startsWith('//')) streamUrl = 'https:' + streamUrl;
      return streamUrl; // Kirimkan link pemenang!
    }

    // MENYALAKAN MESIN BALAP: 4 API Ditembak Bersamaan!
    const racePromises = communityApis.map(api => huntVideo(api));

    try {
      // Promise.any akan mengambil API PERTAMA yang berhasil menemukan video.
      // Jika API 1 mati, dia tidak peduli, selama API 2 atau 3 berhasil duluan!
      const winningUrl = await Promise.any(racePromises);
      
      return NextResponse.json({ 
        title: officialTitle,
        episode: ep,
        url: winningUrl
      });
      
    } catch (raceError) {
      // Ini hanya tereksekusi jika KEEMPAT API gagal/mati secara bersamaan
      return NextResponse.json({ error: `Semua 4 satelit komunitas gagal menemukan episode ${ep}.` }, { status: 404 });
    }

  } catch (err) {
    return NextResponse.json({ error: "Kerusakan internal: " + err.message }, { status: 500 });
  }
}