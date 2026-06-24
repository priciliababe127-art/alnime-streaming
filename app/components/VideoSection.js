'use client';
import { useState } from 'react';
import AnimePlayer from './AnimePlayer';

export default function VideoSection({ animeTitle, otakuSlug, episodes }) {
  const [currentStream, setCurrentStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorOccurred, setErrorOccurred] = useState(false); // <--- Ganti jadi boolean sederhana
  const [activeEp, setActiveEp] = useState(null);

  const handlePlay = async (epNum) => {
    try {
      setErrorOccurred(false); // Reset error
      setCurrentStream(null);
      setLoading(true);
      setActiveEp(epNum);

      if (!otakuSlug) {
        throw new Error("Slug belum tersedia");
      }

      const res = await fetch(`/api/stream?otaku=${otakuSlug}&ep=${epNum}`);
      const data = await res.json();

      if (!res.ok || !data.url) throw new Error("Gagal");

      setCurrentStream(data.url);
    } catch (err) {
      console.error("Gagal Play:", err);
      setErrorOccurred(true); // Cukup tandai bahwa terjadi error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 mt-8">
      
      {/* PLAYER AREA */}
      <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 md:p-6 min-h-[320px] flex flex-col justify-center items-center relative overflow-hidden">
        
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 font-mono text-cyan-400">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs animate-pulse">Menghubungkan...</p>
          </div>
        )}

        {/* UI JIKA GAGAL: Jauh lebih bersih dan profesional */}
        {errorOccurred && !loading && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-slate-400 text-sm mb-6 font-mono">Video tidak dapat dimuat saat ini.</p>
            <button 
              onClick={() => handlePlay(activeEp)}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono rounded-lg transition-all"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!loading && !errorOccurred && !currentStream && (
          <div className="text-slate-600 font-mono text-xs py-20 text-center">
            Pilih episode untuk memulai streaming.
          </div>
        )}

        {!loading && !errorOccurred && currentStream && (
          <div className="w-full">
            <AnimePlayer src={currentStream} />
          </div>
        )}
      </div>

      {/* DERETAN EPISODE */}
      <div>
        <h3 className="text-xs font-mono text-slate-500 mb-3 tracking-wider">EPISODE:</h3>
        <div className="flex flex-wrap gap-2">
          {episodes.map((ep) => (
            <button
              key={ep.number}
              onClick={() => handlePlay(ep.number)}
              className={`px-4 py-2 rounded-lg font-mono text-[10px] font-bold transition-all ${
                activeEp === ep.number && !errorOccurred
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              {ep.number}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}