module.exports = (bot) => {
  bot.command("tocode", async (ctx) => {
    const reply = ctx.message.reply_to_message;

    if (!reply || !reply.text) {
      return ctx.reply("⚠️ Gunakan perintah ini dengan *reply* ke pesan berisi kode/teks.", {
        parse_mode: "Markdown"
      });
    }

    let text = reply.text;

    // Normalisasi triple backtick rusak
    text = text
      .replace(/\\`\\`\\`/g, "```")
      .replace(/`{4,}/g, "```")
      .replace(/\\n/g, "\n");

    const alreadyHasBlock = text.includes("```");
    if (alreadyHasBlock) {
      return ctx.reply("⚠️ Pesan yang direply sudah mengandung blok kode.");
    }

    // Auto detect bahasa berdasarkan isi
    const lower = text.toLowerCase();
    let lang = "plaintext";
    if (/console\.log|=>|\{.*\}/.test(text)) lang = "javascript";
    else if (/def |import |:|print\(/.test(text)) lang = "python";
    else if (/select .* from|where /.test(lower)) lang = "sql";
    else if (/<[^>]+>/.test(text)) lang = "html";
    else if (/#include|int main/.test(text)) lang = "cpp";

    const wrapped = `\`\`\`${lang}\n${text}\n\`\`\``;
    ctx.reply(wrapped.length > 4096 ? wrapped.slice(0, 4090) + "\n...```" : wrapped, {
      parse_mode: "Markdown"
    });
  });
};
