const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = (bot) => {
  bot.command(['aiedit', 'editai'], async (ctx) => {
    const m = ctx.message;
    const sender = m.from.id;
    const text = m.text.split(' ').slice(1).join(' ');
    const q = m.reply_to_message || m;
    const mime = q.photo ? 'image/jpeg' : (q.document ? q.document.mime_type : '') || '';

    async function handleLimit(userId, limit = 5) {
      return true; // ganti sesuai logikmu
    }

    if (!text) return ctx.reply('Harap masukkan prompt custom!\n\nContoh: /aiedit buatkan foto itu lebih estetik.');
    if (!mime) return ctx.reply('Tidak ada gambar yang direply! Silakan reply gambar dengan format jpg/png.');
    if (!/image\/(jpe?g|png)/.test(mime)) return ctx.reply(`Format ${mime} tidak didukung! Hanya jpeg/jpg/png.`);

    if (!(await handleLimit(sender, 5))) return ctx.reply('Limit penggunaan fitur sudah tercapai.');

    try {
      // Ambil file_id
      let fileId;
      if (q.photo) {
        const photos = q.photo;
        fileId = photos[photos.length - 1].file_id; // ukuran terbesar
      } else if (q.document && /image\/(jpe?g|png)/.test(q.document.mime_type)) {
        fileId = q.document.file_id;
      } else {
        return ctx.reply('Tidak ada gambar yang valid untuk diproses.');
      }

      // Dapatkan link file Telegram
      const fileUrl = await ctx.telegram.getFileLink(fileId);

      // Download file dari link
      const response = await axios.get(fileUrl.href, { responseType: 'arraybuffer' });
      const imgData = Buffer.from(response.data, 'binary');

      // Proses dengan Google Generative AI
      const genAI = new GoogleGenerativeAI('AIzaSyCjvXaTRecRjrfAZUz9gPzA1bhXBDdFIG0');
      const base64Image = imgData.toString('base64');
      const contents = [
        { text: text },
        {
          inlineData: {
            mimeType: mime,
            data: base64Image,
          },
        },
      ];

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp-image-generation',
        generationConfig: {
          responseModalities: ['Text', 'Image'],
        },
      });

      const responseAI = await model.generateContent(contents);

      let resultImage;
      let resultText = '';
      for (const part of responseAI.response.candidates[0].content.parts) {
        if (part.text) resultText += part.text;
        else if (part.inlineData) resultImage = Buffer.from(part.inlineData.data, 'base64');
      }

      if (resultImage) {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const tempPath = path.join(tmpDir, `gemini_${Date.now()}.png`);
        fs.writeFileSync(tempPath, resultImage);

        await ctx.replyWithPhoto({ source: tempPath }, { caption: '*Edit selesai sesuai permintaan!*', parse_mode: 'Markdown' });

        setTimeout(() => {
          try {
            fs.unlinkSync(tempPath);
          } catch (err) {
            console.error('Gagal menghapus file sementara:', err);
          }
        }, 30000);
      } else {
        ctx.reply('Gagal memproses gambar.');
      }
    } catch (error) {
      console.error(error);
      ctx.reply(`Error: ${error.message}`);
    }
  });
};