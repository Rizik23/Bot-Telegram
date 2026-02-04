const axios = require("axios");
const { Markup } = require("telegraf");

module.exports = (bot) => {
  bot.command("terabox", async (ctx) => {
    const input = ctx.message.text.split(" ").slice(1);
    const url = input[0];
    const password = input[1] || "";

    if (!url) {
      return ctx.reply("❌ Masukkan link Terabox.\n\nContoh:\n/terabox https://teraboxlink.com/s/abc123 password");
    }

    try {
      const res = await axios.get("https://fastrestapis.fasturl.cloud/downup/teraboxdown", {
        params: {
          url: url,
          password: password
        },
        headers: {
          accept: "application/json"
        }
      });

      const data = res.data;
      if (data.status !== 200 || !data.result || !data.result.length) {
        return ctx.reply("⚠️ Gagal mengambil data. Cek link atau password-nya.");
      }

      const file = data.result[0];
      const sizeMB = (parseInt(file.size) / (1024 * 1024)).toFixed(2);

      const message = `✅ *Berhasil Ditemukan!*\n\n*Nama:* ${file.filename}\n*Ukuran:* ${sizeMB} MB\n*Waktu Buat:* ${new Date(file.create_time * 1000).toLocaleString("id-ID")}`;

      await ctx.replyWithMarkdown(message, {
        reply_markup: Markup.inlineKeyboard([
          Markup.button.url("📥 Download", file.downloadUrl)
        ])
      });

    } catch (err) {
      console.error(err);
      ctx.reply("❌ Terjadi kesalahan saat mengambil data. Mungkin link invalid atau API down.");
    }
  });
};

      