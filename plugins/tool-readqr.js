const axios = require("axios");
const Jimp = require("jimp");
const QrCode = require("qrcode-reader");

module.exports = (bot) => {
  bot.command("readqr", async (ctx) => {
    const replied = ctx.message.reply_to_message;
    if (!replied || !replied.photo) {
      return ctx.reply("Balas gambar QRIS-nya bro.");
    }

    try {
      // Ambil file ID dari foto (ambil resolusi tertinggi)
      const fileId = replied.photo[replied.photo.length - 1].file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);

      // Download image jadi buffer
      const response = await axios.get(fileLink.href, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);

      // Fungsi baca QR
      const readQRISFromBuffer = async (buffer) => {
        return new Promise(async (resolve, reject) => {
          try {
            const image = await Jimp.read(buffer);
            const qr = new QrCode();
            qr.callback = (err, value) => {
              if (err) return reject(err);
              resolve(value ? value.result : null);
            };
            qr.decode(image.bitmap);
          } catch (error) {
            reject(error);
          }
        });
      };

      const hasilQR = await readQRISFromBuffer(buffer);
      if (!hasilQR) return ctx.reply("Gagal membaca QR bro.");
      ctx.reply(`📦 *Isi QR:* \n\n${hasilQR}`);
    } catch (err) {
      console.error("Error baca QR:", err);
      ctx.reply("❌ Gagal proses QR: " + err.message);
    }
  });
};
