const { Client } = require('ssh2');
const { OWNER_ID } = require('../config');

module.exports = (bot) => {
  bot.command(['installtemaenigma', 'instaltemaenigma'], async (ctx) => {
    if (!OWNER_ID.includes(ctx.from.id)) {
      return ctx.reply('🚫 Kamu tidak diizinkan menggunakan perintah ini.');
    }

    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text || text.split('|').length < 6) {
      return ctx.reply(
        `⚠️ Format salah!\n\nContoh:\nipvps|pwvps|linkwa|linkgc1|linkgc2|linkch\n\nNote:\nFormat linkwa harus diawali dengan https://wa.me/62xx`, 
        { parse_mode: 'Markdown' }
      );
    }

    const [ipvps, passwd, linkwa, linkgc1, linkgc2, linkch] = text.split('|').map(v => v.trim());

    if (!ipvps || !passwd || !linkwa || !linkgc1 || !linkgc2 || !linkch) {
      return ctx.reply(
        `⚠️ Ada input yang kosong!\n\nContoh:\nipvps|pwvps|linkwa|linkgc1|linkgc2|linkch`, 
        { parse_mode: 'Markdown' }
      );
    }

    if (!/^https:\/\/wa\.me\/\d+$/.test(linkwa)) {
      return ctx.reply("❌ Format link WhatsApp tidak valid. Harus seperti:\n`https://wa.me/62xxx`", {
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
      await ctx.reply("🎨 Memulai proses install *tema Enigma*...\nMohon tunggu sekitar 3 menit.", {
        parse_mode: "Markdown"
      });

      ssh.exec(command, (err, stream) => {
        if (err) {
          console.error("❌ Eksekusi Gagal:", err);
          return ctx.reply("❌ Terjadi kesalahan saat mengeksekusi perintah.");
        }

        stream.on('close', async () => {
          await ctx.reply("✅ *Tema Enigma* berhasil diinstal!", {
            parse_mode: "Markdown"
          });
          ssh.end();
        });

        stream.on('data', () => {
          stream.write("1\n");                 // Menu tema
          stream.write("3\n");                 // Pilih Enigma
          stream.write(`${linkwa}\n`);
          stream.write(`${linkgc1}\n`);
          stream.write(`${linkgc2}\n`);
          stream.write(`${linkch}\n`);
          stream.write("yes\n");
          stream.write("x\n");
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
    console.log('[PLUGIN] Tema Enigma Unloaded.');
  };
};