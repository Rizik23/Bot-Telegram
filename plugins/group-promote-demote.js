// plugins/promote_demote.js
module.exports = (bot) => {
  // Promote Command
  bot.command('promote', async (ctx) => {
    if (!ctx.chat || ctx.chat.type === 'private') {
      return ctx.reply('Perintah ini hanya bisa digunakan di grup.');
    }

    try {
      const fromId = ctx.from.id;
      const chatId = ctx.chat.id;

      // Cek apakah pengirim adalah admin
      const sender = await ctx.telegram.getChatMember(chatId, fromId);
      if (!['administrator', 'creator'].includes(sender.status)) {
        return ctx.reply('Hanya admin yang bisa promote member.');
      }

      // Harus reply pesan user yang ingin dipromote
      if (!ctx.message.reply_to_message) {
        return ctx.reply('Reply pesan user yang ingin dipromote.');
      }

      const target = ctx.message.reply_to_message.from;

      await ctx.telegram.promoteChatMember(chatId, target.id, {
        can_change_info: true,
        can_post_messages: true,
        can_edit_messages: true,
        can_delete_messages: true,
        can_invite_users: true,
        can_restrict_members: true,
        can_pin_messages: true,
        can_promote_members: false, // Optional: jangan kasih izin promote juga
      });

      ctx.reply(`User ${target.first_name} sudah dipromote jadi admin.`);
    } catch (err) {
      console.error('[PROMOTE ERROR]', err);
      ctx.reply('Gagal promote user. Pastikan bot admin dan punya izin cukup.');
    }
  });

  // Demote Command
  bot.command('demote', async (ctx) => {
    if (!ctx.chat || ctx.chat.type === 'private') {
      return ctx.reply('Perintah ini hanya bisa digunakan di grup.');
    }

    try {
      const fromId = ctx.from.id;
      const chatId = ctx.chat.id;

      // Cek apakah pengirim adalah admin
      const sender = await ctx.telegram.getChatMember(chatId, fromId);
      if (!['administrator', 'creator'].includes(sender.status)) {
        return ctx.reply('Hanya admin yang bisa demote member.');
      }

      // Harus reply pesan user yang ingin didevote
      if (!ctx.message.reply_to_message) {
        return ctx.reply('Reply pesan user yang ingin didemote.');
      }

      const target = ctx.message.reply_to_message.from;

      await ctx.telegram.promoteChatMember(chatId, target.id, {
        can_change_info: false,
        can_post_messages: false,
        can_edit_messages: false,
        can_delete_messages: false,
        can_invite_users: false,
        can_restrict_members: false,
        can_pin_messages: false,
        can_promote_members: false,
      });

      ctx.reply(`User ${target.first_name} sudah didemote dari admin.`);
    } catch (err) {
      console.error('[DEMOTE ERROR]', err);
      ctx.reply('Gagal demote user. Pastikan bot admin dan punya izin cukup.');
    }
  });
};
