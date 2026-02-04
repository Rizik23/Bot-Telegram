const { Composer } = require("telegraf");
const fs = require("fs");
const path = require("path");
const config = require("../config"); // pastikan ada OWNER_ID di config.js

const filePath = path.join(__dirname, "../lib/list.json");

module.exports = (bot) => {
  const composer = new Composer();
  let list = [];

  // Load list.json saat start
  function loadList() {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]");
    list = JSON.parse(fs.readFileSync(filePath));
  }

  loadList();

  // 🔧 Command: /addrespon
  composer.command("addrespon", async (ctx) => {
    if (!config.OWNER_ID.includes(ctx.from.id)) return;

    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text.includes("|")) return ctx.reply("⚠️ Format salah. Contoh:\n`/addrespon halo|hai juga`", { parse_mode: "Markdown" });

    const [cmd, respon] = text.split("|").map(a => a.trim().toLowerCase());
    if (!cmd || !respon) return ctx.reply("❌ Format tidak valid.");

    if (list.find(e => e.cmd === cmd)) {
      return ctx.reply("❌ Respon untuk perintah itu sudah ada.");
    }

    list.push({ cmd, respon });
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
    ctx.reply(`✅ Respon otomatis untuk *${cmd}* berhasil ditambahkan.`, { parse_mode: "Markdown" });
  });

  // 🧹 Command: /delrespon
  composer.command("delrespon", async (ctx) => {
    if (!config.OWNER_ID.includes(ctx.from.id)) return;

    const cmd = ctx.message.text.split(" ")[1]?.toLowerCase();
    if (!cmd) return ctx.reply("⚠️ Masukkan perintah yang ingin dihapus. Contoh:\n`/delrespon halo`", { parse_mode: "Markdown" });

    const index = list.findIndex(e => e.cmd === cmd);
    if (index === -1) return ctx.reply("❌ Respon tidak ditemukan.");

    list.splice(index, 1);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
    ctx.reply(`✅ Respon untuk *${cmd}* berhasil dihapus.`, { parse_mode: "Markdown" });
  });

  // 📃 Command: /listrespon
  composer.command("listrespon", async (ctx) => {
    if (!config.OWNER_ID.includes(ctx.from.id)) return;

    if (!list.length) return ctx.reply("📭 Tidak ada respon otomatis yang tersimpan.");

    const daftar = list.map((e, i) => `${i + 1}. *${e.cmd}* => \`${e.respon}\``).join("\n");
    ctx.reply(`📋 *List Respon Otomatis:*\n\n${daftar}`, { parse_mode: "Markdown" });
  });

  // 🔁 Auto-reply listener
  bot.on("text", async (ctx, next) => {
    const text = ctx.message.text?.toLowerCase();
    if (!text) return next(); // lanjut ke handler lain kalau kosong

    const found = list.find((e) => e.cmd === text);
    if (found) {
      await ctx.reply(found.respon);
      return; // jika ketemu, balas dan berhenti
    }

    return next(); // kalau tidak ada di list, lanjut ke plugin lain
  });

  bot.use(composer.middleware());
};