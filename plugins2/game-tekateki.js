const fs = require('fs');
const fetch = require('node-fetch');
const similarity = require('similarity');

const timeout = 60000;
const winScore = 25000;
const penalty = 1000;
const threshold = 0.72;
const DB_PATH = './saldo.json';

let users = {};

// Load saldo.json saat startup
if (fs.existsSync(DB_PATH)) {
  try {
    users = JSON.parse(fs.readFileSync(DB_PATH));
  } catch (e) {
    console.error('Gagal memuat saldo.json:', e);
    users = {};
  }
}

// Fungsi simpan saldo.json
function saveUsers() {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

const sessions = {};

module.exports = (bot) => {
  // Middleware auto-register
  bot.use(async (ctx, next) => {
    const id = ctx.from?.id?.toString();
    if (!users[id]) users[id] = { money: 0, exp: 0 };
    return next();
  });

  bot.command('tekateki', async (ctx) => {
    const chatId = ctx.chat.id;
    const senderId = ctx.from.id.toString();

    if (!['group', 'supergroup'].includes(ctx.chat.type)) {
      return ctx.reply('❌ Perintah ini hanya bisa digunakan di grup!');
    }

    if (sessions[chatId]) {
      return ctx.reply('❗ Masih ada soal yang belum dijawab di grup ini.');
    }

    try {
      const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/tekateki.json');
      const data = await res.json();
      const json = data[Math.floor(Math.random() * data.length)];

      const teks = `*🧠 TEKA-TEKI*

Soal: ${json.soal}

⏳ Waktu: *${timeout / 1000} detik*
🎁 Bonus: *${winScore} XP*
💸 Hadiah: *${winScore} Money*`;

      await ctx.reply(teks);

      const timeoutId = setTimeout(() => {
        if (sessions[chatId]) {
          users[senderId].money -= penalty;
          if (users[senderId].money < 0) users[senderId].money = 0;
          saveUsers();

          ctx.reply(`❌ *Waktu habis!*
✅ Jawaban: *${json.jawaban}*
-💸${penalty} Money
💰 Sisa saldo: *${users[senderId].money.toLocaleString()}*`);

          delete sessions[chatId];
        }
      }, timeout);

      sessions[chatId] = {
        answer: json.jawaban.toLowerCase().trim(),
        player: senderId,
        poin: winScore,
        timeout: timeoutId,
      };
    } catch (err) {
      console.error(err);
      ctx.reply('⚠️ Gagal mengambil soal.');
    }
  });

  bot.on('text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const senderId = ctx.from.id.toString();
    const text = ctx.message.text.toLowerCase().trim();

    if (!sessions[chatId]) return next();

    const session = sessions[chatId];
    if (senderId !== session.player) return next();

    if (text === session.answer) {
      clearTimeout(session.timeout);
      users[senderId].money += session.poin;
      users[senderId].exp += session.poin;
      saveUsers();

      await ctx.reply(`🎉 *Jawaban benar!*
+💰 ${session.poin} Money
+📈 ${session.poin} XP
Saldo: *${users[senderId].money.toLocaleString()}*`);

      delete sessions[chatId];
    } else if (similarity(text, session.answer) >= threshold) {
      await ctx.reply('🤏 *Hampir benar!*');
    }

    return next();
  });
};