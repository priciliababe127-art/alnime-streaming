'use client';
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import AdBanner from '../components/AdBanner';

export default function AnimePlayer({ src }) {
  const videoRef = useRef(null);
  const isRawVideo = src?.includes('.m3u8') || src?.includes('.mp4');

  useEffect(() => {
    if (!isRawVideo || !src) return;
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }
  }, [src, isRawVideo]);

  if (!src) return null;

  // ==========================================================================
  // JALUR IFRAME DENGAN "JUBAH GAIB" (No-Referrer) & TOMBOL VIP
  // ==========================================================================
  if (!isRawVideo) {
    return (
      <div className="w-full flex flex-col gap-2.5">
        <div className="w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
          {/* MANTRA GAIB: referrerPolicy="no-referrer" membuat server mengira ini akses web normal */}
          <iframe 
            src={src} 
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            className="w-full h-full absolute inset-0 bg-slate-950"
            allowFullScreen
            allow="autoplay; fullscreen"
          />
        </div>

        {/* TOMBOL ANTI-KIAMAT (Penyelamat Mutlak) */}
        <div className="flex items-center justify-between bg-slate-900/80 px-4 py-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-amber-400">⚠️ Layar di atas gelap / berputar terus?</span>
          </div>
          <a 
            href={src} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <span>Buka Player di Tab Baru ↗</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      <video ref={videoRef} controls autoPlay className="w-full h-full" />
    </div>
  );
}