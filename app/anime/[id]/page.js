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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [animeTitle, setAnimeTitle] = useState("Memuat Judul...");
  const [totalEps, setTotalEps] = useState(12);

  const [serverList, setServerList] = useState([]);
  const [activeUrl, setActiveUrl] = useState(null);

  useEffect(() => {
    let isMounted = true; // Mencegah memory leak

    async function fetchData() {
      setLoading(true);
      setError(null);

      // ==============================================================================
      // TAHAP 1: MUNCULKAN SERVER MANUAL SECARA INSTAN! (Tanpa Menunggu)
      // ==============================================================================
      const localServers = manualServers[id]?.[currentEp] || [];
      let currentServers = [...localServers];

      if (currentServers.length > 0) {
        setServerList(currentServers);
        setActiveUrl(currentServers[0].url);
        setLoading(false); // MATIKAN LOADING SEKARANG JUGA jika ada server manual!
      }

      // ==============================================================================
      // TAHAP 2: JALANKAN TUGAS BACKGROUND (Judul Jikan & Server Global)
      // ==============================================================================
      
      // Ambil Judul
      fetch(`https://api.jikan.moe/v4/anime/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data?.data && isMounted) {
            setAnimeTitle(data.data.title);
            setTotalEps(data.data.episodes || 24);
          }
        }).catch(() => console.log("Jikan lambat"));

      // Cari Server Global Otomatis
      fetch(`/api/video?id=${id}&ep=${currentEp}`)
        .then(res => res.json())
        .then(apiData => {
          if (apiData.url && isMounted) {
            const globalServer = { nama: "Auto Global (Eng Sub)", url: apiData.url };
            currentServers = [...currentServers, globalServer];
            setServerList(currentServers); // Tambahkan tombol global ke layar
            
            // Jika sebelumnya kosong melompong, set ini sebagai player utama
            if (currentServers.length === 1) {
              setActiveUrl(globalServer.url);
              setLoading(false);
            }
            if(apiData.title) setAnimeTitle(apiData.title);
          }
        })
        .catch(() => console.log("Global API lambat/gagal"))
        .finally(() => {
          // Jika tugas background selesai dan ternyata KOSONG TOTAL
          if (isMounted) {
            if (currentServers.length === 0) {
              setError("Video belum tersedia. Silakan hubungi admin atau tunggu update otomatis.");
            }
            setLoading(false); // Pastikan loading berhenti
          }
        });
    }

    if (id) fetchData();
    return () => { isMounted = false; };
  }, [id, currentEp]);

  const gantiEpisode = (nomor) => {
    setLoading(true);
    router.push(`/anime/${id}?ep=${nomor}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center">
      
      {/* HEADER */}
      <div className="max-w-4xl w-full mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/" className="px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold flex items-center gap-2">
          🏠 Beranda Utama
        </Link>
        <div className="text-center md:text-right">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-400">{animeTitle}</h1>
          <h2 className="text-lg text-gray-400 mt-1">Episode {currentEp}</h2>
        </div>
      </div>

      {/* KOTAK PLAYER VIDEO */}
      <div className="max-w-4xl w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 relative flex items-center justify-center">
        {loading && (
          <div className="absolute flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 animate-pulse">Menghubungkan satelit server...</p>
          </div>
        )}
        {error && !loading && (
          <div className="absolute text-center px-6">
            <span className="text-5xl mb-4 block">📡</span>
            <p className="text-gray-400">{error}</p>
          </div>
        )}
        {activeUrl && !loading && !error && (
          <iframe src={activeUrl} allowFullScreen className="w-full h-full absolute top-0 left-0" frameBorder="0"></iframe>
        )}
      </div>

      {/* DAFTAR PILIHAN SERVER */}
      {!loading && serverList.length > 0 && (
        <div className="max-w-4xl w-full mt-6 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wider">Pilih Server Video:</h3>
          <div className="flex flex-wrap gap-3">
            {serverList.map((server, index) => (
              <button
                key={index}
                onClick={() => setActiveUrl(server.url)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  activeUrl === server.url 
                    ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {server.nama}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GRID DAFTAR EPISODE */}
      <div className="max-w-4xl w-full mt-8 mb-10">
        <h3 className="text-xl font-bold border-b border-gray-800 pb-2 mb-4">Daftar Episode</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {Array.from({ length: totalEps }, (_, i) => i + 1).map((ep) => (
            <button
              key={ep}
              onClick={() => gantiEpisode(ep)}
              className={`py-3 rounded-lg font-bold transition-all ${
                currentEp === ep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
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