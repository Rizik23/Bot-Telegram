const fs = require("fs");
const path = require("path");
const config = require("../config");

// File users ori lu biasanya di data/users.json
const USERS_FILE = path.join(__dirname, "../data/users.json");

module.exports = (bot) => {
  bot.command("listpengguna", async (ctx) => {
 

    if (!fs.existsSync(USERS_FILE)) {
      return ctx.reply("📋 Tidak ada database user.");
    }

    let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));

    if (!Array.isArray(users) || users.length === 0) {
      return ctx.reply("📋 Tidak ada pengguna yang terdaftar.");
    }

    let userList = "📋 *Daftar Pengguna Bot:*\n\n";

    let userData = await Promise.all(
      users.map(async (id, index) => {
        try {
          let user = await bot.telegram.getChat(id);
          let username = user.username ? `(@${user.username})` : "";
          return `${index + 1}. \`${id}\` ${username}`;
        } catch (error) {
          return `${index + 1}. \`${id}\` _(Tidak dapat mengambil info)_`;
        }
      })
    );

    userList += userData.join("\n");

    await ctx.replyWithMarkdown(userList);
  });
};