 const axios = require('axios');

module.exports = (bot) => {
  bot.command('instagramstalk', async (ctx) => {
    try {
      // Ambil username dari pesan, misal: /instagram google
      const input = ctx.message.text.split(' ').slice(1).join(' ').trim();
      if (!input) return ctx.reply('Kirim username Instagram setelah command, contoh:\n/instagramstalk google');

      // Request ke API pake axios
      const response = await axios.post('https://api.siputzx.my.id/api/stalk/instagram', {
        username: input
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      });

      const data = response.data;
      if (!data.status) return ctx.reply('Data tidak ditemukan atau username salah.');

      const ig = data.data;

      // Format pesan yang mau dikirim
      let msg = `📸 *Instagram Profile Info*\n\n`;
      msg += `👤 Username: ${ig.username}\n`;
      msg += `👑 Full Name: ${ig.full_name}\n`;
      msg += `📝 Biography: ${ig.biography || '-'}\n`;
      msg += `🔗 External URL: ${ig.external_url || '-'}\n`;
      msg += `📊 Followers: ${ig.followers_count.toLocaleString()}\n`;
      msg += `👥 Following: ${ig.following_count.toLocaleString()}\n`;
      msg += `📬 Posts: ${ig.posts_count.toLocaleString()}\n`;
      msg += `🔒 Private: ${ig.is_private ? 'Yes' : 'No'}\n`;
      msg += `✔️ Verified: ${ig.is_verified ? 'Yes' : 'No'}\n`;
      msg += `🏢 Business Account: ${ig.is_business_account ? 'Yes' : 'No'}\n`;

      // Kirim foto profile + caption info
      await ctx.replyWithPhoto(ig.profile_pic_url, { caption: msg, parse_mode: 'Markdown' });
    } catch (error) {
      console.error(error);
      ctx.reply('Terjadi kesalahan saat mengambil data Instagram.');
    }
  });
};
