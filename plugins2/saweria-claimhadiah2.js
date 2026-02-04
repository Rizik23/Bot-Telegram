const fs = require('fs');
const path = require('path');
const config = require('../config');

const premPath = path.join(__dirname, '..', 'prem.json');

function loadPrem() {
  if (!fs.existsSync(premPath)) fs.writeFileSync(premPath, '[]');
  return JSON.parse(fs.readFileSync(premPath));
}

module.exports = (bot) => {
  bot.command('claimhadiah2', async (ctx) => {
    const sender = ctx.from.id.toString();
    const transaksiPath = './src/transaksi.json';
    const klaimPath = './src/claimed.json';

    // ⛔ Validasi Premium
    const premList = loadPrem();
    if (!premList.includes(sender)) {
      return ctx.reply('❌ Fitur ini khusus untuk user *Premium*.\n\nHubungi admin untuk upgrade!');
    }

    // Cek file transaksi dan klaim
    if (!fs.existsSync(transaksiPath)) return ctx.reply('❌ Data transaksi tidak ditemukan.');
    if (!fs.existsSync(klaimPath)) fs.writeFileSync(klaimPath, '{}');

    const transaksi = JSON.parse(fs.readFileSync(transaksiPath));
    const claimed = JSON.parse(fs.readFileSync(klaimPath));

    // Cek apakah user pernah menang Spin 1 kategori Bug
    const pernahMenang = transaksi.some(trx =>
      trx.sender === sender &&
      trx.hadiah === 'Spin 1' &&
      trx.status === 'selesai' &&
      trx.kategori?.toLowerCase() === 'bug'
    );

    if (!pernahMenang) {
      return ctx.reply('❌ Anda belum pernah memenangkan hadiah *Script Bug WA* dari spin.');
    }

    if (claimed[sender]?.hadiah_bug?.status === 'CLAIMED') {
      return ctx.reply('⚠️ Anda sudah klaim hadiah *Script Bug WA* sebelumnya.');
    }

    // Tandai sebagai sudah klaim
    if (!claimed[sender]) claimed[sender] = {};
    claimed[sender].hadiah_bug = {
      status: 'CLAIMED',
      tanggal: new Date().toLocaleDateString('id-ID')
    };

    fs.writeFileSync(klaimPath, JSON.stringify(claimed, null, 2));

    return ctx.reply(`✅ Anda berhasil klaim *Script Bug WA!*\n\n📥 Download: https://yourserver.com/download/bug-wa.zip`);
  });
};