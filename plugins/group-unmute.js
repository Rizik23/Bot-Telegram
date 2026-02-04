const { Composer } = require('telegraf');

module.exports = (bot) => {
  let enabled = true;
  const composer = new Composer();

  composer.command('unmute', async (ctx) => {
    if (!enabled) return;

    if (!ctx.chat || ctx.chat.type === 'private') {
      return ctx.reply('Perintah ini hanya bisa digunakan di group.');
    }

    try {
      const fromId = ctx.from.id;
      const chatId = ctx.chat.id;
      const member = await ctx.telegram.getChatMember(chatId, fromId);

      if (!['administrator', 'creator'].includes(member.status)) {
        return ctx.reply('Hanya admin yang bisa unmute member.');
      }

      if (!ctx.message.reply_to_message) {
        return ctx.reply('Reply pesan user yang ingin diunmute.');
      }

      const targetUser = ctx.message.reply_to_message.from;

      await ctx.telegram.restrictChatMember(chatId, targetUser.id, {
        permissions: {
          can_send_messages: true,
          can_send_media_messages: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
          can_change_info: false,
          can_invite_users: true,
          can_pin_messages: false,
        },
        until_date: 0,
      });

      ctx.reply(`User ${targetUser.first_name} sudah diunmute.`);
    } catch (err) {
      console.error('[UNMUTE ERROR]', err);
      ctx.reply('Gagal unmute user. Pastikan bot admin dan punya izin.');
    }
  });

  bot.use(composer.middleware());

  return {
    enable() {
      enabled = true;
      console.log('[PLUGIN] Unmute diaktifkan');
    },
    disable() {
      enabled = false;
      console.log('[PLUGIN] Unmute dinonaktifkan');
    },
  };
};
