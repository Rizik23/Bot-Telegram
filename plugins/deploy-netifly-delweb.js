const fetch = require('node-fetch');
const { isPremium } = require('../lib/premium');
const config = require('../config');

module.exports = (bot) => {
  bot.command('delnetlify', async (ctx) => {
    const userId = ctx.from.id;
    if (!isPremium(userId)) {
      return ctx.reply('❌ Fitur ini khusus untuk user *Premium*. Hubungi admin untuk upgrade.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    const siteId = args[0];

    if (!siteId) return ctx.reply('❗ Gunakan: /delnetlify <site_id>');

    try {
      const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${config.netlifyToken}` },
      });

      if (res.status === 204) {
        ctx.reply(`✅ Website dengan ID ${siteId} telah dihapus.`);
      } else {
        ctx.reply('❌ Gagal menghapus website.');
      }
    } catch (e) {
      console.error(e);
      ctx.reply('⚠️ Terjadi kesalahan saat menghapus.');
    }
  });
};