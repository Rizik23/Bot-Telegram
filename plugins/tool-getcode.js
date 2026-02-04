const axios = require("axios");

module.exports = (bot) => {
  bot.command("getcode", async (ctx) => {
    const reply = ctx.message.reply_to_message;

    if (!reply || !reply.text || !reply.text.startsWith("http")) {
      return ctx.reply("❌ Balas pesan yang berisi link website.");
    }

    const url = reply.text.trim();

    try {
      ctx.reply("⏳ Mengambil source code dari website...");

      const response = await axios.get(url);
      const htmlContent = response.data;

      await ctx.replyWithDocument({
        source: Buffer.from(htmlContent, "utf-8"),
        filename: "source-code.html"
      }, {
        caption: `📦 Ini source code dari ${url}`,
      });

    } catch (err) {
      console.error("Gagal ambil kode:", err.message);
      ctx.reply("⚠️ Gagal mengambil source code dari website tersebut.");
    }
  });
};
