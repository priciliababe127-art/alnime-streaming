'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Memanggil database manual kita (Pastikan letak foldernya benar: naik 3 tingkat ke folder data)
import { manualServers } from '../../../data/manualServers'; 

export default function AnimePlayer({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const id = params.id; 
  const currentEp = parseInt(searchParams.get('ep')) || 1;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [animeTitle, setAnimeTitle] = useState("Memuat...");
  const [totalEps, setTotalEps] = useState(12); // Default 12 episode

  // State untuk Manajemen Server
  const [serverList, setServerList] = useState([]);
  const [activeUrl, setActiveUrl] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      setServerList([]);

      try {
        // 1. Minta Info Total Episode dari Jikan
        try {
          const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
          const jikanData = await jikanRes.json();
          if (jikanData?.data) {
            setAnimeTitle(jikanData.data.title);
            // Jika anime masih on-going, Jikan membalas null. Kita asumsikan 24 episode.
            setTotalEps(jikanData.data.episodes || 24); 
          }
        } catch(e) { console.log("Gagal memuat judul"); }

        // 2. Minta Link Video Global Otomatis dari API V4 kita
        let globalServer = null;
        try {
          const apiRes = await fetch(`/api/video?id=${id}&ep=${currentEp}`);
          const apiData = await apiRes.json();
          if (apiData.url) {
            globalServer = { nama: "Auto Global (Eng Sub)", url: apiData.url };
            setAnimeTitle(apiData.title); // Update judul pakai bahasa Inggris
          }
        } catch(e) { console.log("Server Global Gagal"); }

        // 3. Cek Buku Catatan Manual (Apakah kamu sudah mengisi link untuk episode ini?)
        const localServers = manualServers[id]?.[currentEp] || [];

        // 4. Gabungkan Server! (Server Manual ditaruh paling depan agar diprioritaskan)
        const combinedServers = [...localServers];
        if (globalServer) combinedServers.push(globalServer);

        if (combinedServers.length === 0) {
          throw new Error("Video belum tersedia di server global maupun manual.");
        }

        setServerList(combinedServers);
        setActiveUrl(combinedServers[0].url); // Otomatis putar server urutan pertama

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id, currentEp]);

  // Fungsi ganti episode
  const gantiEpisode = (nomor) => {
    setLoading(true);
    router.push(`/anime/${id}?ep=${nomor}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center">
      
      {/* HEADER & TOMBOL BERANDA */}
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

      {/* DAFTAR PILIHAN SERVER (Muncul di bawah player) */}
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