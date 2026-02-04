const axios = require("axios");

module.exports = (bot) => {
  bot.command("ssweb", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    const url = args[0];
    const theme = args[1] || "dark";
    const device = args[2] || "mobile";

    if (!url) {
      return ctx.reply(`⚠️ Contoh penggunaan:
        
/ssweb https://google.com [theme] [device]

📌 Contoh:
/ssweb https://google.com dark mobile`, {
        parse_mode: "Markdown"
      });
    }

    try {
      await ctx.reply("📸 Mengambil screenshot, tunggu sebentar...");

      const response = await axios.post(
        "https://api.siputzx.my.id/api/tools/ssweb",
        {
          url,
          theme,
          device
        },
        {
          responseType: "arraybuffer",
          headers: {
            "accept": "*/*",
            "Content-Type": "application/json"
          }
        }
      );

      await ctx.replyWithPhoto({ source: Buffer.from(response.data) }, {
        caption: `✅ Screenshot untuk: ${url}`
      });

    } catch (error) {
      console.error(error);
      ctx.reply("❌ Gagal mengambil screenshot. Pastikan URL valid atau coba lagi nanti.");
    }
  });
};
