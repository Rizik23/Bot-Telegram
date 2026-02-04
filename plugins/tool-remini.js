const axios = require("axios");

module.exports = (bot) => {
  bot.command("remini", async (ctx) => {
    let fileUrl;

    // Cek apakah command reply ke foto
    if (ctx.message.reply_to_message?.photo) {
      const fileId = ctx.message.reply_to_message.photo.slice(-1)[0].file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      fileUrl = fileLink.href;
    } else {
      const text = ctx.message.text.split(" ").slice(1).join(" ");
      if (!text || !text.startsWith("http")) {
        return ctx.reply("❌ Kirim perintah dengan membalas foto atau menyertakan URL gambar.\nContoh: `/remini https://example.com/image.jpg`", { parse_mode: "Markdown" });
      }
      fileUrl = text;
    }

    await ctx.reply("⏳ Sedang meningkatkan kualitas gambar...");

    try {
      const response = await axios.get(
        `https://fastapi.acodes.my.id/api/generator/remini?url=${encodeURIComponent(fileUrl)}`,
        { responseType: "arraybuffer" }
      );

      await ctx.replyWithPhoto({ source: Buffer.from(response.data) }, { caption: "✅ Gambar berhasil ditingkatkan kualitasnya!" });
    } catch (err) {
      console.error("Remini error:", err.message || err);
      ctx.reply("❌ Gagal memproses gambar. Pastikan URL valid atau reply ke foto.");
    }
  });
};
