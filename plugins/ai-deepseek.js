      const axios = require("axios");

module.exports = (bot) => {
  bot.command("deepseek", async (ctx) => {
    const query = ctx.message.text.split(" ").slice(1).join(" ");
    if (!query) {
      return ctx.reply("❌ Masukkan teks pertanyaan!\nContoh: `/deepseek Apa itu AI?`", { parse_mode: "Markdown" });
    }

    await ctx.reply("⏳ Sedang berpikir dengan DeepSeek...");

    try {
      const { data } = await axios.get(`https://restapi-v2.simplebot.my.id/ai/deepseek?text=${encodeURIComponent(query)}`);

      if (data.status && data.result) {
        const replyText = data.result.replace(/<[^>]+>/g, "").trim();
        await ctx.reply(`🤖 *DeepSeek AI Jawaban:*\n\n${replyText}`, { parse_mode: "Markdown" });
      } else {
        ctx.reply("❌ Gagal mendapatkan jawaban dari DeepSeek.");
      }
    } catch (err) {
      console.error("DeepSeek error:", err.message || err);
      ctx.reply("❌ Terjadi kesalahan saat menghubungi API DeepSeek.");
    }
  });
};
 