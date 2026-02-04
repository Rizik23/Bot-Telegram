const { Client } = require('ssh2');
const { OWNER_ID } = require('../config');

module.exports = (bot) => {
  bot.command(['uninstalltema'], async (ctx) => {
    if (!OWNER_ID.includes(ctx.from.id)) {
      return ctx.reply('🚫 Kamu tidak diizinkan menggunakan perintah ini.');
    }

    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text || !text.includes("|")) {
      return ctx.reply("Contoh: ipvps|pwvps");
    }

    const [ipvps, pwvps] = text.split("|").map(v => v.trim());
    if (!ipvps || !pwvps) {
      return ctx.reply("Contoh: ipvps|pwvps");
    }

    const connSettings = {
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    };

    const command = `bash <(curl -s https://raw.githubusercontent.com/Bangsano/Autoinstaller-Theme-Pterodactyl/refs/heads/main/install.sh)`;
    const ssh = new Client();

    try {
      await ctx.reply("🛠️ Memproses *uninstall* tema Pterodactyl...\nTunggu sekitar 3 menit.", {
        parse_mode: "Markdown"
      });

      ssh.on('ready', () => {
        ssh.exec(command, (err, stream) => {
          if (err) {
            console.error("❌ Gagal eksekusi perintah:", err);
            return ctx.reply("❌ Terjadi kesalahan saat mengeksekusi perintah.");
          }

          stream.on('close', async () => {
            await ctx.reply("✅ *Berhasil uninstall tema Pterodactyl*", {
              parse_mode: "Markdown"
            });
            ssh.end();
          });

          stream.on('data', (data) => {
            const out = data.toString();
            console.log(out);
            stream.write("2\n");
            stream.write("y\n");
            stream.write("x\n");
          });

          stream.stderr.on('data', (data) => {
            console.error("⚠️ STDERR:", data.toString());
          });
        });
      });

      ssh.on('error', (err) => {
        console.error("❌ Koneksi SSH gagal:", err);
        ctx.reply("❌ Gagal terhubung ke VPS. Cek kembali IP dan password.");
      });

      ssh.connect(connSettings);
    } catch (e) {
      console.error("❌ Kesalahan umum:", e);
      ctx.reply("❌ Terjadi kesalahan tak terduga.");
    }
  });

  // Fungsi ini bisa dipakai untuk unload plugin, misalnya unregister command
  return () => {
    console.log('[PLUGIN] uninstalltema di-unload!');
  };
};