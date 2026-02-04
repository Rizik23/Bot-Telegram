const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const axios = require('axios');
const { exec } = require('child_process');
const { pipeline } = require('stream/promises');
const crypto = require('crypto');
const { FORCE_SUB_CHANNEL } = require('../config');
const config = require('../config');

module.exports = (bot) => {
  const tmpDir = path.join(__dirname, '../tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  bot.command('playch', async (ctx) => {
      const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma bisa dipakai sama owner bot aja bre.");

    }
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) {
      return ctx.reply('Masukkan judul lagu!\nContoh: /playch Jakarta Hari Ini');
    }

    await ctx.reply(`🎶 Sedang mencari dan mengunduh lagu *${text}*, tunggu bentar ya...`);

    const channel = FORCE_SUB_CHANNEL || '@YourChannelHere';
    let inputPath = '';
    let outputPath = '';

    try {
      const res = await fetch(`https://api.nekorinn.my.id/downloader/ytplay-savetube?q=${encodeURIComponent(text)}`);
      if (!res.ok) throw new Error('Nekorinn API error');
      const data = await res.json();
      if (!data.status || !data.result) throw new Error('Data tidak valid');

      const { title, channel: artist, imageUrl } = data.result.metadata;
      const downloadUrl = data.result.downloadUrl;
      const fileId = crypto.randomUUID();
      const ext = 'mp3';

      inputPath = path.join(tmpDir, `${fileId}_in.${ext}`);
      outputPath = path.join(tmpDir, `${fileId}_out.${ext}`);

      const stream = await axios({ method: 'GET', url: downloadUrl, responseType: 'stream' });
      const writer = fs.createWriteStream(inputPath);
      await pipeline(stream.data, writer);

      fs.copyFileSync(inputPath, outputPath);

      await ctx.telegram.sendAudio(channel, {
        source: fs.createReadStream(outputPath),
        filename: `${title}.mp3`
      }, {
        title,
        performer: artist
      });

      ctx.reply(`✅ Lagu *${title}* berhasil dikirim ke ${channel}`);
    } catch (err) {
      console.warn('[playch fallback] nekorinn gagal:', err.message);

      try {
        const res = await fetch(`https://api.diioffc.web.id/api/search/ytplay?query=${encodeURIComponent(text)}`);
        const json = await res.json();
        if (!json.status || !json.result) return ctx.reply('Gagal mencari lagu.');

        const { title, author, duration, thumbnail, download } = json.result;
        const downloadUrl = download.url;
        const fileId = crypto.randomUUID();

        inputPath = path.join(tmpDir, `${fileId}_in.mp3`);
        outputPath = path.join(tmpDir, `${fileId}_out.mp3`);

        const stream = await axios({ method: 'GET', url: downloadUrl, responseType: 'stream' });
        const writer = fs.createWriteStream(inputPath);
        await pipeline(stream.data, writer);

        fs.copyFileSync(inputPath, outputPath);

        await ctx.telegram.sendAudio(channel, {
          source: fs.createReadStream(outputPath),
          filename: download.filename || `${title}.mp3`
        }, {
          title,
          performer: author.name
        });

        ctx.reply(`✅ Lagu *${title}* berhasil dikirim ke ${channel}`);
      } catch (error) {
        console.error('[playch error]', error.message);
        ctx.reply('❌ Gagal unduh lagu dari kedua API. Coba lagi nanti.');
      }
    } finally {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
  });
};
