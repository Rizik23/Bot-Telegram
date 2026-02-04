const moment = require('moment-timezone');

module.exports = (bot) => {
  bot.command(['tutupjam', 'bukajam'], async (ctx) => {
    const command = ctx.message.text.split(' ')[0].slice(1);
    const args = ctx.message.text.split(' ')[1];

    if (!args) {
      return ctx.reply(`❗ Masukkan format waktu yang benar!\n\nContoh:\n/${command} 18:00`);
    }

    let [jm, mnt] = args.split(':');
    jm = parseInt(jm);
    mnt = parseInt(mnt);

    if (isNaN(jm) || jm > 23) {
      return ctx.reply(`❗ Jam salah (0–23)\n\nContoh:\n/${command} 18:00`);
    }

    if (isNaN(mnt) || mnt > 59) {
      return ctx.reply(`❗ Menit salah (0–59)\n\nContoh:\n/${command} 18:00`);
    }

    const now = moment().tz('Asia/Jakarta');
    const target = moment().tz('Asia/Jakarta').hour(jm).minute(mnt).second(0);
    if (target.isBefore(now)) target.add(1, 'day');

    const delay = target.diff(now);

    ctx.reply(`⏰ Grup akan di${command === 'tutupjam' ? 'tutup' : 'buka'} pada ${jm.toString().padStart(2, '0')}:${mnt.toString().padStart(2, '0')} WIB.`);

    setTimeout(async () => {
      try {
        const chatId = ctx.chat.id;

        if (command === 'tutupjam') {
          await ctx.telegram.setChatPermissions(chatId, {
            can_send_messages: false
          });
          ctx.reply(`✅ Grup telah ditutup. Sekarang hanya admin yang dapat mengirim pesan.`);
        } else {
          await ctx.telegram.setChatPermissions(chatId, {
            can_send_messages: true,
            can_send_media_messages: true,
            can_send_polls: true,
            can_send_other_messages: true,
            can_add_web_page_previews: true,
            can_change_info: false,
            can_invite_users: true,
            can_pin_messages: false
          });
          ctx.reply(`✅ Grup telah dibuka. Sekarang semua peserta dapat mengirim pesan.`);
        }
      } catch (err) {
        console.error('[UPDATE GRUP ERROR]', err);
      }
    }, delay);
  });
};
