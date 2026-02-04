const fs = require('fs');
const path = require('path');
const config = require('../config');
const hutangFile = path.join(__dirname, '../src/hutang.json');

module.exports = (bot) => {
  bot.command(['delhutang', 'deldp'], async (ctx) => {
      if (!config.OWNER_ID.includes(ctx.from.id)) {
        return ctx.reply('❌ *Perintah ini hanya untuk owner!*', { parse_mode: 'Markdown' });
      }

    const args = ctx.message.text.split(' ').slice(1);
    const index = parseInt(args[0]) - 1;

    if (isNaN(index)) {
      return ctx.reply('⚠️ *Masukkan nomor hutang yang valid!*\nContoh: /delhutang 2', {
        parse_mode: 'Markdown'
      });
    }

    if (!fs.existsSync(hutangFile)) return ctx.reply('📂 Tidak ada data hutang.');

    let list = JSON.parse(fs.readFileSync(hutangFile));
    if (index < 0 || index >= list.length) return ctx.reply('❌ *Nomor tidak ditemukan.*');

    const removed = list.splice(index, 1)[0];
    fs.writeFileSync(hutangFile, JSON.stringify(list, null, 2));

    ctx.reply(
      `✅ *Berhasil menghapus hutang/DP dari ${removed.nama}*\n💵 Rp${removed.nominal}\n📌 ${removed.type}`,
      { parse_mode: 'Markdown' }
    );
  });
};