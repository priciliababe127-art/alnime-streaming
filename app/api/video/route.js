import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1';

// ==============================================================================
// FUNGSI SUPER AMAN: Anti-Keselek HTML (Mencegah Error "Unexpected token 'T'")
// ==============================================================================
async function fetchSafeJSON(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
    const text = await res.text();
    // Coba ubah ke JSON. Jika teksnya ternyata HTML Vercel Error, lompati saja!
    return JSON.parse(text);
  } catch (e) {
    return null; // Mengembalikan null tanpa membuat server crash
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const malId = searchParams.get('id'); 
  const ep = searchParams.get('ep') || '1';

  if (!malId) return NextResponse.json({ error: "MAL ID wajib disertakan!" }, { status: 400 });

  try {
    // 1. CEK IDENTITAS GLOBAL (JIKAN)
    const jikanData = await fetchSafeJSON(`https://api.jikan.moe/v4/anime/${malId}`);
    if (!jikanData?.data?.title) {
      return NextResponse.json({ error: "Satelit Jikan tidak dapat menemukan ID ini." }, { status: 404 });
    }

    const officialTitle = jikanData.data.title;
    // Potong jadi 3 kata tanpa karakter aneh agar pencarian sukses
    const cleanQuery = officialTitle.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 3).join(' ');

    // ==============================================================================
    // 2. ROULETTE API KOMUNITAS (Jika 1 mati, lompat ke yang lain)
    // ==============================================================================
    const communityApis = [
      'https://otakudesu-anime-api.vercel.app/api/v1',
      'https://nya-otakudesu.vercel.app/api/v1',
      'https://api-otakudesu-eta.vercel.app/api/v1',
      'https://otakudesu-unofficial-api.vercel.app/v1'
    ];

    for (const baseApi of communityApis) {
      // a) Cari Judulnya di API ini
      const searchData = await fetchSafeJSON(`${baseApi}/search/${encodeURIComponent(cleanQuery)}`);
      
      // Ambil array data (karena setiap API format JSON-nya beda-beda)
      let animes = searchData?.data || searchData?.search || searchData;
      if (!Array.isArray(animes) || animes.length === 0) continue; // Gagal? Lanjut ke API sebelahnya!
      
      // Ambil slug-nya
      let targetSlug = animes[0].slug || animes[0].endpoint;
      if (!targetSlug) continue;

      // Bersihkan slug dari slash berlebih
      targetSlug = targetSlug.replace('/anime/', '').replace('/', '');

      // b) Minta Link Video Episode-nya
      const episodeSlug = `${targetSlug.replace('-sub-indo', '')}-episode-${ep}-sub-indo`;
      const videoData = await fetchSafeJSON(`${baseApi}/episode/${episodeSlug}`);

      let streamUrl = videoData?.data?.stream_url || videoData?.stream_url || videoData?.data?.iframe;
      
      // JIKA BERHASIL DAPAT LINK IFRAME, LANGSUNG KIRIM KE PLAYER UI!
      if (streamUrl) {
        if (streamUrl.startsWith('//')) streamUrl = 'https:' + streamUrl;
        return NextResponse.json({ 
          title: officialTitle,
          episode: ep,
          url: streamUrl,
          server_bantuan: baseApi // Memberitahu kita API mana yang berjasa menyelamatkan hari ini
        });
      }
    }

    // Jika keempat API Publik ini hancur semua (Sangat jarang terjadi)
    return NextResponse.json({ error: `Semua satelit komunitas saat ini mati, atau episode ${ep} belum diunggah.` }, { status: 404 });

  } catch (err) {
    return NextResponse.json({ error: "Kerusakan fatal pada server internal: " + err.message }, { status: 500 });
  }
}