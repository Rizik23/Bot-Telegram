const axios = require('axios');

module.exports = (bot) => {
  bot.command('binary2text', async (ctx) => {
    try {
      const input = ctx.message.text.split(' ').slice(1).join(' ');
      if (!input) {
        return ctx.reply('Masukkan kode biner setelah perintah.\n\nContoh:\n`/binary2text 01001000 01100101 01101100 01101100 01101111`', { parse_mode: 'Markdown' });
      }

      const res = await axios.post('https://api.siputzx.my.id/api/tools/binary2text', {
        content: input
      });

      if (!res.data || !res.data.status) {
        return ctx.reply('Gagal mengonversi biner ke teks. Pastikan formatnya benar.');
      }

      ctx.reply(`🧠 *Hasil Konversi:*\n\n\`${res.data.data}\``, {
        parse_mode: 'Markdown'
      });

    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat menghubungi API. Coba lagi nanti.');
    }
  });
};
