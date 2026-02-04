const axios = require("axios");
const fetch = require("node-fetch");
const { fileTypeFromBuffer } = require("file-type");

module.exports = (bot) => {
  bot.command("qc2", async (ctx) => {
    const message = ctx.message;
    const args = message.text?.split(" ").slice(1);
    const textInput = args.join(" ");
    const replyMsg = message.reply_to_message;
    const warna = ["#000000", "#ff2414", "#22b4f2", "#eb13f2"];
    const bg = warna[Math.floor(Math.random() * warna.length)];

    // Ambil teks & info pengirim
    const isReply = !!replyMsg;
    const name = isReply
      ? replyMsg.from.first_name || "Tanpa Nama"
      : message.from.first_name || "Tanpa Nama";
    const username = isReply
      ? replyMsg.from.username || "bot"
      : message.from.username || "bot";
    const text = isReply
      ? replyMsg.text || replyMsg.caption || ""
      : textInput;

    if (!text) return ctx.reply("❌ Masukin teksnya bre.\nContoh: /qc2 halo (atau reply pesan)");

    const ppuser = `https://t.me/i/userpic/320/${username}.jpg`;

    const obj = {
      type: "quote",
      format: "png",
      backgroundColor: bg,
      width: 512,
      height: 768,
      scale: 2,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name,
            photo: { url: ppuser },
          },
          text,
          replyMessage: {},
        },
      ],
    };

    try {
      const res = await axios.post("https://bot.lyo.su/quote/generate", obj, {
        headers: { "Content-Type": "application/json" },
      });

      const buffer = Buffer.from(res.data.result.image, "base64");
      const fileType = await fileTypeFromBuffer(buffer);
      if (!fileType || fileType.mime !== "image/png") {
        return ctx.reply("❌ Format gambar tidak valid.");
      }

      await ctx.replyWithSticker({ source: buffer });
    } catch (err) {
      console.error("❌ Gagal kirim stiker brat:", err.message);
      ctx.reply("❌ Gagal bikin stikernya bre.");
    }
  });
};