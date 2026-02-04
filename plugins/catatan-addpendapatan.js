const fs = require('fs');
const path = require('path');
const config = require('../config');
const pendapatanFile = path.join(__dirname, '../src/pendapatan.json');

// Load data pendapatan
let pendapatanList = [];
if (fs.existsSync(pendapatanFile)) {
  pendapatanList = JSON.parse(fs.readFileSync(pendapatanFile));
}

// Fungsi mendapatkan waktu WIB
function getWaktuWIB() {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 3600000 * 7);
  return wib.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

module.exports = (bot) => {
  bot.command('addpendapatan', async (ctx) => {
      if (!config.OWNER_ID.includes(ctx.from.id)) {
        return ctx.reply('❌ *Perintah ini hanya untuk owner!*', { parse_mode: 'Markdown' });
      }

    const text = ctx.message.text.split(' ').slice(1).join(' ');

    if (!text || !text.includes('|')) {
      return ctx.reply(`⚠️ *Format salah!* Gunakan:\n/addpendapatan harga|nama barang|pembayaran|total|tanggal`, { parse_mode: 'Markdown' });
    }

    const [harga, namaBarang, pembayaran, total, tanggal] = text.split('|').map(v => v.trim());

    if (!harga || !namaBarang || !pembayaran || !total || !tanggal) {
      return ctx.reply(`⚠️ *Format salah!* Gunakan:\n/addpendapatan harga|nama barang|pembayaran|total|tanggal`, { parse_mode: 'Markdown' });
    }

    const newData = {
      harga: parseInt(harga),
      namaBarang,
      pembayaran,
      total: parseInt(total),
      tanggal,
      waktu: getWaktuWIB()
    };

    pendapatanList.push(newData);
    fs.writeFileSync(pendapatanFile, JSON.stringify(pendapatanList, null, 2));

    return ctx.reply(
      `✅ *Berhasil menambahkan pendapatan:*\n` +
      `📦 *Nama Barang*: ${newData.namaBarang}\n` +
      `💰 *Harga*: Rp${newData.harga}\n` +
      `💳 *Pembayaran*: ${newData.pembayaran}\n` +
      `📊 *Total*: Rp${newData.total}\n` +
      `📅 *Tanggal*: ${newData.tanggal}\n` +
      `⏰ *Waktu*: ${newData.waktu}`,
      { parse_mode: 'Markdown' }
    );
  });
};