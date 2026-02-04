const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const config = require('../config');

module.exports = (bot) => {
  bot.command('claimbug', async (ctx) => {
    const userId = ctx.from.id.toString();
    const username = ctx.from.username ? `@${ctx.from.username}` : 'Tanpa Username';

    const saldoPath = path.join(__dirname, '..', 'saldo.json');
    const notifPath = path.join(__dirname, '..', 'notifclaim.json');

    if (!fs.existsSync(saldoPath)) {
      return ctx.reply('⚠️ File saldo.json tidak ditemukan.');
    }

    let saldoData;
    try {
      saldoData = JSON.parse(fs.readFileSync(saldoPath));
    } catch (err) {
      return ctx.reply('⚠️ Gagal membaca saldo.json.');
    }

    const userData = saldoData[userId] || { money: 0 };
    const saldoUser = userData.money;

    let notifLog = [];
    try {
      if (fs.existsSync(notifPath)) {
        notifLog = JSON.parse(fs.readFileSync(notifPath));
      }
    } catch (e) {
      notifLog = [];
    }

    const sudahClaim = notifLog.some(n => n.userId === userId && n.claim === 'Script Bug');
    if (sudahClaim) {
      return ctx.reply('⚠️ Kamu sudah pernah claim Script Bug sebelumnya.');
    }

    if (saldoUser >= 200000) {
      userData.money -= 200000;
      saldoData[userId] = userData;

      try {
        fs.writeFileSync(saldoPath, JSON.stringify(saldoData, null, 2));
      } catch (err) {
        console.error('❌ Gagal menyimpan saldo.json:', err);
        return ctx.reply('⚠️ Terjadi kesalahan saat menyimpan saldo kamu.');
      }

      const now = new Date();
      const tanggal = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const notif = {
        username,
        userId,
        claim: 'Script Bug',
        tanggal
      };

      const msg = `📢 *CLAIM NOTIFIKASI*\n\n` +
                  `👤 Username: ${username}\n` +
                  `🆔 User ID: ${userId}\n` +
                  `📥 Claim: Script Bug\n` +
                  `📅 Tanggal: ${tanggal}`;

      await bot.telegram.sendMessage(config.OWNER_ID, msg, { parse_mode: 'Markdown' });

      notifLog.push(notif);

      try {
        fs.writeFileSync(notifPath, JSON.stringify(notifLog, null, 2));
      } catch (e) {
        console.error('❌ Gagal menyimpan notifclaim.json:', e);
      }

      return ctx.reply(
        `🎉 Kamu berhasil claim Script Bug!\n\n💰 Sisa saldo kamu: Rp ${userData.money.toLocaleString()}`,
        Markup.inlineKeyboard([
          [Markup.button.url('📦 Download', 'https://www.mediafire.com/file/ylm4fvso4vzqh0v/DRAGON+V7+PRO+NO-ENC.zip/file')],
        ])
      );
    } else {
      return ctx.reply(
        `❌ Saldo kamu tidak cukup untuk claim Script Bug.\n💰 Saldo kamu: Rp ${saldoUser.toLocaleString()}\n\n` +
        `🎮 Silahkan bermain game atau tebak-tebakan untuk mendapatkan saldo!`
      );
    }
  });
};