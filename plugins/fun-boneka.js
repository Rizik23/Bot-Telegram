const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/boneka.json');

  function getList() {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[BONEKA JSON ERROR]', err.message);
      return [];
    }
  }

  function getRandom() {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  }

  bot.command('boneka', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil gambar boneka.');

    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '🧸 Boneka imut buat kamu~',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Boneka', callback_data: 'boneka_next' }]]
      }
    });
  });

  bot.action('boneka_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();

      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil gambar boneka.');

      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '🧸 Boneka baru siap peluk~',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Boneka', callback_data: 'boneka_next' }]]
        }
      });
    } catch (err) {
      console.error('[BONEKA NEXT ERROR]', err.message);
    }
  });
};
