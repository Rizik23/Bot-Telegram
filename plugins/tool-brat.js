const axios = require('axios');

module.exports = (bot) => {
  bot.command('brat', async (ctx) => {
    try {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length === 0) return ctx.reply('Gunakan: /brat <teks> [--gif] [--delay=500]');

      // Parsing argumen
      const textParts = [];
      let isAnimated = false;
      let delay = 500;

      for (let arg of args) {
        if (arg === '--gif') isAnimated = true;
        else if (arg.startsWith('--delay=')) delay = parseInt(arg.split('=')[1]);
        else textParts.push(arg);
      }

      const text = textParts.join(' ');
      if (!text) return ctx.reply('Teks tidak boleh kosong!');

      // Validasi delay
      if (isAnimated && (delay < 100 || delay > 1500)) {
        return ctx.reply('Delay harus antara 100–1500 ms.');
      }

      await ctx.reply('🌿 Generating stiker brat...');

      const url = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=${isAnimated}&delay=${delay}`;

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'accept': '*/*',
        },
      });

      const buffer = Buffer.from(response.data);

      // Kirim sebagai sticker (auto detect WebP/GIF)
      await ctx.replyWithSticker({ source: buffer });
    } catch (err) {
      console.error('❌ Error brat:', err);
      ctx.reply('Gagal membuat stiker brat. Coba lagi nanti ya!');
    }
  });
};
