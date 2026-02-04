const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { downloadMediaMessage } = require('../lib/download');
const config = require('../config');

const premPath = path.join(__dirname, '..', 'prem.json');
function loadPrem() {
  if (!fs.existsSync(premPath)) fs.writeFileSync(premPath, '[]');
  return JSON.parse(fs.readFileSync(premPath));
}

module.exports = (bot) => {
  bot.command(['createweb', 'cweb'], async (ctx) => {
    const userId = ctx.from.id;
    const sender = userId.toString();
    const args = ctx.message.text.split(' ').slice(1);
    const webName = args.join(' ').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');

    const premList = loadPrem();
    if (!premList.includes(sender)) {
      return ctx.reply('❌ Fitur ini khusus untuk user *Premium*.\n\nHubungi admin untuk upgrade!');
    }
    if (!webName) return ctx.reply('Penggunaan: /createweb <namaWeb>');
    if (webName.length < 3) return ctx.reply('Nama web terlalu pendek. Gunakan minimal 3 karakter.');

    const quoted = ctx.message?.reply_to_message;
    const doc = quoted?.document;
    if (!doc) return ctx.reply('Reply file .zip yang berisi project HTML.');
    const fileName = doc.file_name || '';
    if (!fileName.endsWith('.zip')) return ctx.reply('File harus berupa .zip');

    const domainCheckUrl = `https://${webName}.vercel.app`;

    try {
      const check = await fetch(domainCheckUrl);
      if (check.status === 200) {
        return ctx.reply(`❌ Nama web *${webName}* sudah digunakan. Silakan gunakan nama lain.`);
      }
    } catch (e) {}

    try {
      const zipBuffer = await downloadMediaMessage(ctx);
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();

      if (!zipEntries.find(e => e.entryName.toLowerCase() === 'index.html')) {
        return ctx.reply('File zip harus berisi `index.html`');
      }

      const headers = {
        Authorization: `Bearer ${config.vercelToken}`,
        'Content-Type': 'application/json'
      };

      await fetch('https://api.vercel.com/v9/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: webName })
      }).catch(() => {});

      const files = zipEntries
        .filter(entry => !entry.isDirectory && entry.entryName)
        .map(entry => ({
          file: entry.entryName,
          data: entry.getData().toString('base64'),
          encoding: 'base64'
        }));

      const deploy = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: webName,
          project: webName,
          files,
          projectSettings: { framework: null }
        })
      });

      const res = await deploy.json();
      if (!res || !res.url) {
        console.log('Deploy error:', res);
        return ctx.reply(`Gagal deploy ke Vercel:\n${JSON.stringify(res)}`);
      }

      ctx.reply(`✅ Website berhasil dibuat!\n\n🌐 URL: https://${webName}.vercel.app`);
    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat membuat website.');
    }
  });

  bot.command('delweb', async (ctx) => {
    const sender = ctx.from.id.toString();
    const args = ctx.message.text.split(' ').slice(1);
    const webName = args.join(' ').trim();

    const premList = loadPrem();
    if (!premList.includes(sender)) {
      return ctx.reply('❌ Fitur ini khusus user *Premium*.');
    }
    if (!webName) return ctx.reply('Penggunaan: /deleteweb <namaWeb>');

    try {
      const headers = {
        Authorization: `Bearer ${config.vercelToken}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch(`https://api.vercel.com/v9/projects/${webName}`, {
        method: 'DELETE',
        headers
      });

      if (res.status !== 200) return ctx.reply('Gagal menghapus project. Mungkin nama tidak ditemukan.');

      ctx.reply(`✅ Project *${webName}* berhasil dihapus.`);
    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat menghapus project.');
    }
  });

  bot.command('listweb', async (ctx) => {
    const sender = ctx.from.id.toString();
    const premList = loadPrem();
    if (!premList.includes(sender)) {
      return ctx.reply('❌ Fitur ini khusus user *Premium*.');
    }

    try {
      const headers = {
        Authorization: `Bearer ${config.vercelToken}`
      };

      const res = await fetch(`https://api.vercel.com/v9/projects`, { headers });
      const json = await res.json();

      if (!json.projects || json.projects.length === 0) {
        return ctx.reply('Tidak ada project ditemukan.');
      }

      const list = json.projects.map(p => `• ${p.name}`).join('\n');
      ctx.reply(`📦 Daftar Project:

${list}`);
    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat mengambil daftar project.');
    }
  });
};