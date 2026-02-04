const axios = require("axios");
const yts = require("yt-search");
const { default: fetch } = require("node-fetch");

module.exports = (bot) => {
  bot.command("lyrics", async (ctx) => {
    try {
      const query = ctx.message.text.split(" ").slice(1).join(" ");
      if (!query) {
        return ctx.reply("❌ Kirim judul lagu setelah perintah.\nContoh: /lyrics until i found you");
      }

      // 1. Ambil lirik dari API
      const lyricsRes = await axios.get("https://fastrestapis.fasturl.cloud/music/songlyrics-v1", {
        params: { text: query },
        headers: { accept: "application/json" },
      });

      const info = lyricsRes.data?.result?.answer;
      if (!info) return ctx.reply("❌ Gagal mendapatkan lirik lagu.");

      const caption = `🎶 *${info.song}* by *${info.artist}*\n📀 Album: ${info.album} (${info.year_song_released})`;
      const lyrics = `📝 *Lirik:*\n${info.plain_lyrics?.substring(0, 4000) || "Tidak tersedia."}`;

      // 2. Kirim album art dan lirik
      await ctx.replyWithPhoto({ url: info.album_artwork_url }, {
        caption,
        parse_mode: "Markdown",
      });
      await ctx.reply(lyrics, { parse_mode: "Markdown" });

      // 3. Cari video YouTube berdasarkan judul + artis
      const searchQuery = `${info.song} ${info.artist}`;
      const ytResults = await yts(searchQuery);
      const firstVideo = ytResults.videos.length ? ytResults.videos[0] : null;
      if (!firstVideo) return ctx.reply("❌ Video YouTube tidak ditemukan.");

      const youtubeUrl = firstVideo.url;

      // 4. Ambil audio MP3 pakai API Kenshiro
      const mp3Res = await axios.get("https://api.kenshiro.cfd/api/downloader/yta", {
        params: { url: youtubeUrl },
        headers: { accept: "application/json" },
      });

      const dl = mp3Res.data?.data;
      if (!dl?.downloadLink) return ctx.reply("❌ Gagal download audio dari YouTube.");

      ctx.reply("⏳ Sedang mengunduh audio...");

      // 5. Download MP3 dari link
      const audioFetch = await fetch(dl.downloadLink);
      if (!audioFetch.ok) throw new Error("Gagal unduh audio MP3");
      const buffer = await audioFetch.buffer();

      // 6. Kirim MP3 ke Telegram
      await ctx.replyWithAudio({ source: buffer, filename: dl.filename || `${dl.title}.mp3` }, {
        title: dl.title?.substring(0, 64),
        performer: dl.channel || info.artist,
        duration: parseInt(dl.duration)
      });

    } catch (err) {
      console.error("❌ ERROR /lyrics:", err.message);
      ctx.reply("❌ Terjadi kesalahan saat proses lirik/audio.");
    }
  });
};