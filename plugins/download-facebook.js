const axios = require("axios");

module.exports = (bot) => {
  bot.command("facebook", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    if (!args) {
      return ctx.reply("🚫 Masukkan link Facebook!\n\nContoh:\n/facebook https://www.facebook.com/...");
    }

    try {
      const res = await axios.post("https://api.siputzx.my.id/api/d/facebook", {
        url: args.trim()
      });

      const { status, data } = res.data;
      if (!status || !data || !data.length) {
        return ctx.reply("❌ Gagal mengambil video dari Facebook. Pastikan link valid.");
      }

      const video = data[0];
      const head = await axios.head(video.url);
      const contentType = head.headers["content-type"];

      const caption = `📘 *Facebook Video*\n🎞️ Resolusi: ${video.resolution || "Unknown"}`;

      if (contentType.includes("video") || contentType === "application/octet-stream") {
        await ctx.replyWithVideo({ url: video.url }, {
          caption,
          parse_mode: "Markdown"
        });
      } else {
        await ctx.reply("❓ File tidak dikenali sebagai video.");
      }
    } catch (err) {
      console.error("Facebook Error:", err?.response?.data || err.message);
      return ctx.reply("❌ Terjadi kesalahan saat mengambil video dari Facebook.");
    }
  });
};
