const fs = require("fs");
const path = require("path");

module.exports = (bot) => {
  bot.command("status", async (ctx) => {
    const chat = ctx.chat;
    if (!chat || chat.type === "private") {
      return ctx.reply("❌ Command ini hanya bisa digunakan di grup.");
    }

    const groupId = String(chat.id);

    const getPerGroupStatus = (filename) => {
      const filePath = path.join(__dirname, `../data/${filename}`);
      if (!fs.existsSync(filePath)) return "❌ Off";
      try {
        const data = JSON.parse(fs.readFileSync(filePath));
        return data[groupId] ? "✅ On" : "❌ Off";
      } catch {
        return "❌ Error";
      }
    };

    const getGlobalStatus = (filename) => {
      const filePath = path.join(__dirname, `../data/${filename}`);
      if (!fs.existsSync(filePath)) return "❌ Off";
      try {
        const data = JSON.parse(fs.readFileSync(filePath));
        return data.status ? "✅ On" : "❌ Off";
      } catch {
        return "❌ Error";
      }
    };

    const statusAntilink = getPerGroupStatus("antilink.json");
    const statusMedia = getPerGroupStatus("antimedia.json");
    const statusOnlyGroup = getGlobalStatus("onlygroup.json");

    const statusMessage = `
╭─❍ *STATUS FITUR BOT*
│🏷️ *Grup:* ${chat.title || "Tidak diketahui"}
│🆔 *ID:* \`${groupId}\`
│
│🔗 Antilink: ${statusAntilink}
│🖼️ Media: ${statusMedia}
╰──────────────╯`;

    ctx.reply(statusMessage, { parse_mode: "Markdown" });
  });
};
