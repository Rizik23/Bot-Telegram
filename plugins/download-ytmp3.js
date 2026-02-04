const axios = require('axios');

module.exports = (bot) => {
  bot.command('ytmp3', async (ctx) => {
    const url = ctx.message.text.split(' ')[1];
    if (!url) return ctx.reply('Contoh: /ytmp3 https://youtube.com/watch?v=xxxx');

    try {
      const res = await axios.get(`https://api.kenshiro.cfd/api/downloader/yta`, {
        params: { url }
      });

      const data = res.data.data;
      await ctx.replyWithAudio({ url: data.downloadLink }, {
        title: data.title,
        performer: data.channel,
        caption: `🎵 ${data.title} — ${data.channel}`
      });
    } catch (err) {
      console.error(err.message);
      ctx.reply('❌ Gagal download MP3-nya bro.');
    }
  });
};