const axios = require("axios");

module.exports = (bot) => {
  bot.command("kjnjhhhh", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    const domain = args[0];

    if (!domain) {
      return ctx.reply("⚠️ Contoh penggunaan:\n`/subdomain siputzx.my.id`", {
        parse_mode: "Markdown",
      });
    }

    try {
      const res = await axios.post(
        "https://api.siputzx.my.id/api/tools/subdomains",
        { domain },
        {
          headers: {
            "accept": "*/*",
            "Content-Type": "application/json",
          },
        }
      );

      const data = res.data;
      if (!data.status || !data.data || data.data.length === 0) {
        return ctx.reply("❌ Tidak ditemukan subdomain untuk domain tersebut.");
      }

      // Gabung dan hilangkan duplikat
      const subdomains = [...new Set(data.data.join("\n").split("\n").filter(Boolean))];

      // Bagi hasil jika terlalu panjang
      const chunks = [];
      let chunk = "";
      for (const line of subdomains) {
        if ((chunk + line + "\n").length > 4000) {
          chunks.push(chunk);
          chunk = "";
        }
        chunk += line + "\n";
      }
      if (chunk) chunks.push(chunk);

      for (const part of chunks) {
        await ctx.reply("🔍 Ditemukan:\n\n```" + part + "```", {
          parse_mode: "Markdown",
        });
      }
    } catch (err) {
      console.error(err);
      ctx.reply("🚫 Terjadi kesalahan saat menghubungi API.");
    }
  });
};
