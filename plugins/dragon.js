const axios = require("axios");

module.exports = (bot) => {
  bot.command("dragon", async (ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) return ctx.reply("Contoh: /ai buat teks jualan");

    await ctx.reply("🤖 Thinking...");

    const res = await axios.post("http:178.128.117.9:11434/api/generate", {
      model: "deepseek-r1:8b",
      prompt: text,
      stream: false
    });

    ctx.reply(res.data.response);
  });
};