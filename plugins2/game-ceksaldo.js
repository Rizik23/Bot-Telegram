const fs = require('fs');
const path = require('path');

const SALDO_PATH = path.join(__dirname, '../saldo.json');

module.exports = (bot) => {
  bot.command('ceksaldo', async (ctx) => {
    const userId = ctx.from.id.toString();

    // Baca file saldo.json
    let saldoData = {};
    if (fs.existsSync(SALDO_PATH)) {
      try {
        saldoData = JSON.parse(fs.readFileSync(SALDO_PATH));
      } catch (e) {
        console.error('❌ Gagal membaca saldo.json:', e);
        return ctx.reply('⚠️ Terjadi kesalahan membaca data saldo.');
      }
    }

    // Cek saldo user
    const user = saldoData[userId];

    if (!user || typeof user.money !== 'number' || user.money <= 0) {
      return ctx.reply(
        '😕 Maaf, kamu belum memiliki saldo saat ini.\n🎮 Silakan bermain untuk mendapatkan saldo.'
      );
    }

    return ctx.reply(
      `💰 Saldo kamu saat ini: *${user.money.toLocaleString()} money*`,
      { parse_mode: 'Markdown' }
    );
  });
};