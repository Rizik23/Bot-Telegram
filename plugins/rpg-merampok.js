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
  bot.command('merampok', async (ctx) => {
    const db = loadDB();
    const senderId = String(ctx.from.id);
    const users = db.users;

    if (!users[senderId]) return ctx.reply('❌ Kamu belum terdaftar.');

    const lastRob = users[senderId].lastrampok || 0;
    const cooldown = 3600000; // 1 jam
    const remaining = cooldown - (Date.now() - lastRob);

    if (remaining > 0) return ctx.reply(`⏳ Tunggu ${clockString(remaining)} untuk merampok lagi.`);

    const targetUsername = ctx.message.text.split(' ')[1];
    if (!targetUsername || !targetUsername.startsWith('@')) return ctx.reply('🚫 Tag username target, contoh: /merampok @username');

    const targetEntry = Object.entries(users).find(([_, data]) => data.username === targetUsername);
    if (!targetEntry) return ctx.reply('❌ Target tidak ditemukan dalam database!');

    const [targetId, targetData] = targetEntry;

    const dapat = Math.floor(Math.random() * 100000);
    if (targetData.money < 10000) return ctx.reply('💸 Target terlalu miskin untuk dirampok.');

    users[senderId].money += dapat;
    users[targetId].money -= dapat;
    users[senderId].lastrampok = Date.now();

    saveDB(db);
    ctx.reply(`💥 Berhasil merampok ${targetUsername} sebesar 💰${dapat}`);
  });
};
