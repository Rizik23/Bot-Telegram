// ✅ PLUGIN: bot.js — /bot on & /bot off + middleware blok fitur

const fs = require('fs');
const path = require('path');
const config = require('../config');

const statusFile = path.join(__dirname, '../data/bot_status.json');

function isOwner(ctx) { return (config.ownerIds || []).map(String).includes(String(ctx.from.id)); }

// Buat file status default jika belum ada
if (!fs.existsSync(statusFile)) { fs.writeFileSync(statusFile, JSON.stringify({ status: 'on' }, null, 2)); }

module.exports = (bot) => { bot.command('fitur', async (ctx) => { if (!isOwner(ctx)) return ctx.reply('🚫 Hanya Owner yang bisa menggunakan perintah ini.');

const args = ctx.message.text.split(' ').slice(1);
const status = args[0]?.toLowerCase();

if (!['on', 'off'].includes(status)) {
  return ctx.reply('⚙️ Gunakan: /bot on atau /bot off');
}

fs.writeFileSync(statusFile, JSON.stringify({ status }, null, 2));
return ctx.reply(`✅ Bot berhasil di-*${status === 'on' ? 'aktifkan' : 'nonaktifkan'}*`, {
  parse_mode: 'Markdown'
});

});

bot.command(/.*/, async (ctx, next) => { if (isOwner(ctx)) return next();

let status = 'on';
if (fs.existsSync(statusFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(statusFile));
    status = data.status || 'on';
  } catch (err) {
    console.error('❌ Gagal membaca status file:', err.message);
  }
}

if (status === 'off') {
  ctx.session = ctx.session || {};
  if (!ctx.session.notifiedOff) {
    ctx.session.notifiedOff = true;

    for (const ownerId of config.ownerIds) {
      try {
        await ctx.telegram.sendMessage(ownerId, '⚠️ *Bot dalam keadaan OFF*. Semua fitur telah diblokir.', {
          parse_mode: 'Markdown'
        });
      } catch (err) {
        console.error('❌ Gagal kirim notifikasi ke Owner:', err.message);
      }
    }
  }

  return ctx.reply('⚠️ Bot sedang *nonaktif*. Silakan hubungi owner untuk mengaktifkan kembali.', {
    parse_mode: 'Markdown'
  });
}

return next();

});
};