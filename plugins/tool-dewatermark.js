const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = (bot) => {
  bot.command('dewatermark', async (ctx) => {
    try {
      // Cek apakah ada foto dikirim bersama command (reply atau kirim bersamaan)
      // Bisa cek foto dari message document, photo, atau reply to photo
      let photoFileId;

      if (ctx.message.reply_to_message && ctx.message.reply_to_message.photo) {
        // User reply foto
        const photos = ctx.message.reply_to_message.photo;
        photoFileId = photos[photos.length - 1].file_id; // foto resolusi terbesar
      } else if (ctx.message.photo) {
        // Foto langsung dikirim bersama command (jarang, tapi bisa)
        const photos = ctx.message.photo;
        photoFileId = photos[photos.length - 1].file_id;
      } else if (ctx.message.document && ctx.message.document.mime_type.startsWith('image/')) {
        // Kalau kirim file gambar
        photoFileId = ctx.message.document.file_id;
      } else {
        return ctx.reply('Balas sebuah gambar atau kirim gambar bersamaan dengan perintah /dewatermark');
      }

      // Download file gambar dari Telegram
      const fileLink = await ctx.telegram.getFileLink(photoFileId);

      // Download dan simpan sementara ke disk (folder tmp)
      const tmpDir = os.tmpdir();
      const tmpFilePath = path.join(tmpDir, `input_${ctx.from.id}_${Date.now()}.jpg`);

      const writer = fs.createWriteStream(tmpFilePath);
      const response = await axios({
        url: fileLink.href,
        method: 'GET',
        responseType: 'stream',
      });
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Prepare form-data untuk upload ke API dewatermark
      const form = new FormData();
      form.append('image', fs.createReadStream(tmpFilePath));

      // Kirim request POST multipart/form-data ke API
      const apiResponse = await axios.post('https://api.siputzx.my.id/api/tools/dewatermark', form, {
        headers: {
          ...form.getHeaders()
        },
        responseType: 'arraybuffer' // supaya dapat buffer gambar
      });

      // Kirim hasil gambar dewatermark ke user
      await ctx.replyWithPhoto({ source: Buffer.from(apiResponse.data) });

      // Hapus file sementara
      fs.unlink(tmpFilePath, () => {});

    } catch (error) {
      console.error(error);
      ctx.reply('Terjadi kesalahan saat memproses gambar. Pastikan Anda mengirim gambar yang valid.');
    }
  });
};
