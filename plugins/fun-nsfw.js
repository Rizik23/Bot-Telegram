const axios = require("axios");
const { fileTypeFromBuffer } = require("file-type");

module.exports = (bot) => {
  bot.command("nsfw", async (ctx) => {
    try {
      const res = await axios.get("https://api-simplebot.vercel.app/random/nsfw?apikey=free", {
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(res.data);
      const fileType = await fileTypeFromBuffer(buffer);

      if (!fileType || !fileType.mime.startsWith("image/")) {
        return ctx.reply("❌ Gagal mendeteksi format gambar.");
      }

      await ctx.replyWithPhoto(
        { source: buffer },
        { caption: "🔞 Gambar NSFW random" }
      );
    } catch (err) {
      console.error("NSFW Error:", err.message);
      ctx.reply("⚠️ Gagal mengambil gambar NSFW.");
    }
  });
};