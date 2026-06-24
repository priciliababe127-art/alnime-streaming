'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdBanner from '../components/AdBanner';

function SearchEngine() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fungsi untuk membuang duplikat ID agar tidak error
  const getUnique = (arr) => {
    return arr.filter((item, index, self) =>
      index === self.findIndex((t) => t.mal_id === item.mal_id)
    );
  };

  const fetchAnime = async (keyword) => {
    if (!keyword) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${keyword}&limit=18`);
      const data = await res.json();
      setResults(getUnique(data.data || [])); // Disaring di sini
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlQuery) fetchAnime(urlQuery);
  }, [urlQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchAnime(query);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      
      {/* HEADER NAVIGASI */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
        <Link href="/" className="text-xs font-mono text-cyan-400 hover:underline">← Kembali ke Beranda</Link>
        <span className="text-xs font-mono text-slate-500">PENCARIAN DATABASE</span>
      </div>

      {/* SLOT IKLAN BANNER (Sama seperti Beranda) */}
      <div className="w-full max-w-3xl mx-auto mb-10 min-h-[100px] bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
         <AdBanner />
      </div>

      {/* FORM PENCARIAN */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-12 flex gap-2">
        <input 
          className="flex-1 bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-400"
          value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ketik judul anime..."
        />
        <button type="submit" className="bg-cyan-500 text-slate-950 px-6 py-3.5 rounded-xl font-mono font-bold hover:bg-cyan-400 transition-colors">Cari</button>
      </form>

      {/* HASIL */}
      {loading && <div className="text-center font-mono text-cyan-400 py-12 animate-pulse">Mencari di MyAnimeList...</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {results.map((item) => (
          <Link href={`/anime/${item.mal_id}`} key={item.mal_id} className="bg-slate-900/40 border border-slate-800 p-2.5 rounded-2xl flex flex-col justify-between group hover:border-cyan-500 transition-all">
            <img src={item.images.jpg.large_image_url} alt={item.title} className="w-full aspect-[3/4] object-cover rounded-xl mb-2 group-hover:scale-105 transition-transform" />
            <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">{item.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Suspense fallback={<div className="p-12 text-center font-mono">Memuat Mesin...</div>}>
        <SearchEngine />
      </Suspense>
    </div>
  );
}