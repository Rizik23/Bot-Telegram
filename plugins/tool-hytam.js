const { Composer } = require("telegraf");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

module.exports = (bot) => {
  let enabled = true;
  const composer = new Composer();

  composer.command("hytam", async (ctx) => {
    if (!enabled) return;

    const q = ctx.message.reply_to_message || ctx.message;
    const photos = q.photo || [];

    if (photos.length === 0) {
      return ctx.reply(`Kirim/reply gambar dengan caption /hytam`);
    }

    const photo = photos[photos.length - 1];
    const promptText = ctx.message.text.split(" ").slice(1).join(" ") ||
      "Ubahlah Karakter Dari Gambar Tersebut Diubah Kulitnya Menjadi Hitam";

    await ctx.reply("Otw Menghitam...");

    try {
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      const response = await fetch(fileLink.href);
      const buffer = await response.buffer();

      const genAI = new GoogleGenerativeAI("AIzaSyDdfNNmvphdPdHSbIvpO5UkHdzBwx7NVm0"); // Ganti dengan API key kamu
      const base64Image = buffer.toString("base64");

      const contents = [
        { text: promptText },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
      ];

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp-image-generation",
        generationConfig: {
          responseModalities: ["Text", "Image"],
        },
      });

      const result = await model.generateContent(contents);

      let resultImage;
      for (const part of result.response.candidates[0].content.parts) {
        if (part.inlineData) {
          resultImage = Buffer.from(part.inlineData.data, "base64");
        }
      }

      if (resultImage) {
        const tempPath = path.join(process.cwd(), "tmp", `gemini_${Date.now()}.png`);
        fs.writeFileSync(tempPath, resultImage);

        await ctx.replyWithPhoto({ source: tempPath }, {
          caption: "*Wahaha Makan Nih Hytam*",
          parse_mode: "Markdown"
        });

        setTimeout(() => {
          try { fs.unlinkSync(tempPath); } catch {}
        }, 30000);
      } else {
        ctx.reply("Gagal Menghitamkan.");
      }
    } catch (error) {
      console.error(error);
      ctx.reply(`Error: ${error.message}`);
    }
  });

  bot.use(composer.middleware());

  return {
    enable() {
      enabled = true;
      console.log("[PLUGIN] Hytam diaktifkan");
    },
    disable() {
      enabled = false;
      console.log("[PLUGIN] Hytam dinonaktifkan");
    },
  };
};
