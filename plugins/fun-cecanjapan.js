const axios = require("axios");

module.exports = (bot) => {
  bot.command("cecanjapan", async (ctx) => {
    try {
      const res = await axios.post("https://api.siputzx.my.id/api/r/cecan/japan", null, {
        responseType: "arraybuffer"
      });

      await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, {
        caption: "Cecan Jepang hadir buat kamu 🇯🇵✨"
      });
    } catch (err) {
      console.error("Gagal mengambil gambar cecan Jepang:", err.message);
      ctx.reply("Gagal mengambil cecan Jepang. Coba lagi nanti ya~");
    }
  });
};
 