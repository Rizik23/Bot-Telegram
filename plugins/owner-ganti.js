const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config');

module.exports = (bot) => {
  bot.command('ganti', async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma bisa dipakai sama owner bot aja bre.");
    }

    const args = ctx.message.text.split(' ');
    const filePathArg = args[1];
    if (!filePathArg) {
      return ctx.reply('❌ Path file belum dikasih!\nContoh: `/ganti ./plugins/ytdl.js` (reply file)', { parse_mode: 'Markdown' });
    }

    const reply = ctx.message.reply_to_message;
    if (!reply || !reply.document || !reply.document.file_name.endsWith('.js')) {
      return ctx.reply('❌ Reply file JS yang mau dipakai buat ganti!');
    }

    try {
      const fileId = reply.document.file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get(fileLink.href);

      const fullPath = path.resolve(filePathArg);
      await fs.promises.writeFile(fullPath, response.data);

      await ctx.reply(`✅ Plugin *${path.basename(fullPath)}* berhasil diganti!\nBot akan restart otomatis...`, { parse_mode: 'Markdown' });

      setTimeout(() => process.exit(1), 1000);
    } catch (err) {
      console.error('Gagal ganti plugin:', err);
      ctx.reply('❌ Terjadi kesalahan saat menimpa file!');
    }
  });
};