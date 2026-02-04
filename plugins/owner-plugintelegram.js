const fetch = require("node-fetch");

module.exports = (bot) => {
 bot.command("plugintelegram", async (ctx) => {
    
    const text = ctx.message.text?.split(" ").slice(1).join(" ");
    if (!text) {
      return ctx.reply("❌ Kasih deskripsi fitur plugin-nya bre.\n\nContoh: /plugintelegram hapus promosi di grup");
    }

    await ctx.reply("🤖 Lagi gua bikinin pluginnya bre, tunggu bentar ya...");

      const prompt = `
Lu adalah AI expert coding yang tugasnya mengubah plugin bot WhatsApp (format handler yang pakai conn.sendMessage) menjadi plugin bot Telegram versi Node-Telegram-Bot-API dalam format CommonJS.

Tugas dan aturan:
1. Ubah ke format: \`module.exports = (bot) => { ... }\`
2. Gunakan \`bot.onText(/^\\/command(?:\\s+(.*))?$/i, (msg, match) => { ... })\` untuk command seperti \`/menu\`, \`/ping\`, dst.
3. Semua balasan ubah dari \`conn.sendMessage\` atau \`m.reply()\` menjadi \`bot.sendMessage(chatId, ...)\`, \`bot.sendPhoto(...)\`, dst.
4. Untuk akses teks user, gunakan \`match[1]\` atau \`match[2]\`.
5. Gunakan \`msg.chat.id\` sebagai \`chatId\`.
6. Jika ada \`thumbnail\`, ubah ke \`bot.sendPhoto(chatId, urlGambar, { caption })\`.
7. Jangan kirim penjelasan apa pun. Cukup kasih full kode hasil konversi.
8. Bungkus kode hasil dengan \`\`\`javascript di awal dan \`\`\` di akhir.

Ini kode/deskripsi yang mau di-convert:
${text}
`;
try {
      const url = `https://api.fasturl.link/aillm/gpt-4o?ask=${encodeURIComponent(prompt)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.result) {
        const reply = data.result.trim();

        if (!reply.includes("```")) {
          const wrapped = `\`\`\`javascript\n${reply}\n\`\`\``;
          return ctx.reply(wrapped.length > 4000 ? wrapped.slice(0, 4000) + "..." : wrapped, {
            parse_mode: "Markdown",
          });
        }

        return ctx.reply(reply.length > 4000 ? reply.slice(0, 4000) + "..." : reply, {
          parse_mode: "Markdown",
        });
      } else {
        ctx.reply("❌ Gagal dapet balasan dari AI bre.");
      }
    } catch (err) {
      console.error("BuatkanPlugin Error:", err);
      ctx.reply("❌ Terjadi error pas buat plugin.");
    }
  });
};
