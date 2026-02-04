const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/ppcouple.json');

  const getList = () => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error('[PPCOUPLE JSON ERROR]', e.message);
      return [];
    }
  };

  const getRandom = () => {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  };

  bot.command('ppcouple', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil gambar pp couple.');
    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '💞 PP Couple romantis gitu~',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Couple', callback_data: 'ppcouple_next' }]]
      }
    });
  });

  bot.action('ppcouple_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil gambar pp couple.');
      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '💞 Nih PP Couple lain buat kamu!',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Couple', callback_data: 'ppcouple_next' }]]
        }
      });
    } catch (err) {
      console.error('[PPCOUPLE NEXT ERROR]', err.message);
    }
  });
};
