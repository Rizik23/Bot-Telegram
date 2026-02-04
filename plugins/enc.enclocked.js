const fs = require("fs-extra");
const path = require("path");
const fetch = require("node-fetch");
const JsConfuser = require("js-confuser");

const log = (message, error = null) => {
    const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
    const prefix = `\x1b[36m[ ELIKA Obf Bot ]\x1b[0m`;
    const timeStyle = `\x1b[33m[${timestamp}]\x1b[0m`;
    const msgStyle = `\x1b[32m${message}\x1b[0m`;
    console.log(`${prefix} ${timeStyle} ${msgStyle}`);
    if (error) {
        const errorStyle = `\x1b[31m✖ Error: ${error.message || error}\x1b[0m`;
        console.error(`${prefix} ${timeStyle} ${errorStyle}`);
        if (error.stack) console.error(`\x1b[90m${error.stack}\x1b[0m`);
    }
}; 

// Konstanta fungsi async untuk obfuscation Time-Locked Encryption
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
                    complexity: 4
                },
                dispatcher: true,
                globalConcealing: true,
                lock: {
                    selfDefending: true,
                    antiDebug: (code) => `if(typeof debugger!=='undefined'||process.env.NODE_ENV==='debug')throw new Error('Debugging disabled');${code}`,
                    integrity: true,
                    tamperProtection: (code) => `if(!((function(){return eval('1+1')===2;})()))throw new Error('Tamper detected');${code}`
                },
                duplicateLiteralsRemoval: true
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

// Progress bar
const createProgressBar = (percentage) => {
    const total = 10;
    const filled = Math.round((percentage / 100) * total);
    return "▰".repeat(filled) + "▱".repeat(total - filled);
};

// Update progress
async function updateProgress(ctx, message, percentage, status) {
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
            "PROSES ENCRYPT BY ELIKA",
            { parse_mode: "Markdown" }
        );
        await new Promise(resolve => setTimeout(resolve, Math.min(800, percentage * 8)));
    } catch (error) {
        log("Gagal memperbarui progres", error);
    }
}

module.exports = (bot) => {
// Command /enclocked untuk enkripsi dengan masa aktif dalam hari
bot.command("enclocked", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    if (args.length !== 1 || !/^\d+$/.test(args[0]) || parseInt(args[0]) < 1 || parseInt(args[0]) > 365) {
        return ctx.replyWithMarkdown("❌ *Error:* Gunakan format `/enclocked [1-365]` untuk jumlah hari (misal: `/enclocked 7`)!");
    }

    const days = args[0];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));
    const expiryFormatted = expiryDate.toLocaleDateString();

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
        return ctx.replyWithMarkdown("❌ *Error:* Balas file .js dengan `/enclocked [1-365]`!");
    }

    const file = ctx.message.reply_to_message.document;
    if (!file.file_name.endsWith(".js")) {
        return ctx.replyWithMarkdown("❌ *Error:* Hanya file .js yang didukung!");
    }

    const encryptedPath = path.join(__dirname, `locked-encrypted-${file.file_name}`);

    try {
        const progressMessage = await ctx.replyWithMarkdown(
            "```css\n" +
            "🔒 EncryptBot\n" +
            " ⚙️ Memulai (Time-Locked Encryption) (1%)\n" +
            " " + createProgressBar(1) + "\n" +
            "```\n" +
            "PROSES ENCRYPT BY ELIKA"
        );

        const fileLink = await ctx.telegram.getFileLink(file.file_id);
        log(`Mengunduh file untuk Time-Locked Encryption: ${file.file_name}`);
        await updateProgress(ctx, progressMessage, 10, "Mengunduh");
        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(ctx, progressMessage, 20, "Mengunduh Selesai");

        log(`Memvalidasi kode awal: ${file.file_name}`);
        await updateProgress(ctx, progressMessage, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }

        log(`Mengenkripsi file dengan Time-Locked Encryption`);
        await updateProgress(ctx, progressMessage, 40, "Inisialisasi Time-Locked Encryption");
        const obfuscatedCode = await obfuscateTimeLocked(fileContent, days);
        log(`Hasil obfuscation (50 char pertama): ${obfuscatedCode.substring(0, 50)}...`);
        log(`Ukuran file setelah obfuscation: ${Buffer.byteLength(obfuscatedCode, 'utf-8')} bytes`);

        log(`Memvalidasi hasil obfuscation: ${file.file_name}`);
        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            log(`Detail kode bermasalah: ${obfuscatedCode.substring(0, 100)}...`);
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(ctx, progressMessage, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        log(`Mengirim file terenkripsi time-locked: ${file.file_name}`);
        await ctx.replyWithMarkdown(
            `✅ *File terenkripsi (Time-Locked Encryption) siap!*\n` +
            `⏰ Masa aktif: ${days} hari (Kedaluwarsa: ${expiryFormatted})\n` +
            `_Powered by ELIKA_`,
            { parse_mode: "Markdown" }
        );
        await ctx.replyWithDocument(
            { source: encryptedPath, filename: `locked-encrypted-${file.file_name}` }
        );
        await updateProgress(ctx, progressMessage, 100, "Time-Locked Encryption Selesai");

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat Time-Locked obfuscation", error);
        await ctx.replyWithMarkdown(`❌ *Kesalahan:* ${error.message || "Tidak diketahui"}\n_Coba lagi dengan kode Javascript yang valid!_`);
        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});
};