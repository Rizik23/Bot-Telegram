const fs = require("fs");
const path = require("path");
const config = require('../config'); 

module.exports = (bot) => {
  // Kirim file langsung
  bot.command("file", async (ctx) => {
   const userId = String(ctx.from.id);
   if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma bisa dipakai sama owner bot aja bre.");
    }
    const args = ctx.message.text.split(" ").slice(1);
    const filePath = args.join(" ");
    const resolvedPath = path.resolve(process.cwd(), filePath);

    if (!filePath) return ctx.reply("❗ Contoh: `/file ./plugins/ttmp3.js`", { parse_mode: "Markdown" });
    if (!resolvedPath.startsWith(process.cwd())) return ctx.reply("⚠️ Path tidak valid.");
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) return ctx.reply("❌ File tidak ditemukan.");

    try {
      await ctx.replyWithDocument({
        source: resolvedPath,
        filename: path.basename(resolvedPath)
      });
    } catch (err) {
      console.error("File Error:", err.message);
      ctx.reply("❌ Gagal mengirim file.");
    }
  });

  // Tampilkan isi file dalam gaya salin kode
  bot.command("show", async (ctx) => {
      const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma bisa dipakai sama owner bot aja bre.");
    }
    const args = ctx.message.text.split(" ").slice(1);
    const filePath = args.join(" ");
    const resolvedPath = path.resolve(process.cwd(), filePath);

    if (!filePath) return ctx.reply("❗ Contoh: `/show ./plugins/ttmp3.js`", { parse_mode: "Markdown" });
    if (!resolvedPath.startsWith(process.cwd())) return ctx.reply("⚠️ Path tidak valid.");
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) return ctx.reply("❌ File tidak ditemukan.");

    try {
      const content = fs.readFileSync(resolvedPath, "utf8");
      const chunks = splitText(content, 4000);
      for (const chunk of chunks) {
        await ctx.reply(`\`\`\`\n${chunk}\n\`\`\``, { parse_mode: "Markdown" });
      }
    } catch (err) {
      console.error("Show Error:", err.message);
      ctx.reply("❌ Gagal membaca file.");
    }
  });
 
};

// Fungsi bantu untuk split text panjang ke dalam batas Telegram
function splitText(text, maxLength) {
  const lines = text.split("\n");
  const chunks = [];
  let chunk = "";

  for (const line of lines) {
    if ((chunk + "\n" + line).length > maxLength) {
      chunks.push(chunk);
      chunk = line;
    } else {
      chunk += "\n" + line;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}
