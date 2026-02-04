const axios = require("axios");

module.exports = (bot) => {
  bot.command("gdrive", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    if (!args) {
      return ctx.reply("🚫 Masukkan link Google Drive!\n\nContoh:\n/gdrive https://drive.google.com/file/d/...");
    }

    try {
      const res = await axios.post("https://api.siputzx.my.id/api/d/gdrive", {
        url: args.trim()
      });

      const { status, data } = res.data;
      if (!status || !data || !data.download) {
        return ctx.reply("❌ Gagal mengambil link download. Pastikan link valid.");
      }

      await ctx.replyWithDocument({ url: data.download }, {
        caption: `✅ *Berhasil Download!*\n\n📁 *Nama:* ${data.name}\n🔗 *Link:* ${data.link}`,
        parse_mode: "Markdown"
      });

    } catch (e) {
      console.error("GDrive Error:", e);
      return ctx.reply("❌ Terjadi kesalahan saat mengambil link download.");
    }
  });
};
