const fs = require('fs');
const dbPath = './db.json';


function loadDB() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = (bot) => {
  bot.command('setforwardchat', async (ctx) => {
    const isGroup = ['group', 'supergroup'].includes(ctx.chat.type);
    if (!isGroup) return ctx.reply("Perintah ini hanya bisa digunakan di grup.");

    const userId = ctx.from.id;
    const chatId = ctx.chat.id;

    const member = await ctx.telegram.getChatMember(chatId, userId);
    if (!['creator', 'administrator'].includes(member.status)) {
      return ctx.reply("Hanya admin yang bisa mengubah pengaturan ini.");
    }

    const args = ctx.message.text.split(' ')[1];
    if (!['on', 'off'].includes(args)) {
      return ctx.reply("Gunakan: /setforwardchat on atau /setforwardchat off");
    }

    const db = loadDB();
    db[chatId] = db[chatId] || {};
    db[chatId].forward_protection = args === 'on';
    saveDB(db);

    return ctx.reply(`Fitur proteksi forward telah ${args === 'on' ? 'diaktifkan' : 'dinonaktifkan'}.`);
  });

  bot.on('message', async (ctx, next) => {
    const isGroup = ['group', 'supergroup'].includes(ctx.chat.type);
    const msg = ctx.message;
    const chatId = ctx.chat.id;

    if (!isGroup || !msg || msg.from.is_bot || msg.sender_chat) return next();

    const db = loadDB();
    const setting = db[chatId]?.forward_protection;
    if (!setting) return next();

    const isForwarded = msg.forward_date;
    if (!isForwarded) return next();

    try {
      const member = await ctx.telegram.getChatMember(chatId, msg.from.id);
      if (['creator', 'administrator'].includes(member.status)) return next();
      await ctx.deleteMessage();
      console.log(`Forwarded message from ${msg.from.username || msg.from.first_name} deleted.`);
    } catch (err) {
      console.error("Error deleting message:", err.message);
    }

    return next();
  });
};
