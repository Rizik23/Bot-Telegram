const axios = require('axios');

module.exports = function (bot) {
  // /id → digunakan di grup atau chat pribadi untuk ambil ID chat
  bot.command('id', async (ctx) => {
    const chat = ctx.chat;
    const sender = ctx.from;

    if (!chat) return ctx.reply('Tidak dapat mengambil informasi chat.');

    const type = chat.type === 'private' ? 'User' : chat.type;
    ctx.reply(`*Informasi Chat:*\n• Type: ${type}\n• ID: \`${chat.id}\`\n• Title: ${chat.title || sender.first_name}`, {
      parse_mode: 'Markdown'
    });
  });

  // /getid <link> → ambil ID grup dari link
  bot.command('getid', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1).join(' ');
    if (!args) return ctx.reply('Contoh penggunaan:\n/getid https://t.me/nama_grup');

    const match = args.match(/t\.me\/(?:joinchat\/)?([a-zA-Z0-9_-]+)/);
    if (!match) return ctx.reply('Link tidak valid.');

    const username = match[1];

    try {
      const chat = await ctx.telegram.getChat(`@${username}`);
      ctx.reply(`*Informasi Grup:*\n• Title: ${chat.title}\n• ID: \`${chat.id}\`\n• Type: ${chat.type}`, {
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error(err);
      ctx.reply('Gagal mengambil informasi grup. Pastikan bot sudah join ke grup tersebut atau link valid.');
    }
  });
};
