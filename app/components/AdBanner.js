'use client';
import { useEffect, useRef } from 'react';

export default function AdBanner() {
  const bannerRef = useRef(null);

  useEffect(() => {
    // Pastikan script hanya dimuat sekali agar tidak double iklan
    if (bannerRef.current && !bannerRef.current.firstChild) {
      
      // 1. Membuat konfigurasi atOptions
      const conf = document.createElement('script');
      conf.innerHTML = `
        atOptions = {
          'key' : 'dfd8c3ba0c7d710ead4cfc8eeae3617d',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;
      
      // 2. Membuat pemanggil script invoke.js
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://expulsiondatabaseinnocent.com/dfd8c3ba0c7d710ead4cfc8eeae3617d/invoke.js';
      
      // Masukkan ke dalam div kontainer
      bannerRef.current.appendChild(conf);
      bannerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div 
      ref={bannerRef} 
      className="flex justify-center items-center min-h-[60px] my-4 overflow-hidden" 
    />
  );
}