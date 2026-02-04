const axios = require("axios");

module.exports = (bot) => {
  bot.command("pin", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    if (!args) {
      return ctx.reply("🚫 Masukkan link Pinterest!\n\nContoh:\n/pin https://id.pinterest.com/...");
    }

    try {
      const res = await axios.post("https://api.siputzx.my.id/api/d/pinterest", {
        url: args.trim()
      });

      const { status, data } = res.data;
      if (!status || !data?.url) {
        return ctx.reply("❌ Gagal mengambil media dari Pinterest. Pastikan link valid.");
      }

      // Cek tipe file
      const head = await axios.head(data.url);
      const contentType = head.headers["content-type"];

      const caption = `📌 *Pinterest Media*\n🆔 ID: ${data.id || "-"}\n🕒 Dibuat: ${data.created_at || "-"}`;
      
      if (contentType.includes("video")) {
        await ctx.replyWithVideo({ url: data.url }, {
          caption,
          parse_mode: "Markdown"
        });
      } else if (contentType.includes("image")) {
        await ctx.replyWithPhoto({ url: data.url }, {
          caption,
          parse_mode: "Markdown"
        });
      } else {
        await ctx.reply(`❓ File tidak dikenali (tipe: ${contentType})`);
      }
    } catch (err) {
      console.error("Pinterest Error:", err?.response?.data || err.message);
      return ctx.reply("❌ Terjadi kesalahan saat mengambil media dari Pinterest.");
    }
  });
};
