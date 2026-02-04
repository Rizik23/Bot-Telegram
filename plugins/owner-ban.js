const fs = require('fs');
const path = require('path');
const config = require('../config');
const dataFile = path.join(__dirname, '../data/banned.json');

if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]');

function loadBans() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function saveBans(bans) {
  fs.writeFileSync(dataFile, JSON.stringify(bans, null, 2));
}

module.exports = (bot) => {
  // 🚫 Middleware: blokir user yang diban
  bot.use(async (ctx, next) => {
    const userId = String(ctx.from?.id);
    const banned = loadBans();
    if (banned.includes(userId)) return;
    return next();
  });

  // 🚫 /ban <id>
  bot.command("ban", async (ctx) => {
    const sender = String(ctx.from.id);
    if (!config.ownerIds.includes(sender)) {
      return ctx.reply("❌ Fitur ini cuma buat owner aja bre.");
    }

    const target = ctx.message.text?.split(" ")[1];
    if (!target || !/^\d+$/.test(target)) {
      return ctx.reply("❌ Format salah. Contoh: /ban 7502336580");
    }

    const bans = loadBans();
    if (bans.includes(target)) {
      return ctx.reply("⚠️ User itu udah diban sebelumnya.");
    }

    bans.push(target);
    saveBans(bans);
    ctx.reply(`✅ User \`${target}\` berhasil diban.`, { parse_mode: "Markdown" });
  });

  // 🔓 /unban <id>
  bot.command("unban", async (ctx) => {
    const sender = String(ctx.from.id);
    if (!config.ownerIds.includes(sender)) {
      return ctx.reply("❌ Fitur ini cuma buat owner aja bre.");
    }

    const target = ctx.message.text?.split(" ")[1];
    if (!target || !/^\d+$/.test(target)) {
      return ctx.reply("❌ Format salah. Contoh: /unban 7502336580");
    }

    const bans = loadBans();
    if (!bans.includes(target)) {
      return ctx.reply("⚠️ User itu belum diban sebelumnya.");
    }

    const updated = bans.filter(id => id !== target);
    saveBans(updated);
    ctx.reply(`✅ User \`${target}\` berhasil di-unban.`, { parse_mode: "Markdown" });
  });

  // 📋 /listban
  bot.command("listban", async (ctx) => {
    const sender = String(ctx.from.id);
    if (!config.ownerIds.includes(sender)) {
      return ctx.reply("❌ Cuma owner yang bisa lihat daftar ban bre.");
    }

    const bans = loadBans();
    if (!bans.length) {
      return ctx.reply("📭 Belum ada user yang diban.");
    }

    const list = bans.map((id, i) => `│╭─⚬ ${i + 1}. \`${id}\``).join("\n");
    const message = `╭─❍ *DAFTAR USER TERBAN*\n${list}\n╰─────────────╯`;

    ctx.reply(message, { parse_mode: "Markdown" });
  });
};
