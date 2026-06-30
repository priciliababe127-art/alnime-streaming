import Link from 'next/link';

export default async function Home() {
  const API_BASE = "https://hianime-omega.vercel.app/api/v2";
  let latestAnimes = [];

  try {
    // Sesuai Dokumentasi: endpoint /home untuk halaman utama
    const res = await fetch(`${API_BASE}/hianime/home`, { cache: 'no-store' });
    const data = await res.json();
    latestAnimes = data?.data?.latestEpisodeAnimes || [];
  } catch (error) {
    console.error("Gagal mengambil data beranda:", error);
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-white p-6 md:p-12 font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* HEADER HERO (Cyberpunk-Lite) */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-gray-800/80 pb-8">
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 drop-shadow-lg tracking-tighter">
            ALNIME.
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-semibold tracking-[0.2em] uppercase">
            HiAnime Engine • V2.0
          </p>
        </div>
      </header>

      {/* GRID EPISODE TERBARU */}
      <section className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-8 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-100">Baru Rilis</h2>
        </div>

        {latestAnimes.length === 0 ? (
          <div className="text-center text-gray-500 py-20 font-medium">Gagal memuat data dari server HiAnime.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {latestAnimes.map((anime) => (
              <Link href={`/anime/${anime.id}`} key={anime.id} className="group relative flex flex-col gap-3 transition-all duration-300 hover:-translate-y-2">
                
                {/* KOTAK POSTER */}
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-gray-800/60 group-hover:border-cyan-400/50 transition-colors">
                  <img src={anime.poster} alt={anime.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  
                  {/* GRADASI GELAP */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-90"></div>
                  
                  {/* BADGE EPISODE (Sesuai output docs: anime.episodes.sub) */}
                  <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm border border-gray-700 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-lg">
                    EP {anime.episodes?.sub || '?'}
                  </div>
                </div>

                {/* JUDUL ANIME */}
                <h3 className="font-bold text-sm line-clamp-2 text-gray-300 group-hover:text-cyan-300 transition-colors leading-relaxed">
                  {anime.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}