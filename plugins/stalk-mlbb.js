// plugins/stalkmlbb.js
const axios = require('axios');

module.exports = (bot) => {
  bot.command('stalkmlbb', async (ctx) => {
    try {
      const input = ctx.message.text.split(' ').slice(1).join(' ');
      if (!input.includes('|')) {
        return ctx.reply('Contoh penggunaan:\n/stalkmlbb 106101371|2540');
      }

      const [userId, zoneId] = input.split('|').map(v => v.trim());

      if (!userId || !zoneId) {
        return ctx.reply('❌ Format salah. Gunakan: /stalkmlbb userId|zoneId');
      }

      const response = await axios.get('https://fastrestapis.fasturl.cloud/stalk/mlbb', {
        params: { userId, zoneId },
        headers: {
          'accept': 'application/json'
          // Tambahkan 'x-api-key': 'APIKEYMU' jika dibutuhkan
        }
      });

      const res = response.data;
      if (res.status !== 200) {
        return ctx.reply(`❌ ${res.content || 'Terjadi kesalahan'}`);
      }

      const { username, region, level, rank } = res.result;
      const message = `✨ *MLBB Stalker Result*\n\n👤 *Username:* ${username}\n🌍 *Region:* ${region}\n📈 *Level:* ${level || 'N/A'}\n🏆 *Rank:* ${rank || 'N/A'}`;
      ctx.replyWithMarkdown(message);
    } catch (err) {
      if (err.response && err.response.data) {
        const res = err.response.data;
        return ctx.reply(`❌ ${res.content || 'Terjadi kesalahan'}\n🛠 ${res.error || 'Unknown error'}`);
      } else {
        console.error(err);
        return ctx.reply('❌ Terjadi kesalahan internal saat menghubungi API.');
      }
    }
  });
};
