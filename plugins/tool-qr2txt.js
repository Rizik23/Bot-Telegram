const axios = require('axios');

module.exports = (bot) => {
  bot.command('qr2text', async (ctx) => {
    try {
      // Pastikan ada reply gambar
      const reply = ctx.message.reply_to_message;
      if (!reply || !reply.photo) {
        return ctx.reply('❌ Harap reply ke sebuah gambar QR code untuk membaca teksnya.');
      }

      // Ambil file foto terbesar (resolusi tertinggi)
      const photo = reply.photo[reply.photo.length - 1];
      const fileId = photo.file_id;

      // Dapatkan link file dari Telegram
      const fileLink = await ctx.telegram.getFileLink(fileId);

      // Kirim POST ke API qr2text
      const response = await axios.post(
        'https://api.siputzx.my.id/api/tools/qr2text',
        { url: fileLink.href },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data && response.data.status && response.data.data.text) {
        return ctx.reply(`📄 Hasil QR code:\n${response.data.data.text}`);
      } else {
        return ctx.reply('❌ Gagal membaca QR code atau tidak ada teks ditemukan.');
      }
    } catch (error) {
      console.error(error);
      ctx.reply('❌ Terjadi kesalahan saat memproses QR code.');
    }
  });
};
