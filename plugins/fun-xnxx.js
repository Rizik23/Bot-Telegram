
    const fetch = require("node-fetch");

function escapeMarkdownV2(text) {
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!')
    .replace(/'/g, "\\'");
}

module.exports = (bot) => {
  bot.command("xnxxvid", async (ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) return ctx.reply(`Contoh: /xnxxvid stepmoms`, { parse_mode: "MarkdownV2" });

    try {
      const response = await fetch(`https://api.agatz.xyz/api/xnxx?message=${encodeURIComponent(text)}`);
      const res = await response.json();

      if (res.status !== 200) {
        return ctx.reply(`API Error: ${res.creator}`);
      }

      let resultText = '';
      for (let i = 0; i < res.data.result.length; i++) {
        const result = res.data.result[i];
        let title = escapeMarkdownV2(result.title);
        let info = escapeMarkdownV2(result.info);
        let link = escapeMarkdownV2(result.link);

        resultText += `*Title:* ${title}\n*Info:* ${info}\n*Link:* ${link}\n\n`;
      }

      if (resultText.length > 4096) {
        resultText = resultText.substring(0, 4090) + '\\.\\.\\.';
      }

      await ctx.reply(resultText.trim(), { parse_mode: 'MarkdownV2' });
    } catch (e) {
      console.error(e);
      ctx.reply('❌ Gagal mengambil data dari API.');
    }
  });
};
