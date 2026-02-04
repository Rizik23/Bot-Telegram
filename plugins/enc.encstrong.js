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

// Konfigurasi obfuscation untuk Strong style (diperbaiki berdasarkan dokumentasi)
const getStrongObfuscationConfig = () => {
    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: "randomized", // Valid: menghasilkan nama acak
        stringEncoding: true, // Valid: mengenkripsi string
        stringSplitting: true, // Valid: memecah string
        controlFlowFlattening: 0.75, // Valid: mengacak alur kontrol
        duplicateLiteralsRemoval: true, // Valid: menghapus literal duplikat
        calculator: true, // Valid: mengacak operasi matematika
        dispatcher: true, // Valid: mengacak eksekusi dengan dispatcher
        deadCode: true, // Valid: menambahkan kode mati
        opaquePredicates: true, // Valid: menambahkan predikat buram
        lock: {
            selfDefending: true, // Valid: mencegah modifikasi
            antiDebug: true, // Valid: mencegah debugging
            integrity: true, // Valid: memastikan integritas
            tamperProtection: true // Valid: perlindungan tamper
        }
    };
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
// Command /encstrong (Obfuscation baru dengan metode Strong)
bot.command("encstrong", async (ctx) => {

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
        return ctx.replyWithMarkdown("❌ *Error:* Balas file .js dengan `/encstrong`!");
    }

    const file = ctx.message.reply_to_message.document;
    if (!file.file_name.endsWith(".js")) {
        return ctx.replyWithMarkdown("❌ *Error:* Hanya file .js yang didukung!");
    }

    const encryptedPath = path.join(__dirname, `strong-encrypted-${file.file_name}`);

    try {
        const progressMessage = await ctx.replyWithMarkdown(
            "```css\n" +
            "🔒 EncryptBot\n" +
            ` ⚙️ Memulai (Hardened Strong) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n" +
            "PROSES ENCRYPT BY ELIKA"
        );

        const fileLink = await ctx.telegram.getFileLink(file.file_id);
        log(`Mengunduh file untuk Strong obfuscation: ${file.file_name}`);
        await updateProgress(ctx, progressMessage, 10, "Mengunduh");
        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(ctx, progressMessage, 20, "Mengunduh Selesai");

        log(`Memvalidasi kode awal: ${file.file_name}`);
        await updateProgress(ctx, progressMessage, 30, "Memvalidasi Kode");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode tidak valid: ${syntaxError.message}`);
        }

        log(`Mengenkripsi file dengan gaya Strong`);
        await updateProgress(ctx, progressMessage, 40, "Inisialisasi Hardened Strong Obfuscation");
        const obfuscated = await JsConfuser.obfuscate(fileContent, getStrongObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated; // Pastikan string
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        log(`Hasil obfuscation (50 char pertama): ${obfuscatedCode.substring(0, 50)}...`);
        await updateProgress(ctx, progressMessage, 60, "Transformasi Kode");

        log(`Memvalidasi hasil obfuscation: ${file.file_name}`);
        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(ctx, progressMessage, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        log(`Mengirim file terenkripsi gaya Strong: ${file.file_name}`);
        await ctx.replyWithDocument(
            { source: encryptedPath, filename: `strong-encrypted-${file.file_name}` },
            { caption: "✅ *File terenkripsi (Hardened Strong) siap!*\nSUKSES ENCRYPT BY ELIKA 🕊", parse_mode: "Markdown" }
        );
        await updateProgress(ctx, progressMessage, 100, "Hardened Strong Obfuscation Selesai");

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat Strong obfuscation", error);
        await ctx.replyWithMarkdown(`❌ *Kesalahan:* ${error.message || "Tidak diketahui"}\n_Coba lagi dengan kode Javascript yang valid!_`);
        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});
};