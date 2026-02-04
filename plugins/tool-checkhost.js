const axios = require('axios');

module.exports = (bot) => {
  bot.command('checkhost', async (ctx) => {
    // Contoh: /checkhost example.com ping
    const input = ctx.message.text.split(' ');
    if (input.length < 3) {
      return ctx.reply('Format salah!\nGunakan: /checkhost <host> <mode>\nContoh: /checkhost google.com ping');
    }

    const host = input[1];
    const mode = input[2].toLowerCase();

    const validModes = ['ping', 'http', 'tcp', 'udp', 'dns', 'info'];
    if (!validModes.includes(mode)) {
      return ctx.reply(`Mode tidak valid! Pilih salah satu dari: ${validModes.join(', ')}`);
    }

    const url = 'https://fastrestapis.fasturl.cloud/tool/checkhost';
    const params = {
      host,
      mode
    };

    try {
      await ctx.reply(`Sedang melakukan pengecekan host ${host} dengan mode ${mode}...`);
      const response = await axios.get(url, { params });
      if (response.data && response.data.status === 200) {
        const result = response.data.result;
        // Ringkas hasil untuk reply (bisa disesuaikan)
        let replyMsg = `✅ Hasil pengecekan host: ${host}\nMode: ${mode}\n\n`;

        if (mode === 'ping') {
          for (const node in result) {
            if (result[node].result) {
              const res = result[node].result[0];
              replyMsg += `🌍 ${result[node].country_name} ${result[node].flag_emoji}: ${res[0]} - RTT: ${res[1]}s\n`;
            }
          }
        } else if (mode === 'info') {
          replyMsg += `🌍 Negara: ${result.country_name} ${result.flag_emoji}\n`;
          replyMsg += `🌐 ISP: ${result.isp}\n`;
          replyMsg += `📍 Lokasi: ${result.city}, ${result.region}\n`;
          replyMsg += `📡 IP: ${result.ip}\n`;
        } else {
          replyMsg += JSON.stringify(result, null, 2);
        }

        ctx.reply(replyMsg);
      } else {
        ctx.reply('Gagal mendapatkan data dari server.');
      }
    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat mengakses API.');
    }
  });
};
