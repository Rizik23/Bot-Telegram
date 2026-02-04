const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { fileTypeFromBuffer } = require("file-type");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const papttPath = path.join(__dirname, "../media/randompics/paptt.json");
const premiumPath = path.join(__dirname, "../premium.json");

function loadPaptt() {
  try {
    const data = fs.readFileSync(papttPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function savePaptt(url) {
  const list = loadPaptt();
  list.push(url);
  fs.writeFileSync(papttPath, JSON.stringify(list, null, 2));
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function isUserPremium(userId) {
  try {
    const data = JSON.parse(fs.readFileSync(premiumPath, "utf-8"));
    const expiry = data[userId];
    if (!expiry) return false;
    return new Date(expiry) > new Date();
  } catch {
    return false;
  }
}

async function cloudkuUpload(buffer) {
  const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {
    ext: "bin",
    mime: "application/octet-stream",
  };
  const form = new FormData();
  form.append("file", buffer, { filename: `file.${ext}`, contentType: mime });

  const res = await fetch("https://cloudkuimages.guru/upload.php", {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("❌ Cloudku: gagal upload");
  const json = await res.json();
  if (json.status !== "success" || !json.result?.url)
    throw new Error("❌ Cloudku: respons tidak valid");
  return json.result.url;
}

async function catboxUpload(buffer) {
  const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {
    ext: "bin",
    mime: "application/octet-stream",
  };
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", buffer, {
    filename: `file.${ext}`,
    contentType: mime,
  });

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("❌ Catbox: gagal upload");
  return await res.text();
}

module.exports = (bot) => {
  // /paptt
  bot.command("paptt2", async (ctx) => {
    const userId = String(ctx.from.id);
    if (!isUserPremium(userId)) {
      return ctx.reply("❌ Fitur ini hanya untuk user *Premium*.\nBeli akses di @VellzXyrine ya.");
    }

    const list = loadPaptt();
    if (list.length === 0) return ctx.reply("📭 Belum ada paptt yang tersedia.");

    const url = pickRandom(list);
    const isVideo = url.endsWith(".mp4");

    try {
      if (isVideo) {
        await ctx.replyWithVideo({ url }, { caption: "Jangan samge ya bwang🙄" });
      } else {
        await ctx.replyWithPhoto({ url }, { caption: "Jangan samge ya bwang🙄" });
      }
    } catch (e) {
      console.error("❌ Gagal kirim paptt:", e.message);
      ctx.reply("❌ Gagal kirim paptt.");
    }
  });

  // /uploadtt
  bot.command("uploadtt", async (ctx) => {
    const userId = String(ctx.from.id);
    if (!isUserPremium(userId)) {
      return ctx.reply("❌ Fitur ini hanya untuk user *Premium*.");
    }

    const mediaMsg = ctx.message.reply_to_message || ctx.message;
    let fileId;

    if (mediaMsg.photo) {
      fileId = mediaMsg.photo.pop().file_id;
    } else if (mediaMsg.video) {
      fileId = mediaMsg.video.file_id;
    } else {
      return ctx.reply("❌ Balas foto atau video untuk di-upload.");
    }

    try {
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const res = await fetch(fileLink.href);
      if (!res.ok) throw new Error("Gagal download file dari Telegram.");
      const buffer = await res.buffer();

      const url = await cloudkuUpload(buffer).catch(() => null)
               || await catboxUpload(buffer).catch(() => null);

      if (!url) return ctx.reply("❌ Upload gagal ke semua server.");

      savePaptt(url);
      return ctx.reply(`✅ Upload sukses dan ditambahkan ke paptt!\n\n🌐 ${url}`, {
        disable_web_page_preview: true,
      });
    } catch (e) {
      return ctx.reply("❌ Error: " + e.message);
    }
  });
};


 