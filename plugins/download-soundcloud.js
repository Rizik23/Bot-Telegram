const axios = require("axios");
const { Markup } = require("telegraf");

module.exports = (bot) => {
  bot.command("soundcloud", async (ctx) => {
    const query = ctx.message.text.split(" ").slice(1).join(" ");
    if (!query) {
      return ctx.reply("🔍 Masukkan kata kunci pencarian. Contoh:\n`/soundcloud duka`", { parse_mode: "Markdown" });
    }

    try {
      const response = await axios.post("https://api.siputzx.my.id/api/s/soundcloud", {
        query: query
      });

      if (!response.data.status || !response.data.data.length) {
        return ctx.reply("❌ Tidak ditemukan hasil SoundCloud.");
      }

      const results = response.data.data.slice(0, 5); // Batasi 5 hasil
      for (const item of results) {
        const caption = `🎵 *${item.permalink || "Tanpa judul"}*\n` +
          (item.genre ? `🎼 Genre: ${item.genre}\n` : "") +
          `🕒 ${Math.floor((item.duration || 0) / 60000)}:${String(Math.floor((item.duration || 0) % 60000 / 1000)).padStart(2, '0')} menit\n` +
          `▶️ ${item.playback_count?.toLocaleString() || "0"} play\n` +
          `💬 ${item.comment_count?.toLocaleString() || "0"} komentar\n` +
          `🔗 [Link SoundCloud](${item.permalink_url})`;

        if (item.artwork_url) {
          await ctx.replyWithPhoto({ url: item.artwork_url }, {
            caption,
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              Markup.button.url("🔗 Buka SoundCloud", item.permalink_url)
            ])
          });
        } else {
          await ctx.replyWithMarkdown(caption, {
            ...Markup.inlineKeyboard([
              Markup.button.url("🔗 Buka SoundCloud", item.permalink_url)
            ])
          });
        }
      }

    } catch (err) {
      console.error(err);
      ctx.reply("🚫 Terjadi kesalahan saat mengambil data dari SoundCloud.");
    }
  });
};
