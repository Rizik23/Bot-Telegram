const axios = require("axios");

module.exports = (bot) => {
  bot.command("twitter", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    if (!args) {
      return ctx.reply("🚫 Masukkan link Twitter!\n\nContoh:\n/twitter https://twitter.com/...");
    }

    try {
      const res = await axios.post("https://api.siputzx.my.id/api/d/twitter", {
        url: args.trim()
      });

      const { status, data } = res.data;
      if (!status || !data?.downloadLink) {
        return ctx.reply("❌ Gagal mengambil video dari Twitter. Pastikan link valid.");
      }

      const head = await axios.head(data.downloadLink);
      const contentType = head.headers["content-type"];

      // Fungsi cek extension URL
      const isImageExt = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      const isVideoExt = (url) => /\.(mp4|mov|mkv|webm|avi|flv)$/i.test(url);

      const caption = `🐦 *${data.videoTitle || "Twitter Video"}*\n📝 ${data.videoDescription || ""}`;

      if (contentType.includes("video")) {
        await ctx.replyWithVideo({ url: data.downloadLink }, {
          caption,
          parse_mode: "Markdown"
        });
      } else if (contentType.includes("image")) {
        await ctx.replyWithPhoto({ url: data.downloadLink }, {
          caption,
          parse_mode: "Markdown"
        });
      } else if (contentType === "application/octet-stream") {
        // Cek extension untuk pastikan tipe media
        if (isImageExt(data.downloadLink)) {
          await ctx.replyWithPhoto({ url: data.downloadLink }, {
            caption,
            parse_mode: "Markdown"
          });
        } else if (isVideoExt(data.downloadLink)) {
          await ctx.replyWithVideo({ url: data.downloadLink }, {
            caption,
            parse_mode: "Markdown"
          });
        } else {
          // fallback default ke video
          await ctx.replyWithVideo({ url: data.downloadLink }, {
            caption,
            parse_mode: "Markdown"
          });
        }
      } else {
        await ctx.reply(`❓ File tidak dikenali (tipe: ${contentType})`);
      }
    } catch (err) {
      console.error("Twitter Error:", err?.response?.data || err.message);
      return ctx.reply("❌ Terjadi kesalahan saat mengambil media dari Twitter.");
    }
  });
};

