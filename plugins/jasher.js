const fs = require('fs');
const path = require('path');
const { OWNER_ID } = require('../config');

module.exports = (bot) => {
  const groupFile = path.join(__dirname, '../groupList.json');
  if (!fs.existsSync(groupFile)) fs.writeFileSync(groupFile, '[]');

  const readGroupList = () => JSON.parse(fs.readFileSync(groupFile));
  const writeGroupList = (data) => fs.writeFileSync(groupFile, JSON.stringify(data, null, 2));

  const saveGroupId = (id, title) => {
    let groupList = readGroupList();
    if (!groupList.some(g => g.id === id)) {
      groupList.push({ id, title });
      writeGroupList(groupList);
    }
  };

  // Auto-simpan jika bot ditambahkan ke grup
  bot.on('new_chat_members', async (ctx) => {
    const chat = ctx.chat;
    const newMembers = ctx.message.new_chat_members;

    newMembers.forEach((member) => {
      if (member.username === bot.botInfo?.username) {
        saveGroupId(chat.id, chat.title);
        ctx.reply(`Halo grup *${chat.title}*! 👋\nAku siap membantu di sini.`, { parse_mode: "Markdown" });
      }
    });
  });

  // /jasher <teks> → broadcast teks
  // /jasher → broadcast isi pesan (teks/media) tanpa modifikasi
  bot.command('jasher', async (ctx) => {
    if (ctx.from.id.toString() !== OWNER_ID.toString()) return;

    const reply = ctx.message.reply_to_message;
    if (!reply) {
      return ctx.reply('❌ Balas pesan yang ingin dibroadcast (teks/media).', {
        reply_markup: {
          inline_keyboard: [[{ text: "📣 Channel Info", url: "https://t.me/AboutGlxyy" }]]
        }
      });
    }

    const groupList = readGroupList();
    let count = 0;

    for (const group of groupList) {
      try {
        await ctx.telegram.forwardMessage(group.id, ctx.chat.id, reply.message_id);
        count++;
      } catch (err) {
        console.error(`Gagal kirim ke ${group.id}:`, err.message);
      }
    }

    await ctx.reply(`✅ Selesai broadcast ke *${count}* grup.`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "📣 Channel Info", url: "https://t.me/AboutGlxyy" }]]
      }
    });
  });

  // /jasher2 → broadcast media
    bot.command('jasher2', async (ctx) => {
    if (ctx.from.id.toString() !== OWNER_ID.toString()) return;

    const reply = ctx.message.reply_to_message;
    if (!reply) return ctx.reply('❌ Balas pesan yang ingin dibroadcast (boleh teks, foto,   tombol, dsb)');

    const groupList = readGroupList();
    let count = 0;

    for (const group of groupList) {
    try{
      await ctx.telegram.forwardMessage(group.id, ctx.chat.id, reply.message_id);
      count++;
    } catch (err) {}
  }

  // Notifikasi ke pengguna (ctx.chat.id)
    await ctx.reply(`✅ Selesai broadcast ke *${count}* grup.`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "📣 Channel Info", url: "https://t.me/AboutGlxyy" }]]
      }
    });
  });

  // /listgroup
  bot.command('listgroup', async (ctx) => {
    if (ctx.from.id.toString() !== OWNER_ID.toString()) return;
    const groupList = readGroupList();

    if (groupList.length === 0) return ctx.reply('❌ Tidak ada grup yang terdaftar.');

    let text = `📋 *List Grup:*\n\n`;
    groupList.forEach((g, i) => {
      text += `${i + 1}. ${g.title || '-'}\nID: \`${g.id}\`\n\n`;
    });

    ctx.reply(text, { parse_mode: 'Markdown' });
  });

  // /addgroupid <id|@username|link>
  bot.command('addgroupid', async (ctx) => {
    if (ctx.from.id.toString() !== OWNER_ID.toString()) return;
    const args = ctx.message.text.split(' ');
    const input = args[1];

    if (!input) return ctx.reply('⚠️ Gunakan: /addgroupid <@username|invite_link|id_grup>');

    const groupList = readGroupList();

    try {
      let chat;
      if (input.startsWith('https://t.me/')) {
        const username = input.split('/').pop();
        chat = await bot.telegram.getChat(`@${username}`);
        await bot.telegram.joinChat(`@${username}`);
      } else if (input.startsWith('@')) {
        chat = await bot.telegram.getChat(input);
        await bot.telegram.joinChat(input);
      } else {
        chat = await bot.telegram.getChat(input); // by ID
        await bot.telegram.sendMessage(input, '✅ BOT BERHASIL DITAMBAHKAN KE GROUP VIA ADD');
      }

      if (!groupList.some(g => g.id === chat.id)) {
        groupList.push({ id: chat.id, title: chat.title });
        writeGroupList(groupList);
      }

      return ctx.reply(`✅ Bot berhasil masuk ke grup: *${chat.title}*\nID: \`${chat.id}\``, { parse_mode: 'Markdown' });
    } catch (e) {
      return ctx.reply('❌ Gagal join. Pastikan link/username/ID valid dan bot tidak diblok.');
    }
  });

  // /delgroupid <id>
  bot.command('delgroupid', async (ctx) => {
    if (ctx.from.id.toString() !== OWNER_ID.toString()) return;
    const args = ctx.message.text.split(' ');
    const id = args[1];
    if (!id) return ctx.reply('⚠️ Gunakan: /delgroupid <id_grup>');

    let groupList = readGroupList();
    const filtered = groupList.filter(g => g.id.toString() !== id.toString());

    if (filtered.length === groupList.length) return ctx.reply('❌ ID tidak ditemukan dalam daftar.');

    writeGroupList(filtered);
    ctx.reply(`✅ Grup dengan ID ${id} telah dihapus.`);
  });

  // /savegroup (harus dari dalam grup)
  bot.command('savegroup', async (ctx) => {
    if (ctx.from.id.toString() !== OWNER_ID.toString()) return;

    const chat = ctx.chat;
    if (!['group', 'supergroup'].includes(chat.type)) {
      return ctx.reply('❌ Command ini hanya bisa digunakan di dalam grup.');
    }

    let groupList = readGroupList();
    if (groupList.some(g => g.id === chat.id)) {
      return ctx.reply('✅ Grup ini sudah terdaftar.');
    }

    groupList.push({ id: chat.id, title: chat.title });
    writeGroupList(groupList);

    ctx.reply(`✅ Grup *${chat.title}* telah disimpan.`, { parse_mode: 'Markdown' });
  });
};