const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const config = require("../config"); // Pastikan path config.js sesuai
module.exports = (bot) => {
 bot.command("convertplugin", async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma bisa dipakai sama owner bot aja bre.");
    }
    try {
      let code = null;

      // Ambil dari reply text
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

      if (!code) return ctx.reply("❌ Balas teks atau file .js dulu bre.");

      await ctx.reply("🔄 Mengonversi plugin, tunggu sebentar...");

      const prompt = `
Lu adalah AI expert coding dalam membuat plugin bot Telegram versi Telegraf dengan format CommonJS.

Tugas lu:
1. Buatin plugin versi telegraf commonjs bre pake \`module.exports = (bot) => {\`
2. Gunakan \`bot.command\` buat handle command.
3. Kalau perlu filter lain boleh pakai \`bot.on('message', ...)\` atau lainnya.
4. Jangan kasih penjelasan, cukup kirim full kode pluginnya aja.
5. Bungkus hasilnya pake \`\`\`javascript di awal dan \`\`\` di akhir biar gampang disalin.
Ini kodenya bre:


${code}
`;

      const url = `https://fastrestapis.fasturl.cloud/aillm/gpt-4o?ask=${encodeURIComponent(prompt)}`;
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
      console.error("ConvertPlugin Error:", err);
      ctx.reply("❌ Terjadi error saat konversi plugin.");
    }
  });
};
