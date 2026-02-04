const fs = require("fs-extra");
const path = require("path");
const fetch = require("node-fetch");
const JsConfuser = require("js-confuser");
const { webcrack } = require("webcrack");

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

// Konfigurasi obfuscation standar (diperkuat dan aman)
const getObfuscationConfig = (level = "high") => ({
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: "mangled",
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: level === "high" ? 0.95 : level === "medium" ? 0.75 : 0.5,
    shuffle: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
        selfDefending: true,
        antiDebug: true,
        integrity: true,
        tamperProtection: true
    }
});

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
// Command /enceval (diperkuat dengan pemeriksaan channel)
bot.command("enceval", async (ctx) => {

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
        return ctx.replyWithMarkdown("❌ *Error:* Balas file .js dengan `/enceval [level]`!");
    }

    const file = ctx.message.reply_to_message.document;
    if (!file.file_name.endsWith(".js")) {
        return ctx.replyWithMarkdown("❌ *Error:* Hanya file .js yang didukung!");
    }

    const args = ctx.message.text.split(" ");
    const encryptionLevel = ["low", "medium", "high"].includes(args[1]) ? args[1] : "high";
    const encryptedPath = path.join(__dirname, `eval-encrypted-${file.file_name}`);

    try {
        const progressMessage = await ctx.replyWithMarkdown(
            "```css\n" +
            "🔒 EncryptBot\n" +
            ` ⚙️ Memulai Evaluasi (${encryptionLevel}) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n" +
            "PROSES ENCRYPT BY ELIKA"
        );

        const fileLink = await ctx.telegram.getFileLink(file.file_id);
        log(`Mengunduh file untuk evaluasi: ${file.file_name}`);
        await updateProgress(ctx, progressMessage, 10, "Mengunduh");
        const response = await fetch(fileLink);
        const fileContent = await response.text();
        await updateProgress(ctx, progressMessage, 20, "Mengunduh Selesai");

        let evalResult;
        try {
            await updateProgress(ctx, progressMessage, 30, "Mengevaluasi Kode Asli");
            evalResult = eval(fileContent);
            if (typeof evalResult === "function") {
                evalResult = "Function detected (cannot display full output)";
            } else if (evalResult === undefined) {
                evalResult = "No return value";
            }
        } catch (evalError) {
            evalResult = `Evaluation error: ${evalError.message}`;
        }

        log(`Memvalidasi kode: ${file.file_name}`);
        await updateProgress(ctx, progressMessage, 40, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        log(`Mengenkripsi dan mengevaluasi file dengan level: ${encryptionLevel}`);
        await updateProgress(ctx, progressMessage, 50, "Inisialisasi Hardened Enkripsi");
        const obfuscated = await JsConfuser.obfuscate(fileContent, getObfuscationConfig(encryptionLevel));
        await updateProgress(ctx, progressMessage, 70, "Transformasi Kode");
        await fs.writeFile(encryptedPath, obfuscated.code);
        await updateProgress(ctx, progressMessage, 90, "Finalisasi Enkripsi");

        log(`Memvalidasi hasil obfuscation: ${file.file_name}`);
        try {
            new Function(obfuscated.code);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        log(`Mengirim file terenkripsi dan hasil evaluasi: ${file.file_name}`);
        await ctx.replyWithMarkdown(
            "```css\n" +
            "🔒 EncryptBot - Evaluation Result\n" +
            "```\n" +
            `✨ *Original Code Result:* \n\`\`\`javascript\n${evalResult}\n\`\`\`\n` +
            `_Level: ${encryptionLevel} | Powered by ELIKA`
        );
        await ctx.replyWithDocument(
            { source: encryptedPath, filename: `eval-encrypted-${file.file_name}` },
            { caption: "✅ *File terenkripsi siap!*\n_SUKSES ENCRYPT BY ELIKA 🕊", parse_mode: "Markdown" }
        );
        await updateProgress(ctx, progressMessage, 100, `Evaluasi & Enkripsi (${encryptionLevel})`);

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat mengenkripsi/evaluasi", error);
        await ctx.replyWithMarkdown(`❌ *Kesalahan:* ${error.message || "Tidak diketahui"}\n_Coba lagi dengan kode Javascript yang valid!_`);
        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});
};