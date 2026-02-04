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


// Konfigurasi obfuscation untuk Big style (ukuran file besar)
const getBigObfuscationConfig = () => {
    const generateBigName = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const length = Math.floor(Math.random() * 5) + 5; // Nama 5-9 karakter
        let name = "";
        for (let i = 0; i < length; i++) {
            name += chars[Math.floor(Math.random() * chars.length)];
        }
        return name;
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateBigName(),
        stringEncoding: true,
        stringSplitting: true,
        controlFlowFlattening: 0.75, // Stabil dan kuat
        shuffle: true,
        duplicateLiteralsRemoval: true,
        deadCode: true,
        opaquePredicates: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
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
// Command /encbig <size_in_mb> (Obfuscation dengan ukuran besar)
bot.command("encbig", async (ctx) => {

    // Ambil target ukuran dari perintah
    const args = ctx.message.text.split(" ");
    if (args.length < 2 || !args[1] || isNaN(args[1])) {
        return ctx.replyWithMarkdown("❌ *Error:* Gunakan format `/encbig <size_in_mb>` dengan ukuran dalam MB (angka)!");
    }
    const targetSizeMB = Math.max(1, parseInt(args[1], 10)); // Minimal 1 MB

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
        return ctx.replyWithMarkdown("❌ *Error:* Balas file .js dengan `/encbig <size_in_mb>`!");
    }

    const file = ctx.message.reply_to_message.document;
    if (!file.file_name.endsWith(".js")) {
        return ctx.replyWithMarkdown("❌ *Error:* Hanya file .js yang didukung!");
    }

    const encryptedPath = path.join(__dirname, `big-encrypted-${file.file_name}`);

    try {
        const progressMessage = await ctx.replyWithMarkdown(
            "```css\n" +
            "🔒 EncryptBot\n" +
            ` ⚙️ Memulai (Hardened Big: ${targetSizeMB}MB) (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n" +
            "PROSES ENCRYPT BY ELIKA"
        );

        const fileLink = await ctx.telegram.getFileLink(file.file_id);
        log(`Mengunduh file untuk Big obfuscation: ${file.file_name}`);
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

        log(`Mengenkripsi file dengan gaya Big`);
        await updateProgress(ctx, progressMessage, 40, "Inisialisasi Hardened Big Obfuscation");
        const obfuscated = await JsConfuser.obfuscate(fileContent, getBigObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated; // Pastikan string
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        log(`Hasil obfuscation (50 char pertama): ${obfuscatedCode.substring(0, 50)}...`);
        await updateProgress(ctx, progressMessage, 60, "Transformasi Kode");

        // Tambahkan padding secara manual untuk meningkatkan ukuran
        const currentSizeBytes = Buffer.byteLength(obfuscatedCode, "utf8");
        const targetSizeBytes = targetSizeMB * 1024 * 1024; // Konversi MB ke bytes
        if (currentSizeBytes < targetSizeBytes) {
            const paddingSize = targetSizeBytes - currentSizeBytes;
            const padding = crypto.randomBytes(paddingSize).toString("base64");
            obfuscatedCode += `\n/* Binary Padding (${paddingSize} bytes) */\n// ${padding}`;
            log(`Padding ditambahkan: ${paddingSize} bytes`);
        }

        log(`Memvalidasi hasil obfuscation dengan padding: ${file.file_name}`);
        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid setelah padding: ${postObfuscationError.message}`);
        }

        await updateProgress(ctx, progressMessage, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, obfuscatedCode);

        log(`Mengirim file terenkripsi gaya Big: ${file.file_name}`);
        await ctx.replyWithDocument(
            { source: encryptedPath, filename: `big-encrypted-${file.file_name}` },
            { caption: `✅ *File terenkripsi (Hardened Big: ${targetSizeMB}MB) siap!*\nSUKSES ENCRYPT BY ELIKA 🕊`, parse_mode: "Markdown" }
        );
        await updateProgress(ctx, progressMessage, 100, `Hardened Big (${targetSizeMB}MB) Obfuscation Selesai`);

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat Big obfuscation", error);
        await ctx.replyWithMarkdown(`❌ *Kesalahan:* ${error.message || "Tidak diketahui"}\n_Coba lagi dengan kode Javascript yang valid!_`);
        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});
};