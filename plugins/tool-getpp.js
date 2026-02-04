const { InputFile } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  bot.command(['getpp', 'getprofile'], async (ctx) => {
    try {
      const reply = ctx.message.reply_to_message;

      // Target user dari reply atau pengirim command
      const user = reply ? reply.from : ctx.message.from;

      // Ambil file foto profil
      const photos = await ctx.telegram.getUserProfilePhotos(user.id, 0, 1);

      if (photos.total_count === 0) {
        return ctx.reply('❌ User tidak memiliki foto profil.');
      }

      // Ambil file_id dari profil terbaru
      const fileId = photos.photos[0][0].file_id;

      // Ambil URL file dari file_id
      const file = await ctx.telegram.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`;

      // Unduh file sementara
      const tempPath = path.join(__dirname, 'temp_profile.jpg');
      const writer = fs.createWriteStream(tempPath);
      const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream'
      });

      response.data.pipe(writer);

      writer.on('finish', async () => {
        await ctx.replyWithPhoto(
          { source: tempPath },
          { caption: '✅ <b>Done ambil PP</b>', parse_mode: 'HTML' }
        );
        fs.unlinkSync(tempPath); // hapus file setelah dikirim
      });

      writer.on('error', () => {
        ctx.reply('❌ Gagal mengunduh foto profil.');
      });

    } catch (err) {
      console.error(err);
      ctx.reply(`❌ Terjadi kesalahan:\n<code>${err.message}</code>`, { parse_mode: 'HTML' });
    }
  });
};
