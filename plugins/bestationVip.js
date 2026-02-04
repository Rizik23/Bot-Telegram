const axios = require("axios");
const { Markup } = require("telegraf");

module.exports = (bot) => {
  // /bstationsearch <query>
  bot.command("bstationsearch", async (ctx) => {
    try {
      const query = ctx.message.text.split(" ").slice(1).join(" ").trim();

      if (!query) {
        return ctx.reply(
          "❌ Masukin keyword pencarian bre.\n\nContoh:\n/bstationsearch anime"
        );
      }

      await ctx.reply("🔎 Lagi cari video di Bstation...");

      const apiUrl = `https://api.fikmydomainsz.xyz/search/bstation?q=${encodeURIComponent(
        query
      )}`;

      const { data } = await axios.get(apiUrl, { timeout: 30000 });

      // Validasi response
      if (!data || data.status !== true || !data.result) {
        return ctx.reply("❌ Gagal ambil hasil pencarian dari API.");
      }

      const results = Array.isArray(data.result) ? data.result : [];

      if (results.length === 0) {
        return ctx.reply("⚠️ Tidak ada hasil ditemukan bre.");
      }

      // Limit tampil 5 biar ga spam
      const maxShow = 50;
      const show = results.slice(0, maxShow);

      let caption = `<b>📌 Hasil Search Bstation</b>\n`;
      caption += `🔎 Query: <code>${query}</code>\n\n`;

      show.forEach((vid, i) => {
        caption += `<b>${i + 1}. ${vid.title || "Tanpa Judul"}</b>\n`;
        if (vid.duration) caption += `⏳ Durasi: ${vid.duration}\n`;
        if (vid.url) caption += `🔗 Link: ${vid.url}\n`;
        caption += `\n`;
      });

      if (results.length > maxShow) {
        caption += `⚡ Menampilkan ${maxShow} dari ${results.length} hasil.\n`;
      }

      // Button langsung download pakai /bstation
      const buttons = show.map((vid) => [
        Markup.button.url(
          `▶️ ${vid.title?.slice(0, 15) || "Video"}`,
          vid.url
        ),
      ]);

      buttons.push([
        Markup.button.url(
          "🌍 Open API Source",
          "https://api.fikmydomainsz.xyz/search/bstation?q=anime"
        ),
      ]);

      return ctx.reply(caption, {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard(buttons),
      });
    } catch (err) {
      console.error("BstationSearch Error:", err);
      ctx.reply("❌ Terjadi error pas cari video Bstation bre.");
    }
  });
};