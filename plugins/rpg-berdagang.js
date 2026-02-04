const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');
const loadDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}

module.exports = (bot) => {
  bot.command('berdagang', async (ctx) => {
    const db = loadDB();
    const users = db.users;
    const sender = String(ctx.from.id);

    if (!ctx.message.reply_to_message) {
      return ctx.reply('Tag salah satu orang dengan membalas pesannya untuk berdagang!');
    }

    const partnerId = String(ctx.message.reply_to_message.from.id);

    if (!users[sender] || !users[partnerId]) {
      return ctx.reply('Pengguna belum terdaftar di database. Gunakan /start terlebih dahulu.');
    }

    const cooldown = 28800000; // 8 jam
    const now = Date.now();
    const lastTrade = users[sender].lastdagang || 0;
    const remaining = cooldown - (now - lastTrade);

    if (remaining > 0) {
      return ctx.reply(`⏳ Kamu sudah berdagang. Tunggu ${clockString(remaining)} lagi.`);
    }

    const modal = Math.floor(Math.random() * 5000);

    if (users[sender].money < modal || users[partnerId].money < modal) {
      return ctx.reply(`💸 Modal minimal: ${modal}\nKamu atau temanmu tidak cukup modal (minimal 5000).`);
    }

    // Potong modal
    users[sender].money -= modal;
    users[partnerId].money -= modal;
    users[sender].lastdagang = now;

    await ctx.replyWithMarkdown(`📦 *Perdagangan dimulai!*\n@${ctx.from.username || sender} & @${ctx.message.reply_to_message.from.username || partnerId} sedang berdagang...\nModal dipotong: *-${modal}*`, {
      reply_to_message_id: ctx.message.message_id
    });

    // Tambahkan income bertahap
    const waktu = [3600000, 7200000, 10800000, 14400000, 18000000, 21600000, 25200000, 28800000];
    waktu.forEach((delay, index) => {
      setTimeout(() => {
        const amount = index === 7 ? 10000 : 50000;
        const partnerAmount = index === 7 ? 100000 : 50000;

        users[sender].money += amount;
        users[partnerId].money += partnerAmount;

        ctx.replyWithMarkdown(`💰 *Keuntungan Dagang ke-${index + 1}*\n@${ctx.from.username || sender} +${amount} money\n@${ctx.message.reply_to_message.from.username || partnerId} +${partnerAmount} money`, {
          reply_to_message_id: ctx.message.message_id
        });

        saveDB(db);
      }, delay);
    });

    saveDB(db);
  });
};
