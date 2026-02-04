const fs = require("fs");
const path = require("path");

// Path ke database
const dbPath = path.join(__dirname, "../database.json");

// Fungsi untuk baca dan simpan database
function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}
function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Fungsi untuk escape Markdown
function escapeMarkdownV2(text) {
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!')
      .replace(/</g, '\\<')
    .replace(/\\/g, '\\\\')

    .replace(/'/g, "\\'");
}

module.exports = (bot) => {
  bot.command("petshop", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    const type = (args[0] || "").toLowerCase();
    const userId = String(ctx.from.id);

    let db = loadDB();
    if (!db.users[userId]) {
      db.users[userId] = {
        pet: 0,
        cat: 0, dog: 0, fox: 0, horse: 0, robo: 0,
        dragon: 0, lion: 0, rhinoceros: 0, centaur: 0,
        kyubi: 0, griffin: 0, phonix: 0, wolf: 0,
      };
    }

    const user = db.users[userId];

    const prices = {
      cat: 2, dog: 2, horse: 4, fox: 6, robo: 10,
      lion: 10, rhinoceros: 10, dragon: 10, centaur: 10,
      kyubi: 10, griffin: 10, phonix: 10, wolf: 10
    };

    const petList = Object.entries(prices)
      .map(([name, price]) => `• *${escapeMarkdownV2(name.charAt(0).toUpperCase() + name.slice(1))}:* ${price} 🔖`)
      .join("\n");

    const menu = `— *P E T   S T O R E* —\n▮▧▧▧▧▧▧▧▧▧▧▧▧▮\n${petList}`;
ctx.replyWithMarkdownV2(escapeMarkdownV2(menu));


    if (!prices[type]) {
      return ctx.reply("Pet tidak tersedia. Coba ketik /petshop untuk melihat daftar.");
    }

    if (user[type] > 0) {
      return ctx.reply("Kamu sudah memiliki pet ini!");
    }

    if (user.pet < prices[type]) {
      return ctx.reply(`Pet Token kamu kurang. Dibutuhkan: ${prices[type]}`);
    }

    user.pet -= prices[type];
    user[type] += 1;

    saveDB(db);
    return ctx.reply("🎉 Selamat! Kamu berhasil mengadopsi pet baru!");
  });
};
