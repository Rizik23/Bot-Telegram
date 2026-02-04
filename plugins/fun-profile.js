const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/profile.json');

  const getList = () => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error('[PROFILE JSON ERROR]', e.message);
      return [];
    }
  };

  const getRandom = () => {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  };

  bot.command('profile2', async (ctx) => {
    const pick = getRandom();
    if (!pick) return ctx.reply('❌ Gagal ambil gambar profile.');
    await ctx.replyWithPhoto({ url: pick.url }, {
      caption: '🧑 Foto profile aesthetic~',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Profile', callback_data: 'profile_next' }]]
      }
    });
  });

  bot.action('profile_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      const pick = getRandom();
      if (!pick) return ctx.reply('❌ Gagal ambil gambar profile.');
      await ctx.replyWithPhoto({ url: pick.url }, {
        caption: '🧑 Ganti profile baru nih!',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Profile', callback_data: 'profile_next' }]]
        }
      });
    } catch (err) {
      console.error('[PROFILE NEXT ERROR]', err.message);
    }
  });
};
