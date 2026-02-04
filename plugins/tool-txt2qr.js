const axios = require('axios');

module.exports = (bot) => {
  bot.command('text2qr', async (ctx) => {
    try {
      const input = ctx.message.text.split(' ').slice(1).join(' ');
      if (!input) return ctx.reply('❌ Mohon masukkan teks setelah perintah.\nContoh:\n/text2qr Hello World');

      // Request ke API text2qr
      const response = await axios.post(
        'https://api.siputzx.my.id/api/tools/text2qr',
        { text: input },
        { responseType: 'arraybuffer', headers: { 'Content-Type': 'application/json' } }
      );

      // Kirim gambar QR code sebagai foto
      await ctx.replyWithPhoto({ source: Buffer.from(response.data) }, { caption: `QR Code untuk:\n${input}` });
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal membuat QR code, coba lagi nanti.');
    }
  });
};
