const ownerId = 7681171661; // Ganti dengan ID owner kamu

module.exports = (bot) => {
  bot.command('payment', async (ctx) => {
    const qrisUrl = 'https://files.catbox.moe/06w3iq.jpg';

    await ctx.replyWithPhoto({ url: qrisUrl }, {
      caption: `🧾 *Pembayaran via QRIS*

Silakan *scan QRIS* di atas untuk melakukan transaksi.

Jika ingin transfer langsung:
- *Dana:* 083839017817
- *Gopay:* 083839017817

📌 *Wajib kirim bukti transfer ya kak!*
Silakan screenshot bukti transfer, lalu *reply gambar tersebut dengan* \`/cek [Nama Barang]\` agar kami bisa langsung proses.

Contoh: \`/cek Panel 5GB\`

Terima kasih 🙏`,
      parse_mode: 'Markdown'
    });
  });

  bot.command('cek', async (ctx) => {
    const message = ctx.message;

    // Ambil nama barang dari argumen
    const args = message.text.split(' ').slice(1);
    const namaBarang = args.join(' ') || 'Tidak disebutkan';

    // Validasi apakah ini reply ke gambar
    if (!message.reply_to_message || !message.reply_to_message.photo) {
      return ctx.reply('❌ Silakan reply ke bukti transfer berupa *gambar*, lalu ketik `/cek [Nama Barang]`.', {
        parse_mode: 'Markdown'
      });
    }

    const sender = ctx.from;
    const caption = `📩 *Notifikasi Bukti Transfer Masuk!*

👤 Dari: @${sender.username || sender.first_name}
🆔 ID: \`${sender.id}\`
📦 Barang: *${namaBarang}*

✅ Bukti transfer terlampir di bawah. Harap segera dicek.`;

    try {
      await ctx.telegram.copyMessage(
        ownerId,
        ctx.chat.id,
        message.reply_to_message.message_id,
        {
          caption,
          parse_mode: 'Markdown'
        }
      );

      await ctx.reply('✅ Bukti transfer berhasil dikirim ke admin. Mohon tunggu prosesnya ya kak!');
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal mengirim ke admin.');
    }
  });
};