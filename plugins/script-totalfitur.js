const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  bot.command('totalfitur', async (ctx) => {
    try {
      const pluginsPath = path.join(__dirname);
      const files = fs.readdirSync(pluginsPath);
      const total = files.filter(f => f.endsWith('.js')).length;

      await ctx.reply(
        `╭──〔 📦 Total Fitur 〕──\n` +
        `├ Jumlah plugin: ${total}\n` +
        `╰────────────────────╯`
      );
    } catch (err) {
      console.error('Gagal membaca plugin:', err);
      ctx.reply('❌ Gagal membaca folder plugin.');
    }
  });
};
