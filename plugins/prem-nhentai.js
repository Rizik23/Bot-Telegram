const axios = require('axios');
const { Markup } = require('telegraf');

module.exports = (bot) => {
  bot.command('nhentai', async (ctx) => {
    const input = ctx.message.text.split(' ').slice(1);
    const query = input[0];
    const page = input[1] || 1;

    if (!query) {
      return ctx.reply('Gunakan format:\n/nhentai <query> <page>');
    }

    try {
      const res = await axios.get(`https://fastrestapis.fasturl.cloud/comic/nhentaisearch?query=${encodeURIComponent(query)}&page=${page}`, {
        headers: {
          'accept': 'application/json',
        },
      });

      const comics = res.data.result.comics;
      if (!comics || comics.length === 0) {
        return ctx.reply('Tidak ditemukan hasil untuk query tersebut.');
      }

      for (const comic of comics.slice(0, 10)) {
        await ctx.replyWithPhoto(
          { url: comic.thumb },
          {
            caption: `📚 *${comic.title}*\n🔗 [Buka Galeri](${comic.url})`,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              Markup.button.url('🔗 Buka di NHentai', comic.url)
            ])
          }
        );
      }
    } catch (err) {
      console.error('NHentai error:', err);
      ctx.reply('Gagal mengambil data dari NHentai.');
    }
  });
};
