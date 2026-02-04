const config = require('../config'); // pastikan path config sesuai
const CHANNEL_ID = config.FORCE_SUB_CHANNEL;

module.exports = (bot) => {
  bot.command('upch', async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma bisa dipakai sama owner bot aja bre.");
    }

    const reply = ctx.message.reply_to_message;

    if (!reply) {
      return ctx.reply('❗ Balas pesan atau media yang ingin dikirim ke channel.\n\nContoh:\n/reply pesan\n/upch');
    }

    // Cek tombol inline dari reply
    const replyMarkup = reply.reply_markup?.inline_keyboard
      ? { reply_markup: { inline_keyboard: reply.reply_markup.inline_keyboard } }
      : {};

    const extra = {
      parse_mode: 'HTML',
      ...replyMarkup,
    };

    try {
      if (reply.photo) {
        await ctx.telegram.sendPhoto(CHANNEL_ID, reply.photo.at(-1).file_id, {
          caption: reply.caption || '',
          ...extra
        });
      } else if (reply.video) {
        await ctx.telegram.sendVideo(CHANNEL_ID, reply.video.file_id, {
          caption: reply.caption || '',
          ...extra
        });
      } else if (reply.document) {
        await ctx.telegram.sendDocument(CHANNEL_ID, reply.document.file_id, {
          caption: reply.caption || '',
          ...extra
        });
      } else if (reply.audio) {
        await ctx.telegram.sendAudio(CHANNEL_ID, reply.audio.file_id, {
          caption: reply.caption || '',
          ...extra
        });
      } else if (reply.voice) {
        await ctx.telegram.sendVoice(CHANNEL_ID, reply.voice.file_id, {
          caption: reply.caption || '',
          ...extra
        });
      } else if (reply.text) {
        await ctx.telegram.sendMessage(CHANNEL_ID, reply.text, extra);
      } else {
        return ctx.reply('❌ Jenis pesan tidak didukung untuk broadcast.');
      }

      await ctx.reply(`✅ Broadcast berhasil dikirim ke ${CHANNEL_ID}`);
    } catch (err) {
      console.error(err);
      await ctx.reply('⚠️ Gagal mengirim ke channel. Pastikan bot admin & media valid.');
    }
  });
};
