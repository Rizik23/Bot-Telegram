const axios = require('axios');

module.exports = (bot) => {
  bot.command('ytmp4', async (ctx) => {
    const url = ctx.message.text.split(' ')[1];
    if (!url) return ctx.reply('Contoh: /ytmp4 https://youtube.com/watch?v=xxxx');

    try {
      const res = await axios.get(`https://api.kenshiro.cfd/api/downloader/ytv`, {
        params: { url }
      });

      const data = res.data.data;
      await ctx.replyWithVideo({ url: data.downloadLink }, {
        caption: `🎬 ${data.title} — ${data.channel}`
      });
    } catch (err) {
      console.error(err.message);
      ctx.reply('❌ Gagal download MP4-nya bro.');
    }
  });
};