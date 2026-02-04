const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const config = require('../config');

module.exports = (bot) => {
  bot.command('claimdb', async (ctx) => {
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

    // Cek apakah user sudah pernah claim Script Database
    let notifLog = [];
    try {
      if (fs.existsSync(notifPath)) {
        notifLog = JSON.parse(fs.readFileSync(notifPath));
      }
    } catch (e) {
      notifLog = [];
    }

    const sudahClaim = notifLog.some(n => n.userId === userId && n.claim === 'Script Database');
    if (sudahClaim) {
      return ctx.reply('⚠️ Kamu sudah pernah claim Script Database sebelumnya.');
    }

    if (saldoUser >= 250000) {
      // Kurangi saldo dan simpan kembali
      userData.money -= 250000;
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
        claim: 'Script Database',
        tanggal
      };

      const msg = `📢 *CLAIM NOTIFIKASI*\n\n` +
                  `👤 Username: ${username}\n` +
                  `🆔 User ID: ${userId}\n` +
                  `📥 Claim: Script Database\n` +
                  `📅 Tanggal: ${tanggal}`;

      await bot.telegram.sendMessage(config.OWNER_ID, msg, { parse_mode: 'Markdown' });

      notifLog.push(notif);
      try {
        fs.writeFileSync(notifPath, JSON.stringify(notifLog, null, 2));
      } catch (e) {
        console.error('❌ Gagal menyimpan notifclaim.json:', e);
      }

      return ctx.reply(
        `🎉 Kamu berhasil claim Script Database!\n\n💰 Sisa saldo kamu: Rp ${userData.money.toLocaleString()}`,
        Markup.inlineKeyboard([
          [Markup.button.url('📦 Download', 'https://www.mediafire.com/file/yfcvokxxmyotblx/Eternal+Galaxy+(Database).zip/file')],
        ])
      );
    } else {
      return ctx.reply(
        `❌ Saldo kamu tidak cukup untuk claim Script Database.\n💰 Saldo kamu: Rp ${saldoUser.toLocaleString()}\n\n` +
        `🎮 Silahkan bermain game atau tebak-tebakan untuk mendapatkan saldo!`
      );
    }
  });
};