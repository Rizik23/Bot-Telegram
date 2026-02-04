function escapeMarkdownV2(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

module.exports = (bot) => {
  bot.command("getlink", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    const groupId = args[0];

    if (!groupId || !groupId.startsWith("-100")) {
      return ctx.reply("❌ Masukin ID grup yang bener, contoh:\n/getlink -1001234567890");
    }

    try {
      const link = await ctx.telegram.exportChatInviteLink(groupId);
      const escapedLink = escapeMarkdownV2(link);
      const message = `*Link Grup:*\n${escapedLink}`;

      ctx.reply(message, { parse_mode: "MarkdownV2" });
    } catch (err) {
      console.error("Gagal ambil link:", err);
      ctx.reply("❌ Gagal dapetin link:\n• Bot harus admin grup\n• ID grup harus valid\n• Invite link harus bisa diekspor");
    }
  });
};
