const fetch = require("node-fetch");

module.exports = (bot) => {
  bot.command("editcode", async (ctx) => {
    try {
      const userInput = ctx.message.text?.split(" ").slice(1).join(" ");
      if (!userInput) return ctx.reply("⚠️ Contoh: /editcode tambahkan audio dengan url ini https://...");

      let code = null;

      // Ambil dari balasan teks
      if (ctx.message.reply_to_message?.text) {
        code = ctx.message.reply_to_message.text;
      }

      // Atau ambil dari file .js
      else if (ctx.message.reply_to_message?.document) {
        const doc = ctx.message.reply_to_message.document;
        if (
          doc.mime_type === "application/javascript" ||
          doc.file_name.endsWith(".js")
        ) {
          const fileLink = await ctx.telegram.getFileLink(doc.file_id);
          const res = await fetch(fileLink.href);
          code = await res.text();
        }
      }

      if (!code) {
        return ctx.reply("❌ Balas pesan teks atau file .js dulu bre.");
      }

      await ctx.reply("🧠 Otw gua edit kodenya sesuai perintah lu...");

      // Prompt pintar buat AI
      const prompt = `
Lu adalah AI expert coding. Gua punya satu file script yang pengen gua ubah.

Tugas lu:
1. Ubah kodenya sesuai perintah gua.
2. Jangan kasih penjelasan tambahan.
3. Langsung kirim hasil akhir dalam format \`\`\`javascript

Perintah edit:
${userInput}

Kodenya:
${code}
`;

      const url = `https://api.fasturl.link/aillm/gpt-4o?ask=${encodeURIComponent(prompt)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.result) {
        const reply = data.result.trim();

        // Bungkus hasil dengan Markdown jika belum dibungkus
        const finalCode = reply.includes("```") ? reply : `\`\`\`javascript\n${reply}\n\`\`\``;

        return ctx.reply(finalCode.length > 4000 ? finalCode.slice(0, 4000) + "..." : finalCode, {
          parse_mode: "Markdown",
        });
      } else {
        return ctx.reply("❌ Gagal dapet respon dari AI bre.");
      }
    } catch (err) {
      console.error("CodeEdit Error:", err);
      ctx.reply("❌ Terjadi error pas edit kode.");
    }
  });
};
