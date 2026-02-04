const axios = require("axios");

module.exports = (bot) => {
  bot.command("toimg", async (ctx) => {
    const reply = ctx.message?.reply_to_message;
    const sticker = reply?.sticker;

    if (!sticker) return ctx.reply("❌ Reply ke stikernya dulu bre!");

    try {
      const file = await ctx.telegram.getFileLink(sticker.file_id);
      const res = await axios.get(file.href, { responseType: "arraybuffer" });

      await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, {
        caption: "🖼️ Nih hasilnya bre!"
      });
    } catch (err) {
      console.error("toimg error:", err);
      ctx.reply("⚠️ Gagal convert stiker ke gambar.");
    }
  });
};