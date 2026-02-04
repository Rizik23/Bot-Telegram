const axios = require('axios');

module.exports = (bot) => {
  bot.command('fakexnxx', async (ctx) => {
    // Ambil parameter dari teks setelah perintah
    // Format: /fakexnxx <name>|<quote>|<likes>|<dislikes>
    const input = ctx.message.text.split(' ').slice(1).join(' ');
    if (!input) {
      return ctx.reply('Usage:\n/fakexnxx <name>|<quote>|<likes>|<dislikes>\n\nExample:\n/fakexnxx Nelson Mandela|Keberanian bukanlah tidak adanya ketakutan, tetapi kemenangan atas ketakutan itu.|2|0');
    }

    // Pisahkan input dengan delimiter "|"
    const parts = input.split('|');
    if (parts.length < 4) {
      return ctx.reply('Format salah. Harus ada 4 bagian dipisah "|": name, quote, likes, dislikes');
    }

    const [name, quote, likes, dislikes] = parts.map(p => p.trim());

    try {
      const response = await axios.post(
        'https://api.siputzx.my.id/api/canvas/fake-xnxx',
        { name, quote, likes, dislikes },
        { responseType: 'arraybuffer', headers: { 'Content-Type': 'application/json' } }
      );

      // Kirim foto hasil gambar (buffer)
      await ctx.replyWithPhoto({ source: Buffer.from(response.data) });

    } catch (error) {
      console.error(error);
      ctx.reply('Gagal membuat gambar, coba lagi nanti.');
    }
  });
};
