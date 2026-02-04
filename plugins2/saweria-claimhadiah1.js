const fs = require('fs');
const path = require('path');
const config = require('../config');

const premPath = path.join(__dirname, '..', 'prem.json');

function loadPrem() {
  if (!fs.existsSync(premPath)) fs.writeFileSync(premPath, '[]');
  return JSON.parse(fs.readFileSync(premPath));
}

module.exports = (bot) => {
  bot.command('claimhadiah1', async (ctx) => {
    const sender = ctx.from.id.toString();
    const transaksiPath = './src/transaksi.json';
    const klaimPath = './src/claimed.json';

    // ⛔ Validasi Premium
    const premList = loadPrem();
    if (!premList.includes(sender)) {
      return ctx.reply('❌ Fitur ini khusus untuk user *Premium*.\n\nHubungi admin untuk upgrade!');
    }

    // Pastikan file transaksi dan klaim ada
    if (!fs.existsSync(transaksiPath)) return ctx.reply('❌ Data transaksi tidak ditemukan.');
    if (!fs.existsSync(klaimPath)) fs.writeFileSync(klaimPath, '{}');

    const transaksi = JSON.parse(fs.readFileSync(transaksiPath));
    const claimed = JSON.parse(fs.readFileSync(klaimPath));

    // Cek apakah pernah menang Spin 1 kategori AI
    const pernahMenang = transaksi.some(trx =>
      trx.sender === sender &&
      trx.hadiah === 'Spin 1' &&
      trx.status === 'selesai' &&
      trx.kategori?.toLowerCase() === 'ai'
    );

    if (!pernahMenang) {
      return ctx.reply('❌ Anda belum pernah memenangkan hadiah *Script AI Bot* dari permainan spin.');
    }

    if (claimed[sender]?.hadiah_ai?.status === 'CLAIMED') {
      return ctx.reply('⚠️ Anda sudah pernah klaim hadiah *Script AI Bot* sebelumnya.');
    }

    // Tandai sebagai sudah diklaim
    if (!claimed[sender]) claimed[sender] = {};
    claimed[sender].hadiah_ai = {
      status: 'CLAIMED',
      tanggal: new Date().toLocaleDateString('id-ID')
    };

    fs.writeFileSync(klaimPath, JSON.stringify(claimed, null, 2));

    return ctx.reply(`✅ Anda berhasil klaim *Script AI Bot!*\n\n📥 Download: https://yourserver.com/download/ai-bot.zip`);
  });
};