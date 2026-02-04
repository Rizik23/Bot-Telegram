const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const config = require('../config');

module.exports = (bot) => {
  const commands = ['html', 'buathtml', 'createhtml', 'chtml', 'webgen'];

  for (const cmd of commands) {
    bot.command(cmd, async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply('❌ Fitur ini cuma buat owner bot aja bre.');
    }

      const messageText = ctx.message.text;
      const args = messageText.replace(/^\/\S+(@\S+)?\s?/, '').trim();

      if (!args) {
        return ctx.reply(`Contoh: /${cmd} landing page AI`);
      }

      await ctx.reply('⏳ Sedang membuat HTML...');

      try {
        const logic = `kamu adalah ai khusus untuk membuat code HTML, css dan lain lain yang bersangkutan dengan website. kamu dapat membuat code tersebut sesuai dengan permintaan orang, dalam code tersebut hanya code tidak ada tanda kutip atau pun teks lainnya`;

        const url = `https://api.nekorinn.my.id/ai/qwen-turbo-logic?text=${encodeURIComponent(args)}&logic=${encodeURIComponent(logic)}`;
        const res = await fetch(url);
        const json = await res.json();

        if (!json.status || !json.result) {
          return ctx.reply('❌ Gagal membuat HTML dari API.');
        }

        let rawCode = json.result.trim();
        rawCode = rawCode.replace(/^```html\n?|```$/g, '').trim();

        const tmpDir = path.join(__dirname, '..', 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const fileName = `index-${Date.now()}.html`;
        const filePath = path.join(tmpDir, fileName);

        fs.writeFileSync(filePath, rawCode);

        await ctx.replyWithDocument({
          source: fs.readFileSync(filePath),
          filename: 'index.html',
        }, {
          caption: `✅ File Berhasil Dibuat\n\nDengan Query: *${args}*`,
          parse_mode: 'Markdown'
        });


      } catch (err) {
        console.error(err);
        ctx.reply('❌ Terjadi kesalahan saat memproses permintaan.');
      }
    });
  }
};