const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/kayes.json');

  function getList() {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[KAYES JSON ERROR]', err.message);
      return [];
    }
  }

  function getRandom() {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  }

  bot.command('kayes', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil gambar Kayes.');

    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '🌸 Nih Kayes spesial buat kamu!',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Kayes', callback_data: 'kayes_next' }]]
      }
    });
  });

  bot.action('kayes_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();

      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil gambar Kayes.');

      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '🌸 Kayes baru muncul lagi~',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Kayes', callback_data: 'kayes_next' }]]
        }
      });
    } catch (err) {
      console.error('[KAYES NEXT ERROR]', err.message);
    }
  });
};
