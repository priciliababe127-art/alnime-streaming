import Link from 'next/link';

export default async function Home() {
  // BASE URL tanpa /hianime/
  const API_BASE = "https://hianime-omega.vercel.app/api/v2";
  
  let spotlight = [];
  let trending = [];

  try {
    // Sesuai dokumentasi: GET /api/v2/home
    const res = await fetch(`${API_BASE}/home`, { 
      next: { revalidate: 3600 } // Cache selama 1 jam agar web cepat
    });
    
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    
    const data = await res.json();
    
    // Sesuaikan mapping dengan struktur JSON dokumentasi (biasanya data.spotlightAnimes / data.trendingAnimes)
    spotlight = data?.data?.spotlightAnimes || [];
    trending = data?.data?.trendingAnimes || [];
  } catch (error) {
    console.error("Gagal load data home:", error);
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-white p-6 font-sans">
      <h1 className="text-4xl font-black text-blue-500 mb-10">ALNIME.</h1>
      
      {/* BAGIAN TRENDING */}
      <section className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-300">Trending Sekarang</h2>
        
        {trending.length === 0 ? (
          <p className="text-gray-500">Memuat data...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {trending.map((anime) => (
              <Link href={`/anime/${anime.id}`} key={anime.id} className="group">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 border border-gray-800">
                  <img src={anime.poster} alt={anime.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <h3 className="text-sm font-bold truncate">{anime.name}</h3>
                <span className="text-xs text-gray-400">Rank #{anime.rank}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}