const AdmZip = require('adm-zip');
const fetch = require('node-fetch');
const FormData = require('form-data');
const { isPremium } = require('../lib/premium');
const config = require('../config');

module.exports = (bot) => {
  bot.command('createnetlify', async (ctx) => {
    const userId = ctx.from.id;
    if (!isPremium(userId)) {
      return ctx.reply('❌ Fitur ini khusus untuk user *Premium*. Hubungi admin untuk upgrade.');
    }

    const doc = ctx.message?.reply_to_message?.document;
    if (!doc || !doc.file_name.endsWith('.zip')) {
      return ctx.reply('❗ Balas file .zip yang berisi website untuk diupload.');
    }

    try {
      const fileLink = await ctx.telegram.getFileLink(doc.file_id);
      const res = await fetch(fileLink.href);
      const buffer = await res.buffer();

      const form = new FormData();
      form.append('file', buffer, { filename: 'site.zip' });

      const uploadRes = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.netlifyToken}`,
        },
        body: form,
      });

      const data = await uploadRes.json();
      if (data.ssl_url) {
        ctx.reply(`✅ Website berhasil di-deploy ke:\n🌐 ${data.ssl_url}`);
      } else {
        ctx.reply('❌ Gagal deploy website.');
      }
    } catch (e) {
      console.error(e);
      ctx.reply('⚠️ Terjadi kesalahan saat mengunggah.');
    }
  });
};