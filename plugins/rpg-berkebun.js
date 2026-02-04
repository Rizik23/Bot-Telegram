const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');
const loadDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

const timeout = 1800000; // 30 menit

function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}

const emoji = (name) => {
  const map = {
    bibitpisang: '🌱🍌',
    bibitanggur: '🌱🍇',
    bibitmangga: '🌱🥭',
    bibitjeruk: '🌱🍊',
    bibitapel: '🌱🍎',
    pisang: '🍌',
    anggur: '🍇',
    mangga: '🥭',
    jeruk: '🍊',
    apel: '🍎',
  };
  return map[name] || '🌾';
};

module.exports = (bot) => {
  if (!global.misi) global.misi = {};

  bot.command('berkebun', async (ctx) => {
    const db = loadDB();
    const userId = String(ctx.from.id);

    if (!db.users[userId]) {
      return ctx.reply('⚠️ Kamu belum terdaftar. Gunakan /reg untuk mendaftar!');
    }

    const user = db.users[userId];
    const now = Date.now();
    const sisa = timeout - (now - (user.lastberkebon || 0));

    if (global.misi[userId]) {
      return ctx.reply(`⛔ Selesaikan misi *${global.misi[userId][0]}* terlebih dahulu.`);
    }

    const kekurangan = [];
    if (user.bibitpisang < 100) kekurangan.push(`${emoji('bibitpisang')} Bibit Pisang: ${100 - user.bibitpisang}`);
    if (user.bibitanggur < 100) kekurangan.push(`${emoji('bibitanggur')} Bibit Anggur: ${100 - user.bibitanggur}`);
    if (user.bibitmangga < 100) kekurangan.push(`${emoji('bibitmangga')} Bibit Mangga: ${100 - user.bibitmangga}`);
    if (user.bibitjeruk < 100) kekurangan.push(`${emoji('bibitjeruk')} Bibit Jeruk: ${100 - user.bibitjeruk}`);
    if (user.bibitapel < 100) kekurangan.push(`${emoji('bibitapel')} Bibit Apel: ${100 - user.bibitapel}`);

    if (sisa > 0) {
      return ctx.reply(`⏳ Mohon tunggu *${clockString(sisa)}* untuk berkebun kembali.`);
    }

    if (kekurangan.length > 0) {
      return ctx.reply(`📮 Kamu membutuhkan bibit:\n${kekurangan.join('\n')}`);
    }

    // Proses berkebun
    const hasil = {
      pisang: Math.floor(Math.random() * 100),
      anggur: Math.floor(Math.random() * 100),
      mangga: Math.floor(Math.random() * 100),
      jeruk: Math.floor(Math.random() * 100),
      apel: Math.floor(Math.random() * 100),
    };

    global.misi[userId] = ['Berkebun', setTimeout(() => delete global.misi[userId], 20000)];

    setTimeout(() => ctx.reply('Sedang Menanam Bibit...'), 0);
    setTimeout(() => ctx.reply('Menunggu hasil panen...'), 8000);
    setTimeout(() => {
      const hasilText = Object.entries(hasil).map(([k, v]) => `${emoji(k)} ${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join('\n');

      ctx.reply(`⌛ Hasil Panen Kamu:\n\n${hasilText}`);

      // Update data user
      user.pisang += hasil.pisang;
      user.anggur += hasil.anggur;
      user.mangga += hasil.mangga;
      user.jeruk += hasil.jeruk;
      user.apel += hasil.apel;

      user.bibitpisang -= 100;
      user.bibitanggur -= 100;
      user.bibitmangga -= 100;
      user.bibitjeruk -= 100;
      user.bibitapel -= 100;
      user.lastberkebon = now;

      saveDB(db);
    }, 20000);
  });
};
