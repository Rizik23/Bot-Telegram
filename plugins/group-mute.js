const { Composer } = require('telegraf');

module.exports = (bot) => {
  let enabled = true;
  const composer = new Composer();

  composer.command('mute', async (ctx) => {
    if (!enabled) return;

    if (!ctx.chat || ctx.chat.type === 'private') {
      return ctx.reply('Perintah ini hanya bisa digunakan di group.');
    }

    try {
      const fromId = ctx.from.id;
      const chatId = ctx.chat.id;
      const member = await ctx.telegram.getChatMember(chatId, fromId);

      if (!['administrator', 'creator'].includes(member.status)) {
        return ctx.reply('Hanya admin yang bisa mute member.');
      }

      if (!ctx.message.reply_to_message) {
        return ctx.reply('Reply pesan user yang ingin dimute.');
      }

      const args = ctx.message.text.split(' ').slice(1);
      if (args.length === 0) {
        return ctx.reply('Masukkan durasi mute dalam detik. Contoh: /mute 60');
      }

      const duration = parseInt(args[0]);
      if (isNaN(duration) || duration <= 0) {
        return ctx.reply('Durasi mute harus angka positif (detik).');
      }

      const targetUser = ctx.message.reply_to_message.from;
      const untilDate = Math.floor(Date.now() / 1000) + duration;

      await ctx.telegram.restrictChatMember(chatId, targetUser.id, {
        permissions: {
          can_send_messages: false,
          can_send_media_messages: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false,
        },
        until_date: untilDate,
      });

      ctx.reply(`User ${targetUser.first_name} sudah dimute selama ${duration} detik.`);
    } catch (err) {
      console.error('[MUTE ERROR]', err);
      ctx.reply('Gagal mute user. Pastikan bot admin dan punya izin.');
    }
  });

  bot.use(composer.middleware());

  return {
    enable() {
      enabled = true;
      console.log('[PLUGIN] Mute diaktifkan');
    },
    disable() {
      enabled = false;
      console.log('[PLUGIN] Mute dinonaktifkan');
    },
  };
};
