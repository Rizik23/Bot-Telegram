const axios = require("axios");

module.exports = (bot) => {
  bot.command("txttoghibli", async (ctx) => {
    const query = ctx.message.text.split(" ").slice(1).join(" ");
    if (!query) {
      return ctx.reply(
        "❌ Masukkan teks yang ingin diubah ke gaya Ghibli.\nContoh: `/txttoghibli studio Ghibli style`",
        { parse_mode: "Markdown" }
      );
    }

    await ctx.reply("⏳ Sedang membuat gambar dengan gaya Studio Ghibli...");

    try {
      const res = await axios.get(
        `https://fastapi.acodes.my.id/api/generator/txt2ghibli?prompt=${encodeURIComponent(query)}`,
        { responseType: "arraybuffer" }
      );

      if (res.headers["content-type"]?.startsWith("image/")) {
        await ctx.replyWithPhoto(
          { source: Buffer.from(res.data) },
          { caption: `✅ Gambar bergaya Ghibli berhasil dibuat untuk prompt:\n"${query}"` }
        );
      } else {
        await ctx.reply("❌ Gagal mendapatkan gambar. Coba lagi nanti.");
      }
    } catch (err) {
      console.error("Ghibli error:", err.message || err);
      await ctx.reply(
        "❌ Gagal memproses permintaan. Kemungkinan server API sedang bermasalah."
      );
    }
  });
};
