const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const config = require('../config');

const tempDir = path.join(__dirname, '..', 'temp');
const TEXT_FILE_1 = path.join(__dirname, '..', 'text', 'bypass1.txt');
const TEXT_FILE_2 = path.join(__dirname, '..', 'text', 'bypass2.txt');
const CH_ID = config.FORCE_SUB_CHANNEL;

fs.ensureDirSync(tempDir);

module.exports = (bot) => {

  bot.on('document', async (ctx) => {
    const file = ctx.message.document;
    const fileName = file.file_name;

    if (!fileName.endsWith('.js')) {
      return ctx.reply("⚠️ Hanya file .js yang diperbolehkan.");
    }

    try {
      const fileLink = await ctx.telegram.getFileLink(file.file_id);
      const tempPath = path.join(tempDir, `${Date.now()}-${fileName}`);

      const response = await axios.get(fileLink.href, { responseType: 'stream' });
      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      ctx.session = ctx.session || {};
      ctx.session.filePath = tempPath;
      ctx.session.fileId = ctx.message.message_id;
      ctx.session.originalName = fileName;

      await ctx.reply(
        `<b>📄 File diterima: ${fileName}</b>\n\nPilih mode Bypass:`,
        {
          reply_to_message_id: ctx.message.message_id,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '[ BYPASS 01 ]', callback_data: 'bypass_1' }],
              [{ text: '[ BYPASS 02 ]', callback_data: 'bypass_2' }]
            ]
          }
        }
      );
    } catch (err) {
      console.error("❌ Gagal menerima file:", err);
      return ctx.reply("❌ Terjadi kesalahan saat menyimpan file.");
    }
  });

  bot.action(/bypass_(1|2)/, async (ctx) => {
    if (!ctx.session?.filePath || !(await fs.pathExists(ctx.session.filePath))) {
      return ctx.reply("❌ File tidak ditemukan atau sesi telah kedaluwarsa. Silakan upload ulang.");
    }

    const modeNum = ctx.match[1];
    const mode = `bypass_${modeNum}`;
    const textFile = mode === 'bypass_1' ? TEXT_FILE_1 : TEXT_FILE_2;

    try {
      await ctx.deleteMessage();
      const progressMsg = await ctx.reply('⏳ Memproses file...');

      const original = await fs.readFile(ctx.session.filePath, 'utf-8');
      const prepend = await fs.readFile(textFile, 'utf-8');
      const finalContent = `${prepend}\n\n${original}`;

      // Ubah nama output jadi: bypass_noxxa_<timestamp>.js
      const timestamp = Date.now();
      const outputPath = path.join(tempDir, `bypass_dragon_${timestamp}.js`);
      await fs.writeFile(outputPath, finalContent);

      await ctx.deleteMessage(progressMsg.message_id);

      await ctx.replyWithDocument(
        { source: outputPath, filename: `bypass_noxxa_${timestamp}.js` },
        {
          caption: `<b>✅ File berhasil diproses dengan ${mode.toUpperCase().replace('_', ' ')}</b>`,
          parse_mode: 'HTML',
          reply_to_message_id: ctx.session.fileId,
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Developer', url: 'https://t.me/Rizzxtzy' }]
            ]
          }
        }
      );

      // Notifikasi ke channel (jika ada foto profil)
      try {
        const photos = await ctx.telegram.getUserProfilePhotos(ctx.from.id, { limit: 1 });
        const hasPhoto = photos.total_count > 0;

        if (hasPhoto) {
          const fileId = photos.photos[0][0].file_id;
          await ctx.telegram.sendPhoto(CH_ID, fileId, {
            caption: `<b>✅ ${mode.toUpperCase().replace('_', ' ')} berhasil</b>\n👤 @${ctx.from.username} (${ctx.from.id})\n📁 ${ctx.session.originalName}`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: ctx.from.first_name, url: `tg://user?id=${ctx.from.id}` }]
              ]
            }
          });
        }
      } catch (err) {
        console.warn('⚠️ Gagal kirim ke channel:', err.message);
      }

      // Cleanup
      await fs.remove(ctx.session.filePath);
      await fs.remove(outputPath);
      delete ctx.session.filePath;

    } catch (err) {
      console.error("❌ Error saat memproses:", err);
      await ctx.reply("❌ Terjadi kesalahan saat proses bypass.");
      if (ctx.session?.filePath) {
        await fs.remove(ctx.session.filePath).catch(() => {});
        delete ctx.session.filePath;
      }
    }
  });
};