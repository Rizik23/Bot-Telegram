const axios = require("axios");

module.exports = (bot) => {
  bot.command("threadsstalk", async (ctx) => {
    const query = ctx.message.text.split(" ").slice(1).join(" ");
    if (!query) {
      return ctx.reply("Contoh: /threadsstalk google");
    }

    try {
      await ctx.reply("🔍 Sedang mencari profil Threads...");

      const res = await axios.post("https://api.siputzx.my.id/api/stalk/threads", {
        q: query,
      });

      const data = res.data?.data;
      if (!data) return ctx.reply("❌ Tidak ditemukan!");

      const caption = `
👤 *${data.name}* [@${data.username}]
${data.is_verified ? "✅ Terverifikasi" : ""}
🆔 ID: \`${data.id}\`
📝 Bio: ${data.bio || "-"}
👥 Followers: ${data.followers?.toLocaleString() || 0}
🔗 Link: ${data.links?.[0] || "-"}
      `.trim();

      await ctx.replyWithPhoto({ url: data.hd_profile_picture }, { caption, parse_mode: "Markdown" });
    } catch (err) {
      console.error(err);
      ctx.reply("❌ Gagal mengambil data profil Threads.");
    }
  });
};
