const fs = require('fs');
const path = require('path');
const config = require('../config');
const pendapatanFile = path.join(__dirname, '../src/pendapatan.json');

module.exports = (bot) => {
  bot.command('resetpendapatan', async (ctx) => {
      if (!config.OWNER_ID.includes(ctx.from.id)) {
        return ctx.reply('❌ *Perintah ini hanya untuk owner!*', { parse_mode: 'Markdown' });
      }

    // Konfirmasi reset via tombol
    await ctx.reply(
      '⚠️ *Yakin ingin menghapus semua data pendapatan?* Tindakan ini tidak bisa dibatalkan.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Ya, Hapus Semua', callback_data: 'confirm_reset_pendapatan' },
              { text: '❌ Batal', callback_data: 'cancel_reset_pendapatan' }
            ]
          ]
        }
      }
    );
  });

  // Handle tombol konfirmasi
  bot.action('confirm_reset_pendapatan', (ctx) => {
    if (ctx.from.id !== config.OWNER_ID) return ctx.answerCbQuery('Bukan untuk kamu.');

    fs.writeFileSync(pendapatanFile, JSON.stringify([], null, 2));
    ctx.editMessageText('🗑️ *Semua data pendapatan berhasil dihapus!*', { parse_mode: 'Markdown' });
  });

  // Handle tombol batal
  bot.action('cancel_reset_pendapatan', (ctx) => {
    if (ctx.from.id !== config.OWNER_ID) return ctx.answerCbQuery('Bukan untuk kamu.');

    ctx.editMessageText('❌ *Reset dibatalkan.*', { parse_mode: 'Markdown' });
  });
};