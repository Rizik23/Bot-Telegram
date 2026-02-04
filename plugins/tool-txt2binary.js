const axios = require('axios');

module.exports = (bot) => {
  bot.command('text2binary', async (ctx) => {
    try {
      const inputText = ctx.message.text.split(' ').slice(1).join(' ').trim();
      if (!inputText) {
        return ctx.reply('❌ Harap masukkan teks setelah perintah. Contoh:\n/text2binary Hello');
      }

      const response = await axios.post(
        'https://api.siputzx.my.id/api/tools/text2binary',
        { content: inputText },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data && response.data.status && response.data.data) {
        return ctx.reply(`💻 Binary representation:\n${response.data.data}`);
      } else {
        return ctx.reply('❌ Gagal mengonversi teks ke binary.');
      }
    } catch (error) {
      console.error(error);
      ctx.reply('❌ Terjadi kesalahan saat memproses permintaan.');
    }
  });
};
