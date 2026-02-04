const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/blackpink.json');

  const getList = () => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error('[BLACKPINK JSON ERROR]', e.message);
      return [];
    }
  };

  const getRandom = () => {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  };

  bot.command('blackpink', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil gambar Blackpink.');
    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '🖤💗 Blackpink in your area~',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Blackpink', callback_data: 'blackpink_next' }]]
      }
    });
  });

  bot.action('blackpink_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil gambar Blackpink.');
      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '🖤💗 Blackpink lagi nih!',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Blackpink', callback_data: 'blackpink_next' }]]
        }
      });
    } catch (err) {
      console.error('[BLACKPINK NEXT ERROR]', err.message);
    }
  });
};
