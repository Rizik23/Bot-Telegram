const axios = require("axios");

module.exports = (bot) => {
  bot.command("twitterimage", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    if (!args) {
      return ctx.reply("🚫 Masukkan link Twitter!\n\nContoh:\n/twitterimage https://twitter.com/...");
    }

    try {
      const res = await axios.post("https://api.siputzx.my.id/api/d/twitter", {
        url: args.trim()
      });

      const { status, data } = res.data;
      if (!status || !data?.downloadLink) {
        return ctx.reply("❌ Gagal mengambil video dari Twitter. Pastikan link valid.");
      }

      const isVideo = data.downloadLink.endsWith(".mp4") || data.downloadLink.includes("video");

      const caption = `🐦 *Twitter Media*\n🎞 Judul: ${data.videoTitle}\n📝 Deskripsi: ${data.videoDescription}`;
      if (isVideo) {
        await ctx.replyWithVideo({ url: data.downloadLink }, {
          caption,
          parse_mode: "Markdown"
        });
      } else {
        await ctx.replyWithPhoto({ url: data.downloadLink }, {
          caption,
          parse_mode: "Markdown"
        });
      }
    } catch (err) {
      console.error("Twitter Error:", err?.response?.data || err.message);
      return ctx.reply("❌ Terjadi kesalahan saat mengambil media dari Twitter.");
    }
  });
};
