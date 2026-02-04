const fetch = require("node-fetch");
const config = require("../config");

module.exports = (bot) => {
  bot.command("plugintelegraf", async (ctx) => {
    const text = ctx.message.text?.split(" ").slice(1).join(" ").trim();

    if (!text) {
      return ctx.reply(
        "❌ Kasih deskripsi fitur plugin-nya bre.\n\nContoh: /plugintelegraf hapus promosi di grup"
      );
    }

    await ctx.reply("🤖 Lagi gua bikinin pluginnya bre, tunggu bentar ya...");

    const prompt = `
Lu adalah AI expert coding dalam membuat plugin bot Telegram versi Telegraf dengan format CommonJS.

Tugas lu:
1. Buatin plugin versi telegraf commonjs bre pake \`module.exports = (bot) => {\`
2. Gunakan \`bot.command\` buat handle command.
3. Kalau perlu filter lain boleh pakai \`bot.on('message', ...)\` atau lainnya.
4. Jangan kasih penjelasan, cukup kirim full kode pluginnya aja.
5. Bungkus hasilnya pake \`\`\`javascript di awal dan \`\`\` di akhir biar gampang disalin.

Deskripsi plugin:
${text}
`.trim();

    try {
      // ✅ Langsung taro API Key disini
      const GROQ_API_KEY = config.GROQ_API_KEY;

      const body = {
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "Jawab hanya dengan kode plugin CommonJS Telegraf. Tanpa penjelasan.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1400,
      };

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return ctx.reply(
          `❌ Groq Error: ${data?.error?.message || "Unknown Error"}`
        );
      }

      const reply = data?.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        return ctx.reply("❌ Gagal dapet balasan dari Groq bre.");
      }

      // Bungkus codeblock kalau belum ada
      let out = reply;
      if (!out.includes("```")) {
        out = `\`\`\`javascript\n${out}\n\`\`\``;
      }

      // Telegram limit 4096
      if (out.length > 4090) {
        out = out.slice(0, 4090) + "\n```";
      }

      return ctx.reply(out, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("PluginTelegraf Groq Error:", err);
      ctx.reply("❌ Terjadi error pas buat plugin (Groq).");
    }
  });
};