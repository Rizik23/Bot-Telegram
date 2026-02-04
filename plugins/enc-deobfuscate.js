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

// Command /enceval
module.exports = (bot) => {
// Command /deobfuscate (diperbaiki untuk menangani Promise dan validasi)
bot.command("deobfuscate", async (ctx) => {

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
        return ctx.replyWithMarkdown("❌ *Error:* Balas file .js yang diobfuscate dengan `/deobfuscate`!");
    }

    const file = ctx.message.reply_to_message.document;
    if (!file.file_name.endsWith(".js")) {
        return ctx.replyWithMarkdown("❌ *Error:* Hanya file .js yang didukung!");
    }

    const deobfuscatedPath = path.join(__dirname, `deobfuscated-${file.file_name}`);

    try {
        const progressMessage = await ctx.replyWithMarkdown(
            "```css\n" +
            "🔒 EncryptBot\n" +
            ` ⚙️ Memulai Deobfuscation (1%)\n` +
            ` ${createProgressBar(1)}\n` +
            "```\n" +
            "PROSES DECRYPT BY ELIKA"
        );

        // Mengunduh file
        const fileLink = await ctx.telegram.getFileLink(file.file_id);
        log(`Mengunduh file untuk deobfuscation: ${file.file_name}`);
        await updateProgress(ctx, progressMessage, 10, "Mengunduh");
        const response = await fetch(fileLink);
        let fileContent = await response.text();
        await updateProgress(ctx, progressMessage, 20, "Mengunduh Selesai");

        // Validasi kode awal
        log(`Memvalidasi kode awal: ${file.file_name}`);
        await updateProgress(ctx, progressMessage, 30, "Memvalidasi Kode Awal");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }

        // Proses deobfuscation dengan webcrack
        log(`Memulai deobfuscation dengan webcrack: ${file.file_name}`);
        await updateProgress(ctx, progressMessage, 40, "Memulai Deobfuscation");
        const result = await webcrack(fileContent); // Pastikan await digunakan
        let deobfuscatedCode = result.code;

        // Penanganan jika kode dibundel
        let bundleInfo = "";
        if (result.bundle) {
            bundleInfo = "// Detected as bundled code (e.g., Webpack/Browserify)\n";
            log(`Kode terdeteksi sebagai bundel: ${file.file_name}`);
        }

        // Jika tidak ada perubahan signifikan atau hasil bukan string
        if (!deobfuscatedCode || typeof deobfuscatedCode !== "string" || deobfuscatedCode.trim() === fileContent.trim()) {
            log(`Webcrack tidak dapat mendekode lebih lanjut atau hasil bukan string: ${file.file_name}`);
            deobfuscatedCode = `${bundleInfo}// Webcrack tidak dapat mendekode sepenuhnya atau hasil invalid\n${fileContent}`;
        }

        // Validasi kode hasil
        log(`Memvalidasi kode hasil deobfuscation: ${file.file_name}`);
        await updateProgress(ctx, progressMessage, 60, "Memvalidasi Kode Hasil");
        let isValid = true;
        try {
            new Function(deobfuscatedCode);
            log(`Kode hasil valid: ${deobfuscatedCode.substring(0, 50)}...`);
        } catch (syntaxError) {
            log(`Kode hasil tidak valid: ${syntaxError.message}`);
            deobfuscatedCode = `${bundleInfo}// Kesalahan validasi: ${syntaxError.message}\n${deobfuscatedCode}`;
            isValid = false;
        }

        // Simpan hasil
        await updateProgress(ctx, progressMessage, 80, "Menyimpan Hasil");
        await fs.writeFile(deobfuscatedPath, deobfuscatedCode);

        // Kirim hasil
        log(`Mengirim file hasil deobfuscation: ${file.file_name}`);
        await ctx.replyWithDocument(
            { source: deobfuscatedPath, filename: `deobfuscated-${file.file_name}` },
            { caption: `✅ *File berhasil dideobfuscate!${isValid ? "" : " (Perhatikan pesan error dalam file)"}*\nSUKSES ENCRYPT BY ELIKA 🕊`, parse_mode: "Markdown" }
        );
        await updateProgress(ctx, progressMessage, 100, "Deobfuscation Selesai");

        // Hapus file sementara
        if (await fs.pathExists(deobfuscatedPath)) {
            await fs.unlink(deobfuscatedPath);
            log(`File sementara dihapus: ${deobfuscatedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat deobfuscation", error);
        await ctx.replyWithMarkdown(`❌ *Kesalahan:* ${error.message || "Tidak diketahui"}\n_Coba lagi dengan file Javascript yang valid!_`);
        if (await fs.pathExists(deobfuscatedPath)) {
            await fs.unlink(deobfuscatedPath);
            log(`File sementara dihapus setelah error: ${deobfuscatedPath}`);
        }
    }
});
};