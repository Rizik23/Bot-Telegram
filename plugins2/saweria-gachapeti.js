const fs = require("fs");
const path = require("path");
const { Saweria } = require("../lib/saweria");
const config = require('../config');

const premPath = path.join(__dirname, '..', 'prem.json');

function loadPrem() {
  if (!fs.existsSync(premPath)) fs.writeFileSync(premPath, '[]');
  return JSON.parse(fs.readFileSync(premPath));
}

module.exports = (bot) => {
  bot.command("gachapeti", async (ctx) => {
    const m = ctx.message;
    const prefix = "/";
    const sender = m.from.id.toString();
    const paymentFilePath = `./src/gateway/${sender}.json`;
    const saldoFilePath = "./saldo.json";
    const transaksiPath = "./src/transaksi.json";

    // ⛔ Validasi Premium
    const premList = loadPrem();
    if (!premList.includes(sender)) {
      return ctx.reply('❌ Fitur ini khusus untuk user *Premium*.\n\nHubungi admin untuk upgrade!');
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const cekSaldo = (userId) => {
      try {
        const data = fs.existsSync(saldoFilePath)
          ? JSON.parse(fs.readFileSync(saldoFilePath, "utf-8") || "{}")
          : {};
        return data[userId]?.money || 0;
      } catch {
        return 0;
      }
    };

    const tambahSaldo = (userId, amount) => {
      const data = fs.existsSync(saldoFilePath)
        ? JSON.parse(fs.readFileSync(saldoFilePath, "utf-8") || "{}")
        : {};
      if (!data[userId]) data[userId] = { money: 0 };
      data[userId].money += amount;
      fs.writeFileSync(saldoFilePath, JSON.stringify(data, null, 2));
    };

    const updateSaldo = (userId, amount) => {
      try {
        const saldoData = fs.existsSync(saldoFilePath)
          ? JSON.parse(fs.readFileSync(saldoFilePath, "utf-8") || "{}")
          : {};
        if (!saldoData[userId]) saldoData[userId] = { money: 0 };
        saldoData[userId].money += amount;
        fs.writeFileSync(saldoFilePath, JSON.stringify(saldoData, null, 2));
      } catch (error) {
        console.error("Error updating saldo:", error);
      }
    };

    if (fs.existsSync(paymentFilePath)) {
      return await ctx.reply(
        `⚠️ *Proses Gacha sebelumnya belum selesai!*\n\nKetik *${prefix}batalbeli* untuk membatalkan.`
      );
    }

    const gachaPrice = 5000;
    const randomAdditional = Math.floor(Math.random() * (250 - 110 + 1)) + 110;
    const amount = gachaPrice + randomAdditional;
    const userSaldo = cekSaldo(sender);

    const startGacha = async () => {
      const frames = [
        "🟦🟩🟫\n⬜🟪🟥\n🟧⬛🟨",
        "🛍️🟩🟫\n⬜🟪🟥\n🟧⬛🟨",
        "🟦🛍️🟫\n⬜🟪🟥\n🟧⬛🟨",
        "🟦🟩🛍️\n⬜🟪🟥\n🟧⬛🟨",
        "🟦🟩🟫\n🛍️🟪🟥\n🟧⬛🟨",
        "🟦🟩🟫\n⬜🟣🟥\n🟧⬛🟨",
      ];

      let gachaMsg;
      for (const frame of frames) {
        if (!gachaMsg) {
          gachaMsg = await ctx.reply(frame);
        } else {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            gachaMsg.message_id,
            null,
            frame
          );
        }
        await sleep(1500);
      }

      const gachaPool = [
        { kategori: "Common", hadiah: "Tidak ada hadiah", poin: 0, probabilitas: 0.7 },
        { kategori: "Rare", hadiah: "Rp 2.000", poin: 5, probabilitas: 0.15 },
        { kategori: "Epic", hadiah: "Peti Epic + Rp 5.000", poin: 10, probabilitas: 0.09 },
        { kategori: "Legendary", hadiah: "Script Otomatis", poin: 50, probabilitas: 0.004 },
        { kategori: "Mythical", hadiah: "Ultimate Peti", poin: 100, probabilitas: 0.001 },
      ];

      const pilihHasil = (pool) => {
        const rand = Math.random();
        let cumulative = 0;
        for (const item of pool) {
          cumulative += item.probabilitas;
          if (rand <= cumulative) return item;
        }
        return pool[0];
      };

      const hasil = pilihHasil(gachaPool);

      if (hasil.poin > 0) updateSaldo(sender, hasil.poin);

      const jumlahSaldo = parseInt(
        hasil.hadiah.replace("Rp ", "").replace(/\./g, ""), 10
      );

      if (!isNaN(jumlahSaldo) && jumlahSaldo > 0) {
        tambahSaldo(sender, jumlahSaldo);
      }

      await ctx.reply(`🎰 Anda mendapatkan kategori ${hasil.kategori}: ${hasil.hadiah}`);
    };

    if (userSaldo >= gachaPrice) {
      const saldoData = JSON.parse(fs.readFileSync(saldoFilePath, "utf-8") || "{}");
      if (!saldoData[sender]) saldoData[sender] = { money: 0 };
      saldoData[sender].money -= gachaPrice;
      fs.writeFileSync(saldoFilePath, JSON.stringify(saldoData, null, 2));

      await ctx.reply(`✅ *Pembayaran Berhasil!* 💰 Saldo terpotong: Rp${gachaPrice}\n🎮 Memulai Gacha Anda...`);

      const transaksi = {
        transactionId: `${sender}_${Date.now()}`,
        sender,
        amount: gachaPrice,
        hadiah: "Beli Gacha Peti",
        metode: "Saldo",
        tanggal: new Date().toLocaleDateString("id-ID"),
        waktu: new Date().toLocaleTimeString("id-ID"),
        status: "selesai"
      };

      let transaksiData = [];
      if (fs.existsSync(transaksiPath)) {
        transaksiData = JSON.parse(fs.readFileSync(transaksiPath, "utf8"));
      }

      transaksiData.push(transaksi);
      fs.writeFileSync(transaksiPath, JSON.stringify(transaksiData, null, 2), "utf8");

      await startGacha();
    } else {
      const Pay = new Saweria();
      const expiredAt = new Date(Date.now() + 10 * 60 * 1000);
      const res = await Pay.createPayment(amount, `Gacha - ${amount}`, {
        expired_at: expiredAt.toISOString(),
      });

      if (!res.status) return await ctx.reply(`❌ Gagal membuat pembayaran:\n${res.msg}`);

      const teks = `
📄 *INFO PEMBAYARAN GACHA*
🎮 *Permainan*: Gacha Peti
💰 *Total Pembayaran*: Rp${res.data.amount_raw}
📆 *Batas Waktu*: ${expiredAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
🆔 *ID Pembayaran*: ${res.data.id}
🛑 Jika ingin membatalkan, ketik *${prefix}batalbeli*.
      `.trim();

      fs.writeFileSync(paymentFilePath, JSON.stringify({
        number: sender,
        id: res.data.id,
        expiredAt: expiredAt.toISOString()
      }, null, 2));

      await ctx.replyWithPhoto({ source: Buffer.from(res.data.qr_image.split(",")[1], "base64") }, { caption: teks });

      let status = false;
      while (!status && new Date() < expiredAt) {
        await sleep(1000);
        const check = await Pay.checkPayment(res.data.id);
        if (check.status) {
          status = true;
          updateSaldo(sender, gachaPrice);
          fs.unlinkSync(paymentFilePath);

          const transaksi = {
            transactionId: `${sender}_${Date.now()}`,
            sender,
            amount: gachaPrice,
            hadiah: "Beli Gacha Peti",
            metode: "Saweria",
            tanggal: new Date().toLocaleDateString("id-ID"),
            waktu: new Date().toLocaleTimeString("id-ID"),
            status: "selesai"
          };

          let transaksiData = [];
          if (fs.existsSync(transaksiPath)) {
            transaksiData = JSON.parse(fs.readFileSync(transaksiPath, "utf8"));
          }

          transaksiData.push(transaksi);
          fs.writeFileSync(transaksiPath, JSON.stringify(transaksiData, null, 2), "utf8");

          await ctx.reply("✅ *Pembayaran Berhasil!*\n\n🎮 Memulai Gacha Anda...");
          await startGacha();
        }
      }

      if (!status) {
        fs.unlinkSync(paymentFilePath);
        await ctx.reply(`❌ Pembayaran tidak selesai dalam 10 menit. Silakan coba lagi.`);
      }
    }
  });
};