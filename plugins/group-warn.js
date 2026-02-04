const fs = require("fs");
const path = require("path");
const warnPath = path.join(__dirname, "../data/warn.json");

if (!fs.existsSync(warnPath)) fs.writeFileSync(warnPath, JSON.stringify({}));

function loadWarns() {
  return JSON.parse(fs.readFileSync(warnPath, "utf8"));
}

function saveWarns(data) {
  fs.writeFileSync(warnPath, JSON.stringify(data, null, 2));
}

module.exports = (bot) => {
  bot.command("warn", async (ctx) => {
    if (!ctx.chat || ctx.chat.type === "private") {
      return ctx.reply("⚠️ Fitur ini hanya bisa digunakan di grup.");
    }

    const admins = await ctx.getChatAdministrators();
    const isAdmin = admins.some(a => a.user.id === ctx.from.id);

    if (!isAdmin) {
      return ctx.reply("❌ Hanya admin yang bisa kasih warning.");
    }

    const repliedUser = ctx.message.reply_to_message?.from;
    if (!repliedUser) {
      return ctx.reply("⚠️ Balas pesan member yang mau di-warn.");
    }

    const warns = loadWarns();
    const groupId = ctx.chat.id;
    const userId = repliedUser.id;

    if (!warns[groupId]) warns[groupId] = {};
    if (!warns[groupId][userId]) warns[groupId][userId] = 0;

    warns[groupId][userId] += 1;
    const totalWarn = warns[groupId][userId];

    saveWarns(warns);

    if (totalWarn >= 3) {
      try {
        await ctx.kickChatMember(userId);
        await ctx.reply(`🚫 @${repliedUser.username || repliedUser.first_name} sudah 3x kena warn dan telah dikick.`, {
          parse_mode: "Markdown",
        });
        warns[groupId][userId] = 0; // Reset setelah kick
        saveWarns(warns);
      } catch (e) {
        ctx.reply("❌ Gagal kick member. Pastikan bot adalah admin.");
      }
    } else {
      ctx.reply(`⚠️ @${repliedUser.username || repliedUser.first_name} telah diberi warning ke-${totalWarn}`, {
        parse_mode: "Markdown",
      });
    }
  });
};
