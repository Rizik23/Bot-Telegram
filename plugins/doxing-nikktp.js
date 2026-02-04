const { nikParser } = require('nik-parser');
const config = require('../config');

module.exports = (bot) => {
  const commands = ['nikktp', 'doxktp'];

  bot.command(commands, async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply('❌ Fitur ini hanya bisa digunakan oleh *Owner* bot.', {
        parse_mode: 'Markdown'
      });
    }

    const text = ctx.message.text.split(' ').slice(1).join(' ').trim();
    const command = ctx.message.text.split(' ')[0].slice(1);

    if (!text) {
      return ctx.reply(
        `</> Anda harus mendapatkan NIK target terlebih dahulu dan jalankan command seperti ini:\n\n/${command} 16070xxxxxxxxxxxx`
      );
    }

    try {
      const nik = nikParser(text);

      const provinsi = nik.province();
      const kabupaten = nik.kabupatenKota();
      const kecamatan = nik.kecamatan();
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${kecamatan}, ${kabupaten}, ${provinsi}`)}`;

      const hasil = `
*Hasil Parsing NIK:*
• NIK Valid: ${nik.isValid()}
• Provinsi ID: ${nik.provinceId()}
• Nama Provinsi: ${provinsi}
• Kabupaten ID: ${nik.kabupatenKotaId()}
• Nama Kabupaten: ${kabupaten}
• Kecamatan ID: ${nik.kecamatanId()}
• Nama Kecamatan: ${kecamatan}
• Kode Pos: ${nik.kodepos()}
• Jenis Kelamin: ${nik.kelamin()}
• Tanggal Lahir: ${nik.lahir()}
• Uniqcode: ${nik.uniqcode()}

📍 *Lokasi di Maps:* [Klik di sini](${mapsUrl})
      `.trim();

      ctx.reply(hasil, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Terjadi kesalahan saat memproses NIK.');
    }
  });
};