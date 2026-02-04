const { loadImage, createCanvas } = require('canvas');
const axios = require('axios');
const config = require('../config');
module.exports = (bot) => {
  bot.command('cekid1', async (ctx) => {
    try {
      const user = ctx.from;
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const username = user.username ? `@${user.username}` : '-';
      const userId = user.id.toString();
      const today = new Date().toISOString().split('T')[0];
      const dcId = (user.id >> 32) % 256; // Estimasi data center ID

      // Ambil foto profil user
      let photoUrl = null;
      try {
        const photos = await ctx.telegram.getUserProfilePhotos(user.id);
        if (photos.total_count > 0) {
          const fileId = photos.photos[0][0].file_id;
          const file = await ctx.telegram.getFile(fileId);
          photoUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`;
        }
      } catch (e) {
        console.log('Gagal ambil foto profil:', e.message);
      }

      // Gambar background
      const canvas = createCanvas(1000, 600);
      const ctx2d = canvas.getContext('2d');

      // Background
      ctx2d.fillStyle = '#e6f2ee';
      ctx2d.fillRect(0, 0, canvas.width, canvas.height);

      // Foto user
      if (photoUrl) {
        const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
        const avatar = await loadImage(response.data);
        ctx2d.drawImage(avatar, 50, 50, 250, 300);
      } else {
        ctx2d.fillStyle = '#ccc';
        ctx2d.fillRect(50, 50, 250, 300);
      }

      // Teks
      ctx2d.fillStyle = '#0a4f44';
      ctx2d.font = 'bold 40px sans-serif';
      ctx2d.fillText('ID CARD TELEGRAM', 350, 80);

      ctx2d.fillStyle = 'black';
      ctx2d.font = '28px sans-serif';
      ctx2d.fillText(`Nama      : ${fullName}`, 350, 150);
      ctx2d.fillText(`User ID   : ${userId}`, 350, 200);
      ctx2d.fillText(`User Name : ${username}`, 350, 250);
      ctx2d.fillText(`Tanggal   : ${today}`, 350, 300);

      // Dummy barcode
      ctx2d.fillStyle = 'black';
      ctx2d.fillRect(350, 350, 280, 5);
      ctx2d.fillRect(360, 370, 5, 50);
      ctx2d.fillRect(375, 370, 3, 50);
      ctx2d.fillRect(385, 370, 7, 50);
      ctx2d.fillRect(400, 370, 2, 50);
      ctx2d.fillRect(415, 370, 4, 50);
      ctx2d.fillRect(430, 370, 6, 50);

      // Support
      ctx2d.fillStyle = 'black';
      ctx2d.font = '22px sans-serif';
      ctx2d.fillText('suport : fernine', 350, 460);
      ctx2d.fillText('link   : t.me/VellzXyrine', 350, 495);

      // Caption detail
      const caption = `
👤 Nama      : ${fullName}
🆔 User ID   : ${user.id}
🌐 UserName : ${username}
`;

const buffer = canvas.toBuffer('image/png');
await ctx.replyWithPhoto({ source: buffer }, { caption });
} catch (err) {
  console.error(err);
  ctx.reply('Gagal generate ID card.');
}
  });
};
