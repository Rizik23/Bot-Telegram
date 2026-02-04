const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const config = require('../config');

module.exports = (bot) => {
  bot.command('claimeternal', async (ctx) => {
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

    if (saldoUser >= 950000) {
      // Kurangi saldo
      userData.money -= 950000;
      saldoData[userId] = userData;

      // Simpan kembali saldo
      try {
        fs.writeFileSync(saldoPath, JSON.stringify(saldoData, null, 2));
      } catch (err) {
        console.error('❌ Gagal menyimpan saldo.json:', err);
        return ctx.reply('⚠️ Terjadi kesalahan saat menyimpan data saldo.');
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
        claim: 'Eternal Script',
        tanggal
      };

      const msg = `📢 *CLAIM NOTIFIKASI*\n\n` +
                  `👤 Username: ${username}\n` +
                  `🆔 User ID: ${userId}\n` +
                  `📥 Claim: Eternal Script\n` +
                  `📅 Tanggal: ${tanggal}`;

      await bot.telegram.sendMessage(config.OWNER_ID, msg, { parse_mode: 'Markdown' });

      let notifLog = [];
      try {
        if (fs.existsSync(notifPath)) {
          notifLog = JSON.parse(fs.readFileSync(notifPath));
        }
      } catch (e) {
        notifLog = [];
      }

      notifLog.push(notif);

      try {
        fs.writeFileSync(notifPath, JSON.stringify(notifLog, null, 2));
      } catch (e) {
        console.error('❌ Gagal menyimpan notifclaim.json:', e);
      }

      return ctx.reply(
        `🎉 Kamu berhasil claim Eternal Script!\n\n💰 Sisa saldo kamu: Rp ${userData.money.toLocaleString()}`,
        Markup.inlineKeyboard([
          [Markup.button.url('📦 Download', 'https://www.mediafire.com/file/zip/file')],
          [Markup.button.url('ℹ️ Info Update', 'https://t.me/+')],
        ])
      );
    } else {
      return ctx.reply(
        `❌ Saldo kamu tidak cukup untuk claim Eternal.\n💰 Saldo kamu: Rp ${saldoUser.toLocaleString()}\n\n` +
        `🎮 Silahkan bermain game atau tebak-tebakan untuk mendapatkan saldo!`
      );
    }
  });
};