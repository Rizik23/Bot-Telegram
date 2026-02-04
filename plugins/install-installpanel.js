const { Client } = require('ssh2');
const { OWNER_ID } = require('../config');

module.exports = (bot) => {
  bot.command('installpanel', async (ctx) => {
    if (!OWNER_ID.includes(ctx.from.id)) {
      return ctx.reply('🚫 Kamu tidak diizinkan menggunakan perintah ini.');
    }

    const text = ctx.message.text?.split(' ').slice(1).join(' ');
    if (!text) return ctx.reply('Contoh:\n/installpanel ipvps|pwvps|panel.com|node.com|100000');

    const vii = text.split('|');
    if (vii.length < 5) return ctx.reply('Format salah!\nContoh:\n/installpanel ipvps|pwvps|panel.com|node.com|100000');

    const [ip, pw, domainpanel, domainnode, ramserver] = vii;
    const passwordPanel = 'admin1';

    const commandPanel = `bash <(curl -s https://pterodactyl-installer.se)`;
    const commandNode = `bash <(curl -s https://raw.githubusercontent.com/SkyzoOffc/Pterodactyl-Theme-Autoinstaller/main/createnode.sh)`;

    const ssh = new Client();

    function writeDelayed(stream, input, delay = 200) {
      setTimeout(() => stream.write(input + '\n'), delay);
    }

    function instalPanel() {
      ssh.exec(commandPanel, (err, stream) => {
        if (err) return ctx.reply('❌ Gagal eksekusi instalasi panel');

        stream.on('close', instalWings).on('data', (data) => {
          const d = data.toString();

          if (d.includes('Input 0-6')) writeDelayed(stream, '0');
          else if (d.includes('(y/N)')) writeDelayed(stream, 'y');
          else if (d.includes('Database name')) writeDelayed(stream, '');
          else if (d.includes('Database username')) writeDelayed(stream, 'admin');
          else if (d.includes('Password')) writeDelayed(stream, 'admin');
          else if (d.includes('timezone')) writeDelayed(stream, 'Asia/Jakarta');
          else if (d.includes('email address')) writeDelayed(stream, 'admin@gmail.com');
          else if (d.includes('Username')) writeDelayed(stream, 'admin');
          else if (d.includes('First name')) writeDelayed(stream, 'admin');
          else if (d.includes('Last name')) writeDelayed(stream, 'admin');
          else if (d.includes('Password for the initial')) writeDelayed(stream, passwordPanel);
          else if (d.includes('FQDN')) writeDelayed(stream, domainpanel);
          else if (d.includes('UFW')) writeDelayed(stream, 'y');
          else if (d.includes('HTTPS')) writeDelayed(stream, 'y');
          else if (d.includes('appropriate number')) writeDelayed(stream, '1');
          else if (d.includes('I agree')) writeDelayed(stream, 'y');
          else if (d.includes('Proceed anyways')) writeDelayed(stream, 'y');
          else if (d.includes('(yes/no)')) writeDelayed(stream, 'y');
          else if (d.includes('Continue with installation')) writeDelayed(stream, 'y');
          else if (d.includes('Still assume SSL')) writeDelayed(stream, 'y');
          else if (d.includes('Terms of Service')) writeDelayed(stream, 'y');
          else if (d.includes('(A)gree/(C)ancel:')) writeDelayed(stream, 'A');
        }).stderr.on('data', (data) => {
          ctx.reply(`⚠️ Error Panel:\n${data.toString()}`);
        });
      });
    }

    function instalWings() {
      ssh.exec(commandPanel, (err, stream) => {
        if (err) return ctx.reply('❌ Gagal eksekusi instalasi Wings');

        stream.on('close', installNode).on('data', (data) => {
          const d = data.toString();

          if (d.includes('Input 0-6')) writeDelayed(stream, '1');
          else if (d.includes('(y/N)')) writeDelayed(stream, 'y');
          else if (d.includes('Enter the panel address')) writeDelayed(stream, domainpanel);
          else if (d.includes('Database host username')) writeDelayed(stream, 'admin');
          else if (d.includes('Database host password')) writeDelayed(stream, 'admin');
          else if (d.includes('Set the FQDN to use')) writeDelayed(stream, domainnode);
          else if (d.includes('Enter email address')) writeDelayed(stream, 'admin@gmail.com');
        }).stderr.on('data', (data) => {
          ctx.reply(`⚠️ Error Wings:\n${data.toString()}`);
        });
      });
    }

    function installNode() {
      ssh.exec(commandNode, (err, stream) => {
        if (err) return ctx.reply('❌ Gagal eksekusi instalasi Node');

        stream.on('close', async () => {
          const result = `
✅ *Install Panel Berhasil*

🔐 *Username:* admin  
🔑 *Password:* ${passwordPanel}  
🌐 *Panel:* https://${domainpanel}

📌 Jalankan wings:
<code>/startwings ${ip}|${pw}|[token node]</code>
          `.trim();
          await ctx.replyWithHTML(result);
          ssh.end();
        }).on('data', (data) => {
          const d = data.toString();

          if (d.includes('Masukkan nama lokasi:')) writeDelayed(stream, 'Singapore');
          else if (d.includes('deskripsi lokasi:')) writeDelayed(stream, 'Node By noxxa');
          else if (d.includes('domain:')) writeDelayed(stream, domainnode);
          else if (d.includes('nama node:')) writeDelayed(stream, 'noxxasoloo');
          else if (d.includes('RAM')) writeDelayed(stream, ramserver);
          else if (d.includes('disk space')) writeDelayed(stream, ramserver);
          else if (d.includes('Locid')) writeDelayed(stream, '1');
        }).stderr.on('data', (data) => {
          ctx.reply(`⚠️ Error Instalasi Node:\n${data.toString()}`);
        });
      });
    }

    ssh.on('ready', () => {
      ctx.replyWithMarkdown(`🚀 *Memulai Instalasi Panel*\n\n*IP VPS:* ${ip}\n*Domain Panel:* ${domainpanel}\n\nTunggu 10-20 menit...`);
      ssh.exec('\n', (err, stream) => {
        if (err) return ctx.reply('Gagal eksekusi kosong SSH');
        stream.on('close', instalPanel);
      });
    });

    ssh.on('error', (err) => {
      console.error('[SSH ERROR]', err);
      ctx.reply(`❌ Gagal koneksi SSH:\n${err.message}`);
    });

    ssh.connect({
      host: ip,
      port: 22,
      username: 'root',
      password: pw
    });
  });
};