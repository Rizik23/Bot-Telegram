const fs = require("fs");
const path = require("path");
const config = require("../config");

module.exports = (bot) => {
  bot.command("listplugin", async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma bisa dipakai sama owner bot aja bre.");
    }

    try {
      // Dua folder plugin yang akan dibaca
      const pluginDirs = [
        path.join(__dirname, "../plugins"),
        path.join(__dirname, "../plugins2"),
      ];

      let allFiles = [];

      for (const dir of pluginDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter((file) => file.endsWith(".js"));
          const taggedFiles = files.map((file) => `[${path.basename(dir)}] ${file}`);
          allFiles.push(...taggedFiles);
        }
      }

      if (allFiles.length === 0) {
        return ctx.reply("📂 Tidak ada plugin ditemukan di folder `plugins/` maupun `plugins2/`.");
      }

      // Susun daftar plugin
      const pluginList = allFiles.map((f, i) => `${i + 1}. ${f}`);
      
      // Bagi ke dalam batch per 4000 karakter
      let batch = "";
      for (let i = 0; i < pluginList.length; i++) {
        const line = pluginList[i] + "\n";
        if ((batch + line).length > 4000) {
          await ctx.reply(`📦 Daftar Plugin:\n\n${batch}`);
          batch = "";
        }
        batch += line;
      }

      // Kirim sisa batch terakhir
      if (batch.trim().length > 0) {
        await ctx.reply(`📦 Daftar Plugin:\n\n${batch}`);
      }
    } catch (err) {
      console.error("ListPlugin Error:", err);
      ctx.reply("❌ Gagal menampilkan daftar plugin.");
    }
  });
};
