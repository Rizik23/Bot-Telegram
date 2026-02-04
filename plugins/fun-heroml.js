const axios = require("axios");
const cheerio = require("cheerio");

module.exports = (bot) => {
  bot.command("heroml", async (ctx) => {
    const input = ctx.message.text.split(" ").slice(1).join(" ");
    const heroName = input.trim();

    if (!heroName) {
      return ctx.reply("Ketik nama hero Mobile Legends-nya bre.");
    }

    await ctx.reply("🔍 Mengambil informasi hero...");

    try {
      const formattedName = heroName.replace(/ /g, "_");
      const url = `https://mobile-legends.fandom.com/wiki/${formattedName}`;
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      const $ = cheerio.load(data);
      const title = $("h1.page-header__title").text().trim();
      const image = $("aside.portable-infobox img").first().attr("src");

      let caption = `📘 <b>Informasi Hero: ${title}</b>\n\n`;
      $("aside.portable-infobox .pi-item").each((_, el) => {
        const label = $(el).find("h3").text().trim();
        const value = $(el).find("div").not("h3").text().trim();
        if (label && value) {
          caption += `• <b>${label}</b>: ${value}\n`;
        }
      });

      // Kirim foto + caption jika tidak melebihi 1024 karakter
      if (image) {
        if (caption.length <= 1024) {
          await ctx.replyWithPhoto({ url: image }, { caption, parse_mode: "HTML" });
        } else {
          await ctx.replyWithPhoto({ url: image });
          await ctx.replyWithHTML(caption);
        }
      } else {
        await ctx.reply("⚠️ Gambar hero tidak ditemukan.");
      }
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Gagal mengambil informasi hero. Pastikan nama benar.");
    }
  });
};


      