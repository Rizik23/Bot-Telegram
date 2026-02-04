// plugins/iqc.js
const axios = require("axios");

module.exports = (bot) => {
  bot.command(["iqc", "iphoneqc"], async (ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) return ctx.reply("📌 Contoh penggunaan:\n/iqc halo kak, gimana kabarnya?");

    await ctx.reply("⏳ Sedang membuat gambar, tunggu bentar...");

    try {
      const apiUrl = `https://flowfalcon.dpdns.org/imagecreator/iqc?text=${encodeURIComponent(text)}`;
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);

      await ctx.replyWithPhoto(
        { source: buffer },
        {
          caption: `🖼️ *iPhone Quoted Chat*\n\n📝 *Text:* ${text}`,
          parse_mode: "Markdown",
        }
      );
    } catch (err) {
      console.error("❌ Error IQC:", err);
      ctx.reply("❌ Gagal membuat gambar.");
    }
  });
};
