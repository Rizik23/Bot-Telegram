const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();

module.exports = (bot) => {
  bot.command('ytmp3d', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const url = args[1];
    const chatId = ctx.chat.id;

    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return ctx.reply('📌 Kirim link YouTube yang valid!\nContoh: /ytmp3 https://youtu.be/xxxx', {
        parse_mode: 'Markdown',
      });
    }

    try {
      await ctx.reply('⏳ Lagi ambil data dari YouTube bro, sabar ya...');

      const result = await dy_scrap.ytMp3(url); // <- ini method yang bener

      const {
        title,
        dl_url,
        thumb,
        duration,
        quality,
        filesize,
        channel
      } = result;

      const caption = `
<b>🎵 Title:</b> ${title}
<b>👤 Channel:</b> ${channel || '-'}
<b>📦 Quality:</b> ${quality || '-'}
<b>🕒 Duration:</b> ${duration || '-'}
<b>💾 Size:</b> ${filesize || '-'}
      `.trim();

      await ctx.replyWithPhoto({ url: thumb }, {
        caption,
        parse_mode: 'HTML',
      });

      await ctx.replyWithAudio({ url: dl_url }, {
        title,
        performer: channel || 'YouTube MP3',
      });

    } catch (err) {
      console.error('[YTMP3 ERROR]', err.message);
      ctx.reply('❌ Gagal ambil data. Mungkin link-nya error atau video-nya dibatasi.');
    }
  });
};
