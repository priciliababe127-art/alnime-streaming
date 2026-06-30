'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation'; // Tambahkan useParams
import Link from 'next/link';
import { manualServers } from '../../../data/manualServers'; 

export default function AnimePlayer({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams(); // Gunakan ini untuk mengambil ID yang lebih pasti
  
  // Mengambil ID dengan aman
  const id = params?.id || routeParams?.id;
  const currentEp = parseInt(searchParams.get('ep')) || 1;

  // Debugging: Buka F12 (Console) di browser untuk melihat apa isi ID-nya
  useEffect(() => {
    console.log("Current ID:", id);
    console.log("Current EP:", currentEp);
  }, [id, currentEp]);

  const [serverList, setServerList] = useState([]);
  const [activeUrl, setActiveUrl] = useState(null);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [animeTitle, setAnimeTitle] = useState("Memuat Judul...");
  const [totalEps, setTotalEps] = useState(12);

  useEffect(() => {
    if (!id) return; // Jangan jalankan fetch kalau ID belum ada

    let isMounted = true;
    setLoadingGlobal(true);

    // 1. Muat Server Manual
    const currentLocalServers = manualServers[id]?.[currentEp] || [];
    setServerList(currentLocalServers);
    setActiveUrl(currentLocalServers.length > 0 ? currentLocalServers[0].url : null);

    // 2. Fetch API Jikan (Judul)
    fetch(`https://api.jikan.moe/v4/anime/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data?.data && isMounted) {
          setAnimeTitle(data.data.title);
          setTotalEps(data.data.episodes || 24);
        }
      }).catch(() => {});

    // 3. Fetch API HiAnime (Video)
    fetch(`/api/video?id=${id}&ep=${currentEp}`)
      .then(res => res.json())
      .then(apiData => {
        if (apiData.url && isMounted) {
          const globalServer = { nama: "Auto Global (HiAnime)", url: apiData.url };
          setServerList(prev => [...prev.filter(s => s.nama !== "Auto Global (HiAnime)"), globalServer]);
          
          if (!activeUrl) {
            setActiveUrl(apiData.url);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingGlobal(false);
      });

    return () => { isMounted = false; };
  }, [id, currentEp]);

  const gantiEpisode = (nomor) => {
    if (!id) return; // Pencegahan navigasi jika ID undefined
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.push(`/anime/${id}?ep=${nomor}`);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-4 md:p-8 flex flex-col items-center">
      {/* Jika ID tidak ada, tampilkan pesan error */}
      {!id ? (
        <div className="text-red-500 font-bold mt-20">Error: ID Anime Tidak Ditemukan! (Cek URL)</div>
      ) : (
        <>
           {/* ... (isi UI lainnya sama dengan kodingan sebelumnya) ... */}
           {/* Saya persingkat bagian bawah agar kamu fokus pada perubahan di atas */}
           
           {/* Header, Player, Server List, Grid Episode (Tetap sama) */}
           {/* (Pastikan kamu copy-paste sisa kodingan UI dari versi sebelumnya di sini) */}
        </>
      )}
    </div>
  );
}