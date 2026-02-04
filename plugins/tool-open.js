const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  bot.command('open', async (ctx) => {
    const reply = ctx.message.reply_to_message;

    if (!reply || !reply.document) {
      return ctx.reply('❗ Reply ke file yang mau dibuka dengan perintah /open');
    }

    const file = reply.document;
    const fileId = file.file_id;
    const fileName = file.file_name || 'file.txt';
    const ext = path.extname(fileName).toLowerCase();

    const allowedExt = ['.js', '.json', '.txt', '.md', '.html', '.css', '.ts'];
    if (!allowedExt.includes(ext)) {
      return ctx.reply(`❌ File tidak didukung untuk dibuka (ekstensi: ${ext})`);
    }

    try {
      const link = await ctx.telegram.getFileLink(fileId);
      const res = await fetch(link.href);
      const content = await res.text();

      const MAX_LENGTH = 4000;
      const safeContent = content.length > MAX_LENGTH
        ? content.slice(0, MAX_LENGTH) + '\n\n... (dipotong, terlalu panjang)'
        : content;

      await ctx.reply(`<b>📂 Isi file: ${fileName}</b>\n\n<pre><code class="language-js">${escapeHTML(safeContent)}</code></pre>`, {
        parse_mode: 'HTML'
      });
    } catch (err) {
      console.error('[OPEN FILE ERROR]', err.message);
      ctx.reply('❌ Gagal membaca file.');
    }
  });
};

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}