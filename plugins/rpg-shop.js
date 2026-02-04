const fs = require("fs");
const path = require("path");

const items = {
  buy: {
    limit: { exp: 9999 },
    chip: { money: 1000000 },
    exp: { money: 1000 },
    potion: { money: 1250 },
    trash: { money: 40 },
    wood: { money: 700 },
    rock: { money: 850 },
    string: { money: 400 },
    iron: { money: 3000 },
    diamond: { money: 500000 },
    emerald: { money: 100000 },
    gold: { money: 100000 },
    common: { money: 2000 },
    uncommon: { money: 20000 },
    mythic: { money: 75000 },
    legendary: { money: 200000 },
    petfood: { money: 3500 },
    pet: { money: 120000 },
    anggur: { money: 2000 },
    apel: { money: 2000 },
    jeruk: { money: 2000 },
    mangga: { money: 2000 },
    pisang: { money: 2000 },
    bibitanggur: { money: 2000 },
    bibitapel: { money: 2000 },
    bibitjeruk: { money: 2000 },
    bibitmangga: { money: 2000 },
    bibitpisang: { money: 2000 },
    umpan: { money: 5000 },
    fishingrod: { money: 15000 }
  },
  sell: {
    limit: { exp: 999 },
    exp: { money: 1 },
    chip: { money: 1000000 },
    potion: { money: 625 },
    trash: { money: 20 },
    wood: { money: 350 },
    rock: { money: 425 },
    string: { money: 200 },
    iron: { money: 1500 },
    diamond: { money: 250000 },
    emerald: { money: 50000 },
    gold: { money: 50000 },
    common: { money: 1000 },
    uncommon: { money: 10000 },
    mythic: { money: 37500 },
    legendary: { money: 100000 },
    petfood: { money: 1750 },
    pet: { money: 60000 },
    anggur: { money: 1000 },
    apel: { money: 1000 },
    jeruk: { money: 1000 },
    mangga: { money: 1000 },
    pisang: { money: 1000 },
    bibitanggur: { money: 1000 },
    bibitapel: { money: 1000 },
    bibitjeruk: { money: 1000 },
    bibitmangga: { money: 1000 },
    bibitpisang: { money: 1000 },
    umpan: { money: 2500 },
    fishingrod: { money: 10000 }
  }
};

const rpg = {
  emoticon: (item) => {
    const emoji = {
      money: "💰", exp: "✨", potion: "🧪", trash: "🗑️", wood: "🪵", rock: "🪨",
      string: "🧵", iron: "⛓️", diamond: "💎", emerald: "🟢", gold: "🥇",
      common: "📦", uncommon: "🎁", mythic: "🧿", legendary: "🏆", petfood: "🍖",
      pet: "🐾", anggur: "🍇", apel: "🍎", jeruk: "🍊", mangga: "🥭",
      pisang: "🍌", bibitanggur: "🌱🍇", bibitapel: "🌱🍎", bibitjeruk: "🌱🍊",
      bibitmangga: "🌱🥭", bibitpisang: "🌱🍌", chip: "💻", limit: "💡", umpan: "🪱", fishingrod: "🎣"
    };
    return emoji[item] || "";
  }
};

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function isNumber(value) {
  const n = parseInt(value);
  return typeof n === "number" && !isNaN(n);
}

function loadDatabase() {
  const file = path.join(__dirname, "../database.json");
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

function saveDatabase(db) {
  const file = path.join(__dirname, "../database.json");
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
}

module.exports = (bot) => {
  bot.command(["buy", "sell"], async (ctx) => {
    const command = ctx.message.text.split(" ")[0].slice(1).toLowerCase();
    const args = ctx.message.text.trim().split(" ").slice(1);
    const item = (args[0] || "").toLowerCase();
    const total = isNumber(args[1]) ? Math.max(1, Math.min(Number(args[1]), 999999)) : 1;
    const userId = String(ctx.from.id);
    const db = loadDatabase();

    db.users = db.users || {};
    db.users[userId] = db.users[userId] || {};
    const user = db.users[userId];

    const listItems = Object.fromEntries(Object.entries(items[command]).filter(([k]) => k in user || true));

    if (!item || !(item in listItems)) {
      const message = `🛒 List Items (${command.toUpperCase()}):\n\n` +
        Object.keys(listItems).map((v) => {
          let method = Object.keys(listItems[v])[0];
          return `➠ 1 ${rpg.emoticon(v)} ${capitalize(v)} ﹫ ${listItems[v][method]} ${rpg.emoticon(method)}${capitalize(method)}`;
        }).join("\n") +
        `\n\nContoh penggunaan:\n/${command} potion 10`;
      return ctx.reply(message);
    }

    const price = listItems[item];
    const method = Object.keys(price)[0];
    const cost = price[method] * total;

    if (command === "buy") {
      user[method] = user[method] || 0;
      if (user[method] < cost) {
        return ctx.reply(`Kamu butuh *${cost - user[method]}* ${capitalize(method)} ${rpg.emoticon(method)} untuk membeli *${total}* ${capitalize(item)} ${rpg.emoticon(item)}. Kamu punya *${user[method]}* ${capitalize(method)}.`);
      }
      user[method] -= cost;
      user[item] = (user[item] || 0) + total;
      saveDatabase(db);
      return ctx.reply(`✅ Berhasil membeli *${total} ${capitalize(item)} ${rpg.emoticon(item)}* seharga *${cost} ${capitalize(method)} ${rpg.emoticon(method)}*.`);
    } else {
      user[item] = user[item] || 0;
      if (user[item] < total) {
        return ctx.reply(`Kamu hanya punya *${user[item]}* ${capitalize(item)} ${rpg.emoticon(item)}. Tidak cukup untuk menjual.`);
      }
      user[item] -= total;
      user[method] = (user[method] || 0) + cost;
      saveDatabase(db);
      return ctx.reply(`✅ Berhasil menjual *${total} ${capitalize(item)} ${rpg.emoticon(item)}* dan mendapatkan *${cost} ${capitalize(method)} ${rpg.emoticon(method)}*.`);
    }
  });
};
