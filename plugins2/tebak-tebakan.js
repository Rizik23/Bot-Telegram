const fs = require('fs');
const fetch = require('node-fetch');
const SALDO_PATH = './saldo.json';

let sesiTebakTebakan = {};

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
  bot.command('tebaktebakan', async (ctx) => {
    if (!['group', 'supergroup', 'channel'].includes(ctx.chat.type)) {
      return ctx.reply('❌ Perintah ini hanya untuk group/supergroup/channel!');
    }

    const id = ctx.chat.id;
    if (sesiTebakTebakan[id]) return ctx.reply('⚠️ Masih ada sesi tebakan yang belum selesai!');

    try {
      const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebaktebakan.json');
      const list = await res.json();
      const soal = list[Math.floor(Math.random() * list.length)];

      await ctx.reply(`🧠 *Tebak-Tebakan*\n\n${soal.soal}?\n⏱️ Waktu: 60 detik`, { parse_mode: 'Markdown' });

      // Simpan sesi
      sesiTebakTebakan[id] = {
        jawab: soal.jawaban.toLowerCase(),
        timeout: setTimeout(() => {
          ctx.reply(`⌛ Waktu habis!\n✅ Jawaban: *${soal.jawaban}*`, { parse_mode: 'Markdown' });
          reduceSaldo(ctx.from?.id?.toString() || '0', 1500);
          delete sesiTebakTebakan[id];
        }, 60000),
      };
    } catch (e) {
      console.error(e);
      ctx.reply('❌ Gagal memuat soal.');
    }
  });

  // Listener jawaban
  bot.on('text', async (ctx, next) => {
    const id = ctx.chat.id;
    const userId = ctx.from.id.toString();
    const session = sesiTebakTebakan[id];

    if (!session) return next();

    if (ctx.message.text.toLowerCase().trim() === session.jawab) {
      clearTimeout(session.timeout);
      addSaldo(userId, 25000);
      await ctx.reply('🎉 Jawaban benar! Kamu dapat +25.000 money 💰', { parse_mode: 'Markdown' });
      delete sesiTebakTebakan[id];
    } else {
      reduceSaldo(userId, 1000); // salah -1000
    }
  });
};