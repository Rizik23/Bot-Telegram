const fs = require('fs');
const path = require('path');
const config = require('../config');
const hutangFile = path.join(__dirname, '../src/hutang.json');

module.exports = (bot) => {
  bot.command(['resethutang', 'resetdp'], async (ctx) => {
      if (!config.OWNER_ID.includes(ctx.from.id)) {
        return ctx.reply('❌ *Perintah ini hanya untuk owner!*', { parse_mode: 'Markdown' });
      }

    ctx.reply(
      '⚠️ *Yakin ingin menghapus semua data hutang/dp?*',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Ya, hapus semua', callback_data: 'confirm_reset_hutang' },
              { text: '❌ Batal', callback_data: 'cancel_reset_hutang' }
            ]
          ]
        }
      }
    );
  });

  bot.action('confirm_reset_hutang', (ctx) => {
    if (ctx.from.id !== config.OWNER_ID) return ctx.answerCbQuery('Tidak diizinkan.');

    fs.writeFileSync(hutangFile, JSON.stringify([], null, 2));
    ctx.editMessageText('✅ *Semua data hutang/dp berhasil direset.*', { parse_mode: 'Markdown' });
  });

  bot.action('cancel_reset_hutang', (ctx) => {
    if (ctx.from.id !== config.OWNER_ID) return ctx.answerCbQuery('Tidak diizinkan.');

    ctx.editMessageText('❌ *Reset hutang dibatalkan.*', { parse_mode: 'Markdown' });
  });
};