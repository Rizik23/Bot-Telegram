const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = (bot) => {
  bot.command('addsaldo', async (ctx) => {
    const senderId = ctx.from.id.toString();

    // Hanya OWNER yang diizinkan
    if (!config.OWNER_ID.includes(senderId)) {
      return ctx.reply('❌ Kamu tidak memiliki izin untuk menambahkan saldo.');
    }

    const argsText = ctx.message.text.split(' ').slice(1).join(' ').trim();

    if (!argsText || !argsText.includes(',')) {
      return ctx.reply('⚠️ Format salah. Gunakan:\n\n`/addsaldo id,jumlah`\nContoh: `/addsaldo 123456789,50000`', { parse_mode: 'Markdown' });
    }

    const [targetId, jumlahStr] = argsText.split(',').map(x => x.trim());
    const jumlah = parseInt(jumlahStr);

    if (!targetId || isNaN(jumlah) || jumlah <= 0) {
      return ctx.reply('⚠️ Format ID atau jumlah tidak valid.');
    }

    const saldoPath = path.join(__dirname, '..', 'saldo.json');
    let saldoData = {};

    if (fs.existsSync(saldoPath)) {
      try {
        saldoData = JSON.parse(fs.readFileSync(saldoPath));
      } catch (err) {
        return ctx.reply('❌ Gagal membaca saldo.json.');
      }
    }

    if (!saldoData[targetId]) {
      saldoData[targetId] = { money: 0 };
    }

    saldoData[targetId].money += jumlah;

    try {
      fs.writeFileSync(saldoPath, JSON.stringify(saldoData, null, 2));
    } catch (err) {
      console.error('❌ Gagal menyimpan saldo.json:', err);
      return ctx.reply('❌ Gagal menyimpan data saldo.');
    }

    return ctx.reply(
      `✅ Berhasil menambahkan saldo.\n\n🆔 ID: ${targetId}\n➕ Tambahan: Rp ${jumlah.toLocaleString()}\n💰 Total sekarang: Rp ${saldoData[targetId].money.toLocaleString()}`
    );
  });
};