const axios = require("axios");

module.exports = (bot) => {
  bot.command("capcutdl", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    const url = args.trim();

    if (!url || !url.includes("capcut.com")) {
      return ctx.reply("🚫 Contoh penggunaan:\n`/capcutdl https://www.capcut.com/tv2/ZSBr4BaK6/`", {
        parse_mode: "Markdown"
      });
    }

    try {
      const res = await axios.get(`https://api.fasturl.link/downup/capcutdown`, {
        params: { url },
        headers: {
          accept: "application/json"
        }
      });

      const data = res.data.result;
      const caption = `🎬 *CapCut Downloader*
      
📌 *Judul:* ${data.title}
👤 *Author:* ${data.authorName}
🔗 *Source:* [Klik untuk lihat](${url})

_Sedang mengirim video..._`;

      await ctx.replyWithPhoto({ url: data.coverUrl }, {
        caption,
        parse_mode: "Markdown"
      });

      await ctx.replyWithVideo({ url: data.originalVideoUrl }, {
        caption: "✅ Video berhasil didapatkan!"
      });

    } catch (err) {
      console.error(err);
      ctx.reply("❌ Gagal mengambil data. Pastikan link valid dan coba lagi.");
    }
  });
};