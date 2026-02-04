const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/cat.json');

  function getList() {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[CAT JSON ERROR]', err.message);
      return [];
    }
  }

  function getRandom() {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  }

  bot.command('cat', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil gambar kucing.');

    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '🐱 Kucing imut menyerang!',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Cat', callback_data: 'cat_next' }]]
      }
    });
  });

  bot.action('cat_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();

      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil gambar kucing.');

      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '🐱 Nyaa~ kucing baru hadir~',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Cat', callback_data: 'cat_next' }]]
        }
      });
    } catch (err) {
      console.error('[CAT NEXT ERROR]', err.message);
    }
  });
};
