const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

module.exports = (bot) => {
  bot.command(["toanime", "jadianime"], async (ctx) => {
    try {
      const message = ctx.message;
      const reply = message?.reply_to_message;

      if (!reply || !reply.photo) {
        return ctx.reply("❌ Balas foto yang ingin diubah menjadi anime.");
      }

      const fileId = reply.photo[reply.photo.length - 1].file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const tempFilePath = `./temp_${Date.now()}.jpg`;

      // Unduh gambar dari Telegram
      const photo = await axios.get(fileLink.href, { responseType: "arraybuffer" });
      fs.writeFileSync(tempFilePath, photo.data);

      // Upload gambar ke hosting publik (qu.ax)
      const form = new FormData();
      form.append("files[]", fs.createReadStream(tempFilePath));
      const uploadRes = await axios.post("https://qu.ax/upload.php", form, {
        headers: form.getHeaders(),
      });

      if (!uploadRes.data.success || !uploadRes.data.files?.length) {
        fs.unlinkSync(tempFilePath);
        return ctx.reply("❌ Gagal upload gambar ke server.");
      }

      const imageUrl = uploadRes.data.files[0].url;

      // Kirim request ke PixNova API
      const payload = {
        session_hash: Math.random().toString(36).substring(2, 10),
        data: {
          source_image: imageUrl,
          strength: 0.6,
          prompt: "(masterpiece), best quality",
          negative_prompt:
            "(worst quality, low quality:1.4), (greyscale, monochrome:1.1), cropped, lowres , username, blurry, trademark, watermark, title, multiple view, Reference sheet, curvy, plump, fat, strabismus, clothing cutout, side slit,worst hand, (ugly face:1.2), extra leg, extra arm, bad foot, text, name",
          request_from: 2,
        },
      };

      const animeRes = await axios.post("https://pixnova.ai/api/photo2anime", payload, {
        headers: { "Content-Type": "application/json" },
      });

      fs.unlinkSync(tempFilePath); // Hapus file lokal sementara

      const resultUrl = animeRes.data?.output?.result?.[0];
      if (!resultUrl) {
        return ctx.reply("❌ Gagal mendapatkan hasil dari PixNova.");
      }

      await ctx.replyWithPhoto(
        { url: `https://oss-global.pixnova.ai/${resultUrl}` },
        { caption: "_✅ Gambar berhasil diubah menjadi anime!_" }
      );
    } catch (err) {
      console.error("[toanime] Error:", err);
      ctx.reply("⚠️ Terjadi kesalahan saat memproses gambar.");
    }
  });
};
