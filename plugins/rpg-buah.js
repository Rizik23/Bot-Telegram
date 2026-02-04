const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');
const loadDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

module.exports = (bot) => {
  bot.command(['buah', 'listbuah', 'fruits'], async (ctx) => {
    const db = loadDB();
    const senderId = String(ctx.from.id);

    // Cek apakah user ada di database
    if (!db.users[senderId]) {
      return ctx.reply('🚫 Kamu belum memulai permainan. Gunakan /start dulu ya.');
    }

    const user = db.users[senderId];

    const message = `
🍇 *GUDANG BUAH KAMU* 🍇

🍌 Pisang: *${user.pisang || 0}*
🍇 Anggur: *${user.anggur || 0}*
🥭 Mangga: *${user.mangga || 0}*
🍊 Jeruk: *${user.jeruk || 0}*
🍎 Apel: *${user.apel || 0}*

Gunakan perintah */sell* untuk menjual buah.
    `.trim();

    await ctx.replyWithMarkdown(message);
  });
};
