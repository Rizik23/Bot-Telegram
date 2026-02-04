const axios = require('axios');

module.exports = (bot) => {
  bot.command('bingimg', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) {
      return ctx.reply('Contoh penggunaan: /bingimg kucing');
    }

    try {
      const res = await axios.post('https://api.siputzx.my.id/api/s/bimg', {
        query: query
      });

      if (!res.data.status || !res.data.data || res.data.data.length === 0) {
        return ctx.reply('Tidak ditemukan gambar untuk query tersebut.');
      }

      const images = res.data.data.slice(0, 10); // batasi maksimal 10 gambar
      for (const url of images) {
        await ctx.replyWithPhoto({ url });
      }
    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat mencari gambar.');
    }
  });
};
