const fetch = require("node-fetch");

module.exports = (bot) => {
  bot.command("aicode", async (ctx) => {
    const text = ctx.message.text?.split(" ").slice(1).join(" ");
    if (!text) {
      return ctx.reply("❌ Kasih prompt lengkap bre buat generate plugin.\nContoh: `/aicode buatin plugin versi telegraf commonjs bre pake module export bot\nfitur /play\nAPI: https://api.kenshiro.cfd/api/downloader/play?q=Akhir%20tak%20bahagia`", { parse_mode: "Markdown" });
      
    }

    await ctx.reply("🤖 Lagi gua proses pluginnya bre, tunggu bentar ya...");

    const prompt = `
Lu adalah AI expert coding yang jago bikin plugin bot Telegram.
Tugas lu:
1. Buatin plugin bot Telegram pake Telegraf versi CommonJS.
2. Gunakan \`module.exports = (bot) => {\` buat exportnya.
3. Gunakan \`bot.command\` buat bikin command sesuai prompt user.
4. Jangan kasih penjelasan apapun, cukup kirim full kode pluginnya aja.
5. Hasil akhir harus dibungkus \`\`\`javascript di awal dan \`\`\` di akhir.

Prompt user:
${text}`;

    try {
      const url = `https://fastrestapis.fasturl.cloud/aillm/gpt-4o?ask=${encodeURIComponent(
        prompt
      )}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.result) {
        const reply = data.result.trim();
        const wrapped = reply.includes("```")
          ? reply
          : "```javascript\n" + reply + "\n```";

        return ctx.reply(wrapped.length > 4000 ? wrapped.slice(0, 4000) + "..." : wrapped, {
          parse_mode: "Markdown",
        });
      } else {
        ctx.reply("❌ Gagal dapet jawaban dari AI bre.");
      }
    } catch (err) {
      console.error("AICode Error:", err);
      ctx.reply("❌ Terjadi error pas generate plugin.");
    }
  });
};
