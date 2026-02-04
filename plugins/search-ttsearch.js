const { default: axios } = require('axios');
const escapeHTML = (text) =>
  text.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

module.exports = (bot) => {
  const dataCache = new Map();

  bot.command("ttsearch", async (ctx) => {
    const query = ctx.message.text.split(" ").slice(1).join(" ");
    if (!query) return ctx.reply("❗ Masukkan keyword untuk mencari video.");

    try {
      const res = await axios.get(`https://api.siputzx.my.id/api/s/tiktok?query=${encodeURIComponent(query)}`);
      const data = res.data?.data;
      if (!data || !data.length) return ctx.reply("❌ Tidak ditemukan hasil untuk kata kunci itu.");

      dataCache.set(ctx.from.id, { data, index: 0 });
      return sendTikTokResult(ctx, ctx.from.id);

    } catch (err) {
      console.error("TTSearch Error:", err.message);
      return ctx.reply("❌ Terjadi kesalahan saat mencari video.");
    }
  });

  bot.action(/ttnext:(\d+)/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery("Ini bukan buat kamu!");
    const cache = dataCache.get(userId);
    if (!cache) return ctx.reply("❗ Tidak ada data ditemukan.");

    cache.index++;
    if (cache.index >= cache.data.length) {
      dataCache.delete(userId);
      return ctx.reply("✅ Tidak ada video lagi.");
    }
    await ctx.deleteMessage().catch(() => {});
    return sendTikTokResult(ctx, userId);
  });

  async function sendTikTokResult(ctx, userId) {
    const cache = dataCache.get(userId);
    const item = cache.data[cache.index];
    const caption = `<b>${escapeHTML(item.title)}</b>\n` +
                    `Durasi: <i>${item.duration}s</i>\n` +
                    `Creator: <i>${escapeHTML(item.author.nickname)}</i>\n` +
                    `Views: <code>${item.play_count}</code>\n` +
                    `<a href='${item.play}'>Link Video</a>`;

    try {
      await ctx.replyWithVideo({ url: item.play }, {
        caption,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "Next ▶️", callback_data: `ttnext:${userId}` }]]
        }
      });
    } catch (err) {
      console.error("Send TikTok Result Error:", err.message);
      ctx.reply("❌ Gagal mengirim video.");
    }
  }
};