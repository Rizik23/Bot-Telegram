// plugins/infocrypto.js
const axios = require("axios");

function escapeMarkdownV2(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`")
    .replace(/>/g, "\\>")
    .replace(/#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/-/g, "\\-")
    .replace(/=/g, "\\=")
    .replace(/\|/g, "\\|")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!");
}

module.exports = (bot) => {
  bot.command(["crypto", "infocrypto"], async (ctx) => {
    try {
      const text = ctx.message.text.split(" ").slice(1).join(" ").trim();
      const response = await axios.get("https://indodax.com/api/summaries");
      const data = response.data.tickers;

      if (text) {
        const pair = text.toLowerCase();
        const info = data[pair];
        if (!info) return ctx.reply("❌ ID Coin tidak ditemukan!");

        const msg = [
          `📈 Nama : *${escapeMarkdownV2(info.name)}*`,
          `🛒 Harga Buka : *Rp${escapeMarkdownV2(Number(info.low).toLocaleString("id-ID"))}*`,
          `🔒 Harga Tutup : *Rp${escapeMarkdownV2(Number(info.high).toLocaleString("id-ID"))}*`,
          `💰 Harga Saat Ini : *Rp${escapeMarkdownV2(Number(info.last).toLocaleString("id-ID"))}*`,
        ].join("\n");

        return ctx.reply(msg, { parse_mode: "MarkdownV2" });
      }

      let teks = `*📊 Daftar Harga Crypto \\(Indodax\\)*`;
      for (const [pair, info] of Object.entries(data)) {
        teks += `\n\n📈 Nama : *${escapeMarkdownV2(info.name)}*\n📎 ID : *${escapeMarkdownV2(pair)}*\n💰 Harga : *Rp${escapeMarkdownV2(Number(info.last).toLocaleString("id-ID"))}*`;
      }

      // Split message into chunks safely
      const parts = teks.match(/[\s\S]{1,4000}/g);
      for (const part of parts) {
        await ctx.reply(part, { parse_mode: "MarkdownV2" });
      }

    } catch (err) {
      console.error("Gagal fetch dari Indodax:", err.message);
      ctx.reply("⚠️ Gagal mengambil data harga dari Indodax.");
    }
  });
};

