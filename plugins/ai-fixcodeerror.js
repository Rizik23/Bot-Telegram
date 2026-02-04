const axios = require("axios");

module.exports = (bot) => {
  bot.command("fixcodeerror", async (ctx) => {
    try {
      const input = ctx.message.text.split(" ").slice(1).join(" ");
      if (!input) {
        return ctx.reply("❌ Kirim dengan format:\n/fixcodeerror <error nya apa>\nLalu reply dengan kode JS yang mau diperbaiki.");
      }

      const reply = ctx.message.reply_to_message;
      if (!reply || (!reply.text && !reply.document)) {
        return ctx.reply("❌ Lu harus reply ke pesan yang isinya kode JavaScript-nya bre.");
      }

      let code = "";
      if (reply.document) {
        const file = await ctx.telegram.getFileLink(reply.document.file_id);
        const res = await axios.get(file.href);
        code = res.data;
      } else {
        code = reply.text;
      }

      // Prompt dengan gaya lu bre
      const prompt = `
Lu fixin kode ini bre. Error-nya udah dikasih tau.

1. Fokus ke error: ${input}
2. Jangan banyak bacot, kasih langsung kode yang udah dibenerin
3. Bungkus pake \`\`\`javascript biar bisa langsung disalin
4. kalo ada variabel undefined tambahin aja

Kode error-nya:

${code}

Langsung beresin bre, jangan nambahin omongan.
`;

      const { data } = await axios.get("https://api.fasturl.link/aillm/gpt-4o", {
        params: {
          ask: prompt
        },
        headers: {
          accept: "application/json"
        }
      });

      if (!data || !data.result) {
        return ctx.reply("❌ Gagal dapet respon dari AI bre.");
      }

      const result = data.result.trim();

      const finalCode = result.includes("```")
        ? result
        : `\`\`\`javascript\n${result}\n\`\`\``;

      return ctx.reply(finalCode.length > 4000 ? finalCode.slice(0, 4000) + "..." : finalCode, {
        parse_mode: "Markdown"
      });

    } catch (e) {
      console.error("FixCodeError Error:", e);
      return ctx.reply("❌ Ada error bre pas proses fix kode.");
    }
  });
};
