const { Composer } = require('telegraf');
const { SpotifyAPI } = require('../lib/spotify.js');
const axios = require('axios');

module.exports = (bot) => {
  let enabled = true;
  const composer = new Composer();

  composer.command('spotify', async (ctx, next) => {
    if (!enabled) return next();

    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) {
      return ctx.reply('Masukkan judul lagu atau link Spotify!\n\nContoh:\n/spotify rewrite the stars\n/spotify https://open.spotify.com/track/65fpYBrI8o2cfrwf2US4gq');
    }

    try {
      await ctx.replyWithChatAction('typing');

      if (/http(s)?:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+/i.test(text)) {
        const input = text.split('/track/')[1];
        const spotify = await SpotifyAPI();
        const { popularity, id, duration_ms, name, artists, album } = await spotify.getTracks(input);

        const caption = `*${name}*\n\nArtist : ${artists[0].name}\nDuration : ${convertMsToMinSec(duration_ms)}\nPopularity : ${popularity}\nID : ${id}\n\nAlbum Info:\n• Name : ${album.name}\n• Release : ${album.release_date}\n• ID : ${album.id}`;

        await ctx.replyWithPhoto({ url: album.images[0].url }, { caption });

        const audio = await spotifydl(text);
        await ctx.replyWithAudio({ url: audio.download }, { title: name });
      } else {
        const spotify = await SpotifyAPI();
        const { tracks } = await spotify.trackSearch(text);

        if (tracks.items.length === 0) return ctx.reply('Lagu tidak ditemukan.');

        const results = tracks.items.map((v, i) => `*${i + 1}.* ${v.name} - ${v.artists[0].name}\n/spotify ${v.external_urls.spotify}`).join('\n\n');

        await ctx.replyWithMarkdown(`Terdapat *${tracks.items.length} hasil*:\n\n${results}`);
      }
    } catch (err) {
      console.error('[SPOTIFY ERROR]', err);
      ctx.reply('❌ Terjadi kesalahan saat memproses permintaan.');
    }
  });

  bot.use(composer.middleware());

  return {
    enable() {
      enabled = true;
      console.log('[PLUGIN] Spotify plugin enabled');
    },
    disable() {
      enabled = false;
      console.log('[PLUGIN] Spotify plugin disabled');
    }
  };
};

function convertMsToMinSec(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

async function spotifydl(url) {
  try {
    const metaRes = await axios.get(`https://api.fabdl.com/spotify/get?url=${encodeURIComponent(url)}`);
    const { gid, id } = metaRes.data.result;
    const dlRes = await axios.get(`https://api.fabdl.com/spotify/mp3-convert-task/${gid}/${id}`);

    return {
      title: metaRes.data.result.name,
      type: metaRes.data.result.type,
      artis: metaRes.data.result.artists,
      durasi: metaRes.data.result.duration_ms,
      image: metaRes.data.result.image,
      download: `https://api.fabdl.com${dlRes.data.result.download_url}`,
    };
  } catch (error) {
    throw new Error('Gagal mengunduh audio Spotify');
  }
}
