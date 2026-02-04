const fs = require('fs');
const config = require('../config');

module.exports = (bot) => {
  bot.command('rekaptransaksi', async (ctx) => {
    const senderId = ctx.from.id.toString();
    if (!config.OWNER_ID.includes(senderId)) {
      return ctx.reply('❌ Perintah ini hanya untuk owner bot.');
    }

    const transaksiPath = './src/transaksi.json';
    if (!fs.existsSync(transaksiPath)) {
      return ctx.reply('📂 File transaksi.json tidak ditemukan.');
    }

    const transactions = JSON.parse(fs.readFileSync(transaksiPath, 'utf8'));
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return ctx.reply('❌ Tidak ada transaksi yang tercatat.');
    }

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    let totalTransaksi = 0, totalUser = new Set();
    let transaksiHariIni = 0, saldoHariIni = 0, saweriaHariIni = 0;
    let totalSaldo = 0, totalSaweria = 0;
    let produkKeseluruhan = {}, produkHarian = {};
    let pembeliKeseluruhan = {}, pembeliHariIni = {};
    let totalKerugian = 0, transaksiGagal = 0;
    let transaksiMingguan = [];
    
    for (const trx of transactions) {
      if (!trx.tanggal || !trx.tanggal.includes('/')) continue;

      const [d, m, y] = trx.tanggal.split('/').map(Number);
      const trxDate = new Date(y, m - 1, d);
      trx.amount = Number(trx.amount.toString().replace(/[^\d]/g, ''));

      totalTransaksi++;
      totalUser.add(trx.sender);

      const isToday = trxDate.toDateString() === today.toDateString();
      const isWithinWeek = trxDate >= weekAgo && trxDate <= today;
      const isSaweria = ['saweria', 'sw', 'sawer'].some(m => trx.metode?.toLowerCase().includes(m));
      const isSaldo = trx.metode?.toLowerCase().includes('saldo');
      const isSelesai = trx.status === 'selesai';

      if (isToday) {
        transaksiHariIni++;
        if (isSaldo && isSelesai) saldoHariIni += trx.amount;
        if (isSaweria && isSelesai) saweriaHariIni += trx.amount;
        if (trx.hadiah) produkHarian[trx.hadiah] = (produkHarian[trx.hadiah] || 0) + 1;
        pembeliHariIni[trx.sender] = (pembeliHariIni[trx.sender] || 0) + trx.amount;
      }

      if (isWithinWeek) {
        transaksiMingguan.push(trx);
      }

      if (isSaldo && isSelesai) totalSaldo += trx.amount;
      if (isSaweria && isSelesai) totalSaweria += trx.amount;
      if (!isSelesai) {
        transaksiGagal++;
        totalKerugian += trx.amount;
      }

      if (trx.hadiah) {
        produkKeseluruhan[trx.hadiah] = (produkKeseluruhan[trx.hadiah] || 0) + 1;
      }

      pembeliKeseluruhan[trx.sender] = (pembeliKeseluruhan[trx.sender] || 0) + trx.amount;
    }

    const produkJarang = Object.entries(produkKeseluruhan)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
      .map(([produk, jumlah], i) => `${i + 1}. ${produk} - ${jumlah}x`);

    const pembeliKecil = Object.entries(pembeliKeseluruhan)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
      .map(([pengguna, nominal], i) => `${i + 1}. ${pengguna} - Rp ${nominal.toLocaleString('id-ID')}`);

    const rekap = `
📊 *Rekap Transaksi Bot*

📌 Total Transaksi: ${totalTransaksi}
👤 Pengguna Unik: ${totalUser.size}
📆 Hari Ini: ${transaksiHariIni} transaksi
💰 Saldo Hari Ini: Rp ${saldoHariIni.toLocaleString('id-ID')}
💳 Saweria Hari Ini: Rp ${saweriaHariIni.toLocaleString('id-ID')}
📈 Keuntungan Hari Ini: Rp ${(saldoHariIni + saweriaHariIni).toLocaleString('id-ID')}
✅ Total Saldo: Rp ${totalSaldo.toLocaleString('id-ID')}
✅ Total Saweria: Rp ${totalSaweria.toLocaleString('id-ID')}
❌ Gagal: ${transaksiGagal} (Rp ${totalKerugian.toLocaleString('id-ID')})

📦 Produk Jarang Dibeli:
${produkJarang.join('\n') || '- tidak ada -'}

👥 Pembeli Kecil:
${pembeliKecil.join('\n') || '- tidak ada -'}
    `.trim();

    const rekapPath = './src/rekap_transaksi.json';
    fs.writeFileSync(rekapPath, JSON.stringify({
      totalTransaksi,
      totalUser: totalUser.size,
      transaksiHariIni,
      saldoHariIni,
      saweriaHariIni,
      totalKeuntunganHariIni: saldoHariIni + saweriaHariIni,
      produkHarian,
      pembeliHariIni,
      totalProdukTerjual: Object.values(produkKeseluruhan).reduce((a, b) => a + b, 0),
      totalSaldo,
      totalSaweria,
      totalKerugian,
      transaksiGagal,
      transaksiTerbaru: transactions.slice(-10).reverse(),
      transaksiMingguan
    }, null, 2));

    await ctx.reply(rekap, { parse_mode: 'Markdown' });
    await ctx.replyWithDocument({ source: rekapPath, filename: 'rekap_transaksi.json' });
  });
};