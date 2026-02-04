const axios = require("axios");

module.exports = (bot) => {
  bot.command("videydl", async (ctx) => {
    const input = ctx.message.text.split(" ").slice(1).join(" ");
    
    if (!input || !input.startsWith("http")) {
      return ctx.reply(
        "❌ Kirim perintah dengan menyertakan URL video dari videy.co\nContoh: `/videydl https://videy.co/v?id=XXXX`",
        { parse_mode: "Markdown" }
      );
    }

    await ctx.reply("⏳ Sedang memproses video...");

    try {
      const res = await axios.post(
        "https://fastapi.acodes.my.id/api/downloader/videy",
        { text: input },
        {
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.status && res.data?.data) {
        await ctx.replyWithVideo(
          { url: res.data.data },
          { caption: "✅ Video berhasil diunduh dari videy.co!" }
        );
      } else {
        await ctx.reply("❌ Gagal mendapatkan video. Coba cek ulang link-nya.");
      }
    } catch (err) {
      console.error("VideyDL error:", err.message || err);
      ctx.reply("❌ Terjadi kesalahan saat memproses video.");
    }
  });
};
