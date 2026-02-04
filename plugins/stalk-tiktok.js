const axios = require("axios");

module.exports = (bot) => {
  bot.command("tiktokstalk", async (ctx) => {
    const username = ctx.message.text.split(" ")[1];
    if (!username) {
      return ctx.reply("❌ Masukkan username TikTok!\nContoh: /tiktokstalk mrbeast");
    }

    try {
      const { data } = await axios.post("https://api.siputzx.my.id/api/stalk/tiktok", {
        username,
      });

      if (!data.status) {
        return ctx.reply("❌ Gagal mengambil data TikTok.");
      }

      const user = data.data.user;
      const stats = data.data.stats;

      const caption = `
👤 *${user.nickname}* (@${user.uniqueId})
🆔 ID: \`${user.id}\`
✅ Verified: ${user.verified ? "Yes" : "No"}
📍 Region: ${user.region}
📝 Bio: ${user.signature || "-"}
📆 Dibuat: ${new Date(user.createTime * 1000).toLocaleDateString("id-ID")}

📊 *Statistik TikTok*
👥 Followers: ${stats.followerCount.toLocaleString()}
👣 Following: ${stats.followingCount.toLocaleString()}
❤️ Likes: ${stats.heart.toLocaleString()}
🎞️ Video: ${stats.videoCount.toLocaleString()}
👫 Friends: ${stats.friendCount.toLocaleString()}
      `;

      await ctx.replyWithPhoto(
        { url: user.avatarLarger },
        {
          caption,
          parse_mode: "Markdown",
        }
      );
    } catch (err) {
      console.error(err);
      ctx.reply("🚫 Terjadi kesalahan saat mengambil data.");
    }
  });
};
