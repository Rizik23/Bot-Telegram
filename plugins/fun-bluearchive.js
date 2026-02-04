const axios = require("axios");
const { fileTypeFromBuffer } = require("file-type");

module.exports = (bot) => {
  bot.command(["bluearchive", "ba"], async (ctx) => {
    try {
      const res = await axios.get("https://api-simplebot.vercel.app/random/ba?apikey=free", {
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(res.data);
      const fileType = await fileTypeFromBuffer(buffer);

      if (!fileType || !fileType.mime.startsWith("image/")) {
        return ctx.reply("❌ Gagal mendeteksi format gambar Blue Archive.");
      }

      await ctx.replyWithPhoto(
        { source: buffer },
        { caption: "📚 Karakter Blue Archive untukmu, bre!" }
      );
    } catch (err) {
      console.error("Blue Archive Error:", err.message);
      ctx.reply("⚠️ Gagal mengambil gambar Blue Archive.");
    }
  });
};