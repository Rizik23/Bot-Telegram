const axios = require('axios');

module.exports = (bot) => {
  bot.command('qr', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1).join(' ').split('|');
    const data = args[0]?.trim();
    const type = args[1]?.trim() || 'link'; // default link kalau gak dikasih

    if (!data) return ctx.reply('⚠️ Contoh:\n`/qr https://google.com|link`', { parse_mode: 'Markdown' });

    const supportedTypes = ['text', 'vcard', 'link', 'email', 'phone', 'sms', 'is', 'wifi'];
    if (!supportedTypes.includes(type)) {
      return ctx.reply(`❌ *Type tidak valid!*\nGunakan salah satu dari:\n${supportedTypes.map(t => `• \`${t}\``).join('\n')}`, { parse_mode: 'Markdown' });
    }

    const apiUrl = 'https://fastrestapis.fasturl.cloud/tool/qr/generator';
    const params = new URLSearchParams({ data, type });

    try {
      const res = await axios.get(`${apiUrl}?${params.toString()}`, {
        responseType: 'arraybuffer',
        headers: { accept: 'image/png' }
      });

      await ctx.replyWithPhoto({ source: Buffer.from(res.data) }, {
        caption: `✅ QR Code berhasil dibuat!\n📄 Type: \`${type}\`\n🔗 Data: \`${data}\``,
        parse_mode: 'Markdown'
      });

    } catch (err) {
      console.error(err.response?.data || err.message);
      ctx.reply('❌ Gagal generate QR!');
    }
  });
};
