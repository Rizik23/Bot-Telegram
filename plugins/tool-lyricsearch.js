const axios = require("axios");

module.exports = (bot) => {
  bot.command("lyricsearch", async (ctx) => {
    try {
      const input = ctx.message.text.split(" ").slice(1).join(" ");
      if (!input) {
        return ctx.reply("❌ Gunakan format:\n`/lyricsearch <judul lagu atau penggalan lirik>`\n\nContoh: `/lyricsearch until i found you`", { parse_mode: "Markdown" });
      }

      const query = encodeURIComponent(input);
      const url = `https://fastapi.acodes.my.id/api/search/lyricssearch?query=${query}`;
      const { data } = await axios.get(url);

      if (data?.status && data?.data?.lyrics && data.data.lyrics.trim()) {
        const lyrics = data.data.lyrics.trim().slice(0, 4096);
        return ctx.reply(`🎶 *Lirik Ditemukan:*\n\n${lyrics}`, { parse_mode: "Markdown" });
      } else {
        return ctx.reply("❌ Lirik tidak ditemukan.\n\n🔎 Coba cek ejaan judul atau gunakan nama artis yang lebih jelas.");
      }
    } catch (err) {
      console.error("[lyricsearch]", err.message);
      return ctx.reply("⚠️ Terjadi kesalahan saat menghubungi layanan pencarian lirik.");
    }
  });
};
