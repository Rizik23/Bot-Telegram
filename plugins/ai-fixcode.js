const fetch = require("node-fetch");

module.exports = (bot) => {
  bot.command("fixcode", async (ctx) => {
    try {
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
        return ctx.reply("❌ Balas pesan teks error atau file .js dulu bre.");
      }

      await ctx.reply("🧠 Otw gua bantu benerin kodenya ya bre...");

      // Prompt santai
      const prompt = `
Lu adalah AI expert dalam memperbaiki semua kode pemrograman (seperti JavaScript, Python, C++, dll). Tugas lu:

1. Perbaiki kode yang error atau bermasalah tanpa penjelasan tambahan.
2. Langsung tulis ulang kodenya yang sudah diperbaiki.
3. Jangan kasih penjelasan, cukup kirim kodenya aja.

4. Kasih hasilnya pake format \`\`\`(bahasa pemograman) di awal dan \`\`\` di akhir biar gua gampang salin.

Ini kodenya bre:

${code}
`;

      const url = `https://api.fasturl.link/aillm/gpt-4o?ask=${encodeURIComponent(prompt)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.result) {
        const reply = data.result.trim();

        if (!reply.includes("```")) {
          // Tambahin backtick kalau belum dikasih AI-nya
          const wrapped = `\`\`\`javascript\n${reply}\n\`\`\``;
          return ctx.reply(wrapped.length > 4000 ? wrapped.slice(0, 4000) + "..." : wrapped, {
            parse_mode: "Markdown",
          });
        }

        // Kalau AI udah kasih backtick, kirim langsung
        return ctx.reply(reply.length > 4000 ? reply.slice(0, 4000) + "..." : reply, {
          parse_mode: "Markdown",
        });
      } else {
        ctx.reply("❌ Gagal dapet balasan dari AI bre.");
      }
    } catch (err) {
      console.error("FixCode Error:", err);
      ctx.reply("❌ Terjadi error pas proses perbaikan kode.");
    }
  });
};
