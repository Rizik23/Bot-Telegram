module.exports = (bot) => {
  bot.command("info", async (ctx) => {
    let target = ctx.message.reply_to_message?.from || ctx.message.entities?.find(e => e.type === 'text_mention')?.user;

    // Kalau nggak reply atau text_mention, cek dari mention username
    if (!target && ctx.message.entities) {
      const mention = ctx.message.entities.find(e => e.type === "mention");
      if (mention) {
        const username = ctx.message.text.slice(mention.offset + 1, mention.offset + mention.length);
        try {
          target = await ctx.telegram.getChat(`@${username}`);
        } catch {
          return ctx.reply("❌ Gagal mendapatkan info user dari username.");
        }
      }
    }

    // Kalau masih belum ada, fallback ke pengirimnya sendiri
    if (!target) {
      target = ctx.from;
    }

    const id = target.id;
    const firstName = target.first_name || "-";
    const username = target.username ? `@${target.username}` : "-";
    const link = `[Klik Disini](tg://user?id=${id})`;

    const info = `
╭─❍ *INFO PENGGUNA*
│🆔 ID: \`${id}\`
│👤 Nama: ${firstName}
│🔰 Username: ${username}
│🔗 Link: ${link}
╰────────────╯`;

    ctx.reply(info, { parse_mode: "Markdown" });
  });
};
