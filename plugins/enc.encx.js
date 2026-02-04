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

// Fungsi decode invisible yang efisien
function decodeInvisible(encodedText) {
    try {
        if (!encodedText.startsWith('\u200B')) return encodedText; // Fallback jika tidak ada penanda
        const base64Text = encodedText.slice(1); // Hapus penanda invisible
        return Buffer.from(base64Text, 'base64').toString('utf-8');
    } catch (e) {
        log("Gagal decode invisible", e);
        return encodedText; // Fallback ke teks asli
    }
}

// Konfigurasi obfuscation untuk X style
const getXObfuscationConfig = () => {
    const generateXName = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return "xZ" + crypto.randomUUID().slice(0, 4); // Nama pendek dan unik
    };

    return {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: () => generateXName(),
        stringCompression: true,
        stringConcealing: true,
        stringEncoding: true,
        stringSplitting: false,
        controlFlowFlattening: 0.5, // Stabil dan aman
        flatten: true,
        shuffle: true,
        rgf: true,
        deadCode: false, // Nonaktif untuk ukuran kecil
        opaquePredicates: true,
        dispatcher: true,
        globalConcealing: true,
        objectExtraction: true,
        duplicateLiteralsRemoval: true,
        lock: {
            selfDefending: true,
            antiDebug: true,
            integrity: true,
            tamperProtection: true
        }
    };
};

// Fungsi invisible encoding yang efisien dan kecil
function encodeInvisible(text) {
    try {
        // Kompresi kode dengan menghapus spasi berlebih
        const compressedText = text.replace(/\s+/g, ' ').trim();
        // Gunakan base64 untuk efisiensi
        const base64Text = Buffer.from(compressedText).toString('base64');
        // Tambahkan penanda invisible di awal
        return '\u200B' + base64Text; // Hanya penanda awal untuk invisibility minimal
    } catch (e) {
        log("Gagal encode invisible", e);
        return Buffer.from(text).toString('base64'); // Fallback ke base64
    }
}

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
// Command /encx
bot.command("encx", async (ctx) => {

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
        return ctx.replyWithMarkdown("❌ *Error:* Balas file .js dengan `/encx`!");
    }

    const file = ctx.message.reply_to_message.document;
    if (!file.file_name.endsWith(".js")) {
        return ctx.replyWithMarkdown("❌ *Error:* Hanya file .js yang didukung!");
    }

    const encryptedPath = path.join(__dirname, `x-encrypted-${file.file_name}`);

    try {
        const progressMessage = await ctx.replyWithMarkdown(
            "```css\n" +
            "🔒 EncryptBot\n" +
            " ⚙️ Memulai (Hardened X Invisible) (1%)\n" +
            " " + createProgressBar(1) + "\n" +
            "```\n" +
            "PROSES ENCRYPT BY ELIKA"
        );

        const fileLink = await ctx.telegram.getFileLink(file.file_id);
        log(`Mengunduh file untuk X obfuscation: ${file.file_name}`);
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

        log(`Mengenkripsi file dengan gaya X`);
        await updateProgress(ctx, progressMessage, 40, "Inisialisasi Hardened X Obfuscation");
        const obfuscated = await JsConfuser.obfuscate(fileContent, getXObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        log(`Hasil obfuscation sebelum encoding (50 char pertama): ${obfuscatedCode.substring(0, 50)}...`);

        // Tambahkan lapisan invisible encoding
        const encodedInvisible = encodeInvisible(obfuscatedCode);
        const finalCode = `
        (function(){
            function decodeInvisible(encodedText) {
                if (!encodedText.startsWith('\u200B')) return encodedText;
                try {
                    return Buffer.from(encodedText.slice(1), 'base64').toString('utf-8');
                } catch (e) {
                    return encodedText;
                }
            }
            try {
                const hiddenCode = "${encodedInvisible}";
                const decodedCode = decodeInvisible(hiddenCode);
                if (!decodedCode || decodedCode === hiddenCode) throw new Error("Decoding failed");
                eval(decodedCode);
            } catch (e) {
                console.error("Execution error:", e);
            }
        })();
        `;
        log(`Hasil obfuscation dengan invisible encoding (50 char pertama): ${finalCode.substring(0, 50)}...`);
        await updateProgress(ctx, progressMessage, 60, "Transformasi Kode");

        log(`Memvalidasi hasil obfuscation: ${file.file_name}`);
        try {
            new Function(finalCode);
        } catch (postObfuscationError) {
            log(`Detail kode bermasalah: ${finalCode.substring(0, 100)}...`);
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(ctx, progressMessage, 80, "Finalisasi Enkripsi");
        await fs.writeFile(encryptedPath, finalCode);

        log(`Mengirim file terenkripsi gaya X: ${file.file_name}`);
        await ctx.replyWithDocument(
            { source: encryptedPath, filename: `x-encrypted-${file.file_name}` },
            { caption: "✅ *File terenkripsi (Hardened X Invisible) siap!*\nSUKSES ENCRYPT BY ELIKA 🕊", parse_mode: "Markdown" }
        );
        await updateProgress(ctx, progressMessage, 100, "Hardened X Invisible Obfuscation Selesai");

        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus: ${encryptedPath}`);
        }
    } catch (error) {
        log("Kesalahan saat X obfuscation", error);
        await ctx.replyWithMarkdown(`❌ *Kesalahan:* ${error.message || "Tidak diketahui"}\n_Coba lagi dengan kode Javascript yang valid!_`);
        if (await fs.pathExists(encryptedPath)) {
            await fs.unlink(encryptedPath);
            log(`File sementara dihapus setelah error: ${encryptedPath}`);
        }
    }
});
};