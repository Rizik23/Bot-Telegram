const axios = require('axios');

module.exports = (bot) => {
  bot.command('cosplaytele', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) {
      return ctx.reply('📌 Contoh penggunaan:\n`/cosplaytele Marin Kitagawa`', { parse_mode: 'Markdown' });
    }

    try {
      const response = await axios.get(`https://fastrestapis.fasturl.cloud/sfwnsfw/cosplaytele?query=${encodeURIComponent(query)}`, {
        headers: { 'accept': 'application/json' }
      });

      const result = response.data.result;

      // Jika hasilnya array (pencarian umum)
      if (Array.isArray(result)) {
        if (!result.length) return ctx.reply('❌ Tidak ditemukan.');

        const list = result.slice(0, 5).map((item, i) =>
          `*${i + 1}. ${item.title}*\n🔗 ${item.link}`
        ).join('\n\n');

        return ctx.replyWithPhoto(result[0].image, {
          caption: `✅ Hasil pencarian untuk *${query}*:\n\n${list}`,
          parse_mode: 'Markdown'
        });
      }

      // Jika hasilnya objek detail
      const {
        title,
        cosplayer,
        character,
        appearsIn,
        fileSize,
        password,
        downloadLinks,
        galleryImages
      } = result;

      if (!galleryImages || galleryImages.length === 0) {
        return ctx.reply('❌ Tidak ada gambar ditemukan.');
      }

      let caption = `*${title}*\n`;
      if (cosplayer) caption += `👤 Cosplayer: ${cosplayer}\n`;
      if (character) caption += `🎭 Karakter: ${character}\n`;
      if (appearsIn) caption += `📺 Dari: ${appearsIn}\n`;
      if (fileSize) caption += `💾 Ukuran: ${fileSize.trim()}\n`;
      if (password) caption += `🔐 Password: \`${password}\`\n`;
      if (downloadLinks?.length) {
        caption += `\n📥 Link Download:\n` + downloadLinks.map(dl => `• [${dl.platform}](${dl.link})`).join('\n');
      }

      // Kirim 5 gambar satu per satu
      for (let i = 0; i < Math.min(5, galleryImages.length); i++) {
        const imageUrl = galleryImages[i];
        await ctx.replyWithPhoto(imageUrl, {
          caption: i === 0 ? caption : undefined,
          parse_mode: 'Markdown'
        });
      }
    } catch (e) {
      console.error(e);
      return ctx.reply('❌ Gagal mengambil data dari CosplayTele.');
    }
  });
};
