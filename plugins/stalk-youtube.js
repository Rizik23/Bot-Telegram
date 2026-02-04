const axios = require("axios");

module.exports = (bot) => {
  bot.command("youtubestalk", async (ctx) => {
    const username = ctx.message.text.split(" ")[1];
    if (!username) {
      return ctx.reply("❌ Masukkan username YouTube!\nContoh: /youtubestalk siputzx");
    }

    try {
      const { data } = await axios.post("https://api.siputzx.my.id/api/stalk/youtube", {
        username,
      });

      if (!data.status) {
        return ctx.reply("❌ Gagal mengambil data YouTube.");
      }

      const ch = data.data.channel;
      const videos = data.data.latest_videos;

      const caption = `
📺 *YouTube Channel Info*
👤 Username: ${ch.username}
📌 Subscriber: ${ch.subscriberCount}
🎞️ Total Video: ${ch.videoCount}
📝 Deskripsi: ${ch.description || "-"}
🔗 [Kunjungi Channel](${ch.channelUrl})
      `.trim();

      await ctx.replyWithPhoto(
        { url: ch.avatarUrl },
        {
          caption,
          parse_mode: "Markdown",
        }
      );

      for (let video of videos.slice(0, 3)) {
        await ctx.replyWithPhoto(
          { url: video.thumbnail },
          {
            caption: `
🎬 *${video.title}*
🕒 ${video.publishedTime} | ⏱️ ${video.duration}
👁️ ${video.viewCount}
🔗 [Tonton Video](${video.videoUrl})
          `.trim(),
            parse_mode: "Markdown",
          }
        );
      }
    } catch (err) {
      console.error(err);
      ctx.reply("🚫 Terjadi kesalahan saat mengambil data dari YouTube.");
    }
  });
};
