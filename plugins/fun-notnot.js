const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/notnot.json');

  const getList = () => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error('[NOTNOT JSON ERROR]', e.message);
      return [];
    }
  };

  const getRandom = () => {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  };

  bot.command('notnot', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil gambar Notnot.');
    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '😍 Notnot hadir~',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Notnot', callback_data: 'notnot_next' }]]
      }
    });
  });

  bot.action('notnot_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil gambar Notnot.');
      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '😍 Nih Notnot baru!',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Notnot', callback_data: 'notnot_next' }]]
        }
      });
    } catch (err) {
      console.error('[NOTNOT NEXT ERROR]', err.message);
    }
  });
};
