const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const saldoPath = path.join(__dirname, '..', 'saldo.json');
let tebakkabupaten = {};

function getSaldoData() {
  return fs.existsSync(saldoPath) ? JSON.parse(fs.readFileSync(saldoPath)) : {};
}

function saveSaldoData(data) {
  fs.writeFileSync(saldoPath, JSON.stringify(data, null, 2));
}

function tambahSaldo(id, jumlah) {
  const saldo = getSaldoData();
  if (!saldo[id]) saldo[id] = { money: 0 };
  saldo[id].money += jumlah;
  saveSaldoData(saldo);
  return saldo[id].money;
}

module.exports = (bot) => {
  bot.command('tebakkabupaten', async (ctx, next) => {
    const senderId = String(ctx.from.id);
    const chatType = ctx.chat.type;

    if (!['group', 'supergroup', 'channel'].includes(chatType)) {
      await ctx.reply('❗ Hanya bisa dimainkan di grup, supergrup, atau channel.');
      return next();
    }

    if (tebakkabupaten[senderId]) {
      await ctx.reply('⚠️ Masih ada sesi aktif, selesaikan dulu!');
      return next();
    }

    try {
      const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkabupaten.json');
      const data = await res.json();
      const soal = data[Math.floor(Math.random() * data.length)];

      await ctx.replyWithPhoto({ url: soal.url }, {
        caption: `🏞️ *Tebak Kabupaten*\n\nSilahkan jawab nama kabupaten dari gambar ini!\n⏳ *Waktu:* 60 detik`
      });

      tebakkabupaten[senderId] = {
        jawaban: soal.title.toLowerCase(),
        timeout: setTimeout(() => {
          if (tebakkabupaten[senderId]) {
            tambahSaldo(senderId, -1500);
            ctx.reply(`⏰ *Waktu habis!*\nJawaban: *${tebakkabupaten[senderId].jawaban}*\nSaldo -1.500`);
            delete tebakkabupaten[senderId];
          }
        }, 60000)
      };
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Gagal mengambil soal.');
    }

    return next(); // Penting agar /start /menu tetap bisa
  });

  bot.on('text', async (ctx, next) => {
    const senderId = String(ctx.from.id);
    if (!tebakkabupaten[senderId]) return next();

    const userAnswer = ctx.message.text.toLowerCase().trim();
    const correctAnswer = tebakkabupaten[senderId].jawaban;

    if (userAnswer === correctAnswer) {
      clearTimeout(tebakkabupaten[senderId].timeout);
      delete tebakkabupaten[senderId];
      const total = tambahSaldo(senderId, 25000);
      await ctx.replyWithPhoto({
        url: 'https://telegra.ph/file/14744917bea0185b52fb1.jpg'
      }, {
        caption: `✅ *Benar!*\n+10.000 saldo\nSaldo sekarang: *${total}*\n\nKetik /tebakkabupaten untuk bermain lagi!`
      });
    } else {
      const total = tambahSaldo(senderId, -1000);
      await ctx.reply(`❌ *Jawaban Salah!*\n-1000 saldo\nSaldo sekarang: *${total}*`);
    }

    return next(); // agar tidak block handler text lain
  });
};