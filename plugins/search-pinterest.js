const axios = require('axios');

module.exports = (bot) => {
  bot.command('pinterest', async (ctx) => {
    try {
      // ambil kata kunci dari pesan setelah command /pinterest
      const query = ctx.message.text.split(' ').slice(1).join(' ').trim();
      if (!query) {
        return ctx.reply('Harap masukkan kata kunci pencarian. Contoh: /pinterest kucing');
      }

      await ctx.reply(`Mencari gambar Pinterest untuk: "${query}"...`);

      // request ke API pinterest
      const response = await axios.post(
        'https://api.siputzx.my.id/api/s/pinterest',
        { query },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.data.status || !response.data.data.length) {
        return ctx.reply('Maaf, tidak ditemukan gambar untuk kata kunci tersebut.');
      }

      // ambil maksimal 5 gambar
      const results = response.data.data.slice(0, 5);

      for (const item of results) {
        const captionParts = [];
        if (item.grid_title) captionParts.push(`Title: ${item.grid_title}`);
        if (item.created_at) captionParts.push(`Created at: ${item.created_at}`);
        if (item.link) captionParts.push(`Link: ${item.link}`);

        const caption = captionParts.join('\n');

        // kirim foto dengan caption
        await ctx.replyWithPhoto({ url: item.images_url }, { caption });
      }
    } catch (error) {
      console.error(error);
      ctx.reply('Terjadi kesalahan saat mencari gambar Pinterest.');
    }
  });
};
