const { Composer } = require("telegraf");
const axios = require("axios");

module.exports = (bot) => {
  let enabled = true;
  const composer = new Composer();

  composer.command("nulis", async (ctx) => {
    if (!enabled) return;

    const text = ctx.message.text?.split(" ").slice(1).join(" ");
    if (!text)
      return ctx.reply("Mau nulis apa? Contoh:\n/nulis aku sayang kamu");

    try {
      const response = await axios.post(
        "https://lemon-write.vercel.app/api/generate-book",
        {
          text,
          font: "default",
          color: "#000000",
          size: "28",
        },
        {
          responseType: "arraybuffer",
          headers: { "Content-Type": "application/json" },
        }
      );

      await ctx.replyWithPhoto({ source: Buffer.from(response.data) });
    } catch (error) {
      console.error("Nulis error:", error.message);
      ctx.reply("❌ Error, coba lagi nanti ya.");
    }
  });

  bot.use(composer.middleware());

  return {
    enable() {
      enabled = true;
      console.log("[PLUGIN] Nulis diaktifkan");
    },
    disable() {
      enabled = false;
      console.log("[PLUGIN] Nulis dinonaktifkan");
    },
  };
};
