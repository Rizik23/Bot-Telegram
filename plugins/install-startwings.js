const { Client } = require('ssh2');
const { OWNER_ID } = require('../config');

module.exports = (bot) => {
  bot.command(['startwings', 'configurewings'], async (ctx) => {
    if (!OWNER_ID.includes(ctx.from.id)) {
      return ctx.reply('🚫 Kamu tidak diizinkan menggunakan perintah ini.');
    }

    const text = ctx.message.text.split(' ').slice(1).join(' ');
    const args = text.split('|').map(a => a.trim());

    if (args.length < 3) {
      return ctx.reply(`Contoh: ipvps|pwvps|token_node`);
    }

    const [ipvps, password, token] = args;
    const connSettings = {
      host: ipvps,
      port: 22,
      username: 'root',
      password
    };

    const command = `${token} && systemctl start wings`;
    const ssh = new Client();

    await ctx.reply(`🕐 Menghubungkan ke VPS ${ipvps}...`);

    ssh.on('ready', () => {
      ctx.reply('✅ SSH berhasil, menjalankan perintah...');

      ssh.exec(command, (err, stream) => {
        if (err) {
          ctx.reply(`❌ Gagal menjalankan perintah:\n${err.message}`);
          return ssh.end();
        }

        let stderr = '';

        stream.on('close', () => {
          if (stderr) {
            ctx.reply(`⚠️ Wings dijalankan dengan error:\n${stderr}`);
          } else {
            ctx.reply(`✅ *Wings berhasil dijalankan di ${ipvps}*`, { parse_mode: "Markdown" });
          }
          ssh.end();
        });

        stream.on('data', data => {
          console.log('STDOUT:', data.toString());
        });

        stream.stderr.on('data', data => {
          stderr += data.toString();
          console.error('STDERR:', data.toString());
        });
      });
    });

    ssh.on('error', (err) => {
      ctx.reply(`❌ Gagal koneksi SSH:\n${err.message}`);
    });

    ssh.connect(connSettings);
  });

  return () => {
    console.log('[PLUGIN] startwings/configurewings di-unload!');
  };
};