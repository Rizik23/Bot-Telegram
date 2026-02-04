const fetch = require("node-fetch");
const sharp = require("sharp");

module.exports = (bot) => {
  bot.command("infogempa", async (ctx) => {
    try {
      const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
      const json = await res.json();
      const data = json.Infogempa.gempa;

      let caption = `📡 *Informasi Gempa Terkini*\n\n`;
      caption += `📅 Tanggal: ${data.Tanggal}\n`;
      caption += `🕒 Waktu: ${data.Jam}\n`;
      caption += `📍 Wilayah: ${data.Wilayah}\n`;
      caption += `📈 Magnitudo: ${data.Magnitude}\n`;
      caption += `📏 Kedalaman: ${data.Kedalaman}\n`;
      caption += `📌 Koordinat: ${data.Coordinates}\n`;
      caption += `🧭 Lintang: ${data.Lintang} | Bujur: ${data.Bujur}\n`;
      caption += `⚠️ Potensi: *${data.Potensi}*\n`;
      if (data.Dirasakan) caption += `💬 Dirasakan: ${data.Dirasakan}\n`;
      caption += `\n❤️ Support: https://t.me/VellzXyrine`;

      const mapUrl = `https://data.bmkg.go.id/DataMKG/TEWS/${data.Shakemap}`;
      const buffer = await fetch(mapUrl).then(res => res.buffer());
      const image = await sharp(buffer).png().toBuffer();

      await ctx.replyWithPhoto({ source: image }, { caption, parse_mode: "Markdown" });
    } catch (e) {
      console.error("Error infogempa:", e.message);
      ctx.reply("❌ Gagal mengambil data gempa dari BMKG.");
    }
  });
};
