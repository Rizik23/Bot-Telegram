const fs = require("fs-extra");
const path = require("path");
const fetch = require("node-fetch");
const JsConfuser = require("js-confuser");

const createProgressBar = (percentage) => {
  const total = 10;
  const filled = Math.round((percentage / 100) * total);
  return "▰".repeat(filled) + "▱".repeat(total - filled);
};

const updateProgress = async (ctx, message, percentage, status) => {
  const bar = createProgressBar(percentage);
  const levelText = percentage === 100 ? "✅ Selesai" : `⚙️ ${status}`;
  try {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      message.message_id,
      null,
      "```css\n" +
        "🔒 EncryptBot\n" +
        ` ${levelText} (${percentage}%)\n` +
        ` ${bar}\n` +
        "```\n" +
        "PROSES ENCRYPT",
      { parse_mode: "Markdown" }
    );
    // Delay supaya progres terlihat smooth (maks 800ms)
    await new Promise((res) => setTimeout(res, Math.min(800, percentage * 8)));
  } catch (error) {
    console.error("Gagal update progress:", error.message);
  }
};

const obfuscateTimeLocked = async (fileContent, days) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(days));
  const expiryTimestamp = expiryDate.getTime();
  try {
    const obfuscated = await JsConfuser.obfuscate(
      `(function(){const expiry=${expiryTimestamp};if(new Date().getTime()>expiry){throw new Error('Script has expired after ${days} days');}${fileContent}})();`,
      {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: "randomized",
        stringCompression: true,
        stringConcealing: true,
        stringEncoding: true,
        controlFlowFlattening: 0.75,
        flatten: true,
        shuffle: true,
        rgf: false,
        opaquePredicates: {
          count: 6,
          complexity: 4,
        },
        dispatcher: true,
        globalConcealing: true,
        lock: {
          selfDefending: true,
          antiDebug: (code) =>
            `if(typeof debugger!=='undefined'||process.env.NODE_ENV==='debug')throw new Error('Debugging disabled');${code}`,
          integrity: true,
          tamperProtection: (code) =>
            `if(!((function(){return eval('1+1')===2;})()))throw new Error('Tamper detected');${code}`,
        },
        duplicateLiteralsRemoval: true,
      }
    );
    let obfuscatedCode = obfuscated.code || obfuscated;
    if (typeof obfuscatedCode !== "string") {
      throw new Error("Hasil obfuscation bukan string");
    }
    return obfuscatedCode;
  } catch (error) {
    throw new Error(`Gagal obfuscate: ${error.message}`);
  }
};

module.exports = (bot) => {
  bot.command("encexpired", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    if (
      args.length !== 1 ||
      !/^\d+$/.test(args[0]) ||
      parseInt(args[0]) < 1 ||
      parseInt(args[0]) > 365
    ) {
      return ctx.replyWithMarkdown(
        "❌ *Error:* Gunakan format `/encexpired [1-365]` untuk jumlah hari masa berlaku (misal: `/encexpired 7`)!"
      );
    }

    const days = args[0];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));
    const expiryFormatted = expiryDate.toLocaleDateString();

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
      return ctx.replyWithMarkdown(
        "❌ *Error:* Balas file .js dengan perintah `/encexpired [1-365]`!"
      );
    }

    const file = ctx.message.reply_to_message.document;
    if (!file.file_name.endsWith(".js")) {
      return ctx.replyWithMarkdown("❌ *Error:* Hanya file .js yang didukung!");
    }

    const encryptedPath = path.join(
      __dirname,
      `locked-encrypted-${file.file_name}`
    );

    try {
      const progressMessage = await ctx.replyWithMarkdown(
        "```css\n" +
          "🔒 EncryptBot\n" +
          " ⚙️ Memulai (Time-Locked Encryption) (1%)\n" +
          ` ${createProgressBar(1)}\n` +
          "```\n" +
          "PROSES ENCRYPT"
      );

      const fileLink = await ctx.telegram.getFileLink(file.file_id);
      await updateProgress(ctx, progressMessage, 10, "Mengunduh File");

      const response = await fetch(fileLink.href);
      const fileContent = await response.text();
      await updateProgress(ctx, progressMessage, 20, "Mengunduh Selesai");

      await updateProgress(ctx, progressMessage, 30, "Validasi Kode Awal");
      try {
        new Function(fileContent);
      } catch (syntaxError) {
        throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
      }

      await updateProgress(ctx, progressMessage, 40, "Proses Obfuscate");
      const obfuscatedCode = await obfuscateTimeLocked(fileContent, days);

      await updateProgress(ctx, progressMessage, 60, "Validasi Hasil Obfuscate");
      try {
        new Function(obfuscatedCode);
      } catch (postObfuscationError) {
        throw new Error(
          `Hasil obfuscation tidak valid: ${postObfuscationError.message}`
        );
      }

      await fs.writeFile(encryptedPath, obfuscatedCode);
      await updateProgress(ctx, progressMessage, 80, "Finalisasi File");

      await ctx.replyWithMarkdown(
        `✅ *File terenkripsi (Time-Locked Encryption) siap!*\n` +
          `⏰ Masa aktif: ${days} hari (Kedaluwarsa: ${expiryFormatted})\n` +
          `_Powered by XHINN_`
      );
      await ctx.replyWithDocument({
        source: encryptedPath,
        filename: `locked-encrypted-${file.file_name}`,
      });

      await updateProgress(ctx, progressMessage, 100, "Selesai");

      if (await fs.pathExists(encryptedPath)) {
        await fs.unlink(encryptedPath);
      }
    } catch (error) {
      console.error("Kesalahan saat enkripsi time-locked:", error);
      await ctx.replyWithMarkdown(
        `❌ *Kesalahan:* ${error.message || "Terjadi kesalahan"}\n_Coba lagi dengan kode Javascript yang valid!_`
      );
      if (await fs.pathExists(encryptedPath)) {
        await fs.unlink(encryptedPath);
      }
    }
  });
};
