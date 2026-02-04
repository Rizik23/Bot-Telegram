const fs = require("fs");
const path = require("path");

const config = require("../config"); // Pastikan path config.js sesuai
module.exports = (bot) => {
 bot.command("delplugin", async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma bisa dipakai sama owner bot aja bre.");
    }
    try {
      const args = ctx.message.text.split(" ").slice(1);
      if (args.length === 0) {
        return ctx.reply("❌ Contoh: /delplugin 2");
      }

      const index = parseInt(args[0]);
      if (isNaN(index)) {
        return ctx.reply("❌ Nomor plugin gak valid bre.");
      }

      const pluginDir = path.join(__dirname, "../plugins");
      const files = fs.readdirSync(pluginDir).filter(file => file.endsWith(".js"));

      if (index < 1 || index > files.length) {
        return ctx.reply("❌ Nomor plugin gak ada dalam daftar.");
      }

      const targetFile = files[index - 1];
      const filePath = path.join(pluginDir, targetFile);

      fs.unlinkSync(filePath);

      ctx.reply(`🗑️ Plugin *${targetFile}* berhasil dihapus.`);
    } catch (err) {
      console.error("DelPlugin Error:", err);
      ctx.reply("❌ Gagal menghapus plugin.");
    }
  });
};
