const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

module.exports = (bot) => {
  const getStickerSetName = (username) => `pakustad_by_${username}`; // nama unik pack

  bot.command('pakustad', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const text = args.length ? args.join(' ') : (ctx.message?.reply_to_message?.text || ctx.message?.reply_to_message?.caption);

    if (!text) return ctx.reply('⚠️ Masukin teksnya dulu, contoh: /pakustad dosa pacaran?');

    const username = (await ctx.telegram.getMe()).username;
    const stickerSetName = getStickerSetName(username);
    const stickerSetTitle = `🕌 Jawaban Pak Ustad by ${username}`;
    const userId = ctx.from.id;

    await ctx.reply('🕋 Sedang bertanya ke pak ustad...');

    try {
      const res = await axios.get(`https://api.taka.my.id/tanya-ustad?quest=${encodeURIComponent(text)}`, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(res.data);
      if (buffer.length < 10240) return ctx.reply('❌ Jawaban dari pak ustad terlalu pendek.');

      const webpBuffer = await sharp(buffer)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp()
        .toBuffer();

      const tempPath = path.join(__dirname, '../tmp/pakustad.webp');
      fs.writeFileSync(tempPath, webpBuffer);

      // 1. Kirim dulu sticker-nya
      await ctx.replyWithSticker({ source: tempPath });

      // 2. Tambahkan ke pack (diam-diam 😎)
      try {
        await ctx.telegram.addStickerToSet(userId, stickerSetName, {
          emojis: '🕌',
          png_sticker: { source: tempPath }
        });
      } catch (e) {
        if (e.response?.description?.includes('STICKERSET_INVALID')) {
          // Bikin pack baru kalau belum ada
          await ctx.telegram.createNewStickerSet(userId, stickerSetName, stickerSetTitle, {
            emojis: '🕌',
            png_sticker: { source: tempPath }
          });
        } else {
          console.error('[Sticker Set Error]', e.message);
        }
      }

      fs.unlinkSync(tempPath);
    } catch (err) {
      console.error('[Pakustad Error]', err.message);
      ctx.reply('❌ Gagal dapet jawaban dari pak ustad.');
    }
  });
};
