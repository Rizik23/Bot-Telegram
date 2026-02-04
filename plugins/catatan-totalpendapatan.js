const fs = require('fs');
const path = require('path');
const config = require('../config');
const pendapatanFile = path.join(__dirname, '../src/pendapatan.json');

module.exports = (bot) => {
  bot.command('totalpendapatan', (ctx) => {
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

    const total = data.reduce((sum, item) => sum + item.total, 0);

    ctx.reply(`📊 *Total Pendapatan Saat Ini:*\n💵 Rp${total.toLocaleString('id-ID')}`, {
      parse_mode: 'Markdown'
    });
  });
};