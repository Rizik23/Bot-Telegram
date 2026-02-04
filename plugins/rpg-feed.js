const fs = require('fs');
const path = require('path');

// Load database.json
const dbFile = path.join(__dirname, '../database.json');
let db = JSON.parse(fs.readFileSync(dbFile));
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clockString = ms => {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
  let m = isNaN(ms) ? '--' : Math.floor(ms % 3600000 / 60000);
  let s = isNaN(ms) ? '--' : Math.floor(ms % 60000 / 1000);
  return [h, 'h ', m, 'm ', s, 's'].join('');
};

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

module.exports = (bot) => {
  bot.command('feed', async (ctx) => {
    let args = ctx.message.text.split(' ').slice(1);
    const type = (args[0] || '').toLowerCase();

    let info = `
乂 List Pet:
🐈 • Cᴀᴛ
🐕 • Dᴏɢ
🐎 • Hᴏʀsᴇ
🦊 • Fᴏx
🤖 • Rᴏʙᴏ

*➠ Example:* /feed cat
`.trim();

    const userId = ctx.from.id.toString();
    const user = db.users[userId];
    if (!user) return ctx.reply('User not found in database.');

    const petNames = {
      fox: '🦊',
      cat: '🐈',
      dog: '🐕',
      horse: '🐎',
      robo: '🤖'
    };

    const feedMap = {
      fox: 'fox',
      cat: 'cat',
      dog: 'dog',
      horse: 'horse',
      robo: 'robo'
    };

    const pet = feedMap[type];
    if (!pet) return ctx.reply(info);

    const petLevel = user[pet];
    const petLastFeed = user[`${pet}lastfeed`];
    const petExp = user[`${pet}exp`];

    if (petLevel === 0) return ctx.reply('ʏᴏᴜ ᴅᴏɴ\'ᴛ ʜᴀᴠᴇ ᴛʜɪs ᴘᴇᴛ ʏᴇᴛ!');
    if (petLevel === 10) return ctx.reply('ʏᴏᴜʀ ᴘᴇᴛ ɪs ᴍᴀx ʟᴇᴠᴇʟ !');

    const now = new Date();
    const cooldown = 600000;
    const elapsed = now - petLastFeed;
    const remaining = cooldown - elapsed;

    if (elapsed < cooldown) {
      return ctx.reply(`ʏᴏᴜʀ ᴘᴇᴛ ɪs ғᴜʟʟ, ᴛʀʏ ᴀɢᴀɪɴ ɪɴ\n➞ *${clockString(remaining)}*`);
    }

    if (user.petfood <= 0) return ctx.reply('ʏᴏᴜʀ ᴘᴇᴛ ғᴏᴏᴅ ɴᴏᴛ ᴇɴᴏᴜɢʜ');

    user.petfood -= 1;
    user[`${pet}exp`] += 20;
    user[`${pet}lastfeed`] = now.getTime();

    const emoji = petNames[pet];
    const pesan = pickRandom(['ɴʏᴜᴍᴍᴍ~', 'ᴛʜᴀɴᴋs', 'ᴛʜᴀɴᴋʏᴏᴜ ^-^', '...', 'ᴛʜᴀɴᴋ ʏᴏᴜ~', 'ᴀʀɪɢᴀᴛᴏᴜ ^-^']);

    await ctx.reply(`ғᴇᴇᴅɪɴɢ *${type}*...\n*${emoji} ${type.capitalize()}:* ${pesan}`);

    const levelUpReq = (petLevel * 100) - 1;
    if (user[`${pet}exp`] > levelUpReq) {
      user[pet] += 1;
      user[`${pet}exp`] -= (petLevel * 100);
      await ctx.reply('*ᴄᴏɴɢʀᴀᴛs!* , ʏᴏᴜʀ ᴘᴇᴛ ʟᴇᴠᴇʟᴜᴘ');
    }

    // Save to file
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
  });
};
