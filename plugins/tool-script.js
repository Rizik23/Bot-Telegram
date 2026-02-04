const { Markup } = require('telegraf');

module.exports = (bot) => {
  bot.command('script', async (ctx) => {
    const caption = `
<blockquote>╭─「 📜 SCRIPT ELIKA MD 」
│
│ 📁 Nama: ELIKA MD X AUTOR ORDER & BUG MENU
│ 💸 Harga: SCRIPT : 65K FULL UPDATE
╰╼ 

Minat membeli? Ke owner
</blockquote>
`;

    await ctx.replyWithPhoto('https://files.catbox.moe/fid7wo.jpg', {
      caption,
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        Markup.button.url('Owner', 'https://t.me/Rizzxtzy'),
        
      ])
    });
  });
};
