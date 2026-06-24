import Link from 'next/link';
import HeroSearch from './components/HeroSearch';
import AdBanner from './components/AdBanner';

// Komponen Pembantu: Cetakan Kartu Anime
function AnimeCard({ item }) {
  return (
    <Link 
      href={`/anime/${item.mal_id}`} 
      className="group bg-slate-900/40 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-cyan-500/10"
    >
      <div className="w-full aspect-[3/4] rounded-xl overflow-hidden relative bg-slate-950 mb-2.5">
        <img 
          src={item.images.jpg.large_image_url} 
          alt={item.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
          <span className="text-[10px] font-mono text-amber-400 font-bold">★ {item.score || 'N/A'}</span>
        </div>
        <div className="absolute bottom-2 left-2 bg-cyan-500 text-slate-950 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
          {item.type || 'TV'}
        </div>
      </div>
      
      <div>
        <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
          {item.title}
        </h4>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
        <span className="text-emerald-400">{item.status === 'Currently Airing' ? '● On-Going' : '○ Tamat'}</span>
        <span className="text-slate-500">{item.year || 'N/A'}</span>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  // Fungsi untuk membuang duplikat ID
  const getUnique = (arr) => {
    return arr.filter((item, index, self) =>
      index === self.findIndex((t) => t.mal_id === item.mal_id)
    );
  };

  // 1. Ambil 12 Anime Musim Ini
  const airingRes = await fetch('https://api.jikan.moe/v4/seasons/now?limit=12', { next: { revalidate: 3600 } });
  const airingJson = await airingRes.json();
  const airingList = getUnique(airingJson.data || []);

  // 2. Ambil 12 Anime Terpopuler
  const topRes = await fetch('https://api.jikan.moe/v4/top/anime?limit=12', { next: { revalidate: 3600 } });
  const topJson = await topRes.json();
  const topList = getUnique(topJson.data || []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      
      {/* NAVBAR */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wider font-mono">AL<span className="text-cyan-400">NIME</span></span>
            <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">VIP</span>
          </Link>
          <nav className="flex gap-6 text-xs font-mono text-slate-400">
            <Link href="/" className="text-cyan-400 font-bold">Beranda</Link>
            <Link href="/search" className="hover:text-white transition-colors">Cari Anime</Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION DENGAN BANNER IKLAN */}
      <section className="max-w-4xl mx-auto text-center px-4 py-8">
        
        {/* TEMPAT IKLAN BANNER */}
        <div className="w-full max-w-3xl mx-auto mb-8 min-h-[100px] bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
           <AdBanner />
        </div>

        <h1 className="text-2xl sm:text-4xl font-black mt-4 mb-8 tracking-tight">
          ALNime Streaming Anime Terbaru & Terlengkap 
        </h1>

        <HeroSearch />
      </section>

      {/* KONTEN UTAMA */}
      <main className="max-w-6xl mx-auto px-4 flex flex-col gap-12">
        
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
            <h2 className="text-base sm:text-lg font-bold font-mono tracking-wide text-cyan-400">⚡ UPDATE TERBARU</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {airingList.map((anime) => <AnimeCard key={anime.mal_id} item={anime} />)}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
            <h2 className="text-base sm:text-lg font-bold font-mono tracking-wide text-amber-400">⭐ ANIME TERPOPULER</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topList.map((anime) => <AnimeCard key={anime.mal_id} item={anime} />)}
          </div>
        </section>

      </main>
    </div>
  );
}