const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const config = require('../config');

module.exports = (bot) => {
  bot.command('backup2', async (ctx) => {
    const sender = String(ctx.from.id);
    if (!config.ownerIds.includes(sender)) {
      return ctx.reply("❌ Fitur ini cuma buat owner aja bre.");
    }

    const fileName = `backup-${Date.now()}.zip`;
    const filePath = path.join(__dirname, '..', fileName);
    const rootDir = path.join(__dirname, '..');

    ctx.reply('⏳ Sedang membuat backup aman...');

    // Buat versi bersih dulu
    const tempDir = path.join(rootDir, 'tmp_backup');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    // 1. Salin dan bersihkan config.js
    const cleanConfig = `
module.exports = {
  BOT_TOKEN: '',
  FORCE_SUB_CHANNEL: '',
  FORCE_SUB_GROUP: '',
  OWNER_USERNAME: '',
  OWNER_ID: '',
  ownerIds: [""],
  adminId: '',
  ownerID: '',
  domain: '',
  plta: '',
  pltc: '',
  pp: '',
  loc: '',
  eggs: '',
  nestid: '',
  ALLOWED_GROUP_IDS: []
};
`.trim();
    fs.writeFileSync(path.join(tempDir, 'config.js'), cleanConfig);

    // 2. Kosongkan user.json
    fs.mkdirSync(path.join(tempDir, 'data'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'data', 'users.json'), '[]');
    fs.writeFileSync(path.join(tempDir, 'data', 'user_today.json'), JSON.stringify({ date: "", users: [] }, null, 2));

    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      await ctx.replyWithDocument({ source: filePath, filename: fileName });
      fs.unlinkSync(filePath);
      fs.rmSync(tempDir, { recursive: true, force: true }); // hapus folder tmp_backup
    });

    archive.on('error', (err) => {
      console.error('❌ Archive error:', err.message);
      ctx.reply('❌ Gagal membuat backup.');
    });

    archive.pipe(output);

    // Backup isi folder kecuali node_modules, tmp dan backup zip
    archive.glob('**/*', {
      cwd: rootDir,
      ignore: ['node_modules/**', 'tmp/**', `${fileName}`, '*.zip', 'data/user.json', 'data/user_today.json', 'config.js']
    });

    // Tambahkan config dan data dari folder tmp_backup
    archive.directory(tempDir, false); // masukkan isinya ke root ZIP

    archive.finalize();
  });
};