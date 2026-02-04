const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = (bot) => {
  const filePath = path.join(__dirname, '../media/randompics/asupan.json');

  const getList = () => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error('[ASUPAN JSON ERROR]', e.message);
      return [];
    }
  };

  const getRandom = () => {
    const list = getList();
    return list[Math.floor(Math.random() * list.length)];
  };

  async function getDirectVideo(videyUrl) {
    try {
      const { data } = await axios.get(videyUrl);
      const $ = cheerio.load(data);
      const src = $('video source').attr('src');
      if (src && src.endsWith('.mp4')) return src;
      return null;
    } catch (e) {
      console.error('[SCRAPE ERROR]', e.message);
      return null;
    }
  }

  bot.command('bokep', async (ctx) => {
    const item = getRandom();
    const mp4Url = await getDirectVideo(item.url);

    if (!mp4Url) return ctx.reply('❌ Gagal ambil video dari halaman.');

    await ctx.replyWithVideo({ url: mp4Url }, {
      caption: '🍑 Nih asupan dari videy.co!',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Asupan', callback_data: 'asupanscrape_next' }]]
      }
    });
  });

  bot.action('asupanscrape_next', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();

      const item = getRandom();
      const mp4Url = await getDirectVideo(item.url);

      if (!mp4Url) return ctx.reply('❌ Gagal ambil video dari halaman.');

      await ctx.replyWithVideo({ url: mp4Url }, {
        caption: '🍑 Nih lagi asupan baru!',
        reply_markup: {
          inline_keyboard: [[{ text: '➡️ Next Asupan', callback_data: 'asupanscrape_next' }]]
        }
      });
    } catch (err) {
      console.error('[ASUPAN NEXT ERROR]', err.message);
      ctx.reply('❌ Error kirim video.');
    }
  });
};
