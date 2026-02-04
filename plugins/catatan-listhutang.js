const fs = require('fs');
const path = require('path');
const config = require('../config');
const hutangFile = path.join(__dirname, '../src/hutang.json');

module.exports = (bot) => {
  bot.command(['listhutang', 'listdp'], async (ctx) => {
      if (!config.OWNER_ID.includes(ctx.from.id)) {
        return ctx.reply('❌ *Perintah ini hanya untuk owner!*', { parse_mode: 'Markdown' });
      }

    if (!fs.existsSync(hutangFile)) return ctx.reply('📂 Data hutang kosong.');

    const list = JSON.parse(fs.readFileSync(hutangFile));
    if (list.length === 0) return ctx.reply('📂 Tidak ada hutang aktif.');

    let text = '*📋 Daftar Hutang/DP:*\n\n';
    list.forEach((item, i) => {
      text += `*${i + 1}.* ${item.nama}\n`;
      text += `  💰 Rp${item.nominal}\n`;
      text += `  📌 ${item.type}\n`;
      text += `  📝 ${item.deskripsi}\n`;
      text += `  ⏰ ${item.waktu} → ${item.Telat}\n\n`;
    });

    ctx.reply(text, { parse_mode: 'Markdown' });
  });
};