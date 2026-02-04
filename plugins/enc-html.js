const fs = require("fs-extra");
const path = require("path");
const fetch = require("node-fetch");

module.exports = (bot) => {
  bot.command("enchtml", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    const customName = args[0] || "Noxxa";

    if (!ctx.message.reply_to_message?.document) {
      return ctx.reply("❌ Balas file `.html` untuk dienkripsi.");
    }

    const file = ctx.message.reply_to_message.document;
    if (!file.file_name.endsWith(".html")) {
      return ctx.reply("❌ File harus berformat `.html`");
    }

    const outputFile = path.join(__dirname, `../tmp/${customName || "encrypted"}.html`);

    try {
      const fileLink = await ctx.telegram.getFileLink(file.file_id);
      const response = await fetch(fileLink.href);
      const htmlContent = await response.text();

      const base64Encoded = Buffer.from(htmlContent).toString("base64");
      const resultScript = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Encrypted HTML</title></head><body><script>document.write(atob('${base64Encoded}'))</script></body></html>`;

      await fs.writeFile(outputFile, resultScript);

      await ctx.replyWithDocument({
        source: outputFile,
        filename: `enc-${file.file_name}`
      }, {
        caption: `✅ *File HTML terenkripsi base64*
Gunakan hanya di browser.
Nama: \`${customName}\``,
        parse_mode: "Markdown"
      });

      await fs.unlink(outputFile);
    } catch (err) {
      console.error("[EncryptHTML Error]", err);
      ctx.reply("❌ Gagal enkripsi file HTML.");
    }
  });
};
