const fs = require('fs');
const path = require('path');
const config = require('../config');

const premPath = path.join(__dirname, '..', 'prem.json');

function loadPrem() {
  if (!fs.existsSync(premPath)) fs.writeFileSync(premPath, '[]');
  return JSON.parse(fs.readFileSync(premPath, 'utf8'));
}

// Escape khusus MarkdownV2 biar anti "can't parse entities"
function escapeMarkdownV2(text = '') {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

module.exports = (bot) => {
  bot.command('listprem', async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!config.OWNER_ID.includes(senderId)) {
      return ctx.reply('❌ Perintah ini hanya untuk owner bot.');
    }

    const premList = loadPrem();
    if (!Array.isArray(premList) || premList.length === 0) {
      return ctx.reply('📭 Belum ada user premium.');
    }

    // Pakai \. biar titik aman di MarkdownV2
    const list = premList
      .map((id, i) => `${i + 1}\\.` + ` \`${escapeMarkdownV2(id)}\``)
      .join('\n');

    return ctx.replyWithMarkdownV2(`📋 *Daftar User Premium:*\n${list}`);
  });
};