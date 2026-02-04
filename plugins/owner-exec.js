const util = require("util");
const axios = require("axios");
const config = require('../config'); 
module.exports = (bot) => {
  bot.command("exec", async (ctx) => {
   const userId = String(ctx.from.id);
   if (!config.ownerIds.includes(userId)) {
      return ctx.reply("❌ Fitur ini cuma bisa dipakai sama owner bot aja bre.");

    }
    const text = ctx.message.text?.split(" ").slice(1).join(" ");
    if (!text) return ctx.reply("⚠️ Kirim kode yang mau dieksekusi.\n\nContoh:\n/exec console.log('halo')");

    await ctx.reply("🧠 Lagi ngejalanin kode lu...");

    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const fn = new AsyncFunction("ctx", "require", "axios", text);
      let result = await fn(ctx, require, axios);

      if (typeof result !== "string") {
        result = util.inspect(result, { depth: 2 });
      }

      if (!result) result = "✅ Kode dieksekusi tanpa output.";
      ctx.reply(`💻 Output:\n\`\`\`\n${result}\n\`\`\``, {
        parse_mode: "Markdown",
      });
    } catch (err) {
      ctx.reply(`❌ Error:\n\`\`\`\n${err.message}\n\`\`\``, {
        parse_mode: "Markdown",
      });
    }
  });
};