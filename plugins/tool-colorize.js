const axios = require('axios');
const FormData = require('form-data');

module.exports = (bot) => {
  bot.command('colorize', async (ctx) => {
    try {
      const reply = ctx.message.reply_to_message;

      if (!reply || !reply.photo) {
        return ctx.reply('Balas gambar hitam-putih dengan perintah /colorize untuk mewarnainya.');
      }

      const fileId = reply.photo[reply.photo.length - 1].file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);

      const imageStream = await axios.get(fileLink.href, { responseType: 'stream' });

      const form = new FormData();
      form.append('image', imageStream.data, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
      });

      const colorized = await axios.post('https://api.siputzx.my.id/api/tools/colorize', form, {
        headers: form.getHeaders(),
        responseType: 'arraybuffer'
      });

      await ctx.replyWithPhoto({ source: Buffer.from(colorized.data), filename: 'colorized.webp' });

    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal mewarnai gambar. Pastikan kamu membalas gambar hitam-putih.');
    }
  });
};
