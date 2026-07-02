import Link from 'next/link';

export default async function Home() {
  const API_BASE = "https://hianime-omega.vercel.app/api/v2";
  
  let trending = [];
  let latest = [];
  let debugMessage = "";

  try {
    const res = await fetch(`${API_BASE}/home`, { cache: 'no-store' });
    
    if (!res.ok) {
      debugMessage = `Server API Error: ${res.status}`;
    } else {
      const json = await res.json();
      
      // BINGO! Ini adalah nama variabel yang 100% cocok dengan dokumentasi API
      trending = json?.data?.trending || [];
      latest = json?.data?.latestEpisode || [];

      if (trending.length === 0 && latest.length === 0) {
        debugMessage = "Koneksi Sukses, tapi API belum mengirimkan list anime.";
      }
    }
  } catch (error) {
    debugMessage = `Gagal menghubungi API: ${error.message}`;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-12 font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* HEADER HERO */}
      <header className="mb-14 border-b border-gray-800/80 pb-8 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 drop-shadow-lg tracking-tighter">
            ALNIME.
          </h1>
          <p className="text-gray-400 mt-2 font-bold tracking-[0.2em] uppercase text-sm">
            HiAnime Engine • V2.0
          </p>
        </div>
      </header>

      {/* LAYAR DETEKTIF ERROR (Berjaga-jaga) */}
      {debugMessage && (
        <div className="max-w-7xl mx-auto bg-red-900/40 border border-red-500 p-6 rounded-xl mb-10">
          <h2 className="text-red-400 font-bold mb-2">⚠️ Laporan API:</h2>
          <p className="text-white font-mono">{debugMessage}</p>
        </div>
      )}

      {/* GRID BARU RILIS (LATEST EPISODE) */}
      {!debugMessage && latest.length > 0 && (
        <section className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-100">Baru Rilis</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {latest.map((anime) => (
              <Link href={`/anime/${anime.id}`} key={anime.id} className="group relative flex flex-col gap-3 transition-all duration-300 hover:-translate-y-2">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-gray-800/60 group-hover:border-cyan-400/50">
                  <img src={anime.poster} alt={anime.title || anime.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-90"></div>
                </div>
                <h3 className="font-bold text-sm line-clamp-2 text-gray-300 group-hover:text-cyan-300 leading-relaxed">
                  {anime.title || anime.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* GRID TRENDING SEKARANG */}
      {!debugMessage && trending.length > 0 && (
        <section className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-100">Trending Sekarang</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {trending.map((anime, index) => (
              <Link href={`/anime/${anime.id}`} key={anime.id} className="group relative flex flex-col gap-3 transition-all duration-300 hover:-translate-y-2">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-gray-800/60 group-hover:border-blue-500/50">
                  <img src={anime.poster} alt={anime.title || anime.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-90"></div>
                  
                  {/* BADGE RANK */}
                  <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur text-white text-xs font-black px-2.5 py-1 rounded-md shadow-lg">
                    #{index + 1}
                  </div>
                </div>
                <h3 className="font-bold text-sm line-clamp-2 text-gray-300 group-hover:text-blue-400 leading-relaxed">
                  {anime.title || anime.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}