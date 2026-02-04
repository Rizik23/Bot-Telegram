const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/justina.json');

  const getList = () => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error('[JUSTINA JSON ERROR]', e.message);
      return [];
    }
  };

  const getRandom = () => {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  };

  bot.command('justina', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil gambar Justina.');
    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '🌷 Justina versi tercantik!',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Justina', callback_data: 'justina_next' }]]
      }
    });
  });

  bot.action('justina_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil gambar Justina.');
      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '🌷 Nih Justina lagi buat kamu~',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Justina', callback_data: 'justina_next' }]]
        }
      });
    } catch (err) {
      console.error('[JUSTINA NEXT ERROR]', err.message);
    }
  });
};
