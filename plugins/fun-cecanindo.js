const axios = require("axios");

module.exports = (bot) => {
  bot.command("cecanindo", async (ctx) => {
    try {
      const res = await axios.post("https://api.siputzx.my.id/api/r/cecan/indonesia", null, {
        responseType: "arraybuffer"
      });

      await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, {
        caption: "Cecan Indonesia spesial buat kamu 🇮🇩"
      });
    } catch (err) {
      console.error("Gagal mengambil gambar cecan Indonesia:", err.message);
      ctx.reply("Ups! Gagal mengambil cecan Indonesia. Coba lagi nanti.");
    }
  });
};
