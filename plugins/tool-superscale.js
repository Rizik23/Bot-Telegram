const axios = require('axios');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = (bot) => {
  bot.command(['superscale', 'upscale'], async (ctx) => {
    const args = ctx.message.text?.split(' ').slice(1);
    if (args.length < 2) {
      return ctx.reply(`❌ Contoh penggunaan:\n/superscale <image_url> <resize> [anime=true|false]\n\nContoh:\n/superscale https://fastmanager.fasturl.cloud/Uploads/FurryLowRes.jpg 16 false`);
    }

    const imageUrl = args[0];
    const resize = args[1];
    const anime = args[2] || 'false';

    const validResize = ['2', '4', '6', '8', '16'];
    if (!validResize.includes(resize)) {
      return ctx.reply('❌ Resize hanya boleh: 2, 4, 6, 8, atau 16');
    }

    const waitingMsg = await ctx.reply('⏳ Memproses upscaling gambar...');

    try {
      const { data } = await axios.get('https://fastrestapis.fasturl.cloud/aiimage/superscale', {
        params: {
          imageUrl,
          resize,
          anime
        },
        headers: {
          accept: 'application/json'
          // 'x-api-key': 'YOUR_API_KEY' // opsional jika kamu punya
        }
      });

      if (data?.status === 200 && data?.result) {
        await ctx.replyWithPhoto({ url: data.result }, {
          caption: `✅ Gambar berhasil di-upscale!\n🔗 [Download hasil](${data.result})`,
          parse_mode: 'Markdown'
        });
      } else {
        await ctx.reply(`❌ Gagal memproses gambar: ${data?.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Superscale Error:', err.response?.data || err.message);
      await ctx.reply('❌ Terjadi kesalahan saat memproses permintaan.');
    } finally {
      await delay(500);
      await ctx.deleteMessage(waitingMsg.message_id).catch(() => {});
    }
  });
};
