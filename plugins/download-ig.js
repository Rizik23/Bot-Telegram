const axios = require("axios");

module.exports = (bot) => {
  bot.command("ig", async (ctx) => {
    const query = ctx.message.text.split(" ").slice(1).join(" ");
    if (!query || !query.includes("instagram.com")) {
      return ctx.reply("❗ Kirim link Instagram yang valid!\nContoh:\n/ig https://www.instagram.com/reel/xxxx/");
    }

    await ctx.reply("⏳ Tunggu bentar, sedang mengambil media...");

    try {
      const res = await axios.get(`https://api.kenshiro.cfd/api/downloader/instagram?url=${encodeURIComponent(query)}`);
      const data = res.data;

      if (!data.status || !data.data || !data.data.link.length) {
        return ctx.reply("❌ Gagal mengambil data dari Instagram.");
      }

      const caption = `
📸 <b>Instagram Post</b>
👤 <b>@${data.data.username}</b>
❤️ <b>${data.data.like}</b> | 💬 <b>${data.data.comment}</b>
📝 <i>${data.data.caption || "Tidak ada caption"}</i>
🔗 <a href="${query}">Lihat di Instagram</a>
      `.trim();

      for (const media of data.data.link) {
        if (media.type === "video") {
          await ctx.replyWithVideo(
            { url: media.url },
            { caption, parse_mode: "HTML" }
          );
        } else {
          await ctx.replyWithPhoto(
            { url: media.url },
            { caption, parse_mode: "HTML" }
          );
        }
      }

    } catch (err) {
      console.error("[IG ERROR]", err.message);
      ctx.reply("❌ Terjadi error saat ambil media.");
    }
  });
};