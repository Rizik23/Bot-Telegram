const fs = require('fs');
const path = require('path');
const config = require('../config');

const premPath = path.join(__dirname, '..', 'prem.json');

function loadPrem() {
  if (!fs.existsSync(premPath)) fs.writeFileSync(premPath, '[]');
  return JSON.parse(fs.readFileSync(premPath));
}

module.exports = (bot) => {
  bot.command('listprem', async (ctx) => {
    const senderId = ctx.from.id.toString();
    if (!config.OWNER_ID.includes(senderId)) {
      return ctx.reply('❌ Perintah ini hanya untuk owner bot.');
    }

    const premList = loadPrem();
    if (premList.length === 0) {
      return ctx.reply('📭 Belum ada user premium.');
    }

    const list = premList.map((id, i) => `${i + 1}. \`${id}\``).join('\n');
    ctx.replyWithMarkdownV2(`📋 *Daftar User Premium:*\n${list}`);
  });
};