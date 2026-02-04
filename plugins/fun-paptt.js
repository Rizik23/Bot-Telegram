// plugins/paptt.js
const fs = require("fs");

const path = require("path");
const paptt = [
  "https://telegra.ph/file/5c62d66881100db561c9f.mp4",
  "https://telegra.ph/file/a5730f376956d82f9689c.jpg",
  "https://telegra.ph/file/8fb304f891b9827fa88a5.jpg",
    "https://telegra.ph/file/0c8d173a9cb44fe54f3d3.mp4",

"https://telegra.ph/file/b58a5b8177521565c503b.mp4",

"https://telegra.ph/file/34d9348cd0b420eca47e5.jpg",

"https://telegra.ph/file/73c0fecd276c19560133e.jpg",

"https://telegra.ph/file/af029472c3fcf859fd281.jpg",

"https://telegra.ph/file/0e5be819fa70516f63766.jpg",

"https://telegra.ph/file/29146a2c1a9836c01f5a3.jpg",

"https://telegra.ph/file/85883c0024081ffb551b8.jpg",

"https://telegra.ph/file/d8b79ac5e98796efd9d7d.jpg",

"https://telegra.ph/file/267744a1a8c897b1636b9.jpg",

];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function isUserPremium(userId) {

  try {

    const filePath = path.join(__dirname, "../premium.json");

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const expiry = data[userId];

    if (!expiry) return false;

    return new Date(expiry) > new Date(); // true jika belum expired

  } catch (err) {

    console.error("Gagal cek premium:", err.message);

    return false;

  }

}

module.exports = (bot) => {
  bot.command("paptt", async (ctx) => {
    const userId = String(ctx.from.id);
    if (!isUserPremium(userId)) {

      return ctx.reply("❌ Fitur ini hanya untuk user *Premium*.\nBeli Akses Prem Ke @VellzXyrine dulu yaa.");

    }
    const url = pickRandom(paptt);
    const isVideo = url.endsWith(".mp4");

    try {
      if (isVideo) {
        await ctx.replyWithVideo({ url }, { caption: "Jangan samge ya bwang🙄" });
      } else {
        await ctx.replyWithPhoto({ url }, { caption: "Jangan samge ya bwang🙄" });
      }
    } catch (err) {
      console.error("❌ Error kirim paptt:", err.message);
      ctx.reply("❌ Gagal mengirim paptt.");
    }
  });
};