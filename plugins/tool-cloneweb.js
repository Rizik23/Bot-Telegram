const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  bot.command('cloneweb', async (ctx) => {
    const input = ctx.message.text.split(' ');
    const url = input[1];

    if (!url) {
      return ctx.reply(
        `<b>Contoh penggunaan:</b>\n<code>/cloneweb https://example.com</code>`,
        { parse_mode: 'HTML' }
      );
    }

    if (!/^https?:\/\//i.test(url)) {
      return ctx.reply(
        `<b>⚠️ URL tidak valid!</b>\nGunakan format lengkap seperti:\n<blockquote>https://example.com</blockquote>`,
        { parse_mode: 'HTML' }
      );
    }

    await ctx.reply(
      `<i>⏳ Mengambil source code dari:</i>\n<blockquote>${url}</blockquote>`,
      { parse_mode: 'HTML' }
    );

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (TelegramBot)'
        }
      });

      const htmlContent = response.data;
      const filename = `source_${Date.now()}.html`;
      const filepath = path.join(__dirname, filename);

      fs.writeFileSync(filepath, htmlContent, 'utf8');

      // Ambil <title>
      const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1] : '(tidak ada <title>)';

      // Ambil <meta name="description">
      const metaMatch = htmlContent.match(
        /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
      );
      const metaDescription = metaMatch ? metaMatch[1] : '(tidak ada deskripsi)';

      // Tampilkan cuplikan info
      await ctx.reply(
        `<b>🔍 Cuplikan Info Halaman</b>\n` +
        `<b>🌐 URL:</b> <a href="${url}">${url}</a>\n` +
        `<b>📝 Judul:</b> <i>${pageTitle}</i>\n` +
        `<b>📃 Deskripsi:</b>\n<blockquote>${metaDescription}</blockquote>`,
        { parse_mode: 'HTML' }
      );

      // Kirim file hasil
      await ctx.replyWithDocument(
        { source: filepath, filename },
        {
          caption:
            `<b>📄 Source Code</b>\n` +
            `<b>🌐:</b> <a href="${url}">${url}</a>\n` +
            `<b>📝:</b> <i>${pageTitle}</i>`,
          parse_mode: 'HTML'
        }
      );

      fs.unlinkSync(filepath);
    } catch (err) {
      console.error(err);
      ctx.reply(
        `<b>❌ Gagal mengambil source code!</b>\nPeriksa kembali URL atau koneksi internet.`,
        { parse_mode: 'HTML' }
      );
    }
  });
};