const axios = require("axios");

module.exports = (bot) => {
  bot.command("telestick", async (ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text || !/^https:\/\/t\.me\/addstickers\//.test(text)) {
      return ctx.reply("❌ Kasih link valid dari https://t.me/addstickers/NamaSet");
    }

    await ctx.reply("⏳ Sedang mengambil sticker set, tunggu bentar bre...");

    try {
      const match = text.match(/https:\/\/t\.me\/addstickers\/([^\/\?#]+)/);
      if (!match) throw new Error("Invalid URL");

      const setName = match[1];
      const token = "7915411443:AAFF9rjmaD4utEytcNkwLhlJNPsuvSmoN34";

      const resSet = await axios.get(`https://api.telegram.org/bot${token}/getStickerSet?name=${setName}`);
      const stickers = resSet.data.result.stickers;

      const files = await Promise.all(
        stickers.map(async (sticker) => {
          const resFile = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${sticker.file_id}`);
          return {
            emoji: sticker.emoji || "",
            is_animated: sticker.is_animated,
            url: `https://api.telegram.org/file/bot${token}/${resFile.data.result.file_path}`
          };
        })
      );

      let teks = `📦 *Sticker Set*: ${resSet.data.result.title}\n👥 Jumlah: ${files.length}\n\n`;
      files.forEach((s, i) => {
        teks += `#${i + 1} ${s.emoji || ""} ${s.is_animated ? "🎞️ Animated" : ""}\n${s.url}\n\n`;
      });

      return ctx.reply(teks.length > 4000 ? teks.slice(0, 4000) + "\n❗️Kepanjangan bre..." : teks, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    } catch (e) {
      console.error(e);
      ctx.reply("❌ Gagal mengambil sticker set. Pastikan URL-nya valid dan botnya aktif.");
    }
  });
};