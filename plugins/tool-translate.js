const { translate } = require('bing-translate-api');

module.exports = function (bot) {
  bot.command(['tr', 'translate'], async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const lang = args[0];
    const txt = args.length > 1 ? args.slice(1).join(' ') : '';
    const quoted = ctx.message.reply_to_message?.text;
    const msg = quoted || txt;

    const help = `
Contoh:
/translate <lang> <your message>
/translate id Hello How Are You

Daftar bahasa: https://cloud.google.com/translate/docs/languages
`.trim();

    if (!lang || !msg) {
      return ctx.reply(help);
    }

    await ctx.reply('⏳ Translating...');

    try {
      const result = await translate(msg, null, lang);
      // Kirim hasil translate dalam blok kode markdown
      await ctx.reply(`\`\`\`\n${result.translation}\n\`\`\``);
    } catch (e) {
      await ctx.reply(`Gagal menerjemahkan: ${e.message}`);
    }
  });
};
