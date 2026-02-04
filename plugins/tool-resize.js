const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

module.exports = (bot) => {
  bot.command('resize', async (ctx) => {
    try {
      const q = ctx.message.reply_to_message;
      if (!q) return ctx.reply('Silakan reply gambar yang ingin di-resize.');

      // Cek gambar di reply
      let fileId;
      if (q.photo) {
        // ambil ukuran terbesar
        fileId = q.photo[q.photo.length - 1].file_id;
      } else if (q.document && q.document.mime_type.startsWith('image/')) {
        fileId = q.document.file_id;
      } else {
        return ctx.reply('Media yang di-reply bukan gambar.');
      }

      // Download file buffer
      const buffer = await ctx.telegram.getFileBuffer(fileId);

      // Resize pakai sharp ke maxWidth 512, auto height
      const resizedBuffer = await sharp(buffer)
        .resize({ width: 512, withoutEnlargement: true })
        .toBuffer();

      // Simpan sementara
      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const tempPath = path.join(tmpDir, `resized_${Date.now()}.jpg`);
      fs.writeFileSync(tempPath, resizedBuffer);

      // Kirim hasil resize
      await ctx.replyWithPhoto({ source: tempPath }, { caption: 'Gambar sudah di-resize (max width 512px).' });

      // Hapus file sementara setelah 30 detik
      setTimeout(() => {
        try {
          fs.unlinkSync(tempPath);
        } catch (err) {
          console.error('Gagal hapus file sementara:', err);
        }
      }, 30000);

    } catch (e) {
      console.error(e);
      ctx.reply('Terjadi kesalahan saat proses resize gambar.');
    }
  });
};
