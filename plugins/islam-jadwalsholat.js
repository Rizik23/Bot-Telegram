const axios = require("axios");
const cheerio = require("cheerio");

module.exports = (bot) => {
  bot.command("jadwalsholat", async (ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) {
      return ctx.reply(`• *Contoh:* /jadwalsholat jakarta pusat`, {
        parse_mode: "Markdown"
      });
    }

    // Kirim notifikasi proses pencarian
    await ctx.reply("🔍 Sedang mencari jawaban, tunggu sebentar...");

    async function jadwalSholat(kota) {
      try {
        const { data } = await axios.get(`https://www.dream.co.id/jadwal-sholat/${encodeURIComponent(kota)}/`);
        const $ = cheerio.load(data);
        const rows = $(".table-index-jadwal tbody tr");
        const jadwal = [];

        rows.each((index, row) => {
          const cols = $(row).find("td");
          jadwal.push({
            subuh: $(cols[1]).text().trim(),
            duha: $(cols[2]).text().trim(),
            zuhur: $(cols[3]).text().trim(),
            asar: $(cols[4]).text().trim(),
            magrib: $(cols[5]).text().trim(),
            isya: $(cols[6]).text().trim()
          });
        });

        return jadwal[0];
      } catch (error) {
        throw new Error("Gagal mengambil data jadwal sholat");
      }
    }

    try {
      const jadwal = await jadwalSholat(text);
      const caption = `
📍 *${text.toUpperCase()}*
├ Subuh: ${jadwal.subuh}
├ Dhuha: ${jadwal.duha}
├ Dzuhur: ${jadwal.zuhur}
├ Ashar: ${jadwal.asar}
├ Maghrib: ${jadwal.magrib}
└ Isya: ${jadwal.isya}
      `.trim();

      const thumbnailUrl = "https://files.catbox.moe/r3mbjq.jpg";

      await ctx.replyWithPhoto({ url: thumbnailUrl }, {
        caption,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 Sumber", url: "https://www.islamicfinder.org" }
            ]
          ]
        }
      });

    } catch (e) {
      ctx.reply("❌ Gagal mendapatkan jadwal sholat. Pastikan nama kota benar.");
    }
  });
};