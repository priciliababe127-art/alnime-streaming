'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { manualServers } from '../../../data/manualServers'; 

export default function AnimePlayer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  const id = params?.id; 
  const currentEp = parseInt(searchParams.get('ep')) || 1;

  const [serverList, setServerList] = useState([]);
  const [activeUrl, setActiveUrl] = useState(null);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [animeTitle, setAnimeTitle] = useState("Memuat Judul...");
  const [totalEps, setTotalEps] = useState(12);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setLoadingGlobal(true);

    // 1. Data Manual
    const localServers = manualServers[id]?.[currentEp] || [];
    
    // 2. Data API Jikan & HiAnime
    fetch(`https://api.jikan.moe/v4/anime/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data?.data && isMounted) {
          setAnimeTitle(data.data.title);
          setTotalEps(data.data.episodes || 24);
        }
      }).catch(() => {});

    fetch(`/api/video?id=${id}&ep=${currentEp}`)
      .then(res => res.json())
      .then(apiData => {
        if (apiData.url && isMounted) {
          const globalServer = { nama: "Auto Global (HiAnime)", url: apiData.url };
          setServerList([...localServers, globalServer]);
          if (!activeUrl) setActiveUrl(localServers.length > 0 ? localServers[0].url : apiData.url);
        } else {
          setServerList(localServers);
          if (localServers.length > 0) setActiveUrl(localServers[0].url);
        }
      })
      .catch(() => {
        setServerList(localServers);
        if (localServers.length > 0) setActiveUrl(localServers[0].url);
      })
      .finally(() => {
        if (isMounted) setLoadingGlobal(false);
      });

    return () => { isMounted = false; };
  }, [id, currentEp]);

  const gantiEpisode = (nomor) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.push(`/anime/${id}?ep=${nomor}`);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-5xl w-full mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <Link href="/" className="px-6 py-3 bg-gray-800 rounded-2xl font-bold border border-gray-700 hover:border-blue-500 transition-all">🏠 Beranda</Link>
        <div className="text-right">
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-400">{animeTitle}</h1>
          <div className="text-cyan-400 font-bold">EPISODE {currentEp}</div>
        </div>
      </div>

      <div className="max-w-5xl w-full aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 relative flex items-center justify-center">
        {activeUrl ? (
          <iframe src={activeUrl} allowFullScreen className="w-full h-full absolute" frameBorder="0"></iframe>
        ) : (
          loadingGlobal ? (
            <div className="animate-pulse text-gray-400">Menghubungkan Server...</div>
          ) : (
            <div className="text-gray-500">Video belum tersedia.</div>
          )
        )}
      </div>

      {serverList.length > 0 && (
        <div className="max-w-5xl w-full mt-6 bg-gray-800/40 p-6 rounded-2xl text-center">
          <h3 className="text-xs text-gray-400 mb-4 font-bold uppercase tracking-widest">Pilih Server</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {serverList.map((server, index) => (
              <button key={index} onClick={() => setActiveUrl(server.url)} className={`px-5 py-2.5 rounded-xl font-bold text-sm ${activeUrl === server.url ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                {server.nama}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-5xl w-full mt-10">
        <h3 className="text-xl font-bold mb-5">Daftar Episode</h3>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {Array.from({ length: totalEps }, (_, i) => i + 1).map((ep) => (
            <button key={ep} onClick={() => gantiEpisode(ep)} className={`py-3 rounded-xl font-bold ${currentEp === ep ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
              {ep}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}