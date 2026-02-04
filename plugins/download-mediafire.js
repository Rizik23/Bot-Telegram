const axios = require("axios");

// Fungsi escape agar semua teks tampil aman di HTML
function escapeHTML(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = (bot) => {
  bot.command("mediafire", async (ctx) => {
    const input = ctx.message.text.split(" ")[1];

    // Validasi awal: tidak ada URL atau tidak valid
    if (!input || !/^https?:\/\/(www\.)?mediafire\.com\/file\//i.test(input)) {
      return ctx.reply("🚫 Masukkan link MediaFire yang valid.\nContoh:\n/mediafire https://www.mediafire.com/file/xxx/file.zip/file");
    }

    // Tampilkan indikator proses
    const processingMessage = await ctx.reply("⏳ Sedang memproses file dari MediaFire...");

    try {
      const res = await axios.get("https://api.fasturl.link/downup/mediafiredown", {
        params: { url: input },
        headers: { accept: "application/json" },
        timeout: 10000 // maksimum 10 detik
      });

      const result = res.data?.result || {};

      const download = result.download || null;
      const filename = result.filename || "file.zip";
      const size = result.size || "-";
      const filetype = result.filetype || "-";
      const owner = result.owner || "Tidak diketahui";
      const created = result.created ? new Date(result.created).toLocaleString() : "-";

      if (!download) {
        await ctx.reply("❌ Gagal mendapatkan link download. Pastikan file bersifat publik.");
        return;
      }

      const caption = `
📁 <b>${escapeHTML(filename)}</b>
📦 <b>Ukuran:</b> ${escapeHTML(size)}
📄 <b>Tipe:</b> ${escapeHTML(filetype)}
👤 <b>Uploader:</b> ${escapeHTML(owner)}
📅 <b>Upload:</b> ${escapeHTML(created)}
🔗 <a href="${download}">Download Langsung</a>
`.trim();

      // Hapus pesan "memproses"
      await ctx.deleteMessage(processingMessage.message_id);

      // Kirim dokumen
      await ctx.replyWithDocument(
        { url: download, filename },
        {
          caption,
          parse_mode: "HTML"
        }
      );

    } catch (err) {
      console.error("❗ Mediafire error:", err.response?.data || err.message || err);
      await ctx.reply("⚠️ Tidak bisa mengunduh file saat ini. Silakan coba lagi nanti.");
    }
  });
};
