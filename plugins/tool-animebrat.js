const axios = require("axios");

module.exports = (bot) => {
  bot.command("animbrat", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    if (!args) {
      return ctx.reply(`❌ Masukkan teks untuk gambar!\n\nContoh:\n/animbrat Halo, aku user lucu | center | image`);
    }

    // Parsing format: /animbrat teks | posisi | mode
    const [text, position, mode] = args.split("|").map(v => v?.trim());

    if (!text) {
      return ctx.reply("❌ Teks tidak boleh kosong.");
    }

    try {
      const res = await axios.get("https://fastrestapis.fasturl.cloud/maker/animbrat", {
        responseType: "arraybuffer",
        params: {
          text,
          position: position || "center",
          mode: mode || "image"
        },
        headers: {
          accept: "image/png"
          // 'x-api-key': 'APIKEY' // opsional
        }
      });

      const buffer = Buffer.from(res.data, "binary");

      const fileType = (mode || "image").toLowerCase() === "animated" ? "video" : "photo";
      const caption = `🎭 Anime Brat\n📝 Teks: ${text}\n📍 Posisi: ${position || "center"}\n🎞️ Mode: ${mode || "image"}`;

      if (fileType === "photo") {
        await ctx.replyWithPhoto({ source: buffer }, { caption });
      } else {
        await ctx.replyWithAnimation({ source: buffer }, { caption });
      }
    } catch (err) {
      console.error(err?.response?.data || err.message);
      ctx.reply("❌ Gagal membuat gambar Anime Brat. Pastikan format benar atau coba lagi nanti.");
    }
  });
};
