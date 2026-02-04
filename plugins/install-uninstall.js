const { Client } = require('ssh2');
const { OWNER_ID } = require('../config');

module.exports = (bot) => {
  bot.command(['uninstallpanel'], async (ctx) => {
    if (!OWNER_ID.includes(ctx.from.id)) {
      return ctx.reply('🚫 Kamu tidak diizinkan menggunakan perintah ini.');
    }

    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text || !text.includes("|")) {
      return ctx.reply(`Contoh: ipvps|pwvps`);
    }

    const [ipvps, passwd] = text.split('|').map(s => s.trim());
    if (!ipvps || !passwd) {
      return ctx.reply(`Contoh: ipvps|pwvps`);
    }

    const connSettings = {
      host: ipvps,
      port: 22,
      username: 'root',
      password: passwd
    };

    const command = `bash <(curl -s https://pterodactyl-installer.se)`;
    const ssh = new Client();

    await ctx.reply(`🔧 Menghubungkan ke VPS ${ipvps}...`);

    ssh.on('ready', async () => {
      await ctx.reply('🧨 Memulai proses uninstall panel... Ini bisa memakan waktu sekitar 1 menit.');

      ssh.exec(command, (err, stream) => {
        if (err) {
          ctx.reply(`❌ Gagal menjalankan perintah:\n${err.message}`);
          return ssh.end();
        }

        stream.on('close', () => {
          ctx.reply('✅ *Berhasil uninstall panel*', { parse_mode: "Markdown" });
          ssh.end();
        });

        stream.on('data', (data) => {
          const output = data.toString();
          console.log('STDOUT:', output);

          if (output.includes('Input 0-6')) stream.write("6\n");
          if (output.includes('(y/N)')) stream.write("y\n");
          if (output.includes('* Choose the panel user')) stream.write("\n");
          if (output.includes('* Choose the panel database')) stream.write("\n");
        });

        stream.stderr.on('data', (data) => {
          console.error('STDERR:', data.toString());
          ctx.reply('⚠️ Terjadi kesalahan saat uninstall panel.');
        });
      });
    });

    ssh.on('error', (err) => {
      console.error('SSH Error:', err.message);
      ctx.reply('❌ Gagal terhubung ke VPS. Periksa kembali IP atau password.');
    });

    ssh.connect(connSettings);
  });

  return () => {
    console.log('[PLUGIN] uninstallpanel di-unload!');
  };
};