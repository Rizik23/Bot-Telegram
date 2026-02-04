const axios = require('axios');
const { Markup } = require('telegraf');

module.exports = (bot) => {
  bot.command('animequote', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ').trim();

    if (!query) {
      return ctx.reply('🔍 Gunakan format:\n/animequote <kata kunci>\n\nContoh:\n/animequote cat');
    }

    try {
      const res = await axios.post('https://api.siputzx.my.id/api/s/animequotes', {
        query: query
      });

      const data = res.data?.data;

      if (!data || data.length === 0) {
        return ctx.reply('❌ Kutipan tidak ditemukan untuk kata kunci itu.');
      }

      // Kirim maksimal 3 kutipan agar tidak terlalu panjang
      const results = data.slice(0, 3);

      for (const quote of results) {
        await ctx.replyWithPhoto(
          { url: quote.gambar },
          {
            caption: `🎭 *${quote.karakter}* (${quote.anime})\n🎬 *${quote.episode}*\n\n📝 "${quote.quotes}"\n\n🔗 [Lihat di Otakotaku](${quote.link})`,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              Markup.button.url('🌐 Buka Link', quote.link)
            ])
          }
        );
      }
    } catch (err) {
      console.error('Error:', err.message);
      return ctx.reply('⚠️ Terjadi kesalahan saat mengambil data dari server.');
    }
  });
};
