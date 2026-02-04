const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const crypto = require('crypto');

module.exports = (bot) => {
  const tmpDir = path.join(__dirname, '../tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  bot.command('tt', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const url = args[0];

    if (!url || !url.includes('tiktok.com')) {
      return ctx.reply('❗ Kirim link TikTok yang valid!\nContoh: /tt https://vt.tiktok.com/xxxxxx');
    }

    await ctx.reply('📥 Sedang ambil video & audio dari TikTok, sabar ya...');

    try {
      const res = await axios.get(`https://api.kimkiro.my.id/download/tiktok?url=${encodeURIComponent(url)}`);
      const json = res.data;

      if (!json.status || !json.result || !json.result.media) {
        return ctx.reply('❌ Gagal ambil data dari TikTok.');
      }

      const result = json.result;
      const video = result.media.find(v => v.type === 'nowatermark_hd') || result.media[0];
      const audioUrl = result.music?.url;
      const videoUrl = video.url;
      const videoPath = path.join(tmpDir, `${crypto.randomUUID()}_tt.mp4`);
      const audioPath = path.join(tmpDir, `${crypto.randomUUID()}_tt.mp3`);

      const videoStream = await axios({ method: 'GET', url: videoUrl, responseType: 'stream' });
      await pipeline(videoStream.data, fs.createWriteStream(videoPath));

      const caption = `🎬 <b>${result.title || 'Tanpa Judul'}</b>\n👤 @${result.author?.username || 'anon'}\n❤️ ${result.stats?.likes || 0} | 💬 ${result.stats?.comments || 0} | 🔁 ${result.stats?.shares || 0}`;
      await ctx.replyWithVideo({ source: videoPath }, { caption, parse_mode: 'HTML' });

      if (audioUrl) {
        const audioStream = await axios({ method: 'GET', url: audioUrl, responseType: 'stream' });
        await pipeline(audioStream.data, fs.createWriteStream(audioPath));

        await ctx.replyWithAudio({ source: audioPath }, {
          title: result.music?.title || 'TikTok Audio',
          performer: result.music?.author || 'Unknown'
        });
      }
    } catch (e) {
      console.error('[TTDL ERROR]', e.message);
      await ctx.reply('❌ Gagal proses video TikTok.');
    }
  });
};