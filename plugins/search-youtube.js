const axios = require('axios');

module.exports = (bot) => {
  bot.command('syoutube', async (ctx) => {
    // Ambil query dari teks setelah command /youtube
    const input = ctx.message.text;
    const query = input.split(' ').slice(1).join(' ');
    if (!query) {
      return ctx.reply('Mohon masukkan kata kunci pencarian setelah perintah /syoutube');
    }

    try {
      // POST request ke API dengan body { query }
      const response = await axios.post('https://api.siputzx.my.id/api/s/youtube', {
        query: query
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.data.status || !response.data.data.length) {
        return ctx.reply('Tidak ditemukan hasil untuk pencarian tersebut.');
      }

      // Format hasil pencarian menjadi teks
      const results = response.data.data.slice(0, 5).map((item, i) => {
        if (item.type === 'channel') {
          return `📺 Channel: ${item.name}\n📄 About: ${item.about}\n🔗 Link: ${item.url}\nSubs: ${item.subCountLabel}\n`;
        } else if (item.type === 'video') {
          return `🎬 Video: ${item.title}\n👤 Author: ${item.author.name}\n⏱ Duration: ${item.duration.timestamp}\n👁 Views: ${item.views}\n🔗 Link: ${item.url}\n`;
        }
        return '';
      }).join('\n');

      return ctx.reply(`Hasil pencarian YouTube untuk: *${query}*\n\n${results}`, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error(error);
      return ctx.reply('Terjadi kesalahan saat mencari data YouTube.');
    }
  });
};
