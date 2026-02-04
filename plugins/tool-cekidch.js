const { URL } = require("url");

module.exports = (bot) => {
  bot.command("cekidch", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    if (args.length === 0) {
      return ctx.reply("❌ Contoh penggunaan:\n/cekidch https://t.me/namachannel");
    }

    let link = args[0];
    try {
      const url = new URL(link);
      if (url.hostname !== "t.me") throw new Error("Bukan link t.me");

      const username = url.pathname.replace("/", "").trim();
      if (!username) throw new Error("Username kosong");

      const info = await ctx.telegram.getChat(`@${username}`);
      const result = `✅ Info Channel:
🆔 ID: \`${info.id}\`
📛 Nama: ${info.title}
🔗 Username: @${username}`;

      return ctx.reply(result, { parse_mode: "Markdown" });
    } catch (err) {
      return ctx.reply(`❌ Gagal mengambil ID channel.\nAlasan: ${err.message}`);
    }
  });
};
