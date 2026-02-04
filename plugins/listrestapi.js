const axios = require("axios");
const { Markup } = require("telegraf");

module.exports = (bot) => {
  bot.command("listapi", async (ctx) => {
    try {
      await ctx.reply("📡 Ambil daftar endpoint API...");

      const url = "https://api.fikmydomainsz.xyz/tools/statusapi";
      const { data } = await axios.get(url, { timeout: 20000 });

      if (!data || data.status !== true || !data.result) {
        return ctx.reply("❌ Gagal ambil data status API.");
      }

      const result = data.result;
      const domain = result.domain || "api.fikmydomainsz.xyz";
      const endpoints = Array.isArray(result.endpoint_list)
        ? result.endpoint_list
        : [];

      if (endpoints.length === 0) {
        return ctx.reply("⚠️ Endpoint kosong bre.");
      }

      // Limit tampilan biar ga kepanjangan
      const maxShow = 200;
      const showList = endpoints.slice(0, maxShow);

      let caption =
        `<b>📑 LIST ENDPOINT API</b>\n` +
        `🌐 Domain: <code>${domain}</code>\n` +
        `📌 Total Endpoint: <b>${endpoints.length}</b>\n\n` +
        `<b>⚡ Contoh Endpoint:</b>\n`;

      showList.forEach((ep, i) => {
        caption += `• <code>${ep}</code>\n`;
      });

      if (endpoints.length > maxShow) {
        caption += `\n...dan ${endpoints.length - maxShow} endpoint lainnya.\n`;
      }

      // Inline Buttons (Copy Link)
      const buttons = showList.map((ep) => [
        Markup.button.url(
          ep.replace("/", "🔗 "),
          `https://${domain}${ep}`
        ),
      ]);

      buttons.push([
        Markup.button.url(
          "🌍 Open Full Status API",
          "https://api.fikmydomainsz.xyz/tools/statusapi"
        ),
      ]);

      return ctx.reply(caption, {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard(buttons),
      });
    } catch (err) {
      console.error("ListAPI Error:", err);
      ctx.reply("❌ Error pas ambil list API bre.");
    }
  });
};