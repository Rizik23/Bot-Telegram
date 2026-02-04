const axios = require("axios");
const { fileTypeFromBuffer } = require("file-type");

module.exports = (bot) => {
  bot.command("waifu2", async (ctx) => {
    try {
      const res = await axios.get("https://api-simplebot.vercel.app/random/waifu?apikey=free", {
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(res.data);
      const fileType = await fileTypeFromBuffer(buffer);

      if (!fileType || !fileType.mime.startsWith("image/")) {
        return ctx.reply("❌ Gagal mendeteksi format gambar waifu.");
      }

      await ctx.replyWithPhoto(
        { source: buffer },
        { caption: "💖 Random Waifu untukmu~" }
      );
    } catch (err) {
      console.error("Waifu Error:", err.message);
      ctx.reply("⚠️ Gagal mengambil gambar waifu.");
    }
  });
};