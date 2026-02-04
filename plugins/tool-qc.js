const axios = require("axios");
const { fileTypeFromBuffer } = require("file-type");
const crypto = require("crypto");

module.exports = (bot) => {
  bot.command("qc", async (ctx) => {
    const isReply = ctx.message?.reply_to_message;
    const text = isReply ? (isReply.text || isReply.caption) : ctx.message.text?.split(" ").slice(1).join(" ");
    const name = isReply ? (isReply.from?.first_name || "Tanpa Nama") : (ctx.from.first_name || "Tanpa Nama");
    const username = isReply ? (isReply.from?.username || "bot") : (ctx.from.username || "bot");
    const ppuser = `https://t.me/i/userpic/320/${username}.jpg`;

    if (!text) {
      return ctx.reply("❌ Ga ada teks buat diquote.\nBisa reply atau ketik: /qc Halo!");
    }

    const colorFromUsername = (uname) => {
      const hash = crypto.createHash("md5").update(uname).digest("hex");
      return `#${hash.slice(0, 6)}`;
    };

    const obj = {
      type: "quote",
      format: "png",
      backgroundColor: "#1e1e1e", // hitam keabu-abuan
      width: 512,
      height: 768,
      scale: 2,
      messages: [{
        entities: [],
        avatar: true,
        from: {
          id: 1,
          name,
          photo: { url: ppuser },
          color: colorFromUsername(username)
        },
        text,
        textColor: "#FFFFFF",
        replyMessage: {}
      }]
    };

    try {
      const res = await axios.post("https://bot.lyo.su/quote/generate", obj, {
        headers: { "Content-Type": "application/json" }
      });

      const buffer = Buffer.from(res.data.result.image, "base64");
      const fileType = await fileTypeFromBuffer(buffer);
      if (!fileType || fileType.mime !== "image/png") {
        return ctx.reply("❌ Format gambar tidak valid.");
      }

      await ctx.replyWithSticker({ source: buffer });
    } catch (err) {
      console.error("❌ Gagal bikin stiker QC:", err.message);
      ctx.reply("❌ Gagal bikin stikernya bre.");
    }
  });
};