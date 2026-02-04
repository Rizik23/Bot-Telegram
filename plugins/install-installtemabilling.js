const { Client } = require('ssh2');
const { OWNER_ID } = require('../config');

module.exports = (bot) => {
  bot.command(['installtemabilling', 'instaltemabiling'], async (ctx) => {
    if (!OWNER_ID.includes(ctx.from.id)) {
      return ctx.reply('🚫 Kamu tidak diizinkan menggunakan perintah ini.');
    }

    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text || !text.includes("|")) {
      return ctx.reply("⚠️ Contoh penggunaan:\nipvps|pwvps", { parse_mode: "Markdown" });
    }

    const [ipvps, passwd] = text.split("|").map(v => v.trim());
    if (!ipvps || !passwd) {
      return ctx.reply("⚠️ Contoh penggunaan:\nipvps|pwvps", { parse_mode: "Markdown" });
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
      await ctx.reply("🎨 Memulai proses install *tema Billing* untuk Pterodactyl...\nMohon tunggu sekitar 3 menit.", {
        parse_mode: "Markdown"
      });

      ssh.exec(command, (err, stream) => {
        if (err) {
          console.error("❌ Eksekusi Gagal:", err);
          return ctx.reply("❌ Terjadi kesalahan saat mengeksekusi perintah.");
        }

        stream.on('close', async () => {
          await ctx.reply("✅ *Tema Billing berhasil diinstal!*", {
            parse_mode: "Markdown"
          });
          ssh.end();
        });

        stream.on('data', (data) => {
          const output = data.toString();
          console.log(output);

          stream.write("1\n");   // Masuk ke menu tema
          stream.write("2\n");   // Pilih tema Billing
          stream.write("yes\n"); // Konfirmasi install
          stream.write("x\n");   // Keluar
        });

        stream.stderr.on('data', (data) => {
          console.error("⚠️ STDERR:", data.toString());
        });
      });
    }).on('error', (err) => {
      console.error("❌ SSH Error:", err);
      ctx.reply("❌ Gagal terhubung ke VPS. Periksa kembali IP dan password.");
    }).connect(connSettings);
  });

  return () => {
    console.log('[PLUGIN] Tema Billing Unloaded.');
  };
};