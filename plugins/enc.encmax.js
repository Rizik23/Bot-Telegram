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

// Konfigurasi obfuscation untuk Max style dengan intensitas yang dapat diatur
const getMaxObfuscationConfig = (intensity) => {
    const generateMaxName = () => {
        // Nama variabel unik: prefiks "mX" + kombinasi acak
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const length = Math.floor(Math.random() * 4) + 4; // 4-7 karakter
        let name = "mX";
        for (let i = 0; i < length; i++) {
            name += chars[Math.floor(Math.random() * chars.length)];
        }
        return name;
    };

    // Skala intensitas dari 1-10 ke 0.1-1.0 untuk controlFlowFlattening
    const flatteningLevel = intensity / 10;

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateMaxName(),
        stringCompression: true, // Kompresi string
        stringConcealing: true, // Menyembunyikan string
        stringEncoding: true, // Enkripsi string
        stringSplitting: true, // Memecah string
        controlFlowFlattening: flatteningLevel, // Intensitas berdasarkan input (0.1-1.0)
        flatten: true, // Meratakan struktur kontrol
        shuffle: true, // Mengacak urutan
        rgf: true, // Randomized Global Functions
        calculator: true, // Mengacak operasi matematika
        deadCode: true,
        opaquePredicates: true,
        dispatcher: true, // Mengacak eksekusi
        globalConcealing: true, // Menyembunyikan variabel global
        objectExtraction: true, // Mengekstrak objek untuk kebingungan
        duplicateLiteralsRemoval: false, // Menjaga redundansi
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
// Command /encmax <intensity> (Obfuscation dengan metode Max dan intensitas yang dapat diatur)
bot.command("encmax", async (ctx) => {

    // Ambil intensitas dari perintah
    const args = ctx.message.text.split(" ");
    if (args.length < 2 || !args[1] || isNaN(args[1])) {
        return ctx.replyWithMarkdown("❌ *Error:* Gunakan format `/encmax <intensity>` dengan intensitas (1-10)!");
    }
    const intensity = Math.min(Math.max(1, parseInt(args[1], 10)), 10); // Batas 1-10

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
        return ctx.replyWithMarkdown("❌ *Error:* Balas file .js dengan `/encmax <intensity>`!");
    }

    const file = ctx.message.reply_to_message.document;
    if (!file.file_name.endsWith(".js")) {
        return ctx.replyWithMarkdown("❌ *Error:* Hanya file .js yang didukung!");
    }

    const encryptedPath = path.join(__dirname, `max-encrypted-${file.file_name}`);

    try {
        const progressMessage = await ctx.replyWithMarkdown(
            "```css\n" +
            "🔒 EncryptBot\n" +
            ` ⚙️ Memulai (Hardened Max Intensity ${intensity}) (1%)\n` +
            " " + createProgressBar(1) + "\n" +
            "```\n" +
            "PROSES ENCRYPT BY ELIKA"
        );

        const fileLink = await ctx.telegram.getFileLink(file.file_id);
        log(`Mengunduh file untuk Max obfuscation: ${file.file_name}`);
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

        log(`Mengenkripsi file dengan gaya Max (Intensity ${intensity})`);
        await updateProgress(ctx, progressMessage, 40, "Inisialisasi Hardened Max Obfuscation");
        const obfuscated = await JsConfuser.obfuscate(fileContent, getMaxObfuscationConfig(intensity));
        let obfuscatedCode = obfuscated.code || obfuscated;
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

        log(`Mengirim file terenkripsi gaya Max: ${file.file_name}`);
        await ctx.replyWithDocument(
            { source: encryptedPath, filename: `max-encrypted-${file.file_name}` },
            { caption: `✅ *File terenkripsi (Hardened Max, Intensity ${intensity})*\nSUKSES ENCRYPT BY ELIKA 🕊`, parse_mode: "Markdown" }
        );
        await updateProgress(ctx, progressMessage, 100, `Hardened Max (Intensity ${intensity}) Obfuscation Selesai`);

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat Max obfuscation", error);
        await ctx.replyWithMarkdown(`❌ *Kesalahan:* ${error.message || "Tidak diketahui"}\n_Coba lagi dengan kode Javascript yang valid!_`);
        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});
};