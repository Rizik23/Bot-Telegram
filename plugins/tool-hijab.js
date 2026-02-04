const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

module.exports = (bot) => {
  bot.command("hijabkan", async (ctx) => {
    const q = ctx.message.reply_to_message || ctx.message;
    const photos = q.photo || [];

    if (!photos.length) {
      return ctx.reply("❌ Kirim atau balas gambar dengan caption /hijabkan");
    }

    const photo = photos[photos.length - 1];
    const promptText =
      ctx.message.text.split(" ").slice(1).join(" ") ||
      "Buatkan Karakter Yang Ada Di Gambar Tersebut Agar Di Berikan Hijab Warna Putih Hijab Ala Orang Indonesia Dan Buat Jangan Sampai Rambutnya Terlihat Buat Semua Tertutup";

    await ctx.reply("⏳ Otw dihijabkan...");

    try {
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      const response = await fetch(fileLink.href);
      const buffer = await response.buffer();
      const base64Image = buffer.toString("base64");

      const genAI = new GoogleGenerativeAI("AIzaSyDdfNNmvphdPdHSbIvpO5UkHdzBwx7NVm0");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp-image-generation",
        generationConfig: { responseModalities: ["Text", "Image"] },
      });

      const result = await model.generateContent([
        { text: promptText },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
      ]);

      const parts = result.response.candidates?.[0]?.content?.parts || [];

      let resultImage = null;
      for (const part of parts) {
        if (part.inlineData) {
          resultImage = Buffer.from(part.inlineData.data, "base64");
          break;
        }
      }

      if (resultImage) {
        const tempDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const tempPath = path.join(tempDir, `hijab_${Date.now()}.png`);
        fs.writeFileSync(tempPath, resultImage);

        await ctx.replyWithPhoto(
          { source: tempPath },
          { caption: "*Waifu Halal Sudah Jadi*", parse_mode: "Markdown" }
        );

        setTimeout(() => fs.existsSync(tempPath) && fs.unlinkSync(tempPath), 30_000);
      } else {
        ctx.reply("❌ Gagal menghijabkan.");
      }
    } catch (error) {
      console.error("Hijabkan error:", error.message || error);
      ctx.reply(`❌ Error: ${error.message}`);
    }
  });
};
