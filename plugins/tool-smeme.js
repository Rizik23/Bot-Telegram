const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports = (bot) => {
  bot.command(['smeme', 'stickermeme', 'stickmeme'], async (ctx) => {
    const reply = ctx.message.reply_to_message;
    const text = ctx.message.text.split(' ').slice(1).join(' ');

    if (!reply || !reply.photo) {
      return ctx.reply("❌ Balas gambar dengan: /smeme atas|bawah");
    }
    if (!text.includes('|')) {
      return ctx.reply("❌ Format teks salah, gunakan: atas|bawah");
    }

    const [atas, bawah] = text.split('|');
    const fileId = reply.photo[reply.photo.length - 1].file_id;

    try {
      const fileUrl = await ctx.telegram.getFileLink(fileId);
      const imageResp = await axios.get(fileUrl.href, { responseType: 'stream' });

      const tmpPath = path.join(__dirname, `temp_${Date.now()}.jpg`);
      const writer = fs.createWriteStream(tmpPath);
      imageResp.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Upload ke uguu
      const form = new FormData();
      form.append("file", fs.createReadStream(tmpPath));
      const upload = await axios.post("https://uguu.se/upload.php", form, {
        headers: form.getHeaders(),
      });

      const bgUrl = upload.data.files?.[0]?.url;
      if (!bgUrl) throw new Error("❌ Gagal upload ke Uguu.se");

      const memeUrl = `https://api.memegen.link/images/custom/${encodeURIComponent(atas)}/${encodeURIComponent(bawah)}.png?background=${bgUrl}`;
      const memeResp = await axios.get(memeUrl, { responseType: "arraybuffer" });

      await ctx.replyWithSticker({ source: Buffer.from(memeResp.data) });

      fs.unlinkSync(tmpPath);
    } catch (err) {
      console.error("❌ Error SMEME:", err.message);
      ctx.reply("❌ Gagal bikin stiker meme. Coba ulangi atau ganti gambar.");
    }
  });
};