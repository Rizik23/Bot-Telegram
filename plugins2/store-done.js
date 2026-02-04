const { namaOwner, channel, room, testimoni } = require('../config');

module.exports = (bot) => {
  bot.command('done', async (ctx) => {
    const q = ctx.message.text.split(' ').slice(1).join(' ').trim();
    const m = ctx.message;

    if (!q) {
      return ctx.reply(`Format salah!\nPenggunaan:\n/done barang,harga,payment`, {
        reply_to_message_id: m.message_id,
      });
    }

    const t = q.split(',');
    if (t.length < 3) {
      return ctx.reply(`*Format salah!*
Penggunaan:
/done barang,harga,payment`, {
        parse_mode: 'Markdown',
        reply_to_message_id: m.message_id,
      });
    }

    const [barang, price, payment] = t.map(a => a.trim());

    const date = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const teks = `
𝗔𝗟𝗛𝗔𝗠𝗗𝗨𝗟𝗜𝗟𝗟𝗔𝗛 𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗗𝗢𝗡𝗘 ✅
━━━━━━━━━━━━━━━━━━━━
📦 BARANG   : ${barang}
🔖 PRICE    : ${price}
🏦 PAYMENT : ${payment}
📅 DATE     : ${date}
*TERIMAKASIH SUDAH MEMBELI DI ${namaOwner}🥵*

*⏤͟͟͞͞ElikaMd Menyediakan Produk*

*»»—— Produk Noxxa ——««*
*» Tangan Kanan: 125K*
*» Partner Galaxy: 80K*
*» Partner Pribadi: 50K*
*» Partner Function Bug: 125K*
*» Jasa Buat Website Shop: 15-30K*
*» Jasa Buat Website Payment: 10-20K*
*» Jasa Buat Script Bug: 35-70K*
*» Jasa Rename Script: 10K*
*» Jasa Fix Script dll*
*» Sc Wa/Tele*
*» Dll Tanyakan*

© ⏤͟͟͞͞ElikaMd`;

    try {
      const reply = m.reply_to_message;
      const replyMarkup = {
        parse_mode: 'Markdown',
        reply_to_message_id: m.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📦 Marketplace', url: room },
              { text: '📢 Channel', url: channel },
              { text: '🧾 Testimoni', url: testimoni }
            ]
          ]
        }
      };

      // Jika reply berupa foto
      if (reply && reply.photo) {
        const photo = reply.photo[reply.photo.length - 1].file_id; // ambil ukuran terbesar
        return await ctx.replyWithPhoto(photo, {
          caption: teks,
          ...replyMarkup,
        });
      }

      // Jika bukan foto, kirim teks biasa
      await ctx.reply(teks, replyMarkup);

    } catch (err) {
      console.error('[ERROR] /done:', err);
      ctx.reply('❌ Gagal mengirim pesan.');
    }
  });
};