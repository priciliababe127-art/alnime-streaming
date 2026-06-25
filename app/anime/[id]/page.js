'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AnimePlayer({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Mengambil ID dari URL (cth: alnime.sociosquad.net/anime/61316)
  const id = params.id; 
  // Mengambil nomor episode dari URL query (cth: ?ep=1). Default ke 1 jika kosong.
  const currentEp = parseInt(searchParams.get('ep')) || 1;

  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animeTitle, setAnimeTitle] = useState("Sedang memuat data...");

  useEffect(() => {
    async function fetchVideo() {
      setLoading(true);
      setError(null);
      setVideoUrl(null); // Reset video saat ganti episode

      try {
        // MENEMBAK MESIN V2 KITA!
        const res = await fetch(`/api/video?id=${id}&ep=${currentEp}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Gagal menghubungi server agregator.");
        }

        setVideoUrl(data.url);
        setAnimeTitle(data.title);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchVideo();
    }
  }, [id, currentEp]);

  // Fungsi untuk ganti episode
  const gantiEpisode = (arah) => {
    let episodeBaru = currentEp;
    if (arah === 'next') episodeBaru += 1;
    if (arah === 'prev' && currentEp > 1) episodeBaru -= 1;
    
    // Ganti URL tanpa memuat ulang halaman secara penuh
    router.push(`/anime/${id}?ep=${episodeBaru}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center">
      
      {/* HEADER JUDUL */}
      <div className="max-w-4xl w-full mb-6 text-center">
        <h1 className="text-2xl md:text-4xl font-bold text-blue-400">
          {animeTitle}
        </h1>
        <h2 className="text-lg md:text-xl text-gray-400 mt-2">
          Episode {currentEp}
        </h2>
      </div>

      {/* KOTAK PLAYER VIDEO */}
      <div className="max-w-4xl w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 relative flex items-center justify-center">
        
        {/* State 1: Loading */}
        {loading && (
          <div className="absolute flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 animate-pulse">Menghubungi satelit server...</p>
          </div>
        )}

        {/* State 2: Error */}
        {error && !loading && (
          <div className="absolute text-center px-6">
            <span className="text-5xl mb-4 block">📡</span>
            <h3 className="text-xl font-bold text-red-500 mb-2">Transmisi Terputus</h3>
            <p className="text-gray-400">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
            >
              Coba Hubungkan Ulang
            </button>
          </div>
        )}

        {/* State 3: Sukses (Menampilkan Video) */}
        {videoUrl && !loading && !error && (
          <iframe
            src={videoUrl}
            allowFullScreen
            className="w-full h-full absolute top-0 left-0"
            frameBorder="0"
          ></iframe>
        )}
      </div>

      {/* TOMBOL NAVIGASI EPISODE */}
      <div className="max-w-4xl w-full flex justify-between mt-6">
        <button 
          onClick={() => gantiEpisode('prev')}
          disabled={currentEp <= 1 || loading}
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            currentEp <= 1 || loading 
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
              : 'bg-gray-800 hover:bg-gray-700 text-white'
          }`}
        >
          &larr; Ep Sebelumnya
        </button>

        <button 
          onClick={() => gantiEpisode('next')}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ep Selanjutnya &rarr;
        </button>
      </div>

    </div>
  );
}