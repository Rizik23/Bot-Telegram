const fs = require('fs');
const { OWNER_ID } = require('../config');
const db_saweria = require('../src/saweria.json');
const Saweria = require('../lib/saweria'); // Pastikan file ini ada dan valid

module.exports = (bot) => {
  bot.command('login', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    const command = 'login';
    const prefix = '/';
    const mess = {
      owner: "Fitur ini hanya untuk Owner.",
      group: "Fitur tidak bisa dijalankan di grup."
    };

    // ❗ Hanya user dengan ID di OWNER_ID yang bisa akses
    if (!OWNER_ID.includes(ctx.from.id)) return ctx.reply(mess.owner);

    const q = text;
    if (db_saweria.length === 1) return ctx.reply(`Sudah login disaweria...`);
    if (ctx.chat.type !== 'private') return ctx.reply(mess.group);
    if (!q) return ctx.reply(`Contoh: ${prefix + command} email@gmail.com,password`);
    if (!q.split("@")[1]) return ctx.reply(`Contoh: ${prefix + command} email@gmail.com,password`);
    if (!q.split(".")[1]) return ctx.reply(`Contoh: ${prefix + command} email@gmail.com,password`);
    if (!q.split(",")[1]) return ctx.reply(`Contoh: ${prefix + command} email@gmail.com,password`);

    await ctx.reply("Sedang mencoba login...");

    const Pay = new Saweria(db_saweria);
    const res = await Pay.login(q.split(",")[0], q.split(",")[1]);

    if (!res.status) return ctx.reply(`Terjadi kesalahan saat login:\n${res.msg}`);

    setTimeout(() => {
      ctx.reply(`*LOGIN SUKSES ✅*\n\n*USER ID:* ${res.data.user_id}`, {
        parse_mode: 'Markdown'
      });

      db_saweria.push(res.data.user_id);
      fs.writeFileSync('./src/saweria.json', JSON.stringify(db_saweria, null, 2));
    }, 500);
  });
};