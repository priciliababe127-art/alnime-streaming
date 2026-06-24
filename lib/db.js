import fs from 'fs';
import path from 'path';

export async function getLocalAnimeData(malId) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'animeapi.json');
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(jsonData);

    // KARENA DATA SEKARANG ADALAH OBJECT (Key = malId), 
    // KITA BISA LANGSUNG AKSES DENGAN CARA INI:
    return data[malId] || null; 
    
  } catch (error) {
    console.error("Gagal membaca database lokal:", error);
    return null;
  }
}