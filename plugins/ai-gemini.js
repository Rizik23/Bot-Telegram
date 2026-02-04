const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = new GoogleGenerativeAI("AIzaSyCjvXaTRecRjrfAZUz9gPzA1bhXBDdFIG0"); 

module.exports = (bot) => {
  bot.command(['gemini', 'aigemini'], async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) return ctx.reply('❌ Masukkan pertanyaannya.');

    await ctx.reply('⏳ Menjawab dengan Gemini...');

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
      const result = await model.generateContent(text);
      const response = await result.response;
      const answer = response.text();

      ctx.reply(answer || '❌ Tidak ada jawaban yang tersedia.');
    } catch (err) {
      console.error('Gemini Error:', err.message || err);
      ctx.reply('❌ Terjadi kesalahan saat memproses permintaan.');
    }
  });
};
  