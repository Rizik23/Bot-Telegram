const fetch = require('node-fetch');

module.exports = (bot) => {
  bot.command('xnxxvideo', async (ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) {
      return ctx.reply(`🔗 Linknya Mana?\n\n📌 Contoh:\n/xnxxvideo https://www.xnxx.com/video-xxxx`);
    }

    await ctx.reply('⏳ Sedang memproses video, mohon tunggu...');

    try {
      const res = await fetch(`https://api.agatz.xyz/api/xnxxdown?url=${encodeURIComponent(text)}`);
      const json = await res.json();

      if (json.status !== 200 || !json.data?.status) {
        return ctx.reply("❌ Gagal mengambil data dari API. Pastikan link valid.");
      }

      const videoUrl = json.data.files.high || json.data.files.low || json.data.files.HLS;
      const caption = `🎬 *Title:* ${json.data.title}\n⏱️ *Duration:* ${json.data.duration}\n📊 *Info:* ${json.data.info}`;
      const thumbnailUrl = json.data.image;

      // Kirim video
      await ctx.replyWithVideo(
        { url: videoUrl },
        {
          caption,
          parse_mode: "Markdown"
        }
      );

      // Kirim thumbnail (optional)
      await ctx.replyWithPhoto(
        { url: thumbnailUrl },
        {
          caption: "🖼️ Thumbnail",
          parse_mode: "Markdown"
        }
      );

    } catch (e) {
      console.error(e);
      return ctx.reply("⚠️ Terjadi kesalahan saat memproses link. Pastikan URL valid dan server API aktif.");
    }
  });
};
