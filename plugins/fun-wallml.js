const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/wallml.json');

  const getList = () => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error('[WALLML JSON ERROR]', e.message);
      return [];
    }
  };

  const getRandom = () => {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  };

  bot.command('wallml', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil wallpaper ML.');
    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '🎮 Wallpaper Mobile Legends~',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next ML', callback_data: 'wallml_next' }]]
      }
    });
  });

  bot.action('wallml_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil wallpaper ML.');
      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '🎮 Wallpaper ML lain siap pake!',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next ML', callback_data: 'wallml_next' }]]
        }
      });
    } catch (err) {
      console.error('[WALLML NEXT ERROR]', err.message);
    }
  });
};
