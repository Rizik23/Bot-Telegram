const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/antimedia.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
let antimedia = JSON.parse(fs.readFileSync(dbPath));

module.exports = (bot) => {
  bot.command('antimedia', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    if (!ctx.chat.type.includes('group')) return ctx.reply('❌ Grup Only.');
    const admins = await ctx.getChatAdministrators();
    const isAdmin = admins.some(admin => admin.user.id === ctx.from.id);
    if (!isAdmin) return ctx.reply('❌ Cuma admin yang bisa.');

    const cmd = ctx.message.text.split(' ')[1];
    if (cmd === 'on') {
      antimedia[chatId] = true;
      fs.writeFileSync(dbPath, JSON.stringify(antimedia, null, 2));
      return ctx.reply('✅ Anti Media ON');
    } else if (cmd === 'off') {
      delete antimedia[chatId];
      fs.writeFileSync(dbPath, JSON.stringify(antimedia, null, 2));
      return ctx.reply('✅ Anti Media OFF');
    } else {
      return ctx.reply('📌 /antimedia on | off');
    }
  });

  bot.on('message', async (ctx, next) => {
    const chatId = ctx.chat.id.toString();
    if (!antimedia[chatId]) return next();

    if (!ctx.message.photo && !ctx.message.video) return next();
    const admins = await ctx.getChatAdministrators();
    const isAdmin = admins.some(admin => admin.user.id === ctx.from.id);
    if (!isAdmin) {
      try {
        await ctx.deleteMessage();
      } catch (e) {}
    }

    next();
  });
};
