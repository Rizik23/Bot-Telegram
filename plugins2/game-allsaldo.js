const fs = require('fs');
const path = require('path');
const config = require('../config');
const SALDO_PATH = path.join(__dirname, '../saldo.json');

module.exports = (bot) => {
  bot.command('allsaldo', async (ctx) => {
    if (!config.OWNER_ID.includes(ctx.from.id.toString())) {
      return ctx.reply('❌ Perintah ini hanya untuk owner bot.');
    }

    let saldoData = {};
    if (fs.existsSync(SALDO_PATH)) {
      try {
        saldoData = JSON.parse(fs.readFileSync(SALDO_PATH));
      } catch (e) {
        console.error('Gagal membaca saldo.json:', e);
        return ctx.reply('⚠️ Gagal membaca data saldo.');
      }
    }

    const entries = Object.entries(saldoData);
    if (entries.length === 0) return ctx.reply('📦 Belum ada data saldo.');

    const list = entries
      .map(([id, data], i) => `${i + 1}. ID: \`${id}\` — 💰 *${data.money.toLocaleString()} money*`)
      .join('\n');

    await ctx.replyWithMarkdown(`📊 *Daftar Semua Saldo:*\n\n${list}`);
  });
};