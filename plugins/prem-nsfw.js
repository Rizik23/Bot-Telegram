const axios = require("axios");

module.exports = (bot) => {
  bot.command("nsfwimg", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    const prompt = args.join(" ");
    if (!prompt) {
      return ctx.reply("⚠️ Mohon sertakan prompt. Contoh:\n/nsfwimg furry antro nude on the beach");
    }

    const API_URL = "https://fastrestapis.fasturl.cloud/aiimage/nsfw";

    try {
      const response = await axios.get(API_URL, {
        params: { prompt },
        responseType: "arraybuffer",
        headers: { "accept": "image/png" },
        validateStatus: () => true,
      });

      switch (response.status) {
        case 200:
          return ctx.replyWithPhoto(
            { source: Buffer.from(response.data) },
            { caption: `Prompt: ${prompt}` }
          );

        case 400:
          return ctx.reply("❌ Bad Request: Prompt tidak ditemukan atau invalid.");

        case 403:
          return ctx.reply("🚫 Forbidden: Akses ditolak.");

        case 404:
          return ctx.reply("🔍 Not Found: Tidak ada gambar untuk prompt tersebut.");

        case 429:
          return ctx.reply("⏳ Too Many Requests: Terlalu banyak permintaan, coba lagi nanti.");

        case 500:
          return ctx.reply("💥 Internal Server Error: Terjadi kesalahan server.");

        default:
          return ctx.reply(`⚠️ Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(error);
      return ctx.reply("❌ Gagal menghubungi API, coba lagi nanti.");
    }
  });
};
