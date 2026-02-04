const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');
const loadDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}

module.exports = (bot) => {
  bot.command('berburu', async (ctx) => {
    try {
      const db = loadDB();
      const userId = String(ctx.from.id);

      if (!db.users[userId]) {
        return ctx.reply('⚠️ Kamu belum terdaftar. Gunakan /reg untuk mendaftar!');
      }

      const user = db.users[userId];
      const now = Date.now();
      const cooldown = 3600000; // 1 jam
      const lastMisi = user.lastmisi || 0;
      const sisaWaktu = cooldown - (now - lastMisi);

      if (sisaWaktu > 0) {
        return ctx.reply(`⏳ Silahkan tunggu *${clockString(sisaWaktu)}* untuk misi berburu selanjutnya.`);
      }

      if (!global.misi) global.misi = {};
      if (global.misi[userId]) {
        return ctx.reply(`🚫 Selesaikan misi ${global.misi[userId][0]} terlebih dahulu.`);
      }

      const hasil = {
        banteng: Math.floor(Math.random() * 10),
        harimau: Math.floor(Math.random() * 10),
        gajah: Math.floor(Math.random() * 10),
        kambing: Math.floor(Math.random() * 10),
        panda: Math.floor(Math.random() * 10),
        buaya: Math.floor(Math.random() * 10),
        kerbau: Math.floor(Math.random() * 10),
        sapi: Math.floor(Math.random() * 10),
        monyet: Math.floor(Math.random() * 10),
        babihutan: Math.floor(Math.random() * 10),
        babi: Math.floor(Math.random() * 10),
        ayam: Math.floor(Math.random() * 10),
      };

      global.misi[userId] = ['Berburu', setTimeout(() => delete global.misi[userId], 20000)];

      setTimeout(() => ctx.reply('Sedang mencari mangsa...'), 0);
      setTimeout(() => ctx.reply('Dapat Sasaran'), 14000);
      setTimeout(() => ctx.reply('Dorr🔥'), 15000);
      setTimeout(() => ctx.reply('Nah ini dia'), 18000);
      setTimeout(() => {
        const hasilTeks = Object.entries(hasil)
          .filter(([_, val]) => val > 0)
          .map(([key, val]) => `${emojiHewan(key)} ${capitalize(key)}: ${val}`)
          .join('\n');

        ctx.reply(`🕸 *Hasil Berburu ${user.name || ctx.from.first_name}*\n${hasilTeks || 'Tidak mendapat hasil 😞'}`);
      }, 20000);

      for (let [key, val] of Object.entries(hasil)) {
        user[key] = (user[key] || 0) + val;
      }

      user.lastmisi = now;
      saveDB(db);
    } catch (e) {
      console.error(e);
      ctx.reply('❌ Terjadi kesalahan saat menjalankan perintah berburu.');
    }
  });
};

function emojiHewan(hewan) {
  const emojis = {
    banteng: '🐂',
    harimau: '🐅',
    gajah: '🐘',
    kambing: '🐐',
    panda: '🐼',
    buaya: '🐊',
    kerbau: '🐃',
    sapi: '🐮',
    monyet: '🐒',
    ayam: '🐓',
    babi: '🐖',
    babihutan: '🐗'
  };
  return emojis[hewan] || '🐾';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
