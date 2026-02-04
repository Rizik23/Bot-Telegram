const path = require('path');
const dotenv = require('dotenv');

// tentuin path .env yang berada 3 folder di dalam project
const envPath = path.resolve(__dirname, 'media/ElikaMedia/warning/.env');
const tokens = require('./media/ElikaMedia/warning/tokens');

// load .env dari path itu
dotenv.config({ path: envPath });
const MAIN_OWNER_ID = process.env.MAIN_OWNER_ID;
const MAIN_OWNER_ID_NUM = Number(MAIN_OWNER_ID);
const MAIN_GITHUB_TOKEN = process.env.MAIN_GITHUB_TOKEN;
const MAIN_BOT_TOKEN = process.env.MAIN_BOT_TOKEN;
const GROQ_APIKEY = process.env.GROQ_APIKEY;

module.exports = {
  groq: {
    apiKey: GROQ_APIKEY,
    models: [
      "openai/gpt-oss-120b",
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "moonshotai/kimi-k2-instruct",
      "openai/gpt-oss-20b"
    ]
  },
  
  NAMA_DEPAN: "𝐌𝐲-𝐋𝐨𝐯𝐞^𝐋𝐲-𝐙𝐲𝐧 𝘿𝙍𝙂𝙉",
  NAMA_PEMBUAT: "Dragon",
  OWNER_BOT: "Rizzxtzy",
  LINK_CHANNEL_BUTTON: "ZynDelta",
  NAMA_BOT: "Elika",
  
  //sticker loading sesudah /start
  stickers: {
    loading: "CAACAgIAAxkBAAIKhWl4zZ03wc2UUjZxRn-DRTEvLUZcAAJCEAACM8UpSZAO1BGnKkqCOAQ"
  },

  FORCE_SUB_CHANNEL: "@ZynDelta",
  FORCE_SUB_GROUP: "@usisnaiaj",
  OWNER_USERNAME: "@Rizzxtzy",

  channel: "https://t.me/ZynDelta",
  room: "https://t.me/usisnaiaj",
  testimoni: "https://t.me/usisnaiaj",

  namaOwner: "⏤͟͟͞͞Bgzik⃬ᝄ",
  // jangan di apa apain
  BOT_TOKEN: MAIN_BOT_TOKEN,
  githubToken: tokens.MAIN_GITHUB_TOKEN,
  OWNER_ID: MAIN_OWNER_ID,
  ownerId: MAIN_OWNER_ID,
  adminId: MAIN_OWNER_ID,
  ownerID: MAIN_OWNER_ID_NUM,
  ownerIdx: [MAIN_OWNER_ID_NUM],
  ownerIds: [MAIN_OWNER_ID],
  
    // ===== Panel Config =====
  domain: "https://nishplayboy.raffnotdev.biz.id",
  pp: "https://files.catbox.moe/6m3qe7.jpg",
  apikey: "ptla_h6YOJuPHn2H8xL7GAGiqROC3O63T4TNTzShFNDCZran",
  capikey: "ptlc_92LfY24uNZJSDbXxp4zSx7U5Ifd3eHRZUS7n1CUMPVx",
  egg: "15",
  nestid: "5",

  ALLOWED_GROUP_IDS: [], // ID grup yang boleh

  // ==== Bot Setting ========
  botUsername: "ElikaMd_bot",
  menuImage: "", //kosongin aja jangan di isi
  prefix: "/",

  ownerName: "zyn",
  ownerUsername: "Bgzik",

  channelLink: "https://whatsapp.com/channel/0029Vb5vjppCsU9Pmo3UUC2H",

  // "orderkuota" atau "pakasir"
  paymentGateway: "pakasir",

  // ===== OrderKuota Config =====
  orderkuota: {
    apikey: "ISI_KALAU_ADA",
    username: "ISI_KALAU_ADA",
    token: "ISI_KALAU_ADA",
    qrisCode: "ISI_KALAU_ADA"
  },

  // ===== Pakasir Config =====
  pakasir: {
    slug: "bgzikdrgaon",
    apiKey: "GtYmYoR6hVDYyCj6Rh9rl46i3mZlnlaw"
  },

  // Info payment manual (opsional)
  payment: {
    qris: "https://",
    dana: "ISI_KALAU_ADA",
    ovo: "ISI_KALAU_ADA",
    gopay: "ISI_KALAU_ADA"
  },

  // Apikey Digitalocean
  apiDigitalOcean: "ISI_KALAU_ADA",
  
  apiAkunDigitalOcean: {
    akun1: "",
    akun2: "",
    akun3: "",
    akun4: "",
    akun5: "",
    akun6: "",
    akun7: "",
    akun8: "",
    akun9: "",
    akun10: "",
    akun11: "",
    akun12: "",
    akun13: "",
    akun14: "",
    akun15: "",
    akun16: "",
    akun17: "",
    akun18: "",
    akun19: "",
    akun20: ""
  }
};