const axios = require("axios");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

module.exports = (bot) => {
  const ytCache = new Map();

  bot.command(["ytsearch"], async (ctx) => {
    const query = ctx.message.text.split(" ").slice(1).join(" ");
    if (!query) return ctx.reply("Masukkan judul video yang mau dicari!");

    ctx.reply("🔍 Sedang mencari...");
    try {
      const res = await axios.get(`https://restapi-v2.simplebot.my.id/search/youtube?q=${encodeURIComponent(query)}`);
      const result = res.data.result;

      if (!result || !result.length) return ctx.reply("❌ Tidak ditemukan hasil video.");

      ytCache.set(ctx.chat.id, { result, index: 0 });
      return sendResult(ctx);
    } catch (err) {
      console.error(err);
      ctx.reply("❌ Gagal mencari video.");
    }
  });

  bot.action(/^ytmp3 (.+)$/, async (ctx) => {
  const url = ctx.match[1];
  await ctx.answerCbQuery("Downloading MP3...");
  try {
    const res = await axios.get(`https://api.fasturl.link/downup/ytmp3?url=${encodeURIComponent(url)}&quality=128kbps&server=auto`);
    const data = res.data.result;

    const thumbUrl = data.metadata?.thumbnail || '';
    const thumbPath = path.join(__dirname, `thumb-${Date.now()}.jpg`);

    // Download thumbnail sebagai stream JPEG valid
    const resThumb = await fetch(thumbUrl);
    const stream = fs.createWriteStream(thumbPath);
    await new Promise((resolve, reject) => {
      resThumb.body.pipe(stream);
      resThumb.body.on("error", reject);
      stream.on("finish", resolve);
    });

    // Download audio as buffer
    const audioRes = await fetch(data.media);
    const audioBuffer = await audioRes.arrayBuffer();

    await ctx.replyWithAudio(
      { source: Buffer.from(audioBuffer), filename: `${data.title}.mp3` },
      {
        caption: `🎵 ${data.title}\n💾 ${data.quality}`,
        title: data.title,
        performer: data.author?.name || "Unknown",
        thumb: { source: thumbPath }
      }
    );

    fs.unlinkSync(thumbPath);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Gagal mengunduh MP3.");
  }
});


  bot.action(/^ytmp4 (.+)$/, async (ctx) => {
    const url = ctx.match[1];
    await ctx.answerCbQuery("Downloading MP4...");
    try {
      const res = await axios.get(`https://api.fasturl.link/downup/ytmp4?url=${encodeURIComponent(url)}&quality=720&server=auto`);
      const data = res.data.result;

      await ctx.replyWithVideo(
        { url: data.media, filename: `${data.title}.mp4` },
        {
          caption: `🎬 ${data.title}\n💾 ${data.quality}`
        }
      );
    } catch (err) {
      console.error(err);
      ctx.reply("❌ Gagal mengunduh MP4.");
    }
  });

  bot.action(/^ytnext$/, async (ctx) => {
    const cache = ytCache.get(ctx.chat.id);
    if (!cache) return ctx.answerCbQuery("Data expired!");

    cache.index = (cache.index + 1) % cache.result.length;
    ytCache.set(ctx.chat.id, cache);
    await ctx.answerCbQuery();
    return sendResult(ctx, true);
  });

  async function sendResult(ctx, edit = false) {
    const { result, index } = ytCache.get(ctx.chat.id);
    const video = result[index];

    const caption = `🎬 *${video.title}*\n📺 ${video.channel}\n🕒 ${video.duration}\n🔗 [Tonton di YouTube](${video.link})`;
    const buttons = {
      inline_keyboard: [
        [
          { text: "🎧 MP3", callback_data: `ytmp3 ${video.link}` },
          { text: "📹 MP4", callback_data: `ytmp4 ${video.link}` }
        ],
        [{ text: "➡️ Next", callback_data: "ytnext" }]
      ]
    };

    const opts = {
      parse_mode: "Markdown",
      reply_markup: buttons
    };

    if (edit && ctx.updateType === "callback_query") {
      try {
        await ctx.editMessageMedia(
          {
            type: "photo",
            media: video.imageUrl,
            caption,
            parse_mode: "Markdown"
          },
          { reply_markup: buttons }
        );
      } catch (e) {
        await ctx.replyWithPhoto({ url: video.imageUrl }, opts);
      }
    } else {
      await ctx.replyWithPhoto({ url: video.imageUrl }, opts);
    }
  }
};