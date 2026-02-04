const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/cosplay.json');

  function getList() {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      return data;
    } catch (err) {
      console.error('[COSPLAY JSON ERROR]', err.message);
      return [];
    }
  }

  function getRandom() {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  }

  bot.command('cosplay', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil data cosplay.');

    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '📸 Cosplay random buat kamu!',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Cosplay', callback_data: 'cosplay_next' }]]
      }
    });
  });

  bot.action('cosplay_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil data cosplay.');

      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '📸 Cosplay baru nih!',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Cosplay', callback_data: 'cosplay_next' }]]
        }
      });
    } catch (err) {
      console.error('[COSPLAY NEXT ERROR]', err.message);
      ctx.reply('❌ Error saat ambil foto baru.');
    }
  });
};
