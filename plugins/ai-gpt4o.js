const fetch = require('node-fetch');

module.exports = (bot) => {
  bot.command('ai', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!text) return ctx.reply('Penggunaan: /ai <teks>');

    try {
      const wait = await ctx.reply('⏳ Tunggu sebentar, gua lagi cari jawabannya...');

      const apiUrl = `https://exonity.tech/api/chat-ai?question=${encodeURIComponent(text)}&system_prompt=${encodeURIComponent("You are a helpful assistant that answers concisely")}&model=grok-3-mini`;
      const res = await fetch(apiUrl);
      const json = await res.json();
      const indoText = json?.data?.response;

      if (!indoText) {
        return ctx.reply('❌ Gagal mendapatkan balasan dari AI.');
      }

      const translateRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=en&dt=t&q=${encodeURIComponent(indoText)}`);
      const translateJson = await translateRes.json();
      const englishText = translateJson?.[0]?.map(item => item[0]).join('') || '(Gagal menerjemahkan)';

      const replyText = `*G A L A X Y   -   M D*\n\n` +
                        `🇮🇩 *Indonesia:*\n\`\`\`\n${indoText}\n\`\`\`\n\n` +
                        `🇺🇸 *English:*\n\`\`\`\n${englishText}\n\`\`\``;

      await ctx.telegram.editMessageText(ctx.chat.id, wait.message_id, undefined, replyText, {
        parse_mode: 'Markdown'
      });

    } catch (err) {
      console.error('[ERROR /ai]', err);
      ctx.reply('❌ Terjadi kesalahan saat memproses permintaan.');
    }
  });
};
