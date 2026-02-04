const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/aesthetic.json');

  function getList() {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      return data;
    } catch (err) {
      console.error('[AESTHETIC JSON ERROR]', err.message);
      return [];
    }
  }

  function getRandom() {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  }

  bot.command('aesthetic', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil data aesthetic.');

    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '🌸 Aesthetic vibes just for you~',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Aesthetic', callback_data: 'aesthetic_next' }]]
      }
    });
  });

  bot.action('aesthetic_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil data aesthetic.');

      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '🌸 Another aesthetic drop incoming~',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Aesthetic', callback_data: 'aesthetic_next' }]]
        }
      });
    } catch (err) {
      console.error('[AESTHETIC NEXT ERROR]', err.message);
      ctx.reply('❌ Error saat kirim foto aesthetic.');
    }
  });
};
