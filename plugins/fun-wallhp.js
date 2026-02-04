const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/wallhp.json');

  const getList = () => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error('[WALLHP JSON ERROR]', e.message);
      return [];
    }
  };

  const getRandom = () => {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  };

  bot.command('wallhp', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil wallpaper HP.');
    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '📱 Wallpaper HP kece!',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Wallpaper', callback_data: 'wallhp_next' }]]
      }
    });
  });

  bot.action('wallhp_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil wallpaper HP.');
      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '📱 Wallpaper baru siap ganti!',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Wallpaper', callback_data: 'wallhp_next' }]]
        }
      });
    } catch (err) {
      console.error('[WALLHP NEXT ERROR]', err.message);
    }
  });
};
