const { Client } = require('ssh2');
const { OWNER_ID } = require('../config');
const { Markup } = require('telegraf');

module.exports = (bot) => {
  bot.command('installdepend', async (ctx) => {
    if (!OWNER_ID.includes(ctx.from.id)) {
      return ctx.reply('🚫 Kamu tidak diizinkan menggunakan perintah ini.');
    }

    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text || !text.includes('|')) {
      return ctx.reply("Contoh penggunaan:\nipvps|pwvps");
    }

    const [ipvps, passwd] = text.split('|').map(v => v.trim());
    if (!ipvps || !passwd) {
      return ctx.reply("Contoh penggunaan:\nipvps|pwvps");
    }

    const connSettings = {
      host: ipvps,
      port: 22,
      username: 'root',
      password: passwd
    };

    const command = `bash <(curl -s https://raw.githubusercontent.com/KiwamiXq1031/installer-premium/refs/heads/main/zero.sh)`;
    const ssh = new Client();

    ssh.on('ready', async () => {
      await ctx.reply("⚙️ Sedang menginstall *dependensi Pterodactyl*...\nTunggu ±3 menit...", {
        parse_mode: "Markdown"
      });

      ssh.exec(command, (err, stream) => {
        if (err) {
          console.error("❌ Eksekusi gagal:", err);
          return ctx.reply("❌ Terjadi kesalahan saat mengeksekusi perintah.");
        }

        stream.on('close', async () => {
          await ctx.reply("✅ Berhasil install *dependensi Pterodactyl*", {
            parse_mode: "Markdown"
          });

          await ctx.replyWithMarkdown(
            "Klik tombol di bawah untuk melanjutkan install *Tema Nebula*.",
            Markup.inlineKeyboard([
              Markup.button.callback('🚀 Install Tema Nebula', `installtemanebula ${text}`)
            ])
          );

          ssh.end();
        });

        stream.on('data', () => {
          stream.write("11\n");
          stream.write("A\n");
          stream.write("Y\n");
          stream.write("Y\n");
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
};