const fs = require("fs");
const path = require("path");
const config = require("../config");

module.exports = (bot) => {
  bot.command("addplugin", async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma bisa dipakai sama owner bot aja bre.");
    }

    const args = ctx.message.text.split(" ").slice(1);
    const targetFolder = args[0]; // ./plugins atau ./plugins2
    const fileName = args[1];

    if (!targetFolder || !fileName || !fileName.endsWith(".js")) {
      return ctx.reply("❌ Format salah!\nContoh:\n`/addplugin ./plugins2 nama-plugin.js`", {
        parse_mode: "Markdown"
      });
    }

    const replied = ctx.message.reply_to_message;
    if (!replied || !replied.text) {
      return ctx.reply("❌ Balas pesan berisi kode plugin terlebih dahulu.");
    }

    try {
      const resolvedFolder = path.resolve(__dirname, "..", targetFolder.replace("./", ""));
      if (!fs.existsSync(resolvedFolder)) {
        fs.mkdirSync(resolvedFolder, { recursive: true });
      }

      const pluginPath = path.join(resolvedFolder, fileName);
      const pluginCode = replied.text.trim();

      fs.writeFileSync(pluginPath, pluginCode);

      ctx.reply(`✅ Plugin berhasil disimpan ke \`${targetFolder}/${fileName}\``, {
        parse_mode: "Markdown"
      });
    } catch (err) {
      console.error("AddPlugin Error:", err);
      ctx.reply("❌ Gagal menyimpan plugin.");
    }
  });
};
