const fs = require('fs');
const path = require('path');
const config = require('../config');

const premPath = path.join(__dirname, '..', 'prem.json');

function loadPrem() {
  if (!fs.existsSync(premPath)) fs.writeFileSync(premPath, '[]');
  return JSON.parse(fs.readFileSync(premPath));
}

function savePrem(data) {
  fs.writeFileSync(premPath, JSON.stringify(data, null, 2));
}

module.exports = (bot) => {
  bot.command('prem', async (ctx) => {
    const senderId = ctx.from.id.toString();

    if (!config.OWNER_ID.includes(senderId)) {
      return ctx.reply('❌ Perintah ini hanya untuk owner bot.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) {
      return ctx.reply('⚠️ Gunakan format:\n/prem <user_id>');
    }

    const userId = args[0].trim();
    if (!/^\d+$/.test(userId)) {
      return ctx.reply('⚠️ ID harus berupa angka.');
    }

    let premList = loadPrem();
    if (premList.includes(userId)) {
      return ctx.reply('✅ User sudah termasuk premium.');
    }

    premList.push(userId);
    savePrem(premList);

    ctx.reply(`✅ Berhasil menambahkan ${userId} ke daftar premium.`);
  });
};