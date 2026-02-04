const fs = require('fs');
const path = require('path');
const config = require('../config');
const pendapatanFile = path.join(__dirname, '../src/pendapatan.json');

module.exports = (bot) => {
  bot.command('delpendapatan', (ctx) => {
      if (!config.OWNER_ID.includes(ctx.from.id)) {
        return ctx.reply('❌ *Perintah ini hanya untuk owner!*', { parse_mode: 'Markdown' });
      }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) {
      return ctx.reply('⚠️ *Masukkan nomor pendapatan yang ingin dihapus.*\nContoh: /delpendapatan 3', { parse_mode: 'Markdown' });
    }

    const index = parseInt(args[0]) - 1;

    if (isNaN(index)) {
      return ctx.reply('❌ *Nomor tidak valid!*', { parse_mode: 'Markdown' });
    }

    if (!fs.existsSync(pendapatanFile)) {
      return ctx.reply('📂 Data pendapatan tidak ditemukan.');
    }

    let data = JSON.parse(fs.readFileSync(pendapatanFile));
    if (index < 0 || index >= data.length) {
      return ctx.reply(`❌ *Nomor tidak ditemukan.*\nGunakan /listpendapatan untuk melihat nomor yang benar.`, { parse_mode: 'Markdown' });
    }

    const deleted = data.splice(index, 1)[0];
    fs.writeFileSync(pendapatanFile, JSON.stringify(data, null, 2));

    ctx.reply(
      `✅ *Berhasil menghapus pendapatan nomor ${index + 1}:*\n` +
      `📦 ${deleted.namaBarang} | Rp${deleted.total}\n` +
      `📅 ${deleted.tanggal} ⏰ ${deleted.waktu}`,
      { parse_mode: 'Markdown' }
    );
  });
};