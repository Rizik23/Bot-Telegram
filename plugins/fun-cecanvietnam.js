const axios = require("axios");

module.exports = (bot) => {
  bot.command("cecanvietnam", async (ctx) => {
    try {
      const res = await axios.post("https://api.siputzx.my.id/api/r/cecan/vietnam", null, {
        responseType: "arraybuffer"
      });

      await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, {
        caption: "Cecan Vietnam datang membawa senyuman 🇻🇳✨"
      });
    } catch (err) {
      console.error("Gagal ambil gambar cecan Vietnam:", err.message);
      ctx.reply("Gagal ambil cecan Vietnam. Coba lagi nanti ya!");
    }
  });
};
