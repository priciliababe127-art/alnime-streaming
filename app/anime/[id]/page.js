'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { manualServers } from '../../../data/manualServers'; 

export default function AnimePlayer({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const id = params.id; 
  const currentEp = parseInt(searchParams.get('ep')) || 1;

  // 1. BACA CATATAN MANUAL SECARA INSTAN! (Tidak perlu nunggu loading)
  const localServers = manualServers[id]?.[currentEp] || [];

  // State
  const [serverList, setServerList] = useState(localServers);
  const [activeUrl, setActiveUrl] = useState(localServers.length > 0 ? localServers[0].url : null);
  
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [animeTitle, setAnimeTitle] = useState("Memuat Judul...");
  const [totalEps, setTotalEps] = useState(12);

  useEffect(() => {
    let isMounted = true;
    setLoadingGlobal(true);

    // Reset list server ke manual tiap ganti episode
    const currentLocalServers = manualServers[id]?.[currentEp] || [];
    setServerList(currentLocalServers);
    
    // Jika belum ada url aktif (dari manual), pastikan direset
    let currentActiveUrl = currentLocalServers.length > 0 ? currentLocalServers[0].url : null;
    setActiveUrl(currentActiveUrl);

    // 2. CARI JUDUL API JIKAN DI BACKGROUND
    fetch(`https://api.jikan.moe/v4/anime/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data?.data && isMounted) {
          setAnimeTitle(data.data.title);
          setTotalEps(data.data.episodes || 24);
        }
      }).catch(() => {});

    // 3. CARI SERVER GLOBAL DI BACKGROUND
    fetch(`/api/video?id=${id}&ep=${currentEp}`)
      .then(res => res.json())
      .then(apiData => {
        if (apiData.url && isMounted) {
          const globalServer = { nama: "Auto Global (Eng Sub)", url: apiData.url };
          
          setServerList(prev => [...prev, globalServer]);
          
          // Jika tadi server manualnya kosong, jadikan server global ini sebagai player utama
          if (!currentActiveUrl) {
            setActiveUrl(apiData.url);
          }
          if (apiData.title) setAnimeTitle(apiData.title);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingGlobal(false);
      });

    return () => { isMounted = false; };
  }, [id, currentEp]);

  const gantiEpisode = (nomor) => {
    // Scroll mulus ke atas saat ganti episode
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.push(`/anime/${id}?ep=${nomor}`);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-4 md:p-8 flex flex-col items-center font-sans tracking-wide">
      
      {/* HEADER & TOMBOL BERANDA KEKINIAN (Glassmorphism / Neon Hover) */}
      <div className="max-w-5xl w-full mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        
        <Link 
          href="/" 
          className="group relative inline-flex items-center gap-3 px-6 py-3 bg-gray-800/40 backdrop-blur-md border border-gray-700/50 hover:border-blue-500/50 rounded-2xl text-sm font-bold text-gray-300 hover:text-white transition-all duration-300 overflow-hidden shadow-lg hover:shadow-blue-500/20"
        >
          {/* Efek kilap saat di-hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-500/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <span className="text-xl group-hover:scale-110 transition-transform duration-300">🏠</span>
          <span>Beranda Utama</span>
        </Link>

        <div className="text-center md:text-right">
          <h1 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-md">
            {animeTitle}
          </h1>
          <div className="inline-block mt-2 px-3 py-1 bg-gray-800/80 rounded-lg border border-gray-700 text-sm text-cyan-400 font-semibold tracking-widest">
            EPISODE {currentEp}
          </div>
        </div>
      </div>

      {/* KOTAK PLAYER VIDEO */}
      <div className="max-w-5xl w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-gray-800/60 relative flex items-center justify-center group">
        
        {/* Render Iframe Jika Ada URL Aktif */}
        {activeUrl ? (
          <iframe src={activeUrl} allowFullScreen className="w-full h-full absolute top-0 left-0 z-10" frameBorder="0"></iframe>
        ) : (
          /* Render Loading Hanya Jika URL Aktif Masih Kosong & Server Global Masih Dicari */
          loadingGlobal ? (
            <div className="absolute flex flex-col items-center z-0">
              <div className="w-14 h-14 border-4 border-gray-700 border-t-cyan-400 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(34,211,238,0.4)]"></div>
              <p className="text-gray-400 animate-pulse font-medium tracking-wide">Mencari Server...</p>
            </div>
          ) : (
            <div className="absolute text-center z-0 px-6">
              <span className="text-6xl mb-4 block drop-shadow-lg">📡</span>
              <p className="text-gray-400 font-medium">Video belum tersedia untuk episode ini.</p>
            </div>
          )
        )}
      </div>

      {/* DAFTAR PILIHAN SERVER (Muncul SEKETIKA tanpa peduli status loading!) */}
      {serverList.length > 0 && (
        <div className="max-w-5xl w-full mt-6 bg-gray-800/40 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-lg">
          <h3 className="text-xs text-gray-400 mb-3 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Pilih Server Video
          </h3>
          <div className="flex flex-wrap gap-3">
            {serverList.map((server, index) => (
              <button
                key={index}
                onClick={() => setActiveUrl(server.url)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeUrl === server.url 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border-transparent' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 hover:border-gray-400'
                }`}
              >
                {server.nama}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GRID DAFTAR EPISODE */}
      <div className="max-w-5xl w-full mt-10 mb-16">
        <h3 className="text-xl font-extrabold border-b border-gray-800/80 pb-3 mb-5 text-gray-200">Daftar Episode</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {Array.from({ length: totalEps }, (_, i) => i + 1).map((ep) => (
            <button
              key={ep}
              onClick={() => gantiEpisode(ep)}
              className={`py-3.5 rounded-xl font-black text-lg transition-all duration-300 ${
                currentEp === ep 
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-105' 
                  : 'bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700/50 hover:border-gray-500'
              }`}
            >
              {ep}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}