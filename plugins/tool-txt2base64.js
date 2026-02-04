const axios = require('axios');

module.exports = (bot) => {
  bot.command('text2base64', async (ctx) => {
    try {
      const inputText = ctx.message.text.split(' ').slice(1).join(' ').trim();
      if (!inputText) {
        return ctx.reply('❌ Harap masukkan teks setelah perintah. Contoh:\n/text2base64 Hello World');
      }

      const response = await axios.post(
        'https://api.siputzx.my.id/api/tools/text2base64',
        { text: inputText },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data && response.data.status && response.data.data.base64) {
        return ctx.reply(`🔐 Base64 encoding:\n${response.data.data.base64}`);
      } else {
        return ctx.reply('❌ Gagal mengonversi teks ke Base64.');
      }
    } catch (error) {
      console.error(error);
      ctx.reply('❌ Terjadi kesalahan saat memproses permintaan.');
    }
  });
};
