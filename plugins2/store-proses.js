// commands/proses.js
const { channel, room, testimoni } = require('../config');

function example(text) {
  return `Contoh penggunaan:\n/proses ${text}`;
}

function tanggal(ms) {
  const date = new Date(ms);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

module.exports = (bot) => {
  bot.command('proses', async (ctx) => {
    const q = ctx.message.text.split(' ').slice(1).join(' ').trim();
    const m = ctx.message;

    if (!q) return ctx.reply(example('jasa install panel'), { reply_to_message_id: m.message_id });

    const teks = `📦 ${q}
⏰ ${tanggal(Date.now())}

Tunggu sebentar ya Mas/Mbak, pesanan Anda akan segera kami proses. Mohon ditunggu ya 😊
`;

    try {
      await ctx.reply(teks, {
        parse_mode: 'Markdown',
        reply_to_message_id: m.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📢 Channel', url: channel },
              { text: '📦 Testimoni', url: testimoni },
              { text: '🛒 Marketplace', url: room }
            ]
          ]
        }
      });
    } catch (err) {
      console.error('[ERROR] /proses:', err);
      ctx.reply('❌ Gagal mengirim pesan proses.');
    }
  });
};