const fetch = require('node-fetch');
const { isPremium } = require('../lib/premium');
const config = require('../config');

module.exports = (bot) => {
  bot.command('listnetlify', async (ctx) => {
    const userId = ctx.from.id;
    if (!isPremium(userId)) {
      return ctx.reply('❌ Fitur ini khusus untuk user *Premium*. Hubungi admin untuk upgrade.');
    }

    try {
      const res = await fetch('https://api.netlify.com/api/v1/sites', {
        headers: { Authorization: `Bearer ${config.netlifyToken}` },
      });

      const sites = await res.json();
      if (!Array.isArray(sites)) return ctx.reply('❌ Gagal ambil data website.');

      if (sites.length === 0) return ctx.reply('📭 Tidak ada website aktif.');

      const list = sites.map((s, i) =>
        `${i + 1}. [${s.name}](${s.ssl_url})\nID: \`${s.id}\``).join('\n\n');

      ctx.replyWithMarkdown(`🌐 *Daftar Website:*\n\n${list}`);
    } catch (e) {
      console.error(e);
      ctx.reply('⚠️ Terjadi kesalahan saat mengambil daftar.');
    }
  });
};