const axios = require('axios');
const { Markup } = require('telegraf');

module.exports = (bot) => {
  // ✅ CMD /xnxxsearch <keyword>
  bot.command('xnxxsearch', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) return ctx.reply('❌ Masukkan keyword pencarian, contoh: /xnxxsearch jepang');

    await ctx.reply(`🔍 Sedang mencari "*${query}*" di XNXX...`, { parse_mode: 'Markdown' });

    try {
      const res = await axios.get("https://api-simplebot.vercel.app/search/xnxx", {
        params: { apikey: "free", q: query },
      });

      const results = res.data.result;
      if (!Array.isArray(results) || results.length === 0) {
        return ctx.reply('❌ Tidak ada hasil ditemukan.');
      }

      const list = results.slice(0, 5).map((v, i) => {
        return `*${i + 1}.* [${v.title}](${v.link})`;
      }).join("\n\n");

      await ctx.replyWithMarkdown(
        `🎬 *Hasil Pencarian:*\n\n${list}\n\n` +
        `🔽 Kirim /xnxxdownload <link> untuk download video.`
      );
    } catch (err) {
      console.error('Search error:', err.message);
      ctx.reply('❌ Terjadi kesalahan saat mencari.');
    }
  });

  // ✅ CMD /xnxxdownload <link>
  bot.command('xnxxdownload', async (ctx) => {
    const url = ctx.message.text.split(' ').slice(1).join(' ');
    if (!url || !url.includes('xnxx.com')) {
      return ctx.reply('❌ Masukkan link valid, contoh:\n/xnxxdownload https://www.xnxx.com/video-xxx');
    }

    await ctx.reply('⏬ Sedang mengambil video...');

    try {
      const res = await axios.get("https://api-simplebot.vercel.app/download/xnxx", {
        params: { apikey: "free", url },
      });

      const video = res.data.result;
      if (!video || !video.files?.high) throw new Error("Data video tidak valid");

      await ctx.replyWithVideo(
        { url: video.files.high },
        {
          caption: `🎬 *${video.title}*\n🕐 ${video.duration}s\n🌐 ${video.info}`,
          parse_mode: 'Markdown',
        }
      );
    } catch (err) {
      console.error('Download error:', err.message);
      ctx.reply('❌ Gagal ambil video. Pastikan link valid dan coba lagi.');
    }
  });
};
