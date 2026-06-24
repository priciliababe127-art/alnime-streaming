import Script from 'next/script';
import './globals.css';

// ============================================================================
// MEGA-METADATA SEO & OPEN GRAPH
// ============================================================================
export const metadata = {
  metadataBase: new URL('https://alnime.sociosquad.net'),
  title: {
    default: 'ALNIME | Nonton Anime Sub Indo Tanpa Iklan Judi',
    template: '%s | ALNIME'
  },
  description: 'Streaming anime subtitle Indonesia gratis terlengkap dengan antarmuka gelap yang cepat, ringan, dan tanpa gangguan pop-up iklan judi slot.',
  keywords: [
    'nonton anime', 'anime sub indo', 'streaming anime', 'otakudesu', 
    'samehadaku', 'nonton anime gratis', 'ALNIME', 'anime sub indo no iklan',
    'solo leveling sub indo', 'one piece sub indo', 'boruto sub indo terlengkap'
  ],
  authors: [{ name: 'SocioSquad', url: 'https://alnime.sociosquad.net' }],
  creator: 'ALNime Team',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://alnime.sociosquad.net',
    title: 'ALNIME | Nonton Anime Sub Indo Tanpa Ribet',
    description: 'Nonton One Piece, Solo Leveling, Demon Slayer, dan ribuan anime lainnya secara gratis tanpa pop-up judi.',
    siteName: 'ALNIME',
    images: [
      {
        url: '/og-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'ALNIME Official Web Banner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ALNIME | Nonton Anime Sub Indo Tanpa Iklan Judi',
    description: 'Streaming anime subtitle Indonesia gratis tanpa pop-up judi.',
    images: ['/og-banner.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'KODE_DARI_GOOGLE_SEARCH_CONSOLE',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
        
        {children}

        {/* =================================================================== */}
        {/* 1. SCRIPT IKLAN POP-UNDER */}
        {/* =================================================================== */}
        <Script 
          src="https://expulsiondatabaseinnocent.com/d4/1e/ec/d41eec995d21d55bcc35a752a969fee0.js" 
          strategy="afterInteractive" 
        />

        {/* =================================================================== */}
        {/* 2. HISTATS TRACKER (Telah di-React-ifikasi) */}
        {/* =================================================================== */}
        <Script id="histats-init" strategy="afterInteractive">
          {`
            var _Hasync= _Hasync|| [];
            _Hasync.push(['Histats.start', '1,4946765,4,0,0,0,00010000']);
            _Hasync.push(['Histats.fasi', '1']);
            _Hasync.push(['Histats.track_hits', '']);
          `}
        </Script>
        
        <Script 
          src="https://s10.histats.com/js15_as.js" 
          strategy="afterInteractive" 
        />
        
        <noscript>
          <a href="/" target="_blank">
            <img src="https://sstatic1.histats.com/0.gif?4946765&101" alt="Histats" border="0" />
          </a>
        </noscript>

      </body>
    </html>
  );
}