const axios = require('axios');
const FormData = require('form-data');

module.exports = (bot) => {
  bot.command('xnxx', async (ctx) => {
    const title = ctx.message.text.split(' ').slice(1).join(' ');
    if (!title) return ctx.reply('✏️ Masukkan judul:\nContoh: /xnxx Lari ada wibu');

    const reply = ctx.message.reply_to_message;
    if (!reply || !reply.photo) {
      return ctx.reply('📸 Balas perintah ini dengan sebuah foto!\nContoh:\n1. Kirim foto\n2. Reply dengan: /xnxx Judulnya');
    }

    try {
      const photo = reply.photo[reply.photo.length - 1]; // resolusi terbesar
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);

      const imageBuffer = (await axios.get(fileLink.href, { responseType: 'arraybuffer' })).data;

      const form = new FormData();
      form.append('title', title);
      form.append('image', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      });

      const apiRes = await axios.post('https://api.siputzx.my.id/api/canvas/xnxx', form, {
        headers: form.getHeaders(),
        responseType: 'arraybuffer',
      });

      await ctx.replyWithPhoto({ source: Buffer.from(apiRes.data) });
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal membuat gambar XNXX. Coba lagi nanti.');
    }
  });
};
