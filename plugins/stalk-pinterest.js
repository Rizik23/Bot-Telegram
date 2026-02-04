const axios = require("axios");

module.exports = (bot) => {
  bot.command("pintereststalk", async (ctx) => {
    const query = ctx.message.text.split(" ").slice(1).join(" ");
    if (!query) {
      return ctx.reply("📌 Masukkan username Pinterest!\n\nContoh: `/pintereststalk dims`", {
        parse_mode: "Markdown",
      });
    }

    await ctx.reply("🔍 Mencari informasi profil...");

    try {
      const res = await axios.post("https://api.siputzx.my.id/api/stalk/pinterest", {
        q: query
      });

      const result = res.data.result;

      const caption = `📌 *Pinterest Stalker*\n\n` +
        `👤 *Username:* ${result.username}\n` +
        `📛 *Nama Lengkap:* ${result.full_name || "-"}\n` +
        `📍 *Bio:* ${result.bio || "-"}\n` +
        `📊 *Statistik:*\n` +
        `   • Pins: ${result.stats?.pins ?? 0}\n` +
        `   • Followers: ${result.stats?.followers ?? 0}\n` +
        `   • Following: ${result.stats?.following ?? 0}\n` +
        `   • Boards: ${result.stats?.boards ?? 0}\n` +
        `🔗 *Link:* [Klik di sini](${result.profile_url})`;

      await ctx.replyWithPhoto({ url: result.image?.original }, {
        caption,
        parse_mode: "Markdown"
      });

    } catch (err) {
      console.error(err);
      ctx.reply("❌ Gagal mengambil data. Username tidak ditemukan atau server error.");
    }
  });
};
