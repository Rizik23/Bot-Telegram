const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const dbPath = path.join(__dirname, 'db.json');

function loadDB() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = (bot) => {
  bot.command('setwelcome', async (ctx) => {
    if (!['group', 'supergroup'].includes(ctx.chat.type))
      return ctx.reply('Perintah ini hanya untuk grup.');

    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['administrator', 'creator'].includes(member.status))
      return ctx.reply('Hanya admin yang bisa set welcome.');

    const reply = ctx.message.reply_to_message;
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!reply || !text)
      return ctx.reply('Reply media lalu ketik /setwelcome teks');

    let media;
    if (reply.photo) media = reply.photo.pop().file_id;
    else if (reply.video) media = reply.video.file_id;
    else return ctx.reply('Reply harus ke foto atau video.');

    const db = loadDB();
    db[ctx.chat.id] = db[ctx.chat.id] || {};
    db[ctx.chat.id].welcome = { text, media };
    saveDB(db);

    return ctx.reply('Pesan welcome disimpan!');
  });

  bot.command('setleft', async (ctx) => {
    if (!['group', 'supergroup'].includes(ctx.chat.type))
      return ctx.reply('Perintah ini hanya untuk grup.');

    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['administrator', 'creator'].includes(member.status))
      return ctx.reply('Hanya admin yang bisa set goodbye.');

    const reply = ctx.message.reply_to_message;
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!reply || !text)
      return ctx.reply('Reply media lalu ketik /setleft teks');

    let media;
    if (reply.photo) media = reply.photo.pop().file_id;
    else if (reply.video) media = reply.video.file_id;
    else return ctx.reply('Reply harus ke foto atau video.');

    const db = loadDB();
    db[ctx.chat.id] = db[ctx.chat.id] || {};
    db[ctx.chat.id].left = { text, media };
    saveDB(db);

    return ctx.reply('Pesan goodbye disimpan!');
  });

  bot.on('new_chat_members', async (ctx) => {
    const db = loadDB();
    const data = db[ctx.chat.id]?.welcome;
    if (!data) return;

    for (const user of ctx.message.new_chat_members) {
      const name = user.first_name;
      const title = ctx.chat.title;
      const text = data.text.replace('{name}', name).replace('{title}', title);

      const options = {
        caption: text,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.url('Owner', 'https://t.me/VellzXyrine'),
        ]),
      };

      if (data.media.startsWith('BAA'))
        await ctx.replyWithVideo(data.media, options);
      else
        await ctx.replyWithPhoto(data.media, options);
    }
  });

  bot.on('left_chat_member', async (ctx) => {
    const db = loadDB();
    const data = db[ctx.chat.id]?.left;
    if (!data) return;

    const name = ctx.message.left_chat_member.first_name;
    const title = ctx.chat.title;
    const text = data.text.replace('{name}', name).replace('{title}', title);

    const options = { caption: text, parse_mode: 'Markdown' };

    if (data.media.startsWith('BAA'))
      await ctx.replyWithVideo(data.media, options);
    else
      await ctx.replyWithPhoto(data.media, options);
  });
};
