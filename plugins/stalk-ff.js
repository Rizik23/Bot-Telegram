
        // stalkff.js
const axios = require('axios');
const { unlinkSync } = require('fs');
const { writeFile } = require('fs/promises');
const path = require('path');
const https = require('https');

module.exports = (bot) => {
  bot.command('stalkff', async (ctx) => {
    const msg = ctx.message.text.trim().split(' ');
    const id = msg[1];

    if (!id) {
      return ctx.reply('❌ Masukin ID akun Free Fire-nya!\nContoh: /stalkff 123456789');
    }

    const proses = await ctx.reply('🔍 Lagi cari data FF-nya, sabar bre...');

    try {
      const { data } = await axios.get(`https://ff.lxonfire.workers.dev/?id=${id}`);

      if (!data || !data.nickname) {
        return ctx.reply('❌ Gagal menemukan data untuk ID tersebut.');
      }

      const caption = `
<b>👤 Nickname:</b> <code>${data.nickname}</code>
<b>🌍 Region:</b> <code>${data.region}</code>
<b>🆔 OpenID:</b> <code>${data.open_id}</code>
`.trim();

      const imgUrl = data.img_url;
      const fileName = `ff_${Date.now()}.jpg`;
      const filePath = path.join(__dirname, fileName);

      const writer = require('fs').createWriteStream(filePath);
      https.get(imgUrl, (res) => {
        res.pipe(writer);
        writer.on('finish', async () => {
          await ctx.replyWithPhoto({ source: filePath }, { caption, parse_mode: 'HTML' });
          unlinkSync(filePath);
        });
      });

      await ctx.telegram.deleteMessage(ctx.chat.id, proses.message_id);
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Terjadi error saat mengambil data.');
    }
  });
};
