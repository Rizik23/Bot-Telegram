const { Composer } = require('telegraf');
const { Sticker } = require('wa-sticker-formatter');
const fetch = require('node-fetch');

module.exports = (bot) => {
  let enabled = true;
  const composer = new Composer();

  composer.command('kick', async (ctx) => {
    if (!enabled) return;

    try {
      const chat = ctx.chat;
      const senderId = ctx.from.id;
      const botId = (await bot.telegram.getMe()).id;

      if (chat.type !== 'supergroup' && chat.type !== 'group') {
        return ctx.reply('❗ Perintah ini hanya bisa digunakan di grup.');
      }

      const senderStatus = await ctx.getChatMember(senderId);
      const botStatus = await ctx.getChatMember(botId);

      if (!['creator', 'administrator'].includes(senderStatus.status)) {
        return ctx.reply('❗ Kamu harus menjadi admin untuk menggunakan perintah ini.');
      }

      if (botStatus.status !== 'administrator') {
        return ctx.reply('❗ Bot harus menjadi admin di grup ini.');
      }

      const replyUserId = ctx.message?.reply_to_message?.from?.id;
      const mentionIds = ctx.message.entities?.filter(e => e.type === 'text_mention')?.map(e => e.user.id) || [];

      const targets = [...new Set([replyUserId, ...mentionIds].filter(Boolean))];

      if (!targets.length) {
        return ctx.reply('❗ Gunakan /kick dengan reply atau mention user yang ingin dikick.\n\nContoh:\n/kick @user');
      }

      for (const userId of targets) {
        if (userId === botId) continue;
        try {
          await ctx.kickChatMember(userId);
          await delay(1000);
        } catch (err) {
          console.error(`Gagal kick user ${userId}:`, err);
        }
      }

      const res = await fetch('https://files.catbox.moe/lc5y3o.jpg');
      const buffer = await res.buffer();
      const sticker = new Sticker(buffer, {
        pack: 'Group Admin',
        author: 'Bot',
        type: 'default',
        categories: ['😡'],
        id: 'kick-sticker',
        quality: 80,
      });

      const stickerBuffer = await sticker.toBuffer();
      await ctx.replyWithSticker({ source: stickerBuffer });

    } catch (err) {
      console.error('[KICK ERROR]', err);
      ctx.reply('❌ Terjadi kesalahan saat mencoba kick user.');
    }
  });

  bot.use(composer.middleware());

  return {
    enable() {
      enabled = true;
      console.log('[PLUGIN] Kick diaktifkan');
    },
    disable() {
      enabled = false;
      console.log('[PLUGIN] Kick dinonaktifkan');
    },
  };
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
