const axios = require("axios");

module.exports = (bot) => {
  bot.command("cecanchina", async (ctx) => {
    try {
      const res = await axios.post("https://api.siputzx.my.id/api/r/cecan/china", null, {
        responseType: "arraybuffer", // agar bisa kirim file binary
      });

      await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, { caption: "Nih cecan China buat kamu 🇨🇳" });
    } catch (err) {
      console.error("Error fetching cecan china:", err.message);
      ctx.reply("Gagal mengambil gambar. Coba lagi nanti.");
    }
  });
};
