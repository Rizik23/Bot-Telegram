const axios = require('axios');

module.exports = (bot) => {
  // 🔍 DANA
  bot.command('danastalk', async (ctx) => {
    const nomor = ctx.message.text.split(' ').slice(1).join(' ');
    if (!nomor) return ctx.reply('Kirim nomor Dana!\nContoh: /danastalk 08123456789');

    await ctx.reply('⏳ Sedang memproses...');

    try {
      const url = `https://fastrestapis.fasturl.cloud/stalk/bank?number=${encodeURIComponent(nomor)}&bank=dana`;
      const { data } = await axios.get(url);

      if (!data || data.status !== 200 || !data.result)
        return ctx.reply('❌ Gagal mengambil data Dana.');

      const { account_number, name, bank_code } = data.result.data;

      const text = `💳 *Stalker Dana*\n\n📌 *Nomor:* ${account_number}\n👤 *Nama:* ${name}\n🏦 *Bank:* ${bank_code}`;
      await ctx.replyWithMarkdown(text);
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Terjadi kesalahan, coba lagi nanti.');
    }
  });

  // 🔍 GOPAY
  bot.command('gopaystalk', async (ctx) => {
    const nomor = ctx.message.text.split(' ').slice(1).join(' ');
    if (!nomor) return ctx.reply('Kirim nomor GoPay!\nContoh: /gopaystalk 08123456789');

    await ctx.reply('⏳ Sedang memproses...');

    try {
      const url = `https://fastrestapis.fasturl.cloud/stalk/bank?number=${encodeURIComponent(nomor)}&bank=gopay`;
      const { data } = await axios.get(url);

      if (!data || data.status !== 200 || !data.result)
        return ctx.reply('❌ Gagal mengambil data GoPay.');

      const { account_number, name, bank_code } = data.result.data;

      const text = `💳 *Stalker GoPay*\n\n📌 *Nomor:* ${account_number}\n👤 *Nama:* ${name}\n🏦 *Bank:* ${bank_code}`;
      await ctx.replyWithMarkdown(text);
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Terjadi kesalahan, coba lagi nanti.');
    }
  });

  // 🔍 OVO
  bot.command('ovostalk', async (ctx) => {
    const nomor = ctx.message.text.split(' ').slice(1).join(' ');
    if (!nomor) return ctx.reply('Kirim nomor OVO!\nContoh: /ovostalk 08123456789');

    await ctx.reply('⏳ Sedang memproses...');

    try {
      const url = `https://fastrestapis.fasturl.cloud/stalk/bank?number=${encodeURIComponent(nomor)}&bank=ovo`;
      const { data } = await axios.get(url);

      if (!data || data.status !== 200 || !data.result)
        return ctx.reply('❌ Gagal mengambil data OVO.');

      const { account_number, name, bank_code } = data.result.data;

      const text = `💳 *Stalker OVO*\n\n📌 *Nomor:* ${account_number}\n👤 *Nama:* ${name}\n🏦 *Bank:* ${bank_code}`;
      await ctx.replyWithMarkdown(text);
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Terjadi kesalahan, coba lagi nanti.');
    }
  });
};
