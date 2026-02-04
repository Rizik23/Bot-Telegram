const axios = require("axios");

module.exports = (bot) => {
  bot.command("calendar", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    const [monthStr, yearStr] = args.split("|").map(v => v?.trim());

    const now = new Date();
    const month = parseInt(monthStr) || now.getMonth() + 1;
    const year = parseInt(yearStr) || now.getFullYear();

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return ctx.reply("❌ Format salah!\n\nGunakan format:\n/calendar Bulan | Tahun\n\nContoh:\n/calendar 6 | 2025\nAtau gunakan tanpa argumen untuk kalender bulan ini.");
    }

    try {
      const res = await axios.get("https://fastrestapis.fasturl.cloud/maker/calendar/simple", {
        responseType: "arraybuffer",
        params: {
          month,
          year
        },
        headers: {
          accept: "image/png"
          // 'x-api-key': 'APIKEY' // opsional
        }
      });

      const buffer = Buffer.from(res.data, "binary");

      await ctx.replyWithPhoto({ source: buffer }, {
        caption: `🗓️ Kalender ${month}/${year}`
      });
    } catch (err) {
      console.error(err?.response?.data || err.message);
      ctx.reply("❌ Gagal mengambil kalender. Coba lagi nanti.");
    }
  });
};
