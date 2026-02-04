const axios = require("axios");
const { fileTypeFromBuffer } = require("file-type");

module.exports = (bot) => {
  bot.command("tosticker", async (ctx) => {
    const reply = ctx.message?.reply_to_message;
    const photo = reply?.photo?.pop(); // resolusi paling besar

    if (!photo) return ctx.reply("❌ Reply ke fotonya dulu bre!");

    try {
      const file = await ctx.telegram.getFileLink(photo.file_id);
      const res = await axios.get(file.href, { responseType: "arraybuffer" });
      const buffer = Buffer.from(res.data);
      const type = await fileTypeFromBuffer(buffer);

      if (!type || !type.mime.startsWith("image/")) return ctx.reply("❌ File bukan gambar bre!");

      await ctx.replyWithSticker({ source: buffer });
    } catch (err) {
      console.error("tostick error:", err);
      ctx.reply("⚠️ Gagal ubah ke stiker.");
    }
  });
};