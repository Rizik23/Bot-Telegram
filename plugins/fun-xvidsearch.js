const fetch = require('node-fetch');

function escapeMarkdown(text) {
  return String(text || '').replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

module.exports = (bot) => {
  bot.command('xsearch', async (ctx) => {
    const query = ctx.message.text.split(" ").slice(1).join(" ");
    if (!query) {
      return ctx.reply(`🔍 Masukkan kata kunci pencarian!\n\n📌 Contoh:\n/xsearch stepmom`);
    }

    await ctx.reply(`🔎 Mencari video dengan kata kunci: *${escapeMarkdown(query)}*`, { parse_mode: 'MarkdownV2' });

    try {
      const res = await fetch(`https://api.agatz.xyz/api/xvideo?message=${encodeURIComponent(query)}`);
      const json = await res.json();

      if (json.status !== 200 || !Array.isArray(json.data) || json.data.length === 0) {
        return ctx.reply("❌ Tidak ditemukan hasil untuk kata kunci tersebut.");
      }

      let results = json.data.slice(0, 10);
      let text = `📺 *Hasil Pencarian Xvideos untuk:* \`${escapeMarkdown(query)}\`\n\n`;

      for (let i = 0; i < results.length; i++) {
        const v = results[i];
        const title = escapeMarkdown(v?.title || `Tanpa Judul`);
        const link = escapeMarkdown(v?.link || `https://xvideos.com`);

        text += `*${i + 1}\\. Title:* ${title}\n`;
        text += `🔗 [Link Video](${link})\n\n`;
      }

      await ctx.reply(text, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true
      });

    } catch (e) {
      console.error(e);
      return ctx.reply("⚠️ Terjadi kesalahan saat mengambil data pencarian.");
    }
  });
};
