const fs = require('fs');
const path = require('path');

// Lokasi file database
const dbPath = path.join(__dirname, '../database.json');

// Fungsi load & save database
const loadDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

module.exports = (bot) => {
  bot.command('kandang', async (ctx) => {
    const db = loadDB();
    const userId = String(ctx.from.id);
    const user = db.users[userId];

    if (!user) return ctx.reply('❌ Kamu belum terdaftar! Silakan /reg dulu.');

    const {
      banteng = 0,
      harimau = 0,
      gajah = 0,
      kambing = 0,
      panda = 0,
      buaya = 0,
      kerbau = 0,
      sapi = 0,
      monyet = 0,
      ayam = 0,
      babihutan = 0,
      babi = 0
    } = user;

    const kandangList = `
${banteng ? `🐂 Banteng: ${banteng}` : ''}
${harimau ? `🐅 Harimau: ${harimau}` : ''}
${gajah ? `🐘 Gajah: ${gajah}` : ''}
${kambing ? `🐐 Kambing: ${kambing}` : ''}
${panda ? `🐼 Panda: ${panda}` : ''}
${buaya ? `🐊 Buaya: ${buaya}` : ''}
${kerbau ? `🐃 Kerbau: ${kerbau}` : ''}
${sapi ? `🐮 Sapi: ${sapi}` : ''}
${monyet ? `🐒 Monyet: ${monyet}` : ''}
${ayam ? `🐓 Ayam: ${ayam}` : ''}
${babi ? `🐖 Babi: ${babi}` : ''}
${babihutan ? `🐗 Babi Hutan: ${babihutan}` : ''}
`.trim();

const caption = kandangList
  ? `📮 *Kandang Kamu*\n\n${kandangList}`
  : '📮 *Kandang Kamu*\n\n❌ Kamu belum punya hewan di kandang!';

ctx.reply(caption);
});
};
