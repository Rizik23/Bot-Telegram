const axios = require('axios');

module.exports = (bot) => {
  bot.command('base642text', async (ctx) => {
    try {
      const input = ctx.message.text.split(' ').slice(1).join(' ');
      if (!input) {
        return ctx.reply('Masukkan kode Base64 setelah perintah.\n\nContoh:\n`/base642text SGVsbG8gV29ybGQ=`', { parse_mode: 'Markdown' });
      }

      const res = await axios.post('https://api.siputzx.my.id/api/tools/base642text', {
        base64: input
      });

      if (!res.data || !res.data.status) {
        return ctx.reply('Gagal mendecode Base64. Pastikan formatnya benar.');
      }

      ctx.reply(`🧾 *Hasil Decode:*\n\n\`${res.data.data.text}\``, {
        parse_mode: 'Markdown'
      });

    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat menghubungi API. Coba lagi nanti.');
    }
  });
};
