const fs = require('fs');
const path = require('path');
const config = require('../config');
const { Saweria } = require('../lib/saweria');
const { sleep, pilihHadiah } = require('../lib/spin');

const premPath = path.join(__dirname, '..', 'prem.json');

function loadPrem() {
  if (!fs.existsSync(premPath)) fs.writeFileSync(premPath, '[]');
  return JSON.parse(fs.readFileSync(premPath));
}

module.exports = (bot) => {
  bot.command('spin1', async (ctx) => {
    const m = ctx.message;
    const sender = m.from.id.toString();
    const prefix = '/';

    // ⛔ Validasi Premium
    const premList = loadPrem();
    if (!premList.includes(sender)) {
      return ctx.reply('❌ Fitur ini khusus untuk user *Premium*.\n\nHubungi admin untuk upgrade!');
    }

    try {
      const hadiahPool = [
        { kategori: "Zonk", hadiah: "Tidak ada hadiah", poin: 3, probabilitas: 0.07, notifikasi: "⚪ Anda tidak mendapatkan hadiah kali ini." },
        { kategori: "Lucky", hadiah: "Rp 2.000", poin: 5, probabilitas: 0.02, notifikasi: "🫱🟣🫲 Selamat! Anda mendapatkan hadiah uang tunai Rp 2.000!" },
        { kategori: "AI", hadiah: "Script AI Bot", poin: 20, probabilitas: 0.06, notifikasi: "🫱🟢🫲 Selamat! Anda mendapatkan *Script AI Bot*! Ketik *.claimhadiah1* untuk klaim hadiah." },
        { kategori: "Bug", hadiah: "Script Bug WA", poin: 20, probabilitas: 0.03, notifikasi: "🫱🔴🫲 Selamat! Anda mendapatkan *Script Bug WA*! Ketik *.claimhadiah2* untuk klaim hadiah." },
        { kategori: "Mega Win", hadiah: "Rp 8.000", poin: 50, probabilitas: 0.01, notifikasi: "🌟✨ *MEGA WIN!* ✨🌟 Selamat! Anda mendapatkan hadiah uang tunai Rp 8.000 dan 50 poin!" }
      ];

      const spinPrice = 1500;
      const randomAdditional = Math.floor(Math.random() * (250 - 110 + 1)) + 110;
      const amount = spinPrice + randomAdditional;

      const gatewayPath = `./src/gateway/${sender}.json`;
      if (fs.existsSync(gatewayPath)) {
        return ctx.reply(`⚠️ *Proses spin sebelumnya belum selesai!*\n\nKetik *${prefix}batalbeli* untuk membatalkan.`);
      }

      const Pay = new Saweria();
      const expirationTime = new Date(Date.now() + 10 * 60 * 1000);
      const res = await Pay.createPayment(amount, `Spin - ${amount}`, {
        expired_at: expirationTime.toISOString(),
      });

      if (!res.status) {
        return ctx.reply(`❌ Terjadi kesalahan saat membuat pembayaran:\n${res.msg}`);
      }

      fs.writeFileSync(gatewayPath, JSON.stringify({
        number: sender,
        id: res.data.id,
        expiredAt: expirationTime.toISOString(),
      }, null, 3));

      const teks = `
📄 *INFO PEMBAYARAN SPIN*

🎮 *Permainan*: Spin
💰 *Total Pembayaran*: Rp ${amount.toLocaleString("id-ID")}
📆 *Batas Waktu*: ${expirationTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
🆔 *ID Pembayaran*: ${res.data.id}

📌 *Catatan*: 
1️⃣ QR berlaku hanya untuk 1 kali transfer.
2️⃣ QR akan kedaluwarsa dalam 10 menit.
3️⃣ Setelah transfer, tunggu beberapa saat hingga status diperbarui otomatis.

🛑 Jika ingin membatalkan, ketik *${prefix}batalbeli*.
📞 Untuk bantuan, hubungi *${prefix}owner*.
`;

      await ctx.replyWithPhoto({ source: Buffer.from(res.data.qr_image.split(",")[1], "base64") }, { caption: teks });

      // 🔄 Cek Pembayaran
      let status = false;
      const maxAttempts = 600;
      let attempts = 0;

      while (!status && attempts < maxAttempts) {
        await sleep(1000);
        attempts++;
        if (new Date() > expirationTime) {
          fs.unlinkSync(gatewayPath);
          return ctx.reply(`❌ *Waktu pembayaran habis.*\nSilakan coba lagi.`);
        }

        const check = await Pay.checkPayment(res.data.id);
        status = check.status;
        if (status) {
          fs.unlinkSync(gatewayPath);
          await ctx.reply(`✅ *Pembayaran Berhasil melalui QRIS!*\n\n🎮 Memulai Spin Anda...`);

          const transaksiPath = './src/transaksi.json';
          if (!fs.existsSync(transaksiPath)) {
            fs.writeFileSync(transaksiPath, '[]');
          }

          const transaksiData = JSON.parse(fs.readFileSync(transaksiPath, 'utf8'));
          transaksiData.push({
            transactionId: `${sender}_${Date.now()}`,
            sender: sender,
            amount: amount,
            kategori: 'Spin',
            hadiah: "Spin 1",
            metode: "Saweria",
            tanggal: new Date().toLocaleDateString('id-ID'),
            waktu: new Date().toLocaleTimeString('id-ID'),
            status: "selesai"
          });

          fs.writeFileSync(transaksiPath, JSON.stringify(transaksiData, null, 2), 'utf8');
          break;
        }
      }

      if (!status) {
        return ctx.reply(`❌ Pembayaran tidak selesai dalam waktu 10 menit. Silakan coba lagi.`);
      }

      // 🎰 Animasi Spin
      const animasi = ["⚫🟤🟣🔵", "⬛🟫🟪🟦", "🟥🟠🟨🟢", "🟧🟩⚪🔴"];
      let spinCount = Math.floor(Math.random() * (10 - 7 + 1)) + 7;
      let spinMsg;
      for (let i = 0; i < spinCount; i++) {
        for (const frame of animasi) {
          if (!spinMsg) {
            spinMsg = await ctx.reply(frame);
          } else {
            await ctx.telegram.editMessageText(ctx.chat.id, spinMsg.message_id, null, frame);
          }
          await sleep(400);
        }
      }

      // 🎁 Pilih Hadiah
      const hasil = pilihHadiah(hadiahPool);
      let hasilText = `
🎰 *HASIL SPIN*

📅 *Tanggal*: ${new Date().toLocaleDateString('id-ID')}
⏰ *Waktu*: ${new Date().toLocaleTimeString('id-ID')}
📱 *Pemain*: ${ctx.from.first_name || sender}
🎮 *Permainan*: Spin
🎁 *Hadiah*: ${hasil.hadiah}
🏅 *Poin*: ${hasil.poin}

${hasil.notifikasi}

✨ *Terima kasih telah bermain di Galaxy Md!* ✨
`;

      if (hasil.kategori === "AI") hasilText += `\n📌 *Instruksi*: Ketik */claimhadiah1* untuk klaim Script AI.`;
      if (hasil.kategori === "Bug") hasilText += `\n📌 *Instruksi*: Ketik */claimhadiah2* untuk klaim Script Bug.`;

      await ctx.reply(hasilText);

      // 📢 Notifikasi ke Owner
      if (["Mega Win", "Lucky"].includes(hasil.kategori)) {
        const ownerNumber = "7681171661";
        await ctx.telegram.sendMessage(ownerNumber, `
📢 *NOTIFIKASI HADIAH SPIN*

📱 *Pemain*: ${sender}
🎮 *Permainan*: Spin
🎁 *Hadiah*: ${hasil.hadiah}
🏅 *Poin*: ${hasil.poin}
📆 *Tanggal*: ${new Date().toLocaleDateString('id-ID')}
⏰ *Waktu*: ${new Date().toLocaleTimeString('id-ID')}

⚡ *Mohon segera proses hadiah untuk pemain ini!*
        `);
      }

    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Terjadi kesalahan saat memproses spin. Silakan coba lagi nanti.");
    }
  });
};