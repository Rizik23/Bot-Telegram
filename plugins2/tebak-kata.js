const fs = require('fs');
const fetch = require('node-fetch');
const SALDO_PATH = './saldo.json';

let sessions = {}; // penyimpanan sesi per chat

function addSaldo(userId, amount) {
  let saldo = {};
  if (fs.existsSync(SALDO_PATH)) {
    saldo = JSON.parse(fs.readFileSync(SALDO_PATH));
  }
  if (!saldo[userId]) saldo[userId] = { money: 0 };
  saldo[userId].money += amount;
  fs.writeFileSync(SALDO_PATH, JSON.stringify(saldo, null, 2));
}

function reduceSaldo(userId, amount) {
  let saldo = {};
  if (fs.existsSync(SALDO_PATH)) {
    saldo = JSON.parse(fs.readFileSync(SALDO_PATH));
  }
  if (!saldo[userId]) saldo[userId] = { money: 0 };
  saldo[userId].money = Math.max(0, saldo[userId].money - amount);
  fs.writeFileSync(SALDO_PATH, JSON.stringify(saldo, null, 2));
}

module.exports = (bot) => {
  bot.command('tebakkata', async (ctx) => {
    if (!['group', 'supergroup', 'channel'].includes(ctx.chat.type)) {
      return ctx.reply('❌ Perintah ini hanya bisa digunakan di grup, supergroup, atau channel!');
    }

    const id = ctx.chat.id;
    if (sessions[id]) return ctx.reply('⚠️ Masih ada sesi yang belum selesai!');

    try {
      const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkata.json');
      const list = await res.json();
      const soal = list[Math.floor(Math.random() * list.length)];

      const message = await ctx.reply(
        `🧠 *Tebak Kata*\n\n*Soal:* ${soal.soal}\n⏱️ Waktu: 60 detik\n🎁 Hadiah: 10.000 money`, {
          parse_mode: 'Markdown',
        });

      // simpan sesi
      sessions[id] = {
        jawab: soal.jawaban.toLowerCase(),
        timeout: setTimeout(() => {
          ctx.reply(`⌛ Waktu habis!\n✅ Jawaban: *${soal.jawaban}*`, { parse_mode: 'Markdown' });
          reduceSaldo(ctx.from.id.toString(), 1500); // kurangi 1000 jika waktu habis
          delete sessions[id];
        }, 60000),
      };
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal mengambil soal!');
    }
  });

  // listener untuk jawaban
  bot.on('text', async (ctx, next) => {
    const id = ctx.chat.id;
    const userId = ctx.from.id.toString();
    const session = sessions[id];

    if (!session) return next();
    if (ctx.message.text.toLowerCase().trim() === session.jawab) {
      clearTimeout(session.timeout);
      addSaldo(userId, 25000);
      await ctx.reply('🎉 Jawaban benar! Kamu mendapatkan *25.000 money* 💰', { parse_mode: 'Markdown' });
      delete sessions[id];
    } else {
      reduceSaldo(userId, 1000); // jika salah, kurangi 1000
    }
  });
};