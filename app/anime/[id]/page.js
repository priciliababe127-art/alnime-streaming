'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function AnimePlayer({ params }) {
  // Me-resolve params di Next.js 15
  const resolvedParams = use(params);
  const animeId = resolvedParams?.id; 

  const [episodes, setEpisodes] = useState([]);
  const [currentEpId, setCurrentEpId] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  
  // Referensi untuk tag pemutar video bawaan
  const videoRef = useRef(null);

  const API_BASE = "https://hianime-omega.vercel.app/api/v2";

  // SUNTIKAN SCRIPT HLS.JS (Agar bisa memutar format .m3u8 dari HiAnime)
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // 1. Ambil Daftar Episode
  useEffect(() => {
    if (!animeId) return;
    
    fetch(`${API_BASE}/hianime/anime/${animeId}/episodes`)
      .then(res => res.json())
      .then(data => {
        const eps = data?.data?.episodes || [];
        setEpisodes(eps);
        if (eps.length > 0) setCurrentEpId(eps[0].episodeId);
      })
      .catch(err => console.error("Error memuat episode:", err));
  }, [animeId]);

  // 2. Ambil Link Streaming Video (.m3u8)
  useEffect(() => {
    if (!currentEpId) return;
    
    setLoadingVideo(true);
    setVideoUrl(null);

    // Sesuai Dokumentasi: Wajib menyertakan server (misal hd-1) dan category (sub)
    fetch(`${API_BASE}/hianime/episode/sources?animeEpisodeId=${currentEpId}&server=hd-1&category=sub`)
      .then(res => res.json())
      .then(data => {
        const url = data?.data?.sources?.[0]?.url;
        if (url) setVideoUrl(url);
      })
      .catch(err => console.error("Error memuat video:", err))
      .finally(() => setLoadingVideo(false));
  }, [currentEpId]);

  // 3. Mesin Pemutar Video HLS
  useEffect(() => {
    if (videoUrl && videoRef.current && window.Hls) {
      const video = videoRef.current;
      
      // Jika browser mendukung HLS.js (Chrome, Firefox, Edge)
      if (window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      } 
      // Jika browser mendukung HLS secara bawaan (Safari / iOS)
      else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
      }
    }
  }, [videoUrl]);

  if (!animeId) {
    return <div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center">Memproses ID Anime...</div>;
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-white p-4 md:p-8 flex flex-col items-center font-sans">
      
      {/* HEADER NAVIGASI */}
      <div className="max-w-5xl w-full mb-6 flex justify-between items-center">
        <Link 
          href="/" 
          className="group flex items-center gap-2 px-5 py-2.5 bg-gray-800/40 hover:bg-gray-700/80 rounded-xl font-bold border border-gray-700/50 hover:border-cyan-500 transition-all text-sm text-gray-300 hover:text-white"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Kembali ke Beranda
        </Link>
      </div>

      {/* BIOSKOP ALNIME (Pemutar Video) */}
      <div className="max-w-5xl w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-gray-800 relative flex items-center justify-center mb-10 group">
        
        {loadingVideo ? (
          <div className="flex flex-col items-center z-10">
            <div className="w-12 h-12 border-4 border-gray-800 border-t-cyan-400 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(34,211,238,0.4)]"></div>
            <p className="text-cyan-400 font-medium tracking-[0.2em] animate-pulse text-sm">MEMBUKA SERVER...</p>
          </div>
        ) : videoUrl ? (
          // PEMUTAR VIDEO ASLI (BUKAN IFRAME)
          <video 
            ref={videoRef} 
            controls 
            className="w-full h-full absolute top-0 left-0 bg-black outline-none"
            poster="https://i.imgur.com/pZ2jV1y.png" 
          ></video>
        ) : (
          <div className="text-gray-500 font-bold z-10 flex flex-col items-center">
            <span className="text-4xl mb-2 block">📡</span>
            Pilih episode di bawah untuk memulai.
          </div>
        )}
      </div>

      {/* KONTROL EPISODE MODERN */}
      <div className="max-w-5xl w-full bg-gray-900/30 p-6 rounded-2xl border border-gray-800/50 shadow-lg">
        <h3 className="text-xl font-black mb-5 text-gray-100 flex items-center gap-3">
          Daftar Episode 
          <span className="text-xs bg-cyan-900/50 text-cyan-400 px-3 py-1 rounded-full border border-cyan-800/50">
            {episodes.length} Tersedia
          </span>
        </h3>
        
        {/* Scrollable Container jika episode terlalu banyak */}
        <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
            {episodes.map((ep) => (
              <button
                key={ep.episodeId}
                onClick={() => setCurrentEpId(ep.episodeId)}
                title={ep.title || `Episode ${ep.number}`}
                className={`py-3 rounded-xl font-black text-base transition-all duration-300 ${
                  currentEpId === ep.episodeId 
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-[1.05] border-none' 
                    : 'bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700/50 hover:border-gray-500'
                }`}
              >
                {ep.number}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}