const { Client } = require('ssh2');
const { OWNER_ID } = require('../config');

module.exports = (bot) => {
  bot.command('installtemanebula', async (ctx) => {
    if (!OWNER_ID.includes(ctx.from.id)) {
      return ctx.reply('🚫 Kamu tidak diizinkan menggunakan perintah ini.');
    }

    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text || !text.includes("|")) {
      return ctx.reply("⚠️ Format salah!\n\nContoh penggunaan:\n`ipvps|pwvps`", {
        parse_mode: 'Markdown'
      });
    }

    const [ipvps, passwd] = text.split("|").map(item => item.trim());
    if (!ipvps || !passwd) {
      return ctx.reply("⚠️ Format salah!\n\nContoh penggunaan:\n`ipvps|pwvps`", {
        parse_mode: 'Markdown'
      });
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
      await ctx.reply("🛠️ Memulai install *Tema Nebula*...\nHarap tunggu sekitar 3 menit...", {
        parse_mode: 'Markdown'
      });

      ssh.exec(command, (err, stream) => {
        if (err) {
          console.error("❌ Exec Error:", err);
          return ctx.reply("❌ Gagal mengeksekusi script.");
        }

        stream.on('close', async () => {
          await ctx.reply("✅ *Tema Nebula* berhasil diinstal!", {
            parse_mode: 'Markdown'
          });
          ssh.end();
        });

        stream.on('data', (data) => {
          const output = data.toString();
          console.log("STDOUT:", output);

          if (output.toLowerCase().includes('choose an option')) stream.write("10\n");
          if (output.toLowerCase().includes('custom name')) stream.write("\n");
          if (output.toLowerCase().includes('custom link')) stream.write("\n");
          if (output.toLowerCase().includes('exit')) stream.write("x\n");
        });

        stream.stderr.on('data', (data) => {
          console.error("STDERR:", data.toString());
        });
      });

    }).on('error', (err) => {
      console.error("❌ SSH Error:", err);
      ctx.reply("❌ Gagal koneksi ke VPS. Pastikan IP dan password benar.");
    }).connect(connSettings);
  });

  return () => {
    console.log('[PLUGIN] Tema Nebula Unloaded.');
  };
};