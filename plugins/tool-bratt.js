const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

module.exports = (bot) => {
  bot.command("bratt", async (ctx) => {
    const text = ctx.message.text?.split(" ").slice(1).join(" ");
    if (!text) {
      return ctx.reply("⚠️ Contoh penggunaan:\n/brat Hello World!");
    }

    try {
      const imageUrl = `https://api-simplebot.vercel.app/imagecreator/brat?apikey=free&text=${encodeURIComponent(text)}`;
      const res = await fetch(imageUrl);
      const buffer = await res.buffer();

      // Dynamic import file-type
      const { fileTypeFromBuffer } = await import("file-type");
      const fileType = await fileTypeFromBuffer(buffer);
      const tmpPath = path.join(__dirname, `../temp/brat-${Date.now()}.${fileType.ext}`);

      fs.writeFileSync(tmpPath, buffer);

      await ctx.replyWithSticker({ source: tmpPath });

      fs.unlinkSync(tmpPath);
    } catch (err) {
      console.error("❌ Gagal kirim stiker brat:", err);
      ctx.reply("❌ Error pas buat stikernya bre.");
    }
  });
};

