const fs = require('fs');
const path = require('path');
const config = require('../config');
const pendapatanFile = path.join(__dirname, '../src/pendapatan.json');

module.exports = (bot) => {
  bot.command('listpendapatan', (ctx) => {
      if (!config.OWNER_ID.includes(ctx.from.id)) {
        return ctx.reply('❌ *Perintah ini hanya untuk owner!*', { parse_mode: 'Markdown' });
      }

    if (!fs.existsSync(pendapatanFile)) {
      return ctx.reply('📂 Tidak ada data pendapatan tersimpan.');
    }

    const data = JSON.parse(fs.readFileSync(pendapatanFile));
    if (data.length === 0) {
      return ctx.reply('📂 Daftar pendapatan kosong.');
    }

    let teks = '*📋 Daftar Pendapatan:*\n\n';
    data.forEach((item, i) => {
      teks += `*${i + 1}.* ${item.namaBarang}\n`;
      teks += `  💰 Rp${item.harga} x ${item.total / item.harga}\n`;
      teks += `  💳 ${item.pembayaran}\n`;
      teks += `  📅 ${item.tanggal} ⏰ ${item.waktu}\n\n`;
    });

    ctx.reply(teks, { parse_mode: 'Markdown' });
  });
};