const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = (bot) => {
  bot.command('rename', async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply('❌ Fitur ini cuma buat owner bot aja bre.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length !== 2) {
      return ctx.reply('❌ Format salah!\nContoh: /rename lama.js baru.js');
    }

    const [oldName, newName] = args;
    const pluginsDir = path.resolve(__dirname, '../plugins');
    const oldPath = path.join(pluginsDir, oldName);
    const newPath = path.join(pluginsDir, newName);

    try {
      if (!fs.existsSync(oldPath)) {
        return ctx.reply(`❌ File *${oldName}* tidak ditemukan.`, { parse_mode: 'Markdown' });
      }

      if (fs.existsSync(newPath)) {
        return ctx.reply(`❌ File *${newName}* sudah ada.`, { parse_mode: 'Markdown' });
      }

      fs.renameSync(oldPath, newPath);

      await ctx.reply(`✅ File *${oldName}* berhasil diubah jadi *${newName}*\n♻️ Merestart bot...`, {
        parse_mode: 'Markdown'
      });

      setTimeout(() => {
        process.exit(1); // auto restart kalau pakai nodemon
      }, 1500);

    } catch (err) {
      console.error('Rename error:', err);
      ctx.reply('❌ Gagal rename plugin.');
    }
  });
};