const fs = require('fs');
const fetch = require('node-fetch');
const similarity = require('similarity');

const timeout = 60000;
const winScore = 25000;
const losePenalty = 1000;
const threshold = 0.72;

const SESSIONS = {};
const DB_PATH = './saldo.json';

let users = {};

// Load saldo dari file saat start
if (fs.existsSync(DB_PATH)) {
  try {
    users = JSON.parse(fs.readFileSync(DB_PATH));
  } catch (e) {
    console.error('❌ Gagal membaca saldo.json:', e);
    users = {};
  }
}

// Simpan saldo ke file
function saveUsers() {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

module.exports = (bot) => {
  // Middleware auto-register user
  bot.use(async (ctx, next) => {
    const id = ctx.from?.id?.toString();
    if (!users[id]) {
      users[id] = { money: 0 };
      saveUsers();
    }
    return next();
  });

  // Command /susunkata
  bot.command('susunkata', async (ctx) => {
    const chatId = ctx.chat.id;
    const senderId = ctx.from.id.toString();
    const chatType = ctx.chat.type;

    if (!['group', 'supergroup'].includes(chatType)) {
      return ctx.reply('❌ Perintah ini hanya bisa digunakan di grup!');
    }

    if (SESSIONS[chatId]) {
      return ctx.reply('❗ Masih ada soal yang belum dijawab di grup ini.');
    }

    try {
      const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/susunkata.json');
      const data = await res.json();
      const json = data[Math.floor(Math.random() * data.length)];

      const teks = `*🎮 SUSUN KATA*

Soal: ${json.soal}
Tipe: ${json.tipe}

⏳ Waktu: *${timeout / 1000} detik*
🎁 Hadiah: *${winScore} Money*`;

      await ctx.reply(teks);

      const timeoutId = setTimeout(() => {
        if (SESSIONS[chatId]) {
          const user = users[senderId];
          user.money -= losePenalty;
          if (user.money < 0) user.money = 0;
          saveUsers();

          ctx.reply(`⏱️ *Waktu habis!*
✅ Jawaban: *${json.jawaban}*
-💸${losePenalty} Money
💰 Saldo sekarang: *${user.money.toLocaleString()}*`);

          delete SESSIONS[chatId];
        }
      }, timeout);

      SESSIONS[chatId] = {
        answer: json.jawaban.toLowerCase().trim(),
        poin: winScore,
        player: senderId,
        timeout: timeoutId,
      };
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal mengambil soal.');
    }
  });

  // Cek jawaban
  bot.on('text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const senderId = ctx.from.id.toString();
    const text = ctx.message.text.toLowerCase().trim();

    if (!SESSIONS[chatId]) return next();

    const session = SESSIONS[chatId];
    if (session.player !== senderId) return next();

    const user = users[senderId];
    if (!user) return next();

    if (text === session.answer) {
      clearTimeout(session.timeout);
      user.money += session.poin;
      saveUsers();

      await ctx.reply(`🎉 *Jawaban benar!*\n+💰${session.poin} Money\n💰 Saldo: *${user.money.toLocaleString()}*`);
      delete SESSIONS[chatId];
    } else if (similarity(text, session.answer) >= threshold) {
      await ctx.reply('🤏 *Dikit lagi!*');
    }

    return next();
  });
};