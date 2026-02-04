const fs = require('fs');
const path = require('path');

// Path database
const dbPath = path.join(__dirname, '../data/antilink.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
let antilink = JSON.parse(fs.readFileSync(dbPath));

module.exports = (bot) => {
  // Command /antilink on | off
  bot.command('antilink', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    if (!['group', 'supergroup'].includes(ctx.chat.type)) {
      return ctx.reply('❌ Fitur ini hanya untuk grup.');
    }

    const senderId = ctx.from.id;
    const admins = await ctx.getChatAdministrators();
    const isAdmin = admins.some(admin => admin.user.id === senderId);
    if (!isAdmin) return ctx.reply('❌ Lu bukan admin.');

    const args = ctx.message.text.split(' ');
    const status = args[1]?.toLowerCase();

    if (status === 'on') {
      antilink[chatId] = true;
      fs.writeFileSync(dbPath, JSON.stringify(antilink, null, 2));
      return ctx.reply('✅ AntiLink aktif.');
    } else if (status === 'off') {
      delete antilink[chatId];
      fs.writeFileSync(dbPath, JSON.stringify(antilink, null, 2));
      return ctx.reply('✅ AntiLink dimatikan.');
    } else {
      return ctx.reply('📌 Gunakan:\n/antilink on\n/antilink off');
    }
  });

  // Middleware untuk hapus link
  bot.on('message', async (ctx, next) => {
    const chatId = ctx.chat.id.toString();
    const msg = ctx.message?.text || '';

    if (antilink[chatId]) {
      const linkPattern = /(https?:\/\/|t\.me\/|telegram\.me\/|chat\.whatsapp\.com|wa\.me\/)/i;

      if (linkPattern.test(msg)) {
        const admins = await ctx.getChatAdministrators();
        const isAdmin = admins.some(admin => admin.user.id === ctx.from.id);

        if (!isAdmin) {
          await ctx.deleteMessage().catch(() => {}); // ✅ ini dia fix-nya
        
        }
      }
    }

    next();
  });
};
 