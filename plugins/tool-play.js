const axios = require('axios');
const { default: fetch } = require('node-fetch');
const fs = require('fs');
const path = require('path');

module.exports = (bot) => {
  bot.command('play', async (ctx) => {
    const safeReply = (text, extra = {}) =>
      ctx.reply(text, { disable_web_page_preview: true, ...extra });

    try {
      const query = ctx.message.text.split(' ').slice(1).join(' ').trim();
      if (!query) {
        return safeReply(
          'Kirim judul lagu setelah perintah.\n\nContoh: `/play akhir tak bahagia`',
          { parse_mode: 'Markdown' }
        );
      }

      await safeReply('🔎 Sedang mencari lagu...');

      const apiUrl = `https://api.vreden.my.id/api/v1/download/play/audio?query=${encodeURIComponent(query)}`;

      const { data } = await axios.get(apiUrl, {
        headers: { accept: 'application/json' },
        timeout: 60_000,
      });

      // Validasi minimum
      if (!data || data.status !== true || data.status_code !== 200 || !data.result) {
        const msg = data?.message ? `\n\nAPI: ${data.message}` : '';
        return safeReply(`❌ Gagal mendapatkan lagu.${msg}`);
      }

      const result = data.result;

      // Metadata
      const meta = result.metadata || {};
      const title = meta.title || 'Unknown Title';
      const authorName = meta.author?.name || 'Unknown';
      const durationText = meta.duration?.timestamp || meta.timestamp || '-';
      const ytUrl = meta.url || (meta.videoId ? `https://youtube.com/watch?v=${meta.videoId}` : '');
      const thumbUrl = meta.thumbnail || meta.image || null;

      // Download object (ini yang penting)
      const dl = result.download || {};
      const audioUrl =
        dl.url ||                      // ✅ normalnya ini ada 1
        result.audio?.url ||           // fallback kalau format beda
        result.url;                    // fallback terakhir

      // Kalau API bilang download gagal / belum kebentuk
      if (!audioUrl) {
        // kalau ada status false, kasih alasan yang jelas
        if (dl.status === false) {
          const reason = dl.message || dl.error || 'Generator link audio gagal di sisi API.';
          return safeReply(`❌ Gagal membuat link audio.\nAlasan: ${reason}`);
        }

        // kalau object download kosong/ga ada
        return safeReply(
          '❌ Lagu ditemukan, tapi API tidak mengirim URL audio.\n' +
          'Coba ulangi beberapa detik lagi atau pakai judul yang lebih spesifik.'
        );
      }

      // File temporary
      const tempThumbPath = path.join(__dirname, `thumb-${Date.now()}.jpg`);
      const tempAudioPath = path.join(__dirname, `audio-${Date.now()}.mp3`);

      // Download thumbnail (optional)
      if (thumbUrl) {
        try {
          const thumbRes = await fetch(thumbUrl);
          if (thumbRes.ok) {
            const buf = Buffer.from(await thumbRes.arrayBuffer());
            fs.writeFileSync(tempThumbPath, buf);
          }
        } catch (_) {}
      }

      // Download audio stream
      const audioRes = await axios.get(audioUrl, { responseType: 'stream', timeout: 120_000 });
      const writer = fs.createWriteStream(tempAudioPath);
      await new Promise((resolve, reject) => {
        audioRes.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Kirim info
      const caption =
        `🎶 *${title}*\n` +
        `👤 *${authorName}*\n` +
        `🕒 *${durationText}*\n` +
        (dl.quality ? `🎧 *${dl.quality}*\n` : '') +
        (ytUrl ? `📺 [Tonton di YouTube](${ytUrl})\n` : '') +
        `\nSedang mengirim audio...`;

      if (fs.existsSync(tempThumbPath)) {
        await ctx.replyWithPhoto({ source: tempThumbPath }, { caption, parse_mode: 'Markdown' });
      } else {
        await safeReply(caption, { parse_mode: 'Markdown' });
      }

      // Kirim audio
      await ctx.replyWithAudio(
        { source: tempAudioPath },
        {
          title,
          performer: authorName,
          // thumb: fs.existsSync(tempThumbPath) ? { source: tempThumbPath } : undefined,
        }
      );

      // Cleanup
      if (fs.existsSync(tempThumbPath)) fs.unlinkSync(tempThumbPath);
      if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);

    } catch (err) {
      console.error('Error /play:', err?.response?.data || err);
      ctx.reply('🚫 Terjadi kesalahan saat mengambil lagu.');
    }
  });
};