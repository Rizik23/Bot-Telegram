const axios = require("axios");

module.exports = (bot) => {
  bot.command("cecankorea", async (ctx) => {
    try {
      const res = await axios.post("https://api.siputzx.my.id/api/r/cecan/korea", null, {
        responseType: "arraybuffer"
      });

      await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, {
        caption: "Cecan Korea hadir buat kamu 🇰🇷💖"
      });
    } catch (err) {
      console.error("Gagal mengambil gambar cecan Korea:", err.message);
      ctx.reply("Gagal mengambil cecan Korea. Coba lagi nanti ya!");
    }
  });
};
