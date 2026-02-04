const axios = require('axios');

module.exports = (bot) => {
  bot.command('countryinfo', async (ctx) => {
    try {
      const input = ctx.message.text.split(' ').slice(1).join(' ');
      if (!input) {
        return ctx.reply('Masukkan nama negara setelah perintah.\n\nContoh:\n`/countryinfo Indonesia`', { parse_mode: 'Markdown' });
      }

      const res = await axios.post('https://api.siputzx.my.id/api/tools/countryInfo', {
        name: input
      });

      const { data } = res.data;

      if (!data) {
        return ctx.reply('Negara tidak ditemukan atau tidak valid.');
      }

      const caption = `
🌍 *${data.name}* (${res.data.searchMetadata.originalQuery})
📍 *Capital:* ${data.capital}
📞 *Phone Code:* ${data.phoneCode}
🌐 *Continent:* ${data.continent.name} ${data.continent.emoji}
🗺️ [Google Maps](${data.googleMapsLink})
📏 *Area:* ${data.area.squareKilometers} km²
🏳️ *TLD:* ${data.internetTLD}
💰 *Currency:* ${data.currency}
🗣️ *Languages:* ${data.languages.native.join(', ')}
🧭 *Driving Side:* ${data.drivingSide}
⚖️ *Government:* ${data.constitutionalForm}
🍺 *Alcohol Prohibition:* ${data.alcoholProhibition}
🌟 *Famous For:* ${data.famousFor}
      `.trim();

      await ctx.replyWithPhoto(
        { url: data.flag },
        {
          caption,
          parse_mode: 'Markdown',
        }
      );

      // Info negara tetangga (opsional)
      if (data.neighbors && data.neighbors.length) {
        const neighborText = data.neighbors.map(n => `🧭 *${n.name}*\n📍 [Maps](https://www.google.com/maps/place/${n.coordinates.latitude},${n.coordinates.longitude})`).join('\n\n');
        await ctx.reply(`🌐 *Negara Tetangga:*\n\n${neighborText}`, { parse_mode: 'Markdown' });
      }

    } catch (err) {
      console.error(err);
      ctx.reply('Gagal mengambil informasi negara. Coba lagi nanti atau pastikan nama negara valid.');
    }
  });
};
