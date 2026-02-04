const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const axios = require('axios');
const fetch = require('node-fetch');

module.exports = (bot) => {
  bot.command('pakustad2', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const text = args.length ? args.join(' ') : (ctx.message?.reply_to_message?.text || ctx.message?.reply_to_message?.caption);
    if (!text) return ctx.reply('⚠️ Masukin pertanyaannya dulu. Contoh:\n`/pakustad2 apa hukum pacaran?`', { parse_mode: 'Markdown' });

    await ctx.reply('🕌 Bertanya ke Pak Ustad...');

    // === Ambil sticker dari API Taka ===
    const tmpPath = path.join(__dirname, '../tmp/pakustad.webp');
    try {
      const stickerRes = await axios.get(`https://api.taka.my.id/tanya-ustad?quest=${encodeURIComponent(text)}`, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(stickerRes.data);
      if (buffer.length < 10240) {
        return ctx.reply('❌ Gagal ambil jawaban visual dari Pak Ustad.');
      }

      const webp = await sharp(buffer)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp()
        .toBuffer();

      fs.writeFileSync(tmpPath, webp);
      await ctx.replyWithSticker({ source: tmpPath });
      fs.unlinkSync(tmpPath);
    } catch (e) {
      console.error('[Sticker Error]', e.message);
      ctx.reply('⚠️ Gagal kirim sticker Pak Ustad.');
    }

    // === Kirim teks jawaban dari AI (GPT-4o) ===
    const prompt = `
Kamu adalah seorang ustad yang menjawab secara singkat, serius, dan sesuai syariat Islam. Jawablah pertanyaan berikut ini dengan jawaban yang singkat dan to the point.

Pertanyaan: ${text}
Jawaban:
    `.trim();

    try {
      const res = await fetch(`https://fastrestapis.fasturl.cloud/aillm/gpt-4o-turbo?ask=${encodeURIComponent(prompt)}`);
      const json = await res.json();
      if (!json || !json.result) return ctx.reply('❌ Gagal dapat jawaban dari Pak Ustad AI.');

      await ctx.reply(`📿 *Jawaban Pak Ustad:*\n\n${json.result.trim()}`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[AI Error]', err.message);
      ctx.reply('❌ Gagal menjawab via AI.');
    }
  });
};