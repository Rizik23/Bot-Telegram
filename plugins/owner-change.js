const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = (bot) => {
  bot.command('change', async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma bisa dipakai sama owner bot aja bre.");
    }

    const args = ctx.message.text.split(' ');
    const filePathArg = args[1];

    if (!filePathArg) {
      return ctx.reply('❌ Path file belum dikasih!\nContoh: /change ./plugins/ytdl.js <kodeBaru>', { parse_mode: 'Markdown' });
    }

    const code = ctx.message.text.split(' ').slice(2).join(' ');
    if (!code) {
      return ctx.reply('❌ Kode baru belum dikasih!');
    }

    const fullPath = path.resolve(filePathArg);
    if (!fs.existsSync(fullPath)) {
      return ctx.reply(`❌ File *${filePathArg}* tidak ditemukan!`, { parse_mode: 'Markdown' });
    }

    try {
      await fs.promises.writeFile(fullPath, code);
      await ctx.reply(`✅ Plugin *${path.basename(fullPath)}* berhasil diubah!\nBot akan restart otomatis...`, { parse_mode: 'Markdown' });

      setTimeout(() => process.exit(1), 1000);
    } catch (err) {
      console.error('Gagal overwrite plugin:', err);
      ctx.reply('❌ Gagal menulis file. Cek log terminal.');
    }
  });
};