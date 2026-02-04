const fs = require("fs");
const FormData = require("form-data");
const { fileTypeFromBuffer } = require("file-type");
const fetch = (...args) => import("node-fetch").then(res => res.default(...args));

module.exports = (bot) => {
  bot.command(["removebg", "rbg"], async (ctx) => {
    const reply = ctx.message?.reply_to_message;

    if (!reply || !reply.photo) {
      return ctx.reply("⚠️ Kirim atau reply sebuah foto terlebih dahulu.");
    }

    await ctx.reply("🖼️ Memproses penghapusan background...");

    try {
      const fileId = reply.photo[reply.photo.length - 1].file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const res = await fetch(fileLink.href);
      const buffer = await res.buffer();

      // Upload ke Catbox
      async function catboxUpload(buffer) {
        const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {
          ext: "bin",
          mime: "application/octet-stream",
        };
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", buffer, {
          filename: `file.${ext}`,
          contentType: mime,
        });

        const res = await fetch("https://catbox.moe/user/api.php", {
          method: "POST",
          body: form,
        });

        if (!res.ok) throw new Error("❌ Gagal menghubungi Catbox.");
        const url = await res.text();
        if (!url.startsWith("https://")) throw new Error("❌ Upload gagal.");
        return url;
      }

      const catboxUrl = await catboxUpload(buffer);
      const apiUrl = `https://api-simplebot.vercel.app/imagecreator/removebg?apikey=free&url=${encodeURIComponent(catboxUrl)}`;

      const res1 = await fetch(apiUrl);
const text = await res1.text();

if (!text.startsWith("{")) {
  throw new Error("❌ API tidak membalas dengan format JSON:\n\n" + text.slice(0, 100));
}

const jsonRes = JSON.parse(text);


      if (!jsonRes?.result) {
        console.log("❌ RESPONSE REMOVE.BG:", jsonRes);
        throw new Error("❌ Gagal menghapus background.");
      }

      await ctx.replyWithPhoto({ url: jsonRes.result }, {
        caption: "✅ Background berhasil dihapus."
      });

    } catch (err) {
      console.error("RemoveBG error:", err);
      ctx.reply("❌ Terjadi kesalahan: " + err.message);
    }
  });
};
