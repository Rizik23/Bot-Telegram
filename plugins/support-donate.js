const { Input } = require("telegraf");

module.exports = (bot) => {
  bot.command("donate", async (ctx) => {
    const caption = `
╭───❏ *DONASI DUKUNG BOT INI*
│🙏 Terima kasih udah mau support bot ini!
│💸 Scan QRIS di bawah untuk donasi.
│💸 No dana : 083839017817
│💸 No Gopay : 083839017817
│
│📍 Donasi akan digunakan untuk:
│- Biaya server
│- Pengembangan fitur
│- Ngopi bareng bot 😎
╰❏
`;

    try {
      await ctx.replyWithPhoto(
        Input.fromURL("https://files.catbox.moe/06w3iq.jpg"),
        {
          caption,
          parse_mode: "Markdown"
        }
      );
    } catch (err) {
      console.error("❌ Gagal kirim QRIS:", err.message);
      ctx.reply("❌ Gagal kirim QRIS donasi bre.");
    }
  });
};
