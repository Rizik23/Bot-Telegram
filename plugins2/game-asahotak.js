const fs = require('fs');
const fetch = require('node-fetch');
const similarity = require('similarity');

const sessions = {};
const threshold = 0.72;
const winScore = 25000;
const saldoFile = './saldo.json';

function loadSaldo() {
  if (!fs.existsSync(saldoFile)) fs.writeFileSync(saldoFile, '{}');
  return JSON.parse(fs.readFileSync(saldoFile));
}

function saveSaldo(saldo) {
  fs.writeFileSync(saldoFile, JSON.stringify(saldo, null, 2));
}

module.exports = (bot) => {
  bot.command('asahotak', async (ctx) => {
    if (!ctx.chat.type.includes('group')) return ctx.reply('❌ Command ini hanya bisa digunakan di grup.');

    const userId = ctx.from.id.toString();

    if (sessions[userId]) return ctx.reply('⚠️ Kamu masih punya soal yang belum dijawab!');

    try {
      const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/asahotak.json');
      const data = await res.json();
      const item = data[Math.floor(Math.random() * data.length)];

      const clue = item.jawaban[0] + item.jawaban.slice(1).replace(/[a-zA-Z]/g, '_');

      await ctx.replyWithMarkdown(`🧠 *Asah Otak*\n\n*Soal:* ${item.soal}\n\n🔎 Clue: _${clue}_\n💰 Hadiah: *${winScore} money*\n⏱️ Jawab dalam *60 detik*!`);

      sessions[userId] = {
        answer: item.jawaban.toLowerCase(),
        clue,
        winScore,
        timeout: setTimeout(() => {
          if (sessions[userId]) {
            ctx.replyWithMarkdown(`⏰ *Waktu habis!*\n📌 Jawaban yang benar: *${sessions[userId].answer}*`);
            delete sessions[userId];
          }
        }, 60000)
      };
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal mengambil soal!');
    }
  });

  bot.on('text', async (ctx, next) => {
    const userId = ctx.from.id.toString();
    const msg = ctx.message.text.toLowerCase().trim();

    if (!(userId in sessions)) return next();

    const session = sessions[userId];

    if (msg === session.answer) {
      clearTimeout(session.timeout);
      delete sessions[userId];

      const saldo = loadSaldo();
      if (!saldo[userId]) saldo[userId] = { money: 0 };
      saldo[userId].money += winScore;
      saveSaldo(saldo);

      return ctx.replyWithMarkdown(`✅ *Benar!*\n🎉 Kamu mendapatkan *${winScore} money*\n💰 Total: *${saldo[userId].money.toLocaleString()} money*`);
    }

    if (similarity(msg, session.answer) >= threshold) {
      return ctx.reply('🧐 Hampir benar! Coba lagi...');
    }

    return ctx.reply('❌ Salah! Coba lagi.');
  });
};