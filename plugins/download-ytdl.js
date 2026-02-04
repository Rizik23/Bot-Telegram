const axios = require('axios');

module.exports = (bot) => {
  bot.command('ytdl', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const url = args[0];
    const format = (args[1] || 'mp4').toLowerCase();

    if (!url || !url.includes('youtu')) {
      return ctx.reply('❌ Format salah!\nContoh: \n `/ytdl https://youtu.be/xxxx mp3` \n `/ytdl https://youtu.be/xxxx mp4`', { parse_mode: 'Markdown' });
    }

    if (!['mp3', 'mp4'].includes(format)) {
      return ctx.reply('❌ Format harus mp3 atau mp4.');
    }

    await ctx.reply(`⏳ Sedang memproses *${format.toUpperCase()}*...`, { parse_mode: 'Markdown' });

    try {
      const apiUrl = format === 'mp3'
        ? `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(url)}`
        : `https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(url)}`;

      const res = await axios.get(apiUrl);
      const data = res.data.result;

      if (!data || !data.download || !data.download.url) {
        throw new Error('Link download tidak ditemukan');
      }

      const mediaUrl = data.download.url;
      const title = data.metadata?.title || 'Video';

      if (format === 'mp3') {
        await ctx.replyWithAudio({ url: mediaUrl }, {
          title,
          performer: data.metadata?.author?.name || 'Unknown',
        });
      } else {
        await ctx.replyWithVideo({ url: mediaUrl }, {
          caption: `🎬 ${title}`,
        });
      }

    } catch (err) {
      console.error('YTDL Error:', err);
      ctx.reply('❌ Gagal mengambil data. Coba pastikan link valid.');
    }
  });
};