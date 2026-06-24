import fs from 'fs';
import path from 'path';
import VideoSection from '../../components/VideoSection';
import AdBanner from '../../components/AdBanner'; // <-- Tambahkan ini

async function getLocalData(id) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'animeapi.json');
    if (!fs.existsSync(filePath)) return null;
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(jsonData);
    return data[id] || null;
  } catch (e) {
    return null;
  }
}

export default async function AnimePage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) return <div className="p-8 text-center text-amber-500 font-mono">ID Anime Tidak Valid.</div>;

  const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`, { next: { revalidate: 3600 } });
  const json = await res.json();
  const data = json?.data;

  if (!data) return <div className="p-8 text-center text-red-500">Data tidak ditemukan.</div>;

  let localData = await getLocalData(id);
  const otakuSlug = localData?.otakudesu;

  const episodeCount = data.episodes || 12;
  const episodes = Array.from({ length: episodeCount }, (_, i) => ({ number: i + 1 }));

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8 bg-slate-950 min-h-screen text-slate-100">
      
      {/* Tombol Beranda */}
      <div className="mb-4 flex items-center justify-between">
        <a 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-cyan-400 transition-all"
        >
          <span>← Beranda</span>
        </a>
      </div>

      {/* SLOT IKLAN BANNER (Sesuai permintaanmu) */}
      <div className="mb-8 w-full min-h-[80px] bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
        <AdBanner />
      </div>

      {/* Metadata Section */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {data.images?.jpg?.large_image_url && (
          <img 
            src={data.images.jpg.large_image_url} 
            alt={data.title} 
            className="w-full md:w-72 rounded-2xl shadow-2xl border border-slate-800 object-cover aspect-[3/4]" 
          />
        )}
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">{data.title}</h1>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-4">
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl font-mono">{data.type || 'TV'}</span>
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl font-mono">{data.status || 'Unknown'}</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed line-clamp-6 bg-slate-900/40 p-4 rounded-xl border border-slate-900">{data.synopsis || 'Tidak ada sinopsis tersedia.'}</p>
        </div>
      </div>

      {/* Streaming Section */}
      <VideoSection 
        animeTitle={data.title}
        otakuSlug={otakuSlug || ''}
        episodes={episodes}
      />
      
    </main>
  );
}