const { Composer } = require("telegraf");
const chalk = require("chalk");
const moment = require("moment-timezone");

module.exports = (bot) => {
  let enabled = true;
  let totalLogged = 0;

  const composer = new Composer();
  const TZ = "Asia/Jakarta";

  // ========= helpers =========
  const timeNow = () => chalk.green(moment().tz(TZ).format("YYYY-MM-DD HH:mm:ss"));

  const safe = (v, fallback = "-") => (v === undefined || v === null || v === "" ? fallback : v);

  const oneLine = (s) => String(s || "").replace(/\s+/g, " ").trim();

  const clip = (s, max = 160) => {
    const t = oneLine(s);
    if (!t) return "";
    if (t.length <= max) return t;
    return t.slice(0, max - 1) + "…";
  };

  function getChatLabel(ctx) {
    const type = ctx?.chat?.type;
    if (type === "private") return chalk.blue("Private");
    if (type === "group") return chalk.blue("Group");
    if (type === "supergroup") return chalk.blue("Supergroup");
    if (type === "channel") return chalk.blue("Channel");
    return chalk.blue(safe(type, "Chat"));
  }

  function getChatName(ctx) {
    const type = ctx?.chat?.type;
    if (type === "private") return chalk.blue("Private Chat");
    const title = ctx?.chat?.title || ctx?.chat?.username || ctx?.chat?.id;
    return chalk.blue(safe(title, "Unknown Chat"));
  }

  function getUserName(ctx) {
    const u = ctx?.from;
    if (!u) return chalk.yellow("Unknown");
    if (u.username) return chalk.yellow(`@${u.username}`);
    return chalk.yellow(safe(u.first_name, "Pengguna Tidak Diketahui"));
  }

  function detectMessageType(msg) {
    if (!msg) return "Unknown";
    if (msg.text) return "Text";
    if (msg.photo) return "Photo";
    if (msg.video) return "Video";
    if (msg.document) return "Document";
    if (msg.sticker) return "Sticker";
    if (msg.audio) return "Audio";
    if (msg.voice) return "Voice";
    if (msg.animation) return "Animation";
    if (msg.video_note) return "VideoNote";
    if (msg.contact) return "Contact";
    if (msg.location) return "Location";
    if (msg.poll) return "Poll";
    return "NonText";
  }

  function extractPreview(msg) {
    if (!msg) return chalk.gray("[No Message]");

    if (msg.text) return chalk.white(clip(msg.text, 200));
    if (msg.caption) return chalk.white(clip(msg.caption, 200));

    const type = detectMessageType(msg);

    // detail kecil biar enak
    if (msg.sticker) {
      const emj = msg.sticker.emoji ? ` ${msg.sticker.emoji}` : "";
      return chalk.gray(`[Sticker${emj}]`);
    }
    if (msg.document) {
      const name = msg.document.file_name ? ` ${msg.document.file_name}` : "";
      return chalk.gray(`[Document${name}]`);
    }
    if (msg.audio) {
      const title = msg.audio.title ? ` ${msg.audio.title}` : "";
      return chalk.gray(`[Audio${title}]`);
    }
    if (msg.photo) return chalk.gray("[Photo]");
    if (msg.video) return chalk.gray("[Video]");
    if (msg.voice) return chalk.gray("[Voice]");
    if (msg.animation) return chalk.gray("[Animation]");
    if (msg.location) return chalk.gray("[Location]");
    if (msg.contact) return chalk.gray("[Contact]");
    if (msg.poll) return chalk.gray("[Poll]");

    return chalk.gray(`[${type}]`);
  }

  function printBannerOnce() {
    console.log(
      "\n" +
        chalk.cyan("╭───────────────────────────────────────") +
        "\n" +
        chalk.cyan("│ ") +
        chalk.blue.bold("ELIKA MD  - Logger Aktif") +
        chalk.cyan("                           │") +
        "\n" +
        chalk.cyan("╰───────────────────────────────────────") +
        "\n"
    );
  }

  // print banner on load
  printBannerOnce();

  // ========= middleware =========
  composer.use(async (ctx, next) => {
    if (!enabled) return next();

    // hanya log kalau ada message (bukan callback query dll)
    const msg = ctx?.message;
    if (!msg) return next();

    totalLogged += 1;

    const username = getUserName(ctx);
    const chatType = getChatLabel(ctx);
    const chatName = getChatName(ctx);
    const stamp = timeNow();
    const mType = chalk.magenta(detectMessageType(msg));
    const preview = extractPreview(msg);

    const box =
      "\n" +
      chalk.cyan("╭───────────────────────────────") +
      "\n" +
      chalk.cyan("┝ ") +
      chalk.green("Waktu     : ") +
      stamp +
      "\n" +
      chalk.cyan("┝ ") +
      chalk.green("Dari      : ") +
      username +
      "\n" +
      chalk.cyan("┝ ") +
      chalk.green("Chat      : ") +
      chatType +
      chalk.gray(" • ") +
      chatName +
      "\n" +
      chalk.cyan("┝ ") +
      chalk.green("Tipe      : ") +
      mType +
      "\n" +
      chalk.cyan("┝ ") +
      chalk.green("Pesan     : ") +
      preview +
      "\n" +
      chalk.cyan("┝ ") +
      chalk.green("Counter   : ") +
      chalk.white(String(totalLogged)) +
      "\n" +
      chalk.cyan("╰───────────────────────────────");

    console.log(box);

    return next();
  });

  bot.use(composer.middleware());

  // ========= controls =========
  return {
    enable() {
      enabled = true;
      console.log(chalk.green("[PLUGIN] Logger diaktifkan"));
    },
    disable() {
      enabled = false;
      console.log(chalk.yellow("[PLUGIN] Logger dinonaktifkan"));
    },
    status() {
      console.log(
        chalk.cyan("[PLUGIN] Logger status: ") +
          (enabled ? chalk.green("ON") : chalk.red("OFF")) +
          chalk.gray(" | ") +
          chalk.cyan("Total logged: ") +
          chalk.white(String(totalLogged))
      );
    },
  };
};