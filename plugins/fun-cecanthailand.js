const axios = require("axios");

module.exports = (bot) => {
  bot.command("cecanthailand", async (ctx) => {
    try {
      const res = await axios.post("https://api.siputzx.my.id/api/r/cecan/thailand", null, {
        responseType: "arraybuffer"
      });

      await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, {
        caption: "Cecan Thailand buat kamu yang suka senyum manis 😍🇹🇭"
      });
    } catch (err) {
      console.error("Gagal ambil gambar cecan Thailand:", err.message);
      ctx.reply("Gagal ambil cecan Thailand. Coba lagi nanti ya!");
    }
  });
};
