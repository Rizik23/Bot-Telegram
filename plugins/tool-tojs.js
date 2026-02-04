module.exports = (bot) => {
  bot.command("tojs", async (ctx) => {
    const reply = ctx.message.reply_to_message;

    if (!reply || !reply.text) {
      return ctx.reply("⚠️ Gunakan perintah ini dengan *reply* ke pesan berisi teks kode.", {
        parse_mode: "Markdown"
      });
    }

    let text = reply.text;

    // Normalize semua variasi escape karakter backtick
    text = text
      .replace(/\\`\\`\\`/g, "```") // Kalau user nulis \`\`\`
      .replace(/`{4,}/g, "```")    // Lebih dari 3 backtick → jadi 3
      .replace(/\\n/g, "\n");      // Escape newline kalau ada

    // Deteksi apakah teks udah mengandung blok kode
    const alreadyCodeBlock = text.includes("```");

    if (alreadyCodeBlock) {
      return ctx.reply("⚠️ Pesan yang direply sudah mengandung blok kode. Skip format ulang.");
    }

    const final = `\`\`\`javascript\n${text}\n\`\`\``;
    ctx.reply(final.length > 4096 ? final.slice(0, 4090) + "\n...```" : final, {
      parse_mode: "Markdown"
    });
  });
};
