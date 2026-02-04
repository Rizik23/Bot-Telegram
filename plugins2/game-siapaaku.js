const fs = require('fs');
const fetch = require('node-fetch');
const similarity = require('similarity');

const siapaaku = {};
const timeout = 60000;
const reward = 25000;
const penalty = 1000;
const threshold = 0.72;

const DB_PATH = './saldo.json';
let users = {};

// Load saldo dari file
if (fs.existsSync(DB_PATH)) {
  try {
    users = JSON.parse(fs.readFileSync(DB_PATH));
  } catch (err) {
    console.error('❌ Gagal membaca saldo.json:', err);
    users = {};
  }
}

// Simpan saldo ke file
function saveUsers() {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

module.exports = (bot) => {
  // Middleware register user jika belum
  bot.use(async (ctx, next) => {
    const id = ctx.from?.id?.toString();
    if (!users[id]) {
      users[id] = { money: 0 };
      saveUsers();
    }
    return next();
  });

  // Command /siapaaku
  bot.command('siapaaku', async (ctx) => {
    if (!['group', 'supergroup'].includes(ctx.chat.type)) {
      return ctx.reply('❌ Perintah ini hanya bisa digunakan di grup!');
    }

    const chatId = ctx.chat.id;
    const senderId = ctx.from.id.toString();

    if (siapaaku[chatId]) {
      return ctx.reply('⚠️ Masih ada soal belum terjawab di grup ini.');
    }

    try {
      const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/siapakahaku.json');
      const list = await res.json();
      const json = list[Math.floor(Math.random() * list.length)];

      const clue = json.jawaban
        .split('')
        .map((c, i) => (i % 2 === 0 ? c : '_'))
        .join('');

      const teks = `*🎮 GAME: Siapakah Aku?*

🧠 Soal: ${json.soal}
💡 Clue: *${clue}*
🎁 Hadiah: *${reward.toLocaleString()} Money*
⏱️ Waktu: *${timeout / 1000} detik*

*Silakan jawab di kolom chat!*`;

      await ctx.reply(teks);

      // Set sesi
      const timeoutId = setTimeout(() => {
        if (siapaaku[chatId]) {
          const user = users[senderId];
          user.money -= penalty;
          if (user.money < 0) user.money = 0;
          saveUsers();

          ctx.reply(`⏱️ *Waktu habis!*
✅ Jawaban: *${json.jawaban}*
-💸${penalty} Money
💰 Saldo sekarang: *${user.money.toLocaleString()}*`);

          delete siapaaku[chatId];
        }
      }, timeout);

      siapaaku[chatId] = {
        answer: json.jawaban.toLowerCase(),
        reward,
        player: senderId,
        timeout: timeoutId
      };
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal memuat soal.');
    }
  });

  // Handler jawaban
  bot.on('text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const senderId = ctx.from.id.toString();
    const text = ctx.message.text.toLowerCase();

    if (!siapaaku[chatId]) return next();

    const game = siapaaku[chatId];
    if (game.player !== senderId) return next();

    const user = users[senderId];
    if (!user) return next();

    if (text === game.answer) {
      clearTimeout(game.timeout);
      user.money += game.reward;
      saveUsers();

      await ctx.reply(`🎉 *Benar!*
Jawaban: *${game.answer}*
+💰${game.reward.toLocaleString()} Money
💼 Total: *${user.money.toLocaleString()}*`);

      delete siapaaku[chatId];
    } else if (similarity(text, game.answer) >= threshold) {
      await ctx.reply('🤏 Dikit lagi!');
    }

    return next();
  });
};