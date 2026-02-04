const axios = require('axios');
const { Markup } = require('telegraf');

module.exports = (bot) => {
  bot.command('googleimg', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) {
      return ctx.reply('Kirim perintah dengan kata kunci pencarian!\nContoh: /googleimg kucing lucu');
    }

    try {
      const res = await axios.post('https://api.siputzx.my.id/api/images', {
        query
      });

      const data = res.data?.data;
      if (!data || data.length === 0) {
        return ctx.reply('Gambar tidak ditemukan!');
      }

      // Kirim galeri media maksimal 10 gambar
      const media = data.slice(0, 10).map((img) => ({
        type: 'photo',
        media: img.url,
        caption: `Hasil: ${query}`
      }));

      if (media.length === 1) {
        return ctx.replyWithPhoto(media[0].media, {
          caption: media[0].caption
        });
      } else {
        return ctx.replyWithMediaGroup(media);
      }

    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat mengambil gambar.');
    }
  });
};
