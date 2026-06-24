import fs from 'fs';
import path from 'path';

// Kita perlu mendefinisikan __dirname secara manual di ES Modules
const __dirname = path.resolve();

async function addAnimeToDb(malId, otakuSlug) {
  const dbPath = path.join(__dirname, 'data', 'animeapi.json');
  
  // 1. Ambil data dari Jikan
  const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
  const { data } = await res.json();
  
  if (!data) return console.log("Gagal mengambil data dari Jikan!");

  // 2. Baca file database
  let db = {};
  if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }

  // 3. Masukkan data
  db[malId] = {
    title: data.title,
    otakudesu: otakuSlug
  };

  // 4. Simpan
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log(`✅ Berhasil menambahkan: ${data.title} (Slug: ${otakuSlug})`);
}

// Ambil argumen
const args = process.argv.slice(2);
if (args.length >= 2) {
  addAnimeToDb(args[0], args[1]);
} else {
  console.log("Gunakan: node scripts/generate.js [mal_id] [otaku_slug]");
}