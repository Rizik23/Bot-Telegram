const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { Input } = require('telegraf');

const SALDO_PATH = path.join(__dirname, '../saldo.json');
const sessions = {}; // sesi per grup

module.exports = (bot) => {
  bot.command('tebakgambar', async (ctx) => {
    if (!ctx.chat.type.includes('group')) return ctx.reply('❌ Perintah ini hanya bisa digunakan di grup.');

    const chatId = ctx.chat.id.toString();

    if (sessions[chatId]) {
      return ctx.reply('⚠️ Masih ada sesi yang belum selesai di grup ini!');
    }

    try {
      const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json');
      const data = await res.json();
      const soal = data[Math.floor(Math.random() * data.length)];

      const caption = `🖼️ *Tebak Gambar*\n\n📌 Deskripsi: ${soal.deskripsi}\n⏱️ Waktu: 60 detik\n🎁 Hadiah: *10.000 money*\n\nSilakan jawab di kolom chat!`;
      await ctx.replyWithPhoto(Input.fromURL(soal.img), {
        caption,
        parse_mode: 'Markdown'
      });

      const timeout = setTimeout(() => {
        if (sessions[chatId]) {
          ctx.reply(`⏰ *Waktu habis!*\n📌 Jawaban: *${sessions[chatId].jawaban}*`, { parse_mode: 'Markdown' });
          delete sessions[chatId];
        }
      }, 60000);

      sessions[chatId] = {
        jawaban: soal.jawaban.toLowerCase().trim(),
        timeout
      };
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal memuat soal.');
    }
  });

  bot.on('text', async (ctx, next) => {
    const chatId = ctx.chat.id.toString();
    const userId = ctx.from.id.toString();
    const text = ctx.message.text.toLowerCase().trim();

    if (!(chatId in sessions)) return next();

    const session = sessions[chatId];

    // Load saldo
    let saldoData = {};
    if (fs.existsSync(SALDO_PATH)) {
      saldoData = JSON.parse(fs.readFileSync(SALDO_PATH));
    }
    if (!saldoData[userId]) saldoData[userId] = { money: 0 };

    if (text === session.jawaban) {
      clearTimeout(session.timeout);
      delete sessions[chatId];

      saldoData[userId].money += 25000;
      fs.writeFileSync(SALDO_PATH, JSON.stringify(saldoData, null, 2));

      return ctx.replyWithMarkdown(`🎯 *Jawaban Benar!*\n\n🎉 Selamat kamu mendapatkan *10.000 money*\n\nKetik /tebakgambar untuk bermain lagi!`);
    } else {
      // Kurangi 500 jika saldo cukup
      if (saldoData[userId].money >= 1000) {
        saldoData[userId].money -= 1000;
        fs.writeFileSync(SALDO_PATH, JSON.stringify(saldoData, null, 2));
        return ctx.reply('❌ Jawaban salah! -1000 money');
      } else {
        return ctx.reply('❌ Jawaban salah! (saldo tidak cukup untuk dikurangi)');
      }
    }
  });
};