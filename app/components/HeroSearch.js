'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HeroSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-xl mx-auto flex gap-2">
      <input 
        type="text" 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari anime (Contoh: Bleach, Horimiya)..." 
        className="flex-1 bg-slate-900/90 border border-slate-800 focus:border-cyan-400 rounded-2xl px-5 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 font-mono outline-none shadow-2xl transition-all"
      />
      <button 
        type="submit" 
        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold px-6 py-3.5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
      >
        <span>🔍</span>
        <span className="hidden sm:inline">Cari</span>
      </button>
    </form>
  );
}