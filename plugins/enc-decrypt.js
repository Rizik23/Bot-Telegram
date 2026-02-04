const fs = require('fs');
const path = require('path');
const { webcrack } = require('webcrack');

module.exports = (bot) => {
  bot.command(['dec', 'decrypt'], async (ctx) => {
    const reply = ctx.message.reply_to_message;
    const usage = `*Usage:*\nBalas ke _kode JavaScript obfuscated_ atau _file dokumen .js_ untuk didecrypt.\n\nKetik: \`/decrypt\``;

    if (!reply) return ctx.reply(usage, { parse_mode: 'Markdown' });

    try {
      let content = '';

      // Ambil isi dari file reply
      if (reply.document) {
        const file = reply.document;
        const link = await ctx.telegram.getFileLink(file.file_id);
        const response = await fetch(link.href);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        content = buffer.toString('utf-8');
      } else if (reply.text) {
        content = reply.text;
      } else {
        return ctx.reply('⚠️ Tidak ada teks atau dokumen valid yang bisa didecrypt.');
      }

      // Kirim progres decrypt
      const progress = await ctx.reply('🚀 Mulai decrypt by Galaxy MD...');
      const steps = [10, 20, 30, 35, 45, 55, 65, 77, 80, 89, 95, 100];

      for (let p of steps) {
        await new Promise(r => setTimeout(r, 300));
        await ctx.telegram.editMessageText(ctx.chat.id, progress.message_id, null, `🔓 Decrypting... ${p}%`);
      }

      // Gunakan webcrack untuk membuka obfuscated JS
      const result = await webcrack(content, {
        simplify: true,         // Buka dan sederhanakan code
        rename: true,           // Rename nama variabel acak menjadi readable
        constantEvaluate: true, // Evaluasi ekspresi konstanta
        deadCode: true          // Hapus kode mati
      });

      const fileName = 'decrypt_noxxa_.js';
      const filePath = path.join(__dirname, '..', 'temp', fileName);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, result.code);

      await ctx.telegram.editMessageText(ctx.chat.id, progress.message_id, null, '✅ Selesai decrypt!');
      await ctx.replyWithDocument(
        { source: filePath, filename: fileName },
        { caption: '✅ File berhasil didecrypt oleh Galaxy MD!' }
      );

      // Bersihkan file sementara
      setTimeout(() => fs.unlink(filePath, () => {}), 5000);

    } catch (err) {
      console.error(err);
      return ctx.reply(`❌ Gagal decrypt: ${err.message}`);
    }
  });
};