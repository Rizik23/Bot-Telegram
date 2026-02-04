const { Client } = require('ssh2');
const { OWNER_ID } = require('../config');

module.exports = (bot) => {
  bot.command(['installtemastellar', 'installtemastelar'], async (ctx) => {
    if (!OWNER_ID.includes(ctx.from.id)) {
      return ctx.reply('🚫 Kamu tidak diizinkan menggunakan perintah ini.');
    }

    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text || !text.includes("|")) {
      return ctx.reply("Contoh: ipvps|pwvps");
    }

    const [ipvps, passwd] = text.split("|").map(item => item.trim());
    if (!ipvps || !passwd) {
      return ctx.reply("Contoh: ipvps|pwvps");
    }

    const connSettings = {
      host: ipvps,
      port: 22,
      username: 'root',
      password: passwd
    };

    const command = `bash <(curl -s https://raw.githubusercontent.com/Bangsano/Autoinstaller-Theme-Pterodactyl/refs/heads/main/install.sh)`;
    const ssh = new Client();

    ssh.on('ready', async () => {
      await ctx.reply("🚀 Memproses install *tema Stellar* Pterodactyl...\nTunggu sekitar 3 menit.", {
        parse_mode: "Markdown"
      });

      ssh.exec(command, (err, stream) => {
        if (err) {
          console.error("❌ Eksekusi Gagal:", err);
          return ctx.reply("❌ Terjadi kesalahan saat mengeksekusi perintah.");
        }

        stream.on('close', async () => {
          await ctx.reply("✅ *Berhasil install tema Stellar Pterodactyl*", {
            parse_mode: "Markdown"
          });
          ssh.end();
        });

        stream.on('data', (data) => {
          const output = data.toString();
          console.log(output);

          if (output.includes('Choose an option')) stream.write("1\n");
          if (output.toLowerCase().includes('auto install')) stream.write("1\n");
          if (output.toLowerCase().includes('(yes/no)')) stream.write("yes\n");
          if (output.toLowerCase().includes('exit')) stream.write("x\n");
        });

        stream.stderr.on('data', (data) => {
          console.error("⚠️ STDERR:", data.toString());
        });
      });
    }).on('error', (err) => {
      console.error("❌ Koneksi SSH gagal:", err);
      ctx.reply("❌ Gagal terhubung ke VPS. Periksa kembali IP dan password.");
    }).connect(connSettings);
  });

  return () => {
    console.log('[PLUGIN] Tema Stellar Unloaded.');
  };
};