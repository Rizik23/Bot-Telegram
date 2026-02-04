const axios = require("axios");

module.exports = (bot) => {
  bot.command("twitterstalk", async (ctx) => {
    const username = ctx.message.text.split(" ")[1];
    if (!username) {
      return ctx.reply("❌ Masukkan username Twitter!\nContoh: /twitterstalk siputzx");
    }

    try {
      const { data } = await axios.post("https://api.siputzx.my.id/api/stalk/twitter", {
        user: username,
      });

      if (!data.status) {
        return ctx.reply("❌ Gagal mengambil data Twitter.");
      }

      const user = data.data;

      const caption = `
🐦 *${user.name}* (@${user.username})
🆔 ID: \`${user.id}\`
✅ Verified: ${user.verified ? "Yes" : "No"}
📍 Lokasi: ${user.location || "-"}
📅 Bergabung: ${new Date(user.created_at).toLocaleDateString("id-ID")}
📝 Bio: ${user.description || "-"}

📊 *Statistik*
🧵 Tweets: ${user.stats.tweets}
👥 Followers: ${user.stats.followers}
👣 Following: ${user.stats.following}
❤️ Likes: ${user.stats.likes}
🖼️ Media: ${user.stats.media}
      `;

      await ctx.replyWithPhoto(
        { url: user.profile.image },
        {
          caption,
          parse_mode: "Markdown",
        }
      );
    } catch (err) {
      console.error(err);
      ctx.reply("🚫 Terjadi kesalahan saat mengambil data Twitter.");
    }
  });
};
