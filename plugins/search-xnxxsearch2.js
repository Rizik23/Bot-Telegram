const axios = require('axios');
const { Markup } = require('telegraf');

let searchCache = {};

module.exports = (bot) => {
  bot.command('xnxxsearch2', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) return ctx.reply('❌ Masukkan keyword pencarian, contoh: /xnxxsearch2 msbrew');

    await ctx.reply(`🔍 Sedang mencari "*${query}*" di XNXX...`, { parse_mode: 'Markdown' });

    try {
      const res = await axios.get("https://api-simplebot.vercel.app/search/xnxx", {
        params: { apikey: "free", q: query },
      });

      const results = res.data.result;
      if (!Array.isArray(results) || results.length === 0) {
        return ctx.reply('❌ Tidak ada hasil ditemukan.');
      }

      const userId = ctx.from.id;
      searchCache[userId] = { results, index: 0 };

      await sendVideo(ctx, userId);
    } catch (err) {
      console.error('Search error:', err.message);
      ctx.reply('❌ Terjadi kesalahan saat mencari video.');
    }
  });

  bot.action(['xnxx_next', 'xnxx_prev'], async (ctx) => {
    const userId = ctx.from.id;
    const data = searchCache[userId];
    if (!data) return ctx.answerCbQuery('❌ Tidak ada data disimpan.');

    if (ctx.match[0] === 'xnxx_next' && data.index < data.results.length - 1) {
      data.index++;
    } else if (ctx.match[0] === 'xnxx_prev' && data.index > 0) {
      data.index--;
    }

    try {
      await ctx.deleteMessage();
    } catch (e) {
      console.warn('❗ Gagal hapus pesan lama:', e.message);
    }

    await sendVideo(ctx, userId);
  });
};

async function sendVideo(ctx, userId) {
  const { results, index } = searchCache[userId];
  const result = results[index];
  if (!result) return ctx.reply('❌ Data video tidak valid.');

  try {
    const res = await axios.get("https://api-simplebot.vercel.app/download/xnxx", {
      params: { apikey: "free", url: result.link },
    });

    const video = res.data.result;
    if (!video || !video.files || !video.files.high) throw new Error('Gagal ambil video.');

    // Tombol navigation
    const navButtons = [];
    if (index > 0) navButtons.push(Markup.button.callback('⬅️ Prev', 'xnxx_prev'));
    if (index < results.length - 1) navButtons.push(Markup.button.callback('Next ➡️', 'xnxx_next'));

    await ctx.replyWithVideo(
      { url: video.files.high },
      {
        caption: `🎬 *${video.title}*\n🕐 ${video.duration}s\n🌐 ${video.info}`,
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([navButtons], { columns: 2 }),
      }
    );
  } catch (err) {
    console.error('Download error:', err.message);
    ctx.reply('❌ Gagal ambil video.');
  }
}
