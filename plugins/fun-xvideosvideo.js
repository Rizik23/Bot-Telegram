const fetch = require('node-fetch');

module.exports = (bot) => {
  bot.command('xvideos', async (ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) {
      return ctx.reply(`🔗 Linknya Mana?\n\n📌 Contoh:\n/xvideoshttps://www.xvideos.com/video-xxxx`);
    }

    await ctx.reply('⏳ Sedang memproses video, mohon tunggu...');

    try {
      const res = await fetch(`https://api.agatz.xyz/api/xvideosdl?url=${encodeURIComponent(text)}`);
      const json = await res.json();

      if (json.status !== 200 || !json.data?.url) {
        return ctx.reply("❌ Gagal mengambil data dari API. Pastikan link valid.");
      }

      const {
        title,
        views,
        vote,
        like_count,
        dislike_count,
        thumb,
        url
      } = json.data;

      const caption = `🎬 *Title:* ${title}\n👀 *Views:* ${views}\n👍 *Likes:* ${like_count}\n👎 *Dislikes:* ${dislike_count}\n🗳️ *Votes:* ${vote}`;

      // Kirim video
      await ctx.replyWithVideo(
        { url },
        {
          caption,
          parse_mode: "Markdown"
        }
      );

      // Kirim thumbnail (opsional)
      await ctx.replyWithPhoto(
        { url: thumb },
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
