const axios = require("axios");
const fetch = require("node-fetch");
const FormData = require("form-data");
const { fileTypeFromBuffer } = require("file-type");

module.exports = (bot) => {
  bot.command("hd", async (ctx) => {
    try {
      const media = ctx.message.reply_to_message;
      if (!media || (!media.photo && !media.document && !media.sticker)) {
        return ctx.reply("❌ Balas gambar/stiker yang mau di-HD-kan!");
      }

      let fileId;
      if (media.photo) {
        fileId = media.photo[media.photo.length - 1].file_id;
      } else if (media.document || media.sticker) {
        fileId = (media.document || media.sticker).file_id;
      }

      const fileLink = await ctx.telegram.getFileLink(fileId);
      const buffer = await (await fetch(fileLink.href)).buffer();

      // Upload ke Catbox
      const uploadedUrl = await uploadCatbox(buffer).catch(() => null);
      if (!uploadedUrl) return ctx.reply("❌ Gagal upload gambar.");

      await ctx.reply("🛠️ Meng-HD-kan gambar...");

      const resize = 4; // bisa diubah ke 2 / 4 / 8
      const upscaleUrl = `https://api.fasturl.link/aiimage/upscale?imageUrl=${encodeURIComponent(uploadedUrl)}&resize=${resize}`;
      const imageRes = await axios.get(upscaleUrl, { responseType: "arraybuffer" });

      const finalBuffer = Buffer.from(imageRes.data);
      await ctx.replyWithPhoto({ source: finalBuffer }, {
        caption: `✅ Gambar berhasil di-HD-kan (${resize}x) oleh *ferninesite*`,
        parse_mode: "Markdown"
      });
    } catch (err) {
      console.error("Upscale Error:", err);
      ctx.reply("❌ Gagal meng-HD-kan gambar.");
    }
  });
};

async function uploadCatbox(buffer) {
  const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {
    ext: "jpg",
    mime: "image/jpeg",
  };

  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", buffer, {
    filename: `image.${ext}`,
    contentType: mime,
  });

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error("❌ Upload ke Catbox gagal.");
  return await res.text();
}