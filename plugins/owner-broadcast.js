const fs = require("fs");
const path = require("path");
const config = require("../config");
const dbFile = path.join(__dirname, "../data/users.json");
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, "[]");

function saveUser(id) {
  const data = JSON.parse(fs.readFileSync(dbFile));
  if (!data.includes(id)) {
    data.push(id);
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
  }
}

function getUsers() {
  return JSON.parse(fs.readFileSync(dbFile));
}


function escape(text) {
  return text.replace(/([_\*\[\]()~>#+=|{}.!\\-])/g, '\\$1');
}

function escapeMarkdownV2(text) {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

function splitText(text, maxLength = 4000) {
  const lines = text.split('\n');
  let chunks = [], current = "";

  for (const line of lines) {
    if ((current + line + "\n").length > maxLength) {
      chunks.push(current);
      current = "";
    }
    current += line + "\n";
  }
  if (current) chunks.push(current);
  return chunks;
}


  module.exports = (bot) => {
  // Simpan user setiap interaksi
  bot.on("message", (ctx, next) => {
    if (ctx.from && ctx.from.id) saveUser(ctx.from.id);
    return next();
  });

  // 🔁 Broadcast ke semua user pakai forward
  bot.command("broadcast", async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!config.ownerIds.includes(senderId)) {
      return ctx.reply("❌ Fitur ini cuma untuk owner.");
    }

    const reply = ctx.message.reply_to_message;
    if (!reply) return ctx.reply("❗Reply ke pesan (apa pun isinya) untuk broadcast.");

    const users = getUsers();
    let success = 0, fail = 0;

    for (const id of users) {
      try {
        await ctx.telegram.forwardMessage(id, ctx.chat.id, reply.message_id);
        success++;
        await new Promise((r) => setTimeout(r, 150)); // delay biar aman
      } catch {
        fail++;
      }
    }

    ctx.reply(`📢 Broadcast selesai!\n✅ Terkirim: ${success}\n❌ Gagal: ${fail}`);
  });


  // 🔁 Broadcast ke satu user saja pakai forward
  bot.command("broadcastuser", async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!config.ownerIds.includes(senderId)) {
      return ctx.reply("❌ Fitur ini cuma untuk owner.");
    }

    const args = ctx.message.text.split(" ");
    const targetId = args[1];

    if (!targetId || !/^\d+$/.test(targetId)) {
      return ctx.reply("❗Format salah. Contoh: /broadcastuser 123456789\nGunakan ID user, bukan @username.");
    }

    const reply = ctx.message.reply_to_message;
    if (!reply) return ctx.reply("❗Reply ke pesan yang ingin dikirim.");

    try {
      await ctx.telegram.forwardMessage(targetId, ctx.chat.id, reply.message_id);
      ctx.reply(`✅ Broadcast berhasil ke ID \`${targetId}\``, { parse_mode: "Markdown" });
    } catch (err) {
      console.error('❌ Gagal forward ke user:', err.message);
      ctx.reply(`❌ Gagal kirim ke ID \`${targetId}\`\nPastikan user sudah mulai chat bot.`);
    }
  });


    

  bot.command("listuser", async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma buat owner bot aja bre.");
    }

    const users = getUsers();
    if (!users.length) return ctx.reply("👥 Belum ada user yang terdaftar.");

    let text = "*List Pengguna Bot:*\n";
    for (let i = 0; i < users.length; i++) {
      try {
        const user = await ctx.telegram.getChat(users[i]);
        const username = user.username ? `@${user.username}` : "tanpa username";
        text += `╭─ ${i + 1}\n`;
        text += `│ 👤 ${escapeMarkdownV2(username)}\n`;
        text += `╰╼ 🆔 ${escapeMarkdownV2(user.id.toString())}\n\n`;
      } catch {
        text += `╭─ ${i + 1}\n`;
        text += `│ ⚠️ Gagal ambil info\n`;
        text += `╰╼ 🆔 ${escapeMarkdownV2(users[i])}\n\n`;
      }
    }

    const chunks = splitText(text);
    for (const chunk of chunks) {
      await ctx.reply(chunk, { parse_mode: "MarkdownV2" });
    }
  });
};
    
    

