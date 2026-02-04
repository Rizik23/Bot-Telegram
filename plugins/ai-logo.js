const axios = require("axios");
const { Input } = require("telegraf");

module.exports = (bot) => {
  bot.command("ailogo", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    const [brandname, prompt, industry, style] = args.split("|").map(v => v?.trim());

    if (!brandname || !prompt || !industry || !style) {
      return ctx.reply("❌ Format salah!\n\nGunakan format:\n/logogenerator BrandName | Deskripsi Logo | Industri | Gaya\n\nContoh:\n/logogenerator Tech Innovators | A modern logo with a futuristic feel | Technology | Minimalist");
    }

    try {
      const res = await axios.get("https://fastrestapis.fasturl.cloud/aiimage/logogenerator", {
        responseType: "arraybuffer",
        params: {
          brandname,
          prompt,
          industry,
          style
        },
        headers: {
          accept: "image/png"
          // Jika punya API key: 'x-api-key': 'APIKEY'
        }
      });

      const imageBuffer = Buffer.from(res.data, "binary");
      await ctx.replyWithPhoto({ source: imageBuffer }, {
        caption: `✅ Logo untuk *${brandname}*\n📝 Prompt: ${prompt}\n🏢 Industri: ${industry}\n🎨 Gaya: ${style}`,
        parse_mode: "Markdown"
      });
    } catch (error) {
      console.error(error?.response?.data || error.message);
      ctx.reply("❌ Gagal membuat logo. Pastikan parameter benar dan coba lagi nanti.");
    }
  });
};
