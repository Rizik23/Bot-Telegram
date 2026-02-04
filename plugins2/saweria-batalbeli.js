const fs = require("fs");
const path = require("path");

const premPath = path.join(__dirname, '..', 'prem.json');

function loadPrem() {
  if (!fs.existsSync(premPath)) fs.writeFileSync(premPath, '[]');
  return JSON.parse(fs.readFileSync(premPath));
}

module.exports = (bot) => {
  bot.command("batalbeli", async (ctx) => {
    const sender = ctx.from.id.toString();
    const gatewayDir = path.join(__dirname, "../src/gateway");
    const gatewayFile = path.join(gatewayDir, `${sender}.json`);

    try {
    // ⛔ Validasi Premium
    const premList = loadPrem();
    if (!premList.includes(sender)) {
      return ctx.reply('❌ Fitur ini khusus untuk user *Premium*.\n\nHubungi admin untuk upgrade!');
    }

      if (!fs.existsSync(gatewayFile)) {
        return await ctx.reply("⚠️ Tidak ada pembayaran aktif yang bisa dibatalkan.");
      }

      fs.unlinkSync(gatewayFile);
      return await ctx.reply("✅ Pembayaran berhasil dibatalkan.");
    } catch (err) {
      console.error("Gagal membatalkan pembayaran:", err);
      return await ctx.reply("❌ Terjadi kesalahan saat membatalkan pembayaran.");
    }
  });
};