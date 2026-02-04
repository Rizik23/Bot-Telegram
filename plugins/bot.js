// plugins/store-autoorder.js

require("../lib/myfunc.js");

const config = require("../config");

const {
  createAdmin,
  createPanel,
  createPayment,
  cekPaid,
  createVPSDroplet,
  getDropletInfo,
  vpsImages,
  vpsRegions,
  vpsSpecs,
  generateStrongPassword,
  getOSAdditionalCost,
  validateOSForRegion
} = require("../lib/myfunc2.js");

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const prefix = config.prefix || ".";

// ✅ pastikan semua folder DB/price ngarah ke ROOT project, bukan folder plugins
const ROOT = process.cwd();

const scriptDir = path.join(ROOT, "scripts");
const scriptDB  = path.join(ROOT, "db", "scripts.json");
const userDB    = path.join(ROOT, "db", "users.json");
const stockDB   = path.join(ROOT, "db", "stocks.json");
const doDB      = path.join(ROOT, "db", "digitalocean.json");

const hargaPanel      = require(path.join(ROOT, "price", "panel.js"));
const hargaAdminPanel = require(path.join(ROOT, "price", "adminpanel.js"));
const vpsPackages     = require(path.join(ROOT, "price", "vps.js"));
const orders = {};

// Inisialisasi database
if (!fs.existsSync(scriptDir)) fs.mkdirSync(scriptDir);
if (!fs.existsSync(scriptDB)) fs.writeFileSync(scriptDB, "[]");
if (!fs.existsSync(userDB)) fs.writeFileSync(userDB, "[]");
if (!fs.existsSync(stockDB)) fs.writeFileSync(stockDB, "{}");
if (!fs.existsSync(doDB)) fs.writeFileSync(doDB, "{}");

// Load database
const loadScripts = () => JSON.parse(fs.readFileSync(scriptDB));
const saveScripts = (d) => fs.writeFileSync(scriptDB, JSON.stringify(d, null, 2));
const loadUsers = () => JSON.parse(fs.readFileSync(userDB));
const saveUsers = (d) => fs.writeFileSync(userDB, JSON.stringify(d, null, 2));
const loadStocks = () => JSON.parse(fs.readFileSync(stockDB));
const saveStocks = (d) => fs.writeFileSync(stockDB, JSON.stringify(d, null, 2));
const loadDO = () => JSON.parse(fs.readFileSync(doDB));
const saveDO = (d) => fs.writeFileSync(doDB, JSON.stringify(d, null, 2));

// ===================== FUNGSI UTILITAS =====================

// Fungsi untuk escape karakter Markdown khusus
function escapeMarkdown(text) {
    if (!text) return '';
    return String(text)
        .replace(/_/g, '\\_')
        .replace(/\*/g, '\\*')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/~/g, '\\~')
        .replace(/`/g, '\\`')
        .replace(/>/g, '\\>')
        .replace(/#/g, '\\#')
        .replace(/\+/g, '\\+')
        .replace(/-/g, '\\-')
        .replace(/=/g, '\\=')
        .replace(/\|/g, '\\|')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\./g, '\\.')
        .replace(/!/g, '\\!');
}

// === helper biar aman edit message foto/caption atau text ===
// === helper paling aman (anti 400 no text in message to edit) ===
async function smartEdit(ctx, text, extra = {}) {
  const msg = ctx.callbackQuery?.message;

  // kalau gak ada message (misal callback dari inline lama), fallback reply
  if (!msg) return ctx.reply(text, extra).catch(() => {});

  // kalau message itu media, coba edit caption dulu
  const isMedia =
    !!msg.photo?.length ||
    !!msg.video ||
    !!msg.document ||
    !!msg.animation;

  if (isMedia) {
    try {
      return await ctx.editMessageCaption(text, extra);
    } catch (e) {
      // kalau caption kosong/tidak ada -> Telegram kadang ngelempar "no text..."
      // fallback ke editMessageText (kalau ternyata message text)
      try {
        return await ctx.editMessageText(text, extra);
      } catch (e2) {
        return await ctx.reply(text, extra).catch(() => {});
      }
    }
  }

  // kalau message text biasa
  try {
    return await ctx.editMessageText(text, extra);
  } catch (e) {
    // fallback terakhir
    return await ctx.reply(text, extra).catch(() => {});
  }
}

// Fungsi untuk generate random fee
function generateRandomFee() {
    return Math.floor(Math.random() * 200) + 100; // 100-300
}

// Fungsi random number
function randomNumber(length) {
    let result = '';
    const characters = '0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const getBotStats = (db) => {
  const totalUser = db.length

  let totalTransaksi = 0
  let totalPemasukan = 0

  for (const user of db) {
    totalPemasukan += user.total_spent || 0
    totalTransaksi += user.history?.length || 0
  }

  return {
    totalUser,
    totalTransaksi,
    totalPemasukan
  }
}

async function broadcastNewProduct(ctx, type, name, description, price, cmds) {
    const users = loadUsers();

    const now = new Date();
    const waktu = now.toLocaleString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }).replace(".", ":");

    const text = `
🎉 *Produk Baru Telah Ditambahkan!*

📦 *Type:* ${escapeMarkdown(type)}
📛 *Nama:* ${escapeMarkdown(name)} ${description ? "(" + escapeMarkdown(description) + ")" : ""}
💰 *Harga:* Rp${Number(price).toLocaleString("id-ID")}

👤 *Ditambahkan Oleh:* @${config.ownerUsername}
🕒 *Waktu:* ${waktu}

Ketik ${cmds} untuk membeli produknya!
`.trim();

    for (const u of users) {
        try {
            await ctx.telegram.sendMessage(u.id, text, {
                parse_mode: "Markdown"
            });
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            // Skip error
        }
    }
}

const os = require("os");
const start = process.hrtime.bigint();
const end = process.hrtime.bigint();
const speed = Number(end - start) / 1e6; // ms
const used = (process.memoryUsage().rss / 1024 / 1024 / 1024).toFixed(2);
const total = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

const menuTextUbot = () => `
 *# Bot - Information*
 ▢ Speed: ${speed}ms
 ▢ Runtime: ${runtime(process.uptime())}
 ▢ Ram: ${used}GB/${total}GB
 
 *# Main - Menu*
 ${config.prefix}me
 ${config.prefix}tourl
 ${config.prefix}tourl2
 ${config.prefix}npmdl
 ${config.prefix}ping

 *# Shop - Menu*
 ${config.prefix}buypanel
 ${config.prefix}buyadmin
 ${config.prefix}buyscript
 ${config.prefix}buyapp
 ${config.prefix}buydo
 ${config.prefix}buyvps

 *# Store - Menu*
 ${config.prefix}cfd
 ${config.prefix}bl
 ${config.prefix}delbl
 ${config.prefix}proses
 ${config.prefix}pay

 *# Panel - Menu*
 ${config.prefix}1gb - ${config.prefix}unli
 ${config.prefix}listpanel
 ${config.prefix}delpanel
 ${config.prefix}cadmin
 ${config.prefix}listadmin
 ${config.prefix}deladmin
 ${config.prefix}subdo
 ${config.prefix}installpanel

 *# Owner - Menu*
 ${config.prefix}backup
 ${config.prefix}restart
`;

const menuTextBot = (ctx) => {
  let db = loadUsers()
  const firstName = ctx.from?.first_name || "-"
  const lastName = ctx.from?.last_name || "-"
  const userId = ctx.from?.id
  const { totalUser, totalTransaksi, totalPemasukan } = getBotStats(db)

  return `
> *${escapeMarkdown("🤖Informasi Profile Bot")}*
ᯤ Runtime: ${runtime(process.uptime())}
ᯤ Total User: ${totalUser}
ᯤ Total Pemasukan: Rp${escapeMarkdown(totalPemasukan.toLocaleString("id-ID"))}
ᯤ Total Transaksi: ${totalTransaksi}

> *${escapeMarkdown("🪪Informasi Profil Anda")}*
ᯤ ID: ${userId}
ᯤ Nama Depan: ${escapeMarkdown(firstName)}
ᯤ Nama Belakang: ${escapeMarkdown(lastName)}
`
}

const textOrder = (name, price, fee) => `
*───[ INFORMASI PEMBAYARAN ]───*

📦 Produk: ${escapeMarkdown(name)}
💰 Nominal: Rp${toRupiah(price)} (Fee Rp${fee})
💳 Total Pembayaran: Rp${toRupiah((price + fee))}
🕒 Expired Qr: 6 Menit

Silakan scan QRIS ini sebelum 6 menit, 
Status pembayaran akan terdeteksi otomatis oleh sistem.
`;

// Fungsi untuk membuat text konfirmasi
function createConfirmationText(productType, productName, price, fee, details = {}) {
    let detailText = "";
    const now = new Date();
    const waktu = now.toLocaleString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }).replace(".", ":");

    if (productType === "panel") {
        detailText = `👤 Username: ${escapeMarkdown(details.username)}\n💾 Ram: ${/unli/.test(details.ram.toLowerCase()) ? "Unlimited" : details.ram}`;
    } else if (productType === "admin") {
        detailText = `👤 Username: ${escapeMarkdown(details.username)}`;
    } else if (productType === "script") {
        detailText = `📦 Nama Script: ${escapeMarkdown(productName)}\n📝 Deskripsi: ${escapeMarkdown(details.description || "-")}`;
    } else if (productType === "app") {
        detailText = `📱 Kategori: ${escapeMarkdown(details.category)}\n📝 Deskripsi: ${escapeMarkdown(details.description)}`;
    } else if (productType === "do") {
        detailText = `🌊 Kategori: ${escapeMarkdown(details.category)}\n📝 Deskripsi: ${escapeMarkdown(details.description)}`;
    } else if (productType === "vps") {
        detailText = `💻 Spesifikasi: ${escapeMarkdown(details.specName || "")}\n🖥️ OS: ${escapeMarkdown(details.osName || "")}\n🌍 Region: ${escapeMarkdown(details.regionName || "")}`;
    }

    return `📝 *Konfirmasi Pemesanan*

📦 Produk: ${escapeMarkdown(productName)}
💰 Harga: Rp${toRupiah(price)}
🕒 Waktu: ${waktu}

${detailText}

⚠️ Apakah Anda yakin ingin melanjutkan pembayaran?
`;
}

const isOwner = (ctx) => {
    const fromId = ctx.from?.id || ctx.callbackQuery?.from?.id || ctx.inlineQuery?.from?.id;
    return fromId.toString() == config.ownerId;
}

// Fungsi untuk menambahkan user ke database
function addUser(userData) {
    const users = loadUsers();
    const existingUser = users.find(u => u.id === userData.id);
    if (!existingUser) {
        const userToAdd = {
            ...userData,
            username: userData.username ? escapeMarkdown(userData.username) : "",
            first_name: userData.first_name ? escapeMarkdown(userData.first_name) : "",
            last_name: userData.last_name ? escapeMarkdown(userData.last_name) : ""
        };
        users.push(userToAdd);
        saveUsers(users);
    }
}

// Fungsi untuk update user history
function updateUserHistory(userId, orderData, details = {}) {
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        if (!users[userIndex].history) users[userIndex].history = [];
        
        const transaction = {
            product: orderData.name,
            amount: orderData.amount,
            type: orderData.type,
            timestamp: new Date().toISOString()
        };
        
        switch (orderData.type) {
            case "panel":
                transaction.details = `Username: ${orderData.username}, RAM: ${orderData.ram === "unli" ? "Unlimited" : orderData.ram + "GB"}`;
                break;
            case "admin":
                transaction.details = `Username: ${orderData.username}`;
                break;
            case "script":
                transaction.details = `Script: ${orderData.name}`;
                break;
            case "app":
                transaction.details = `${orderData.category} - ${orderData.description}`;
                break;
            case "do":
                transaction.details = `${orderData.category} - ${orderData.description}`;
                break;
            case "vps":
                transaction.details = `${orderData.spec.ramCpu.name} - ${orderData.spec.os.name} - ${orderData.spec.region.name}`;
                break;
            default:
                transaction.details = details.description || "-";
        }
        
        users[userIndex].history.push(transaction);
        saveUsers(users);
    }
}

// Fungsi untuk mengirim notifikasi ke owner saat order berhasil
async function notifyOwner(ctx, orderData, buyerInfo) {
    try {
        const now = new Date();
        const waktu = now.toLocaleString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).replace(".", ":");
        
        let productDetails = "";
        switch (orderData.type) {
            case "panel":
                productDetails = `👤 Username: ${escapeMarkdown(orderData.username)}\n💾 RAM: ${orderData.ram === "unli" ? "Unlimited" : orderData.ram + "GB"}`;
                break;
            case "admin":
                productDetails = `👤 Username: ${escapeMarkdown(orderData.username)}`;
                break;
            case "script":
                productDetails = `📦 Script: ${escapeMarkdown(orderData.name)}`;
                break;
            case "app":
                productDetails = `📱 Kategori: ${escapeMarkdown(orderData.category)}\n📝 Deskripsi: ${escapeMarkdown(orderData.description)}`;
                break;
            case "do":
                productDetails = `🌊 Kategori: ${escapeMarkdown(orderData.category)}\n📝 Deskripsi: ${escapeMarkdown(orderData.description)}`;
                break;
            case "vps":
                productDetails = `💻 Spesifikasi: ${escapeMarkdown(orderData.spec.ramCpu.name)}\n🖥️ OS: ${escapeMarkdown(orderData.spec.os.name)}\n🌍 Region: ${escapeMarkdown(orderData.spec.region.name)}`;
                break;
        }
        
        const buyerUsername = buyerInfo.username ? escapeMarkdown(buyerInfo.username) : "Tidak ada";
        const buyerName = escapeMarkdown(buyerInfo.name);
        
        const notificationText = `💰 *ORDER BERHASIL DIPROSES!*

🕒 Waktu: ${waktu}
📦 Produk: ${escapeMarkdown(orderData.name)}
💰 Total: Rp${toRupiah(orderData.amount)}
👤 Buyer: ${buyerName}
🆔 User ID: \`${buyerInfo.id}\`
📱 Username: ${buyerInfo.username ? `@${buyerUsername}` : "Tidak ada"}

📋 Detail Produk:
${productDetails}

━━━━━━━━━━━━━━━
📊 Total Pembelian User: Rp${toRupiah(buyerInfo.totalSpent)}`.trim();

        const contactButton = {
            text: "📞 Hubungi Buyer",
            url: `https://t.me/${buyerInfo.username || buyerInfo.id}`
        };

        if (!buyerInfo.username) {
            contactButton.url = `tg://user?id=${buyerInfo.id}`;
        }

        await ctx.telegram.sendMessage(config.ownerId, notificationText, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [contactButton]
                ]
            }
        });
        
    } catch (error) {
        console.error("Error notifying owner:", error);
    }
}

module.exports = (bot) => {

// ####### HANDLE USERBOT MENU ##### //
  bot.on("inline_query", async ctx => {
    try {
          const queryTime = ctx.inlineQuery.query_date;
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime - queryTime > 8) {
        console.log('⏰ Skipping expired inline query');
        return;
    }
      const msg = ctx.inlineQuery;
      const body = (msg.query || "").trim();
      const isCmd = body.startsWith(prefix);
      const args = body.split(/ +/).slice(1);
      const text = args.join(" ");
      const command = isCmd
        ? body.slice(prefix.length).trim().split(" ").shift().toLowerCase()
        : body.toLowerCase();

      switch (command) {
        case "menu": {
  return ctx.answerInlineQuery([{
    type: "photo",
    id: "menu-1",
    photo_url: config.menuImage,
    thumb_url: config.menuImage,
    caption: menuTextUbot(),
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📢 Join Channel", url: config.channelLink },
        { text: "🧩 Source Code", url: `tg://user?id=${config.ownerId}` }
      ]]
    }
  }], { cache_time: 0 });
}

case "cpanel-result": {
  if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

  const parts = text.split("|");
  if (parts.length < 7) return;
  const [username, password, serverId, ram, disk, cpu, domain] = parts;

  const ramText = ram === "0" ? "Unlimited" : `${ram / 1000}GB`;
  const diskText = disk === "0" ? "Unlimited" : `${disk / 1000}GB`;
  const cpuText = cpu === "0" ? "Unlimited" : `${cpu}%`;

  const teks = `
✅ <b>Panel Berhasil Dibuat!</b>

👤 Username: <code>${escapeMarkdown(username)}</code>
🔐 Password: <code>${escapeMarkdown(password)}</code>
📦 Server ID: <code>${serverId}</code>
🌐 Panel: <span class="tg-spoiler">https://${escapeMarkdown(domain)}</span>

⚙️ <b>Spesifikasi Server Panel</b>
- RAM: ${ramText}
- Disk: ${diskText}
- CPU: ${cpuText}
`;

  return ctx.answerInlineQuery([{
    type: "article",
    id: "panel-1",
    title: "📦 cPanel Result",
    description: `Panel ${escapeMarkdown(username)} dibuat!`,
    input_message_content: {
      message_text: teks,
      parse_mode: "HTML",
      disable_web_page_preview: true
    },
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌐 Login Web Panel", url: `https://${domain}/auth/login` }]
      ]
    }
  }], { cache_time: 0 });
  break;
}

case "cadmin-result": {
  if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

  const parts = text.split("|");
  if (parts.length < 3) return;
  const [username, password, domain] = parts;
  const teks = `
✅ <b>Akun Admin Panel Berhasil Dibuat!</b>

👤 Username: <code>${escapeMarkdown(username)}</code>
🔐 Password: <code>${escapeMarkdown(password)}</code>
🌐 Panel: <span class="tg-spoiler">https://${escapeMarkdown(domain)}</span>
`;

  return ctx.answerInlineQuery([{
    type: "article",
    id: "cadmin-1",
    title: "📦 Admin Panel Result",
    description: `Admin ${escapeMarkdown(username)} berhasil dibuat!`,
    input_message_content: {
      message_text: teks,
      parse_mode: "HTML",
      disable_web_page_preview: true
    },
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌐 Login Web Panel", url: `https://${domain}/auth/login` }]
      ]
    }
  }], { cache_time: 0 });
  break;
}

case "deladmin": {
  if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

  const res = await fetch(`${config.domain}/api/application/users`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apikey}`
    }
  });
  const data = await res.json();
  const users = data.data || [];

  const admins = users.filter(u => u.attributes.root_admin === true);
  if (!admins.length) return ctx.answerInlineQuery([], { cache_time: 1 });

  const buttons = admins.map(a => ([{
    text: `📡 ${escapeMarkdown(a.attributes.username)} (ID: ${a.attributes.id})`,
    callback_data: `deladmin|${a.attributes.id}`
  }]));

  return ctx.answerInlineQuery([{
    type: "article",
    id: "deladmin-1",
    title: "⚠️ Hapus Admin Panel",
    description: `Pilih admin yang ingin dihapus`,
    input_message_content: {
      message_text: `⚠️ *Hapus Admin Panel*\n\nPilih admin yang ingin dihapus:`,
      parse_mode: "Markdown"
    },
    reply_markup: { inline_keyboard: buttons }
  }], { cache_time: 0 });
  break;
}

        // ===== PAYMENT =====
        case "payment": {
          const caption =
`*Payment Pembayaran verlangid 🕊️*

*▢ Dana:* \`${escapeMarkdown(config.payment.dana)}\`
*▢ Ovo:* \`${escapeMarkdown(config.payment.ovo)}\`
*▢ Gopay:* \`${escapeMarkdown(config.payment.gopay)}\`
`;

          return ctx.answerInlineQuery([{
            type: "photo",
            id: "payment-1",
            photo_url: config.payment.qris,
            thumb_url: config.payment.qris,
            caption,
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [[
              { text: "💬 Join Channel verlangid", url: config.channelLink }
            ]] }
          }], { cache_time: 0 });
        }
        
case "installpanel-result": {
  if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');
  if (!text.includes("|")) return

  const [domain, user, password, ip, pwvps] = text.split("|").map(v => v.trim());

  const teks = `
✅ <b>Install Panel Berhasil!</b>

👤 Username: <code>${escapeMarkdown(user)}</code>
🔐 Password: <code>${escapeMarkdown(password)}</code>
🌐 Panel: <span class="tg-spoiler">https://${escapeMarkdown(domain)}</span>

<b>Start Wing Command:</b>
<code>.startwings ${ip}|${pwvps}|token_node</code>
`;

  return ctx.answerInlineQuery([{
    type: "article",
    id: "installpanel-1",
    title: "✅ Install Panel Selesai",
    description: `Panel: ${escapeMarkdown(domain)}`,
    input_message_content: {
      message_text: teks,
      parse_mode: "HTML",
      disable_web_page_preview: true
    },
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌐 Login Web Panel", url: `https://${domain}` }]
      ]
    }
  }], { cache_time: 0 });
  break;
}

        // ===== SUBDOMAIN =====
        case "jdudjdhej": {
          if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');
          if (!text.includes("|")) return 

          const [host, ip] = text.split("|").map(v => v.trim());
          const domains = Object.keys(config.subdomain || {});
          if (!domains.length) return ctx.answerCbQuery('Tidak Ada API Subdomain!');
          const buttons = domains.map(dom => ([
            { text: `🌐 ${escapeMarkdown(dom)}`, callback_data: `subdo|${dom}|${host}|${ip}` }
          ]));

          return ctx.answerInlineQuery([{
            type: "article",
            id: "subdo-1",
            title: "🌐 Buat Subdomain",
            description: `Host: ${escapeMarkdown(host)} | IP: ${ip}`,
            input_message_content: {
              message_text:
`🚀 *Subdomain Creator*

Hostname: \`${escapeMarkdown(host)}\`
IP: \`${ip}\`

Pilih domain:`,
              parse_mode: "Markdown"
            },
            reply_markup: { inline_keyboard: buttons }
          }], { cache_time: 0 });
        }
        
        case "delpanel": {
  if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

  try {
    const res = await fetch(`${config.domain}/api/application/servers`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apikey}`
      }
    });
    const data = await res.json();
    const servers = data.data || [];

    if (!servers.length)
      return ctx.answerCbQuery('Tidak Ada Server Panel!');

    const buttons = servers.map(s => {
      const { id, name } = s.attributes;
      return [{ text: `📡 ${escapeMarkdown(name)} (ID: ${id})`, callback_data: `delpanel|${id}` }];
    });

    return ctx.answerInlineQuery([{
      type: "article",
      id: "delpanel-1",
      title: "📡 Hapus Server",
      description: `Pilih server yang ingin dihapus`,
      input_message_content: {
        message_text:
`⚠️ *Hapus User & Server Panel*

Pilih server yang ingin dihapus:`,
        parse_mode: "Markdown"
      },
      reply_markup: { inline_keyboard: buttons }
    }], { cache_time: 0 });

  } catch (err) {
    console.error("Error fetch servers:", err);
    return ctx.answerCbQuery('Error! Terjadi Kesalahan.');
  }
}

        // ===== PROSES =====
        case "proses": {
          if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');
          if (!text) return
          return ctx.answerInlineQuery([{
            type: "article",
            id: "proses-1",
            title: "📦 Proses",
            description: escapeMarkdown(text),
            input_message_content: {
              message_text: `✅ Pesanan sedang diproses\n\n📦 ${escapeMarkdown(text)}\n⏰ ${global.tanggal(Date.now())}\n\n_Thank you for purchasing 🕊️_`,
              parse_mode: "Markdown"
            },
            reply_markup: { inline_keyboard: [[
              { text: "💬 Join Channel verlangid", url: config.channelLink }
            ]] }
          }], { cache_time: 0 });
        }
        
        case "buy": {
          return ctx.answerInlineQuery([{
            type: "article",
            id: "buyproduk-1",
            title: "📦 Buyproduk",
            description: escapeMarkdown(text),
            input_message_content: {
              message_text: `Silahkan Order Produk Via Bot Otomatis 🚀`,
              parse_mode: "Markdown"
            },
            reply_markup: { inline_keyboard: [[
              { text: "💬 Order Via Bot", url: `https://t.me/${config.botUsername}`}
            ]] }
          }], { cache_time: 0 });
        }

        default:
          return
      }
    } catch (e) {
      console.log("❌ Inline error:", e);
      return ctx.answerCbQuery('Respon Inline Error!');
    }
  });
  

// ####### HANDLE USERBOT MENU ##### //
bot.action(/delpanel\|(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');
  const serverId = ctx.match[1];

  try {
    const [serverRes, userRes] = await Promise.all([
      fetch(`${config.domain}/api/application/servers/${serverId}`, {
        method: "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${config.apikey}` }
      }),
      fetch(`${config.domain}/api/application/users`, {
        method: "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${config.apikey}` }
      })
    ]);

    const server = (await serverRes.json()).attributes;
    const users = (await userRes.json()).data || [];

    if (!server)
      return ctx.editMessageText(`❌ Server ID ${serverId} tidak ditemukan`, { parse_mode: "Markdown" });

    await fetch(`${config.domain}/api/application/servers/${serverId}`, {
      method: "DELETE",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${config.apikey}` }
    });

    const serverNameLower = server.name.toLowerCase();
    const user = users.find(u => u.attributes.first_name?.toLowerCase() === serverNameLower);
    if (user) {
      await fetch(`${config.domain}/api/application/users/${user.attributes.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${config.apikey}` }
      });
    }

    return ctx.editMessageText(
`✅ Server *${escapeMarkdown(server.name)}* (ID: ${serverId}) berhasil dihapus!`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 Back To List Server", callback_data: "delpanel-back" }]]
        }
      }
    );
  } catch (err) {
    return ctx.editMessageText(`❌ Gagal hapus server!\n${err.message}`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "🔄 Back To List Server", callback_data: "delpanel-back" }]]
      }
    });
  }
});

bot.action("delpanel-back", async (ctx) => {
  await ctx.answerCbQuery();
  if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');
  const serverRes = await fetch(`${config.domain}/api/application/servers`, {
    method: "GET",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${config.apikey}` }
  });

  const servers = (await serverRes.json()).data || [];
  if (!servers.length)
    return ctx.answerCbQuery('Tidak Ada Server Panel!');

  const buttons = servers.map(s => ([{
    text: `📡 ${escapeMarkdown(s.attributes.name)} (ID: ${s.attributes.id})`,
    callback_data: `delpanel|${s.attributes.id}`
  }]));

  return ctx.editMessageText(
`⚠️ *Hapus User & Server Panel*\n\nPilih server yang ingin dihapus:`,
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: buttons } }
  );
});


bot.action(/hehehhehe\|(.+?)\|(.+?)\|(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');
  const [meki, domain, host, ip] = ctx.match[0].split("|")

  const api = config.subdomain[domain];
  if (!api) return ctx.answerCbQuery("❌ Domain tidak valid!");

  const cleanHost = host.replace(/[^a-z0-9.-]/gi, "").toLowerCase();
  const cleanIp = ip.replace(/[^0-9.]/g, "");
  const rand = Math.floor(100 + Math.random() * 900);

  const panel = `${cleanHost}.${domain}`;
  const node = `node${rand}.${cleanHost}.${domain}`;

  try {
    const createSub = async (name) => {
      const res = await axios.post(
        `https://api.cloudflare.com/client/v4/zones/${api.zone}/dns_records`,
        { type: "A", name, content: cleanIp, ttl: 3600, proxied: false },
        { headers: { Authorization: `Bearer ${api.apitoken}`, "Content-Type": "application/json" } }
      );
      if (!res.data.success) throw new Error("Gagal membuat subdomain");
    };

    await createSub(panel);
    await createSub(node);

    return ctx.editMessageText(
`✅ *Subdomain berhasil dibuat!*

🌐 Panel: \`${escapeMarkdown(panel)}\`
🌐 Node: \`${escapeMarkdown(node)}\`
📌 IP: \`${cleanIp}\``,
      { parse_mode: "Markdown" }
    );
  } catch (e) {
    return ctx.editMessageText(
`❌ *Gagal membuat subdomain!*\n${e.message}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            { text: "🔄 Buat Ulang Subdomain", callback_data: `retry|${host}|${ip}` }
          ]]
        }
      }
    );
  }
});


bot.action(/retry\|(.+?)\|(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');
  const [, host, ip] = ctx.match;

  const buttons = Object.keys(config.subdomain).map(dom => ([{
    text: `🌐 ${escapeMarkdown(dom)}`, callback_data: `subdo|${dom}|${host}|${ip}`
  }]));

  return ctx.editMessageText(
`🚀 *Subdomain Creator*

Hostname: \`${escapeMarkdown(host)}\`
IP: \`${ip}\`

Pilih domain:`,
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: buttons } }
  );
});


bot.action(/deladmin\|(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');
  const userId = ctx.match[1];

  try {
    const res = await fetch(`${config.domain}/api/application/users`, {
      method: "GET",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${config.apikey}` }
    });
    const users = (await res.json()).data || [];

    const target = users.find(u => u.attributes.id == userId && u.attributes.root_admin);
    if (!target) throw new Error("Admin tidak ditemukan!");

    await fetch(`${config.domain}/api/application/users/${userId}`, {
      method: "DELETE",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${config.apikey}` }
    });

    return ctx.editMessageText(
`✅ Admin *${escapeMarkdown(target.attributes.username)}* berhasil dihapus!`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 Back To List Admin", callback_data: "deladmin-back" }]]
        }
      }
    );
  } catch (err) {
    return ctx.editMessageText(`❌ Gagal hapus admin!\n${err.message}`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "🔄 Back To List Admin", callback_data: "deladmin-back" }]]
      }
    });
  }
});


bot.action("deladmin-back", async (ctx) => {
  await ctx.answerCbQuery();
  if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

  const res = await fetch(`${config.domain}/api/application/users`, {
    method: "GET",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${config.apikey}` }
  });
  const users = (await res.json()).data || [];

  const admins = users.filter(u => u.attributes.root_admin);
  if (!admins.length)
    return ctx.answerCbQuery('Tidak Ada Admin Panel!');

  const buttons = admins.map(a => ([{
    text: `🗑️ ${escapeMarkdown(a.attributes.username)} (ID: ${a.attributes.id})`,
    callback_data: `deladmin|${a.attributes.id}`
  }]));

  return ctx.editMessageText(
`⚠️ *Hapus Admin Panel*\n\nPilih admin yang ingin dihapus:`,
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: buttons } }
  );
});


    // #### HANDLE STORE BOT MENU ##### //
    bot.on("text", async (ctx, next) => {
         
        const msg = ctx.message;
        const configuredPrefix = (config.prefix || ".").toString();

        const body = (msg.text || "").trim();

        // Support both configured prefix (e.g. ".") and Telegram slash commands ("/")
        const prefixes = configuredPrefix === "/" ? ["/", "."] : [configuredPrefix, "/"];
        const usedPrefix = prefixes.find((p) => body.startsWith(p));
        const isCmd = !!usedPrefix;

        const raw = isCmd ? body.slice(usedPrefix.length).trim() : body;
        const parts = raw.split(/ +/).filter(Boolean);
        const command = (parts[0] || "").toLowerCase();
        const args = parts.slice(1);
        const text = args.join(" ");
        const fromId = ctx.from.id;
        const userName = ctx.from.username || `${ctx.from.first_name}${ctx.from.last_name ? ' ' + ctx.from.last_name : ''}`;

        fromId ? addUser({
            id: fromId,
            username: userName,
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name || "",
            join_date: new Date().toISOString(),
            total_spent: 0,
            history: []
        }) : ""

        switch (command) {
            // ===== MENU / START =====
            case "akskssjnskssjs":
            case "nejejejeneiehej": {
                return ctx.replyWithPhoto(config.menuImage, {
                    caption: menuTextBot(ctx),
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [
                            { text: "🛒 Katalog Produk", callback_data: "katalog" }
                            ], 
                            [
                                { text: "📢 Testimoni", url: config.channelLink }, 
                                { text: "📞 Developer", url: "https://t.me/"+config.ownerUsername }
                            ]
                        ]
                    }
                });
            }

            case "ownermenu":
            case "ownmenu": {
                return ctx.replyWithPhoto(config.menuImage, {
                    caption: menuTextOwn(),
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "📢 Channel Testimoni", url: config.channelLink }
                            ]
                        ]
                    }
                });
            }

            // ===== PROFILE USER =====
            case "profile": {
                const users = loadUsers();
                const user = users.find(u => u.id === fromId);
                if (!user) return ctx.reply("❌ User tidak ditemukan.");

                const firstName = user.first_name || '';
                const lastName = user.last_name || '';
                const fullName = firstName + (lastName ? ' ' + lastName : '');
                const userUsername = user.username ? '@' + user.username : 'Tidak ada';

                let lastTransactions = '_Belum ada transaksi_';
                if (user.history && user.history.length > 0) {
                    lastTransactions = user.history.slice(-3).reverse().map((t, i) => {
                        const product = escapeMarkdown(t.product);
                        const amount = toRupiah(t.amount);
                        const date = new Date(t.timestamp).toLocaleDateString('id-ID');
                        return `${i + 1}. ${product} - Rp${amount} (${date})`;
                    }).join('\n');
                }

                const profileText = `*👤 Profile User*

*📛 Nama:* ${escapeMarkdown(fullName)}
*🆔 User ID:* \`${user.id}\`
*📧 Username:* ${escapeMarkdown(userUsername)}
*📅 Join Date:* ${new Date(user.join_date).toLocaleDateString('id-ID')}
*💰 Total Spent:* Rp${toRupiah(user.total_spent || 0)}
*📊 Total Transaksi:* ${user.history ? user.history.length : 0}

*📋 Last 3 Transactions:*
${lastTransactions}`;

                return ctx.reply(profileText, { parse_mode: "Markdown" });
            }

            case "history": {
                const users = loadUsers();
                const user = users.find(u => u.id === fromId);
                if (!user || !user.history || user.history.length === 0) {
                    return ctx.reply("📭 Belum ada riwayat transaksi.");
                }

                let historyText = "*📋 Riwayat Transaksi*\n\n";
                user.history.reverse().forEach((t, i) => {
                    historyText += `*${i + 1}. ${escapeMarkdown(t.product)}*\n`;
                    historyText += `💰 Harga: Rp${toRupiah(t.amount)}\n`;
                    historyText += `📅 Tanggal: ${new Date(t.timestamp).toLocaleDateString('id-ID')} ${new Date(t.timestamp).toLocaleTimeString('id-ID')}\n`;
                    historyText += `📦 Tipe: ${t.type}\n`;
                    if (t.details) historyText += `📝 Detail: ${escapeMarkdown(t.details)}\n`;
                    historyText += "\n";
                });

                return ctx.reply(historyText, { parse_mode: "Markdown" });
            }

            // ===== USERLIST (OWNER ONLY) =====
            case "userlist": {
                if (!isOwner(ctx)) return ctx.reply("❌ Owner Only!");
                const users = loadUsers();
                if (users.length === 0) return ctx.reply("📭 Belum ada user terdaftar.");

                let userText = `*📊 Total Users: ${users.length}*\n\n`;

                users.slice(0, 20).forEach((u, i) => {
                    const firstName = u.first_name || '';
                    const lastName = u.last_name || '';
                    const username = u.username ? '@' + u.username : '-';

                    userText += `*${i + 1}. ${escapeMarkdown(firstName + (lastName ? ' ' + lastName : ''))}*\n`;
                    userText += `\`ID: ${u.id}\`\n`;
                    userText += `📧 ${escapeMarkdown(username)}\n`;
                    userText += `💰 Spent: Rp${toRupiah(u.total_spent || 0)}\n`;
                    userText += `📅 Join: ${new Date(u.join_date).toLocaleDateString('id-ID')}\n`;
                    userText += "\n";
                });

                if (users.length > 20) {
                    userText += `\n_...dan ${users.length - 20} user lainnya_`;
                }

                return ctx.reply(userText, { parse_mode: "Markdown" });
            }

            // ===== ADD SCRIPT =====
            case "addscript": {
                if (!isOwner(ctx)) return ctx.reply("❌ Owner Only!");
                if (!ctx.message.reply_to_message?.document)
                    return ctx.reply(`Reply ZIP dengan:\n${config.prefix}addscript nama|deskripsi|harga`);

                const doc = ctx.message.reply_to_message.document;
                if (!doc.file_name.endsWith(".zip")) return ctx.reply("Harus file .zip");

                if (!text.includes("|")) return ctx.reply(`Format: ${config.prefix}addscript nama|deskripsi|harga`);
                const [name, desk, price] = text.split("|").map(v => v.trim());
                if (!name || isNaN(price) || !desk) return ctx.reply("Data tidak valid.");

                const scripts = loadScripts();
                if (scripts.find(s => s.name.toLowerCase() === name.toLowerCase()))
                    return ctx.reply("Script sudah ada.");

                const link = await ctx.telegram.getFileLink(doc.file_id);
                const res = await axios.get(link.href, { responseType: "arraybuffer" });
                const savePath = path.join(scriptDir, doc.file_name);
                fs.writeFileSync(savePath, res.data);

                scripts.push({ name, desk, price: Number(price), file: `scripts/${doc.file_name}`, added_date: new Date().toISOString() });
                saveScripts(scripts);

                await ctx.reply(`✅ Script ${escapeMarkdown(name)} berhasil ditambahkan.`, { parse_mode: "Markdown" });
                return broadcastNewProduct(ctx, "SCRIPT", name, null, price, "/buyscript")
            }

            // ===== BROADCAST MESSAGE (OWNER ONLY) =====
            case "broadcast": {
                if (!isOwner(ctx)) return ctx.reply("❌ Owner only!");

                const users = loadUsers();
                if (users.length === 0) {
                    return ctx.reply("📭 Tidak ada user untuk di-broadcast.");
                }

                const replyMsg = ctx.message.reply_to_message;
                let broadcastMessage = "";
                let photoFileId = null;
                let hasPhoto = false;

                if (replyMsg) {
                    if (replyMsg.photo && replyMsg.photo.length > 0) {
                        hasPhoto = true;
                        const photo = replyMsg.photo[replyMsg.photo.length - 1];
                        photoFileId = photo.file_id;
                        broadcastMessage = replyMsg.caption || "";
                    } else if (replyMsg.text) {
                        broadcastMessage = replyMsg.text;
                    } else {
                        return ctx.reply("❌ Format tidak valid! Reply pesan dengan teks atau foto.");
                    }
                } else if (text) {
                    broadcastMessage = text;
                } else {
                    return ctx.reply(`Contoh penggunaan:\n${config.prefix}broadcast [pesan]\n\nAtau\n\nReply pesan/foto dengan ketik ${config.prefix}broadcast`);
                }

                if (!broadcastMessage.trim() && !hasPhoto) {
                    return ctx.reply("❌ Pesan broadcast tidak boleh kosong!");
                }

                const startMsg = await ctx.reply(`🚀 *MEMULAI BROADCAST*\n\n` +
                    `📊 Total User: ${users.length}\n` +
                    `⏳ Estimasi waktu: ${Math.ceil(users.length / 10)} detik\n` +
                    `🔄 Mengirim... 0/${users.length}`,
                    { parse_mode: "Markdown" });

                startBroadcast(ctx, users, broadcastMessage, hasPhoto, photoFileId, startMsg.message_id);
                break;
            }

            // ===== BACKUP SCRIPT =====
            case "backupsc":
            case "bck":
            case "backup": {
                if (!isOwner(ctx)) return ctx.reply("❌ Owner only!");

                try {
                    await ctx.reply("🔄 Backup Processing...");

                    const archiver = require('archiver');

                    const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                    const tgl = new Date();
                    const tanggal = tgl.getDate().toString().padStart(2, "0");
                    const bulan = bulanIndo[tgl.getMonth()];
                    const name = `Tele-Autoorder-${tanggal}-${bulan}-${tgl.getFullYear()}`;

                    const exclude = ["node_modules", "package-lock.json", "yarn.lock", ".npm", ".cache", ".git"];
                    const filesToZip = fs.readdirSync(".").filter((f) =>
                        !exclude.includes(f) &&
                        !f.startsWith('.') &&
                        f !== ""
                    );

                    if (!filesToZip.length) {
                        return ctx.reply("❌ Tidak ada file yang dapat di backup!");
                    }

                    const output = fs.createWriteStream(`./${name}.zip`);
                    const archive = archiver("zip", { zlib: { level: 9 } });

                    output.on('close', async () => {
                        console.log(`Backup created: ${archive.pointer()} total bytes`);

                        try {
                            await ctx.telegram.sendDocument(
                                config.ownerId,
                                { source: `./${name}.zip` },
                                {
                                    caption: `✅ <b>Backup Script selesai!</b>\n📁 ${escapeMarkdown(name)}.zip`,
                                    parse_mode: "HTML"
                                }
                            );

                            fs.unlinkSync(`./${name}.zip`);

                            if (ctx.chat.id.toString() !== config.ownerId.toString()) {
                                await ctx.reply(
                                    "✅ <b>Backup script selesai!</b>\n📁 File telah dikirim ke chat pribadi owner.",
                                    { parse_mode: "HTML" }
                                );
                            }

                        } catch (err) {
                            console.error("Gagal kirim file backup:", err);
                            await ctx.reply("❌ Error! Gagal mengirim file backup.");
                        }
                    });

                    archive.on('error', async (err) => {
                        console.error("Archive Error:", err);
                        await ctx.reply("❌ Error! Gagal membuat file backup.");
                    });

                    archive.pipe(output);

                    for (let file of filesToZip) {
                        const stat = fs.statSync(file);
                        if (stat.isDirectory()) {
                            archive.directory(file, file);
                        } else {
                            archive.file(file, { name: file });
                        }
                    }

                    await archive.finalize();

                } catch (err) {
                    console.error("Backup Error:", err);
                    await ctx.reply("❌ Error! Terjadi kesalahan saat proses backup.");
                }
                break;
            }

            // ===== GET SCRIPT =====
            case "delscript":
            case "getscript": {
                if (!isOwner(ctx)) return ctx.reply("❌ Owner only.");
                const allScripts = loadScripts();
                if (!allScripts.length) return ctx.reply("📭 Belum ada script.");

                const buttons = allScripts.map((s, i) => ([
                    { text: `📂 ${escapeMarkdown(s.name)} - Rp${s.price}`, callback_data: `getscript_detail|${i}` }
                ]));

                return ctx.reply("*📦 DAFTAR SCRIPT*\n\nPilih Script untuk melihat detail:", {
                    parse_mode: "Markdown",
                    reply_markup: { inline_keyboard: buttons }
                });
            }

            // ===== ADD STOCK (OWNER ONLY) =====
            case "addstock": {
                if (!isOwner(ctx)) return ctx.reply("❌ Owner Only!");
                if (!text.includes("|")) return ctx.reply(`Format: ${config.prefix}addstock kategori|keterangan|data akun|harga\n\nContoh: ${config.prefix}addstock netflix|1 Bulan|email: xxx@gmail.com pass: xxx123|25000`);

                const parts = text.split("|").map(v => v.trim());
                if (parts.length < 4) {
                    return ctx.reply("Format tidak valid! Gunakan: kategori|keterangan|data akun|harga");
                }

                const [category, description, accountData, priceStr] = parts;
                const price = parseInt(priceStr);

                if (!category || !description || !accountData || isNaN(price)) {
                    return ctx.reply("Data tidak valid! Pastikan semua field terisi dan harga berupa angka.");
                }

                const stocks = loadStocks();

                if (!stocks[category]) {
                    stocks[category] = [];
                }

                let itemAdded = false;
                let existingGroup = null;
                let groupIndex = -1;

                for (let i = 0; i < stocks[category].length; i++) {
                    const item = stocks[category][i];
                    if (item.description.toLowerCase() === description.toLowerCase() &&
                        item.price === price) {
                        existingGroup = item;
                        groupIndex = i;
                        break;
                    }
                }

                if (existingGroup) {
                    const accountExists = existingGroup.accounts.some(acc => acc === accountData);

                    if (!accountExists) {
                        existingGroup.accounts.push(accountData);
                        existingGroup.stock += 1;
                        itemAdded = true;
                    } else {
                        return ctx.reply(`⚠️ Akun ini sudah ada dalam database!\n\n📁 Kategori: *${escapeMarkdown(category)}*\n📝 Deskripsi: ${escapeMarkdown(description)}\n💰 Harga: Rp${toRupiah(price)}\n\nTidak perlu ditambahkan lagi.`,
                            { parse_mode: "Markdown" });
                    }
                } else {
                    stocks[category].push({
                        description: description,
                        price: price,
                        stock: 1,
                        accounts: [accountData],
                        added_date: new Date().toISOString()
                    });
                    itemAdded = true;
                    groupIndex = stocks[category].length - 1;
                }

                saveStocks(stocks);

                if (itemAdded) {
                    const totalItemsInCategory = stocks[category].reduce((sum, item) => sum + item.accounts.length, 0);
                    const totalItemsInGroup = existingGroup ? existingGroup.accounts.length : 1;

                    let responseText = `✅ Stock berhasil ditambahkan!\n\n`;
                    responseText += `📁 Kategori: *${escapeMarkdown(category)}*\n`;
                    responseText += `📝 Keterangan: ${escapeMarkdown(description)}\n`;
                    responseText += `💰 Harga: Rp${toRupiah(price)}\n`;
                    responseText += `🔑 Data Akun: ${escapeMarkdown(accountData.substring(0, 30))}...\n\n`;

                    if (existingGroup) {
                        responseText += `📊 *Informasi Grouping:*\n`;
                        responseText += `├ Total akun dalam group: ${totalItemsInGroup}\n`;
                        responseText += `└ Index group: ${groupIndex + 1}\n\n`;
                    } else {
                        responseText += `📊 *Grouping baru dibuat*\n`;
                        responseText += `└ Group ke: ${groupIndex + 1} dalam kategori\n\n`;
                    }

                    responseText += `📈 *Statistik Kategori ${escapeMarkdown(category.toUpperCase())}*\n`;
                    responseText += `├ Total group: ${stocks[category].length}\n`;
                    responseText += `└ Total item: ${totalItemsInCategory}`;

                    await ctx.reply(responseText, { parse_mode: "Markdown" });
                    return broadcastNewProduct(ctx, "APPS PREMIUM", category, description, price, "/buyapps")
                }

                break;
            }

            // ===== ADD STOCK DIGITAL OCEAN (OWNER ONLY) =====
            case "addstockdo": {
                if (!isOwner(ctx)) return ctx.reply("❌ Owner Only!");
                if (!text.includes("|")) return ctx.reply(`Format: ${config.prefix}addstockdo kategori|keterangan|data akun|harga\n\nContoh: ${config.prefix}addstockdo 3 Droplet|1 Bulan|email: xxx@gmail.com pass: xxx123|120000`);

                const parts = text.split("|").map(v => v.trim());
                if (parts.length < 4) {
                    return ctx.reply("Format tidak valid! Gunakan: kategori|keterangan|data akun|harga");
                }

                const [category, description, accountData, priceStr] = parts;
                const price = parseInt(priceStr);

                if (!category || !description || !accountData || isNaN(price)) {
                    return ctx.reply("Data tidak valid! Pastikan semua field terisi dan harga berupa angka.");
                }

                const doData = loadDO();

                if (!doData[category]) {
                    doData[category] = [];
                }

                let itemAdded = false;
                let existingGroup = null;
                let groupIndex = -1;

                for (let i = 0; i < doData[category].length; i++) {
                    const item = doData[category][i];
                    if (item.description.toLowerCase() === description.toLowerCase() &&
                        item.price === price) {
                        existingGroup = item;
                        groupIndex = i;
                        break;
                    }
                }

                if (existingGroup) {
                    const accountExists = existingGroup.accounts.some(acc => acc === accountData);

                    if (!accountExists) {
                        existingGroup.accounts.push(accountData);
                        existingGroup.stock += 1;
                        itemAdded = true;
                    } else {
                        return ctx.reply(`⚠️ Akun ini sudah ada dalam database!\n\n📁 Kategori: *${escapeMarkdown(category)}*\n📝 Deskripsi: ${escapeMarkdown(description)}\n💰 Harga: Rp${toRupiah(price)}\n\nTidak perlu ditambahkan lagi.`,
                            { parse_mode: "Markdown" });
                    }
                } else {
                    doData[category].push({
                        description: description,
                        price: price,
                        stock: 1,
                        accounts: [accountData],
                        added_date: new Date().toISOString()
                    });
                    itemAdded = true;
                    groupIndex = doData[category].length - 1;
                }

                saveDO(doData);

                if (itemAdded) {
                    const totalItemsInCategory = doData[category].reduce((sum, item) => sum + item.accounts.length, 0);
                    const totalItemsInGroup = existingGroup ? existingGroup.accounts.length : 1;

                    let responseText = `✅ Stock Digital Ocean berhasil ditambahkan!\n\n`;
                    responseText += `📁 Kategori: *${escapeMarkdown(category)}*\n`;
                    responseText += `📝 Keterangan: ${escapeMarkdown(description)}\n`;
                    responseText += `💰 Harga: Rp${toRupiah(price)}\n`;
                    responseText += `🔑 Data Akun: ${escapeMarkdown(accountData.substring(0, 30))}...\n\n`;

                    if (existingGroup) {
                        responseText += `📊 *Informasi Grouping:*\n`;
                        responseText += `├ Total akun dalam group: ${totalItemsInGroup}\n`;
                        responseText += `└ Index group: ${groupIndex + 1}\n\n`;
                    } else {
                        responseText += `📊 *Grouping baru dibuat*\n`;
                        responseText += `└ Group ke: ${groupIndex + 1} dalam kategori\n\n`;
                    }

                    responseText += `📈 *Statistik Kategori ${escapeMarkdown(category.toUpperCase())}*\n`;
                    responseText += `├ Total group: ${doData[category].length}\n`;
                    responseText += `└ Total item: ${totalItemsInCategory}`;

                    await ctx.reply(responseText, { parse_mode: "Markdown" });
                    return broadcastNewProduct(ctx, "DIGITAL OCEAN", category, description, price, "/buydo")
                }

                break;
            }

            // ===== GET/DEL STOCK (OWNER ONLY) =====
            case "getstock":
            case "delstock":
            case "getstockdo":
            case "delstockdo": {
                if (!isOwner(ctx)) return ctx.reply("❌ Owner Only!");

                const isDO = command.includes("do");
                const data = isDO ? loadDO() : loadStocks();
                const categories = Object.keys(data);

                if (categories.length === 0) {
                    return ctx.reply(`📭 Tidak ada stok ${isDO ? 'Digital Ocean' : 'apps'} tersedia.`);
                }

                const categoryButtons = categories.map(cat => [
                    {
                        text: `📁 ${escapeMarkdown(cat.toUpperCase())} (${data[cat].reduce((sum, item) => sum + item.accounts.length, 0)} items)`,
                        callback_data: `${isDO ? 'do' : 'view'}_category|${cat}`
                    }
                ]);

                return ctx.reply(`📊 *DAFTAR KATEGORI STOCK ${isDO ? 'DIGITAL OCEAN' : 'APPS'}*\n\nPilih kategori untuk ${command.includes('del') ? 'menghapus' : 'melihat'} stock:`, {
                    parse_mode: "Markdown",
                    reply_markup: { inline_keyboard: categoryButtons }
                });
            }

            case "buypanel": {
    if (!text) return ctx.reply(`Ketik ${config.prefix}buypanel username untuk membeli panel.`);
    if (text.includes(" ")) return ctx.reply("Format username dilarang memakai spasi!");
    const user = text;
    const panelButtons = [];
    const dataPanel = Object.keys(hargaPanel)

    for (let i of dataPanel) {
        const key = `${i}`;
        panelButtons.push([
            { text: `⚡ ${i.toUpperCase()} - Rp${hargaPanel[i].toLocaleString("id-ID")}`, callback_data: `panel_ram|${key}|${user}` }
        ]);
    }

    return ctx.reply("Pilih Ram Panel Pterodactyl:", {
        reply_markup: { inline_keyboard: panelButtons }
    });
}

            // ===== BUY ADMIN =====
           case "buyadp":  case "buyadmin": {
                if (!text)
                    return ctx.reply(`Ketik ${config.prefix}buyadmin username untuk membeli admin panel.`);
                if (text.includes(" "))
                    return ctx.reply("Format username dilarang memakai spasi!");

                const fee = generateRandomFee();
                const price = hargaAdminPanel
                const name = "Admin Panel";
                const user = text;

                // Menampilkan konfirmasi dulu sebelum ke pembayaran
                return ctx.reply(createConfirmationText("admin", name, price, fee, { username: user }), {
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "✅ Lanjut Pembayaran", callback_data: `confirm_admin|${user}` },
                                { text: "❌ Batalkan", callback_data: "cancel_order" }
                            ]
                        ]
                    }
                });
            }
            
default:
  return next();
            }
    });

    // ===== CALLBACK QUERIES =====
    
bot.action("buyscript", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();

  // Load daftar script dari storage/database
  const scriptsList = loadScripts();

  // Jika stok kosong
  if (!scriptsList.length) {
    return ctx.answerCbQuery("❌ Stok script sedang kosong!", {
      show_alert: true,
    });
  }

  // Generate tombol list script
  const scriptButtons = scriptsList.map((s) => [
    {
      text: `📂 ${s.name} • Rp${Number(s.price).toLocaleString("id-ID")}`,
      callback_data: `confirm_script|${s.name}`,
    },
  ]);

  // Kirim menu script dengan tampilan HTML Developer Style
  const caption = `
<blockquote><b>┌───「 🛒 SCRIPT STORE 」───┐
├ 📌 Silakan pilih script yang tersedia
├ ⚡ Semua produk sudah siap pakai
├ 💻 Developer Premium Resources
├────────────────────────
├ 📦 Total Script : ${scriptsList.length}
└────────────────────────</b></blockquote>
<blockquote><b>👇 Pilih salah satu script di bawah untuk lanjut checkout.</b></blockquote>
  `.trim();

  await ctx.reply(caption, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: scriptButtons,
    },
  });
});
bot.action("buyapp", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  await ctx.deleteMessage().catch(() => {});

  const stocks = loadStocks();
  const categories = Object.keys(stocks || {});

  // ✅ kalau kosong: popup + edit message + tombol balik
  if (!categories.length) {
    await ctx.answerCbQuery(
      "Stock Apps belum tersedia.\nHubungi admin untuk info lebih lanjut.",
      { show_alert: true }
    ).catch(() => {});

    return smartEdit(
      ctx,
      `<blockquote><b>❌ Stock Apps Premium belum tersedia.</b></blockquote>
<blockquote><b>Silakan hubungi admin untuk info lebih lanjut.</b></blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "owner", url: "@Rizzxtzy" }]
          ]
        }
      }
    );
  }

  // ✅ kalau ada kategori: tampilkan list kategori apps
  const categoryButtons = categories.map((cat) => [
    {
      text: `📱 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
      callback_data: `app_category|${cat}`,
    },
  ]);

  // tombol balik ke storemenu
  categoryButtons.push([
    { text: "owner", url: "@Rizzxtzy" }
  ]);

  return smartEdit(
    ctx,
    `<blockquote><b>Pilih Kategori Apps Premium:</b></blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: categoryButtons },
    }
  );
});

// optional biar tombol pager ga error
bot.action("noop", async (ctx) => ctx.answerCbQuery().catch(() => {}));

bot.action("buydo", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});

  const doData = loadDO();
  const categories = Object.keys(doData || {});

  // ✅ kalau kosong: popup + edit pesan biar user lihat
  if (!categories.length) {
    await ctx.answerCbQuery(
      "Stock belum tersedia.\nHubungi admin untuk info lebih lanjut.",
      { show_alert: true }
    ).catch(() => {});

    return smartEdit(
      ctx,
      `<blockquote><b>❌ Stock Digital Ocean belum tersedia.</b></blockquote>
<blockquote><b>Silakan hubungi admin untuk info lebih lanjut.</b></blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅️ KEMBALI", callback_data: "storemenu" }]
          ]
        }
      }
    );
  }

  // kalau ada kategori lanjut normal
  const categoryButtons = categories.map((cat) => [
    {
      text: `🌊 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
      callback_data: `do_category_buy|${cat}`,
    },
  ]);

  categoryButtons.push([
    { text: "⬅️ KEMBALI", callback_data: "storemenu" }
  ]);

  return smartEdit(
    ctx,
    `<blockquote><b>Pilih Kategori Akun Digital Ocean:</b></blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: categoryButtons },
    }
  );
});

bot.action("buyvps", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});

  if (!config.apiDigitalOcean) {
    return ctx.answerCbQuery("Fitur VPS belum tersedia", { show_alert: true }).catch(() => {});
  }

  const packageButtons = vpsPackages.map((pkg) => [
    {
      text: `${pkg.label} - Rp${toRupiah(pkg.price)}`,
      callback_data: `vps_step1|${pkg.key}`,
    },
  ]);

  // tombol balik ke menu utama lu (sesuaikan callback_data nya)
  packageButtons.push([{ text: "⬅️ KEMBALI", callback_data: "storemenu" }]);

  const caption =
    `<blockquote><b>🛍️ VPS MENU</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>Pilih Paket Ram & Cpu VPS:</b></blockquote>`;

  // EDIT pesan yang sama (yang punya tombol buyvps)
  try {
    if (ctx.update?.callback_query?.message?.photo?.length) {
      // kalau message itu foto + caption
      await ctx.editMessageCaption(caption, {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: packageButtons },
      });
    } else {
      // kalau message itu teks biasa
      await ctx.editMessageText(caption, {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: packageButtons },
      });
    }
  } catch (e) {
    // fallback kalau edit gagal (misal message sudah berubah)
    await ctx.reply(caption, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: packageButtons },
    });
  }
});

bot.action("buypanel", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  // ini cuma instruksi, karena username harus dari text user
  return smartEdit(
    ctx,
    `<blockquote><b>🧩 BUY PANEL</b>\n\nKetik <code>${config.prefix}buypanel username</code> untuk membeli panel.</blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "⬅️ KEMBALI", callback_data: "storemenu" }]]
      }
    }
  );
});

    bot.action("buyadmin", async (ctx) => {
        await ctx.answerCbQuery();
        return ctx.reply(`Ketik ${config.prefix}buyadmin username untuk membeli admin panel.`);
    });

    bot.action("cancel_order", async (ctx) => {
        await ctx.answerCbQuery();
        const userId = ctx.from.id;
        const order = orders[userId];

        if (order) {
            try {
                if (order.qrMessageId) {
                    await ctx.telegram.deleteMessage(order.chatId, order.qrMessageId);
                }
            } catch {
                // Skip error
            }
        } else {
            await ctx.deleteMessage();
        }

        delete orders[userId];

        return ctx.telegram.sendMessage(
            ctx.chat.id,
            "❌ Order berhasil dibatalkan.\nSilakan order ulang dari .menu",
            {
                parse_mode: "Markdown"
            }
        );
    });

    bot.action("back_to_main_menu", async (ctx) => {
       await ctx.deleteMessage();
        await ctx.answerCbQuery();
        return ctx.replyWithPhoto(config.menuImage, {
            caption: menuTextBot(ctx),
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                            [
                            { text: "🛒 Katalog Produk", callback_data: "katalog" }
                            ], 
                            [
                                { text: "📢 Testimoni", url: config.channelLink }, 
                                { text: "📞 Developer", url: "https://t.me/"+config.ownerUsername }
                            ]
                        ]
            }
        });
    });
    
    bot.action("katalog", async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.deleteMessage();
        const storeMenuKeyboard = {
  inline_keyboard: [
    [
      { text: "🌐 Buy Panel", callback_data: "buypanel" },
      { text: "🔖 Buy Admin", callback_data: "buyadmin" }
    ],
    [
      { text: "📂 Buy Script", callback_data: "buyscript" },
      { text: "🖥️ Buy VPS", callback_data: "buyvps" }
    ],
    [
      { text: "🌊 Buy Digital Ocean", callback_data: "buydo" },

    ], 
        [
            { text: "📱 Buy Apps Premium", callback_data: "buyapp" }

    ], 
        [
      { text: "⬅️ Kembali Ke Menu", callback_data: "back_to_main_menu" }
    ]
  ]
}
        return ctx.replyWithPhoto(config.menuImage, {
            caption: "*Pilih Produk:*",
            parse_mode: "Markdown",
            reply_markup: storeMenuKeyboard
        });
    });
    
    bot.action("profile", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});

  const users = loadUsers();
  const fromId = ctx.from.id;

  const user = users.find((u) => u.id === fromId);
  if (!user) {
    return smartEdit(ctx, "❌ User tidak ditemukan.", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ KEMBALI", callback_data: "storemenu" }]
        ]
      }
    });
  }

  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const fullName = firstName + (lastName ? " " + lastName : "");

  const userUsername = user.username
    ? "@" + user.username
    : "Tidak ada";

  // ===== Last Transactions =====
  let lastTransactions = "_Belum ada transaksi_";

  if (user.history && user.history.length > 0) {
    lastTransactions = user.history
      .slice(-3)
      .reverse()
      .map((t, i) => {
        const product = escapeMarkdown(t.product);
        const amount = toRupiah(t.amount);
        const date = new Date(t.timestamp).toLocaleDateString("id-ID");

        return `${i + 1}. ${product} - Rp${amount} (${date})`;
      })
      .join("\n");
  }

  // ===== Profile Text =====
  const profileText = `*👤 PROFILE USER*

*📛 Nama:* ${escapeMarkdown(fullName)}
*🆔 User ID:* \`${user.id}\`
*📧 Username:* ${escapeMarkdown(userUsername)}
*📅 Join Date:* ${new Date(user.join_date).toLocaleDateString("id-ID")}

*💰 Total Spent:* Rp${toRupiah(user.total_spent || 0)}
*📊 Total Transaksi:* ${user.history ? user.history.length : 0}

*📋 Last 3 Transactions:*
${lastTransactions}
`;

  return smartEdit(ctx, profileText, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "⬅️ KEMBALI", callback_data: "storemenu" }]
      ]
    }
  });
});

    // ===== STOCK CATEGORY VIEW =====
    bot.action(/view_category\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const category = ctx.match[1];
        const stocks = loadStocks();
        const items = stocks[category];

        if (!items || items.length === 0) {
            return ctx.editMessageText(`❌ Tidak ada stock di kategori *${escapeMarkdown(category)}*.`,
                { parse_mode: "Markdown" });
        }

        let allItems = [];
        let globalIndex = 0;

        items.forEach((item, itemIdx) => {
            item.accounts.forEach((account, accIdx) => {
                allItems.push({
                    category: category,
                    description: item.description,
                    price: item.price,
                    account: account,
                    globalIndex: globalIndex,
                    itemIndex: itemIdx,
                    accountIndex: accIdx,
                    added_date: item.added_date,
                    totalInGroup: item.accounts.length,
                    stockInGroup: item.stock
                });
                globalIndex++;
            });
        });

        const itemsPerPage = 8;
        const totalPages = Math.ceil(allItems.length / itemsPerPage);
        let currentPage = 0;

        const createPage = (page) => {
            const startIdx = page * itemsPerPage;
            const endIdx = Math.min(startIdx + itemsPerPage, allItems.length);
            const pageItems = allItems.slice(startIdx, endIdx);

            const buttons = pageItems.map((item, idx) => [
                {
                    text: `📦 ${escapeMarkdown(item.description)} - Rp${toRupiah(item.price)}`,
                    callback_data: `stock_detail|${category}|${item.itemIndex}|${item.accountIndex}`
                }
            ]);

            const navButtons = [];
            if (totalPages > 1) {
                if (page > 0) {
                    navButtons.push({ text: "◀️ Prev", callback_data: `category_page|${category}|${page - 1}` });
                }
                navButtons.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
                if (page < totalPages - 1) {
                    navButtons.push({ text: "Next ▶️", callback_data: `category_page|${category}|${page + 1}` });
                }
            }

            const actionButtons = [
                [
                    { text: "🗑️ Hapus Kategori", callback_data: `del_category|${category}` },
                    { text: "↩️ Back Kategori", callback_data: "back_to_categories" }
                ]
            ];

            if (navButtons.length > 0) {
                buttons.push(navButtons);
            }
            buttons.push(...actionButtons);

            return {
                text: `📊 *STOCK KATEGORI: ${escapeMarkdown(category.toUpperCase())}*\n\n` +
                    `📝 Total Item: ${allItems.length}\n` +
                    `📅 Halaman: ${page + 1}/${totalPages}\n\n` +
                    `Pilih item untuk melihat detail:`,
                keyboard: { inline_keyboard: buttons }
            };
        };

        const pageData = createPage(currentPage);
        return ctx.editMessageText(pageData.text, {
            parse_mode: "Markdown",
            reply_markup: pageData.keyboard
        });
    });


// === DIGITAL OCEAN CATEGORY VIEW (OWNER) ===
bot.action(/do_category\|(.+)/, async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  if (!isOwner(ctx)) return ctx.answerCbQuery("❌ Owner Only!").catch(() => {});
  const category = ctx.match[1];
  const doData = loadDO();
  const items = doData[category];

  if (!items || items.length === 0) {
    return ctx.editMessageText(
      `❌ Tidak ada stock di kategori *${escapeMarkdown(category)}*.`,
      { parse_mode: "Markdown" }
    );
  }

  let allItems = [];
  let globalIndex = 0;

  items.forEach((item, itemIdx) => {
    item.accounts.forEach((account, accIdx) => {
      allItems.push({
        category,
        description: item.description,
        price: item.price,
        account,
        globalIndex,
        itemIndex: itemIdx,
        accountIndex: accIdx,
        added_date: item.added_date,
        totalInGroup: item.accounts.length,
        stockInGroup: item.stock,
      });
      globalIndex++;
    });
  });

  const itemsPerPage = 8;
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  let currentPage = 0;

  const createPage = (page) => {
    const startIdx = page * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, allItems.length);
    const pageItems = allItems.slice(startIdx, endIdx);

    const buttons = pageItems.map((item) => [
      {
        text: `🌊 ${escapeMarkdown(item.description)} - Rp${toRupiah(item.price)}`,
        callback_data: `do_detail|${category}|${item.itemIndex}|${item.accountIndex}`,
      },
    ]);

    const navButtons = [];
    if (totalPages > 1) {
      if (page > 0) navButtons.push({ text: "◀️ Prev", callback_data: `do_category_page|${category}|${page - 1}` });
      navButtons.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
      if (page < totalPages - 1) navButtons.push({ text: "Next ▶️", callback_data: `do_category_page|${category}|${page + 1}` });
    }

    const actionButtons = [
      [
        { text: "🗑️ Hapus Kategori", callback_data: `del_do_category|${category}` },
        { text: "↩️ Back Kategori", callback_data: "back_to_do_categories" },
      ],
    ];

    if (navButtons.length) buttons.push(navButtons);
    buttons.push(...actionButtons);

    return {
      text:
        `🌊 *DIGITAL OCEAN KATEGORI: ${escapeMarkdown(category.toUpperCase())}*\n\n` +
        `📝 Total Item: ${allItems.length}\n` +
        `📅 Halaman: ${page + 1}/${totalPages}\n\n` +
        `Pilih item untuk melihat detail:`,
      keyboard: { inline_keyboard: buttons },
    };
  };

  const pageData = createPage(currentPage);
  return ctx.editMessageText(pageData.text, {
    parse_mode: "Markdown",
    reply_markup: pageData.keyboard,
  });
});


// == DIGITAL OCEAN BUY CATEGORY (USER) ===
bot.action(/do_category_buy\|(.+)/, async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const category = ctx.match[1];
  const doData = loadDO();
  const items = doData?.[category];

  if (!items || items.length === 0) {
    return smartEdit(
      ctx,
      `❌ Stok untuk kategori *${escapeMarkdown(category)}* sedang kosong.`,
      { parse_mode: "Markdown" }
    );
  }

  const itemButtons = items.map((item, index) => [
    {
      text: `🌊 ${escapeMarkdown(item.description)} - Rp${toRupiah(item.price)} (stok ${item.stock})`,
      callback_data: `do_item_buy|${category}|${index}`,
    },
  ]);

  // ✅ back ke kategori + back ke storemenu
  itemButtons.push([{ text: "↩️ Kembali ke Kategori", callback_data: "back_do_buy_category" }]);
  itemButtons.push([{ text: "⬅️ Kembali ke Store Menu", callback_data: "storemenu" }]);

  return smartEdit(
    ctx,
    `📦 Kategori DO: *${escapeMarkdown(category.toUpperCase())}*\n\n*Pilih Stock Akun:*`,
    {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: itemButtons },
    }
  );
});


// back ke list kategori (BUY)
bot.action("back_do_buy_category", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const doData = loadDO();
  const categories = Object.keys(doData || {});

  if (!categories.length) {
    return smartEdit(ctx, "📭 Stok Digital Ocean sedang kosong.", { parse_mode: "Markdown" });
  }

  const categoryButtons = categories.map((cat) => [
    { text: `🌊 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`, callback_data: `do_category_buy|${cat}` },
  ]);

  // ✅ tombol balik storemenu
  categoryButtons.push([{ text: "⬅️ KEMBALI", callback_data: "storemenu" }]);

  return smartEdit(ctx, "*Pilih Kategori Digital Ocean:*", {
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: categoryButtons },
  });
});


// ===== DIGITAL OCEAN BUY ITEM =====
bot.action(/do_item_buy\|(.+)/, async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const [category, indexStr] = ctx.match[1].split("|");
  const index = parseInt(indexStr, 10);

  const doData = loadDO();
  const items = doData?.[category];

  if (!items || !items[index]) {
    return smartEdit(ctx, "❌ Item tidak ditemukan!", { parse_mode: "Markdown" });
  }

  const item = items[index];
  if (Number(item.stock) <= 0) {
    return smartEdit(ctx, "❌ Stok habis!", { parse_mode: "Markdown" });
  }

  const fee = generateRandomFee();
  const price = item.price;
  const name = `Digital Ocean ${category} (${item.description})`;

  const confirmationText = createConfirmationText("do", name, price, fee, {
    category,
    description: item.description,
  });

  return smartEdit(ctx, confirmationText, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Konfirmasi", callback_data: `confirm_do_payment|${category}|${index}` },
          { text: "❌ Batalkan", callback_data: `do_category_buy|${category}` },
        ],
        [{ text: "⬅️ Kembali ke Store Menu", callback_data: "storemenu" }],
      ],
    },
  });
});

    // ===== KONFIRMASI PEMBAYARAN DO =====
    bot.action(/confirm_do_payment\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.deleteMessage();

        const [category, indexStr] = ctx.match[1].split("|");
        const index = parseInt(indexStr);
        const doData = loadDO();
        const items = doData[category];

        if (!items || !items[index]) {
            return ctx.reply("❌ Item tidak ditemukan!");
        }

        const item = items[index];
        if (item.stock <= 0) {
            return ctx.reply("❌ Stok habis!");
        }

        const userId = ctx.from.id;
        const fee = generateRandomFee();
        const price = item.price + fee;
        const name = `Digital Ocean ${category} (${item.description})`;

        const paymentType = config.paymentGateway;

        const pay = await createPayment(paymentType, price, config);

        orders[userId] = {
            type: "do",
            category,
            itemIndex: index,
            name,
            description: item.description,
            account: item.accounts[0],
            accounts: item.accounts,
            amount: price,
            fee,
            orderId: pay.orderId || null,
            paymentType: paymentType,
            chatId: ctx.chat.id,
            expireAt: Date.now() + 6 * 60 * 1000
        };

        const photo =
            paymentType === "pakasir"
                ? { source: pay.qris }
                : pay.qris;

        const qrMsg = await ctx.replyWithPhoto(photo, {
            caption: textOrder(name, price, fee),
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Batalkan Order", callback_data: "cancel_order" }]
                ]
            }
        });

        orders[userId].qrMessageId = qrMsg.message_id;
        startCheck(userId, ctx);
    });

    bot.action(/category_page\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const [category, pageStr] = ctx.match[1].split("|");
        const page = parseInt(pageStr);

        const stocks = loadStocks();
        const items = stocks[category];

        if (!items) {
            return ctx.editMessageText("❌ Kategori tidak ditemukan.");
        }

        let allItems = [];
        let globalIndex = 0;

        items.forEach((item, itemIdx) => {
            item.accounts.forEach((account, accIdx) => {
                allItems.push({
                    category: category,
                    description: item.description,
                    price: item.price,
                    account: account,
                    globalIndex: globalIndex,
                    itemIndex: itemIdx,
                    accountIndex: accIdx,
                    added_date: item.added_date,
                    totalInGroup: item.accounts.length,
                    stockInGroup: item.stock
                });
                globalIndex++;
            });
        });

        const itemsPerPage = 8;
        const totalPages = Math.ceil(allItems.length / itemsPerPage);

        const createPage = (pageNum) => {
            const startIdx = pageNum * itemsPerPage;
            const endIdx = Math.min(startIdx + itemsPerPage, allItems.length);
            const pageItems = allItems.slice(startIdx, endIdx);

            const buttons = pageItems.map((item, idx) => [
                {
                    text: `📦 ${escapeMarkdown(item.description)} - Rp${toRupiah(item.price)}`,
                    callback_data: `stock_detail|${category}|${item.itemIndex}|${item.accountIndex}`
                }
            ]);

            const navButtons = [];
            if (totalPages > 1) {
                if (pageNum > 0) {
                    navButtons.push({ text: "◀️ Prev", callback_data: `category_page|${category}|${pageNum - 1}` });
                }
                navButtons.push({ text: `${pageNum + 1}/${totalPages}`, callback_data: "noop" });
                if (pageNum < totalPages - 1) {
                    navButtons.push({ text: "Next ▶️", callback_data: `category_page|${category}|${pageNum + 1}` });
                }
            }

            const actionButtons = [
                [
                    { text: "🗑️ Hapus Kategori", callback_data: `del_category|${category}` },
                    { text: "↩️ Back Kategori", callback_data: "back_to_categories" }
                ]
            ];

            if (navButtons.length > 0) {
                buttons.push(navButtons);
            }
            buttons.push(...actionButtons);

            return {
                text: `📊 *STOCK KATEGORI: ${escapeMarkdown(category.toUpperCase())}*\n\n` +
                    `📝 Total Item: ${allItems.length}\n` +
                    `📅 Halaman: ${pageNum + 1}/${totalPages}\n\n` +
                    `Pilih item untuk melihat detail:`,
                keyboard: { inline_keyboard: buttons }
            };
        };

        const pageData = createPage(page);
        return ctx.editMessageText(pageData.text, {
            parse_mode: "Markdown",
            reply_markup: pageData.keyboard
        });
    });

    bot.action(/do_category_page\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const [category, pageStr] = ctx.match[1].split("|");
        const page = parseInt(pageStr);

        const doData = loadDO();
        const items = doData[category];

        if (!items) {
            return ctx.editMessageText("❌ Kategori tidak ditemukan.");
        }

        let allItems = [];
        let globalIndex = 0;

        items.forEach((item, itemIdx) => {
            item.accounts.forEach((account, accIdx) => {
                allItems.push({
                    category: category,
                    description: item.description,
                    price: item.price,
                    account: account,
                    globalIndex: globalIndex,
                    itemIndex: itemIdx,
                    accountIndex: accIdx,
                    added_date: item.added_date,
                    totalInGroup: item.accounts.length,
                    stockInGroup: item.stock
                });
                globalIndex++;
            });
        });

        const itemsPerPage = 8;
        const totalPages = Math.ceil(allItems.length / itemsPerPage);

        const createPage = (pageNum) => {
            const startIdx = pageNum * itemsPerPage;
            const endIdx = Math.min(startIdx + itemsPerPage, allItems.length);
            const pageItems = allItems.slice(startIdx, endIdx);

            const buttons = pageItems.map((item, idx) => [
                {
                    text: `🌊 ${escapeMarkdown(item.description)} - Rp${toRupiah(item.price)}`,
                    callback_data: `do_detail|${category}|${item.itemIndex}|${item.accountIndex}`
                }
            ]);

            const navButtons = [];
            if (totalPages > 1) {
                if (pageNum > 0) {
                    navButtons.push({ text: "◀️ Prev", callback_data: `do_category_page|${category}|${pageNum - 1}` });
                }
                navButtons.push({ text: `${pageNum + 1}/${totalPages}`, callback_data: "noop" });
                if (pageNum < totalPages - 1) {
                    navButtons.push({ text: "Next ▶️", callback_data: `do_category_page|${category}|${pageNum + 1}` });
                }
            }

            const actionButtons = [
                [
                    { text: "🗑️ Hapus Kategori", callback_data: `del_do_category|${category}` },
                    { text: "↩️ Back Kategori", callback_data: "back_to_do_categories" }
                ]
            ];

            if (navButtons.length > 0) {
                buttons.push(navButtons);
            }
            buttons.push(...actionButtons);

            return {
                text: `🌊 *DIGITAL OCEAN KATEGORI: ${escapeMarkdown(category.toUpperCase())}*\n\n` +
                    `📝 Total Item: ${allItems.length}\n` +
                    `📅 Halaman: ${pageNum + 1}/${totalPages}\n\n` +
                    `Pilih item untuk melihat detail:`,
                keyboard: { inline_keyboard: buttons }
            };
        };

        const pageData = createPage(page);
        return ctx.editMessageText(pageData.text, {
            parse_mode: "Markdown",
            reply_markup: pageData.keyboard
        });
    });

    bot.action(/stock_detail\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const [category, itemIndexStr, accountIndexStr] = ctx.match[1].split("|");
        const itemIndex = parseInt(itemIndexStr);
        const accountIndex = parseInt(accountIndexStr);

        const stocks = loadStocks();

        if (!stocks[category] || !stocks[category][itemIndex]) {
            return ctx.editMessageText("❌ Item tidak ditemukan.");
        }

        const item = stocks[category][itemIndex];
        const account = item.accounts[accountIndex];

        if (!account) {
            return ctx.editMessageText("❌ Akun tidak ditemukan.");
        }

        const detailText = `📋 *DETAIL STOCK ITEM*

📁 *Kategori:* ${escapeMarkdown(category.toUpperCase())}
📝 *Deskripsi:* ${escapeMarkdown(item.description)}
💰 *Harga:* Rp${toRupiah(item.price)}
📅 *Ditambahkan:* ${new Date(item.added_date).toLocaleDateString('id-ID')}

🔑 *Data Akun:* 
\`${escapeMarkdown(account)}\`

📊 *Informasi Grup:*
├ Total Akun: ${item.accounts.length}
├ Stok: ${item.stock}
└ Index: ${itemIndex + 1}/${stocks[category].length} (kategori)`;

        return ctx.editMessageText(detailText, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🗑️ Hapus Stock", callback_data: `del_stock_item|${category}|${itemIndex}|${accountIndex}` }
                    ],
                    [
                        { text: "↩️ Back Stock", callback_data: `view_category|${category}` },
                        { text: "⬅️ Back Kategori", callback_data: "back_to_categories" }
                    ]
                ]
            }
        });
    });

    bot.action(/do_detail\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const [category, itemIndexStr, accountIndexStr] = ctx.match[1].split("|");
        const itemIndex = parseInt(itemIndexStr);
        const accountIndex = parseInt(accountIndexStr);

        const doData = loadDO();

        if (!doData[category] || !doData[category][itemIndex]) {
            return ctx.editMessageText("❌ Item tidak ditemukan.");
        }

        const item = doData[category][itemIndex];
        const account = item.accounts[accountIndex];

        if (!account) {
            return ctx.editMessageText("❌ Akun tidak ditemukan.");
        }

        const detailText = `🌊 *DETAIL DIGITAL OCEAN ITEM*

📁 *Kategori:* ${escapeMarkdown(category.toUpperCase())}
📝 *Deskripsi:* ${escapeMarkdown(item.description)}
💰 *Harga:* Rp${toRupiah(item.price)}
📅 *Ditambahkan:* ${new Date(item.added_date).toLocaleDateString('id-ID')}

🔑 *Data Akun:* 
\`${escapeMarkdown(account)}\`

📊 *Informasi Grup:*
├ Total Akun: ${item.accounts.length}
├ Stok: ${item.stock}
└ Index: ${itemIndex + 1}/${doData[category].length} (kategori)`;

        return ctx.editMessageText(detailText, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🗑️ Hapus Stock", callback_data: `del_do_item|${category}|${itemIndex}|${accountIndex}` }
                    ],
                    [
                        { text: "↩️ Back Stock", callback_data: `do_category|${category}` },
                        { text: "⬅️ Back Kategori", callback_data: "back_to_do_categories" }
                    ]
                ]
            }
        });
    });

    bot.action(/del_stock_item\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const [category, itemIndexStr, accountIndexStr] = ctx.match[1].split("|");
        const itemIndex = parseInt(itemIndexStr);
        const accountIndex = parseInt(accountIndexStr);

        const stocks = loadStocks();

        if (!stocks[category] || !stocks[category][itemIndex]) {
            return ctx.editMessageText("❌ Item tidak ditemukan.");
        }

        const item = stocks[category][itemIndex];
        const deletedAccount = item.accounts[accountIndex];

        item.accounts.splice(accountIndex, 1);
        item.stock -= 1;

        if (item.accounts.length === 0) {
            stocks[category].splice(itemIndex, 1);

            if (stocks[category].length === 0) {
                delete stocks[category];
                saveStocks(stocks);
                return ctx.editMessageText(
                    `✅ Item berhasil dihapus!\n\n` +
                    `📁 Kategori: ${escapeMarkdown(category)} (dihapus karena kosong)\n` +
                    `🔑 Akun yang dihapus: ${escapeMarkdown(deletedAccount.substring(0, 50))}...\n\n` +
                    `Kategori telah dihapus karena tidak ada item lagi.`,
                    {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "📋 Kembali ke List Kategori", callback_data: "back_to_categories" }]
                            ]
                        }
                    }
                );
            }
        }

        saveStocks(stocks);

        return ctx.editMessageText(
            `✅ Item berhasil dihapus!\n\n` +
            `📁 Kategori: ${escapeMarkdown(category)}\n` +
            `📝 Deskripsi: ${escapeMarkdown(item.description)}\n` +
            `🔑 Akun yang dihapus: ${escapeMarkdown(deletedAccount.substring(0, 50))}...\n` +
            `💰 Harga: Rp${toRupiah(item.price)}\n` +
            `📊 Sisa stok: ${item.accounts.length} akun`,
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "📂 Lihat Kategori", callback_data: `view_category|${category}` },
                            { text: "↩️ Back Kategori", callback_data: "back_to_categories" }
                        ]
                    ]
                }
            }
        );
    });

    bot.action(/del_do_item\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const [category, itemIndexStr, accountIndexStr] = ctx.match[1].split("|");
        const itemIndex = parseInt(itemIndexStr);
        const accountIndex = parseInt(accountIndexStr);

        const doData = loadDO();

        if (!doData[category] || !doData[category][itemIndex]) {
            return ctx.editMessageText("❌ Item tidak ditemukan.");
        }

        const item = doData[category][itemIndex];
        const deletedAccount = item.accounts[accountIndex];

        item.accounts.splice(accountIndex, 1);
        item.stock -= 1;

        if (item.accounts.length === 0) {
            doData[category].splice(itemIndex, 1);

            if (doData[category].length === 0) {
                delete doData[category];
                saveDO(doData);
                return ctx.editMessageText(
                    `✅ Item berhasil dihapus!\n\n` +
                    `📁 Kategori: ${escapeMarkdown(category)} (dihapus karena kosong)\n` +
                    `🔑 Akun yang dihapus: ${escapeMarkdown(deletedAccount.substring(0, 50))}...\n\n` +
                    `Kategori telah dihapus karena tidak ada item lagi.`,
                    {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "📋 Kembali ke List Kategori", callback_data: "back_to_do_categories" }]
                            ]
                        }
                    }
                );
            }
        }

        saveDO(doData);

        return ctx.editMessageText(
            `✅ Item berhasil dihapus!\n\n` +
            `📁 Kategori: ${escapeMarkdown(category)}\n` +
            `📝 Deskripsi: ${escapeMarkdown(item.description)}\n` +
            `🔑 Akun yang dihapus: ${escapeMarkdown(deletedAccount.substring(0, 50))}...\n` +
            `💰 Harga: Rp${toRupiah(item.price)}\n` +
            `📊 Sisa stok: ${item.accounts.length} akun`,
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "📂 Lihat Kategori", callback_data: `do_category|${category}` },
                            { text: "↩️ Back Kategori", callback_data: "back_to_do_categories" }
                        ]
                    ]
                }
            }
        );
    });

    bot.action(/del_category\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const category = ctx.match[1];
        const stocks = loadStocks();

        if (!stocks[category]) {
            return ctx.editMessageText("❌ Kategori tidak ditemukan.");
        }

        const totalItems = stocks[category].reduce((sum, item) => sum + item.accounts.length, 0);
        const categoryName = category;

        delete stocks[category];
        saveStocks(stocks);

        return ctx.editMessageText(
            `🗑️ *Kategori Berhasil Dihapus!*\n\n` +
            `📁 Kategori: ${escapeMarkdown(categoryName.toUpperCase())}\n` +
            `📊 Total Item: ${totalItems}\n` +
            `✅ Semua data dalam kategori ini telah dihapus.`,
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📋 Lihat Kategori Lain", callback_data: "back_to_categories" }]
                    ]
                }
            }
        );
    });

    bot.action(/del_do_category\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const category = ctx.match[1];
        const doData = loadDO();

        if (!doData[category]) {
            return ctx.editMessageText("❌ Kategori tidak ditemukan.");
        }

        const totalItems = doData[category].reduce((sum, item) => sum + item.accounts.length, 0);
        const categoryName = category;

        delete doData[category];
        saveDO(doData);

        return ctx.editMessageText(
            `🗑️ *Kategori Digital Ocean Berhasil Dihapus!*\n\n` +
            `📁 Kategori: ${escapeMarkdown(categoryName.toUpperCase())}\n` +
            `📊 Total Item: ${totalItems}\n` +
            `✅ Semua data dalam kategori ini telah dihapus.`,
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📋 Lihat Kategori Lain", callback_data: "back_to_do_categories" }]
                    ]
                }
            }
        );
    });

    bot.action("back_to_categories", async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const stocks = loadStocks();
        const categories = Object.keys(stocks);

        if (categories.length === 0) {
            return ctx.editMessageText("📭 Tidak ada stok tersedia.");
        }

        const categoryButtons = categories.map(cat => [
            {
                text: `📁 ${escapeMarkdown(cat.toUpperCase())} (${stocks[cat].reduce((sum, item) => sum + item.accounts.length, 0)} items)`,
                callback_data: `view_category|${cat}`
            }
        ]);

        return ctx.editMessageText("📊 *DAFTAR KATEGORI STOCK*\n\nPilih kategori untuk melihat stock:", {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: categoryButtons }
        });
    });

    bot.action("back_to_do_categories", async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const doData = loadDO();
        const categories = Object.keys(doData);

        if (categories.length === 0) {
            return ctx.editMessageText("📭 Tidak ada stok Digital Ocean tersedia.");
        }

        const categoryButtons = categories.map(cat => [
            {
                text: `🌊 ${escapeMarkdown(cat.toUpperCase())} (${doData[cat].reduce((sum, item) => sum + item.accounts.length, 0)} items)`,
                callback_data: `do_category|${cat}`
            }
        ]);

        return ctx.editMessageText("🌊 *DAFTAR KATEGORI DIGITAL OCEAN*\n\nPilih kategori untuk melihat stock:", {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: categoryButtons }
        });
    });

    bot.action("noop", async (ctx) => {
        await ctx.answerCbQuery();
    });

    bot.action("back_stock_category", async (ctx) => {
        await ctx.answerCbQuery();
        const stocks = loadStocks();
        const categories = Object.keys(stocks);

        if (categories.length === 0) {
            return ctx.reply("📭 Stok apps premium sedang kosong.");
        }

        const categoryButtons = categories.map(cat => [
            { text: `📱 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`, callback_data: `app_category|${cat}` }
        ]);

        return ctx.editMessageText("*Pilih Kategori Apps Premium:*", {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: categoryButtons }
        });
    });

    bot.action(/app_category\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        const category = ctx.match[1];
        const stocks = loadStocks();
        const items = stocks[category];

        if (!items || items.length === 0) {
            return ctx.editMessageText(`❌ Stok untuk kategori *${escapeMarkdown(category)}* sedang kosong.`,
                { parse_mode: "Markdown" });
        }

        const itemButtons = items.map((item, index) => [
            {
                text: `📱 ${escapeMarkdown(item.description)} - Rp${toRupiah(item.price)} (stok ${item.stock})`,
                callback_data: `app_item|${category}|${index}`
            }
        ]);

        itemButtons.push([
            {
                text: `↩️ Kembali ke Kategori`,
                callback_data: `back_stock_category`
            }
        ]);

        return ctx.editMessageText(`📦 Kategori APPS: *${escapeMarkdown(category.toUpperCase())}*\n\n*Pilih Stock Akun:*`, {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: itemButtons }
        });
    });

    bot.action(/app_item\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        const [category, indexStr] = ctx.match[1].split("|");
        const index = parseInt(indexStr);
        const stocks = loadStocks();
        const items = stocks[category];

        if (!items || !items[index]) {
            return ctx.editMessageText("❌ Item tidak ditemukan!");
        }

        const item = items[index];
        if (item.stock <= 0) {
            return ctx.editMessageText("❌ Stok habis!");
        }

        const fee = generateRandomFee();
        const price = item.price
        const name = `${category.toUpperCase()} - ${item.description}`;

        const confirmationText = createConfirmationText("app", name, price, fee, {
            category: category,
            description: item.description
        });

        return ctx.editMessageText(confirmationText, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Konfirmasi", callback_data: `confirm_app_payment|${category}|${index}` },
                        { text: "❌ Batalkan", callback_data: `app_category|${category}` }
                    ]
                ]
            }
        });
    });

    // ===== KONFIRMASI PEMBAYARAN APP =====
    bot.action(/confirm_app_payment\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.deleteMessage();

        const [category, indexStr] = ctx.match[1].split("|");
        const index = parseInt(indexStr);
        const stocks = loadStocks();
        const items = stocks[category];

        if (!items || !items[index]) {
            return ctx.reply("❌ Item tidak ditemukan!");
        }

        const item = items[index];
        if (item.stock <= 0) {
            return ctx.reply("❌ Stok habis!");
        }

        const userId = ctx.from.id;
        const fee = generateRandomFee();
        const basePrice = item.price
        const price = item.price + fee;
        const name = `${category.toUpperCase()} - ${item.description}`;

        const paymentType = config.paymentGateway;

        const pay = await createPayment(paymentType, price, config);

        orders[userId] = {
            type: "app",
            category,
            itemIndex: index,
            name,
            description: item.description,
            account: item.accounts[0],
            accounts: item.accounts,
            amount: price,
            fee,
            orderId: pay.orderId || null,
            paymentType: paymentType,
            chatId: ctx.chat.id,
            expireAt: Date.now() + 6 * 60 * 1000
        };

        const photo =
            paymentType === "pakasir"
                ? { source: pay.qris }
                : pay.qris;

        const qrMsg = await ctx.replyWithPhoto(photo, {
            caption: textOrder(name, basePrice, fee),
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Batalkan Order", callback_data: "cancel_order" }]
                ]
            }
        });

        orders[userId].qrMessageId = qrMsg.message_id;
        startCheck(userId, ctx);
    });

// Handler untuk kembali ke pilihan paket
bot.action(/back_to_packages/, async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});

  const packageButtons = vpsPackages.map((pkg) => [
    {
      text: `${pkg.label} - Rp${toRupiah(pkg.price)}`,
      callback_data: `vps_step1|${pkg.key}`
    }
  ]);

  // ✅ Tambahin tombol KEMBALI ke storemenu
  packageButtons.push([{ text: "⬅️ KEMBALI", callback_data: "storemenu" }]);

  return smartEdit(
    ctx,
    `<blockquote><b>🛍️ SHOP MENU</b>
━━━━━━━━━━━━━━━━━━━━━━
<b>Pilih Paket Ram & Cpu VPS:</b></blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: packageButtons }
    }
  );
});

// ===== VPS STEP 1: Pilih RAM & CPU (satu set) =====
bot.action(/vps_step1\|(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const specKey = ctx.match[1];

    if (!vpsSpecs[specKey]) {
        return smartEdit(
            ctx,
            `<blockquote>
<b>❌ Error:</b> Spec "<b>${specKey}</b>" tidak ditemukan.

Silakan ulangi dari awal: <b>${config.prefix}buyvps</b>
</blockquote>`,
            { parse_mode: "HTML" }
        );
    }

    const spec = vpsSpecs[specKey];

    const osButtons = Object.entries(vpsImages).map(([osKey, os]) => {
        const costInfo = getOSAdditionalCost(osKey);
        const priceText = costInfo.additional ? ` (+Rp${toRupiah(costInfo.cost)})` : '';

        return [
            {
                text: `${os.icon} ${os.name}${priceText}`,
                callback_data: `vps_step2|${specKey}|${osKey}`
            }
        ];
    });

    osButtons.push([
        {
            text: "↩️ Kembali ke Paket",
            callback_data: `back_to_packages`
        }
    ]);

    return smartEdit(
        ctx,
        `<blockquote>
<b>Paket Terpilih:</b> ${spec.name}

<b>Pilih Operating System:</b>
</blockquote>`,
        {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: osButtons }
        }
    );
});


// ===== VPS STEP 2: Pilih OS =====
bot.action(/vps_step2\|(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const [specKey, osKey] = ctx.match[1].split("|");

    if (!vpsSpecs[specKey]) {
        return smartEdit(
            ctx,
            `<blockquote>
<b>❌ Error:</b> Spec "<b>${specKey}</b>" tidak ditemukan.

Silakan ulangi dari awal: <b>${config.prefix}buyvps</b>
</blockquote>`,
            { parse_mode: "HTML" }
        );
    }

    if (!vpsImages[osKey]) {
        return smartEdit(
            ctx,
            `<blockquote>
<b>❌ Error:</b> OS "<b>${osKey}</b>" tidak ditemukan.

Silakan pilih OS lain.
</blockquote>`,
            { parse_mode: "HTML" }
        );
    }

    const spec = vpsSpecs[specKey];
    const osImage = vpsImages[osKey];
    const costInfo = getOSAdditionalCost(osKey);

    const regionButtons = Object.entries(vpsRegions).map(([key, region]) => [
        {
            text: `${region.flag} ${region.name}`,
            callback_data: `vps_step3|${specKey}|${osKey}|${key}`
        }
    ]);

    regionButtons.push([
        {
            text: "↩️ Kembali ke OS",
            callback_data: `vps_step1|${specKey}`
        }
    ]);

    const additionalCostText = costInfo.additional ? `<b>Biaya OS:</b> Rp${toRupiah(costInfo.cost)}\n` : '';

    return smartEdit(
        ctx,
        `<blockquote>
<b>Spesifikasi:</b>
• ${spec.name}
${additionalCostText}• OS: ${osImage.name}

<b>Pilih Region Server:</b>
</blockquote>`,
        {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: regionButtons }
        }
    );
});


// ===== VPS STEP 3: Pilih Region dan Tampilkan KONFIRMASI =====
bot.action(/vps_step3\|(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const [specKey, osKey, regionKey] = ctx.match[1].split("|");

    if (!vpsSpecs[specKey]) {
        return smartEdit(
            ctx,
            `<blockquote>
<b>❌ Error:</b> Spec "<b>${specKey}</b>" tidak ditemukan.

Silakan ulangi dari awal: <b>${config.prefix}buyvps</b>
</blockquote>`,
            { parse_mode: "HTML" }
        );
    }

    if (!vpsImages[osKey]) {
        return smartEdit(
            ctx,
            `<blockquote>
<b>❌ Error:</b> OS "<b>${osKey}</b>" tidak ditemukan.

Silakan ulangi dari awal: <b>${config.prefix}buyvps</b>
</blockquote>`,
            { parse_mode: "HTML" }
        );
    }

    if (!vpsRegions[regionKey]) {
        return smartEdit(
            ctx,
            `<blockquote>
<b>❌ Error:</b> Region "<b>${regionKey}</b>" tidak ditemukan.

Silakan ulangi dari awal: <b>${config.prefix}buyvps</b>
</blockquote>`,
            { parse_mode: "HTML" }
        );
    }

    const spec = vpsSpecs[specKey];
    const osImage = vpsImages[osKey];
    const region = vpsRegions[regionKey];

    const regionValidation = validateOSForRegion(osKey, regionKey);
    if (!regionValidation.valid) {
        return smartEdit(
            ctx,
            `<blockquote>
<b>❌ Error:</b> ${regionValidation.message}

Silakan pilih region lain.
</blockquote>`,
            { parse_mode: "HTML" }
        );
    }

    let basePrice = (vpsPackages.find(v => v.key === specKey)).price;

    const osCostInfo = getOSAdditionalCost(osKey);
    const osAdditionalCost = osCostInfo.additional ? osCostInfo.cost : 0;

    const fee = generateRandomFee();
    const totalPrice = basePrice + osAdditionalCost;
    const name = `VPS Digital Ocean ${spec.name}`;

    const confirmationText = createConfirmationText("vps", name, totalPrice, fee, {
        specName: spec.name,
        osName: osImage.name,
        regionName: `${region.flag} ${region.name}`,
        osCost: osAdditionalCost > 0 ? `\n💵 Biaya OS: Rp${toRupiah(osAdditionalCost)}` : ''
    });

    return smartEdit(ctx, confirmationText, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "✅ Konfirmasi", callback_data: `confirm_vps_payment|${specKey}|${osKey}|${regionKey}` },
                    { text: "❌ Batalkan", callback_data: `vps_step2|${specKey}|${osKey}` }
                ]
            ]
        }
    });
});

    // ===== KONFIRMASI PEMBAYARAN VPS =====
bot.action(/confirm_vps_payment\|(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();

    const [specKey, osKey, regionKey] = ctx.match[1].split("|");

    if (!vpsSpecs[specKey]) {
        return ctx.reply(
            `<blockquote>
<b>❌ Error:</b> Spec "<b>${specKey}</b>" tidak ditemukan.

Silakan ulangi dari awal: <b>${config.prefix}buyvps</b>
</blockquote>`,
            { parse_mode: "HTML" }
        );
    }

    if (!vpsImages[osKey]) {
        return ctx.reply(
            `<blockquote>
<b>❌ Error:</b> OS "<b>${osKey}</b>" tidak ditemukan.

Silakan ulangi dari awal: <b>${config.prefix}buyvps</b>
</blockquote>`,
            { parse_mode: "HTML" }
        );
    }

    if (!vpsRegions[regionKey]) {
        return ctx.reply(
            `<blockquote>
<b>❌ Error:</b> Region "<b>${regionKey}</b>" tidak ditemukan.

Silakan ulangi dari awal: <b>${config.prefix}buyvps</b>
</blockquote>`,
            { parse_mode: "HTML" }
        );
    }

    const spec = vpsSpecs[specKey];
    const osImage = vpsImages[osKey];
    const region = vpsRegions[regionKey];

    const regionValidation = validateOSForRegion(osKey, regionKey);
    if (!regionValidation.valid) {
        return ctx.reply(
            `<blockquote>
<b>❌ Error:</b> ${regionValidation.message}

Silakan pilih region lain.
</blockquote>`,
            { parse_mode: "HTML" }
        );
    }

    const userId = ctx.from.id;
    let basePrice = (vpsPackages.find(v => v.key === specKey)).price;

    const osCostInfo = getOSAdditionalCost(osKey);
    const osAdditionalCost = osCostInfo.additional ? osCostInfo.cost : 0;

    const fee = generateRandomFee();
    const totalPrice = basePrice + osAdditionalCost + fee;
    const name = `VPS Digital Ocean ${spec.name}`;

    const paymentType = config.paymentGateway;
    const pay = await createPayment(paymentType, totalPrice, config);

    orders[userId] = {
        type: "vps",
        specKey: specKey,
        osKey: osKey,
        regionKey: regionKey,
        name: name,
        spec: {
            ramCpu: spec,
            os: osImage,
            region: region,
            basePrice: basePrice,
            osAdditionalCost: osAdditionalCost
        },
        amount: totalPrice,
        fee: fee,
        orderId: pay.orderId || null,
        paymentType: paymentType,
        chatId: ctx.chat.id,
        expireAt: Date.now() + 6 * 60 * 1000
    };

    const photo =
        paymentType === "pakasir"
            ? { source: pay.qris }
            : pay.qris;

    const qrMsg = await ctx.replyWithPhoto(photo, {
        caption: textOrder(name, basePrice, fee),
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "❌ Batalkan Order", callback_data: "cancel_order" }]
            ]
        }
    });

    orders[userId].qrMessageId = qrMsg.message_id;
    startCheck(userId, ctx);
});

    bot.action(/delstock_cat\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const category = ctx.match[1];
        const stocks = loadStocks();

        if (!stocks[category]) {
            return ctx.editMessageText(`❌ Kategori *${escapeMarkdown(category)}* tidak ditemukan.`,
                { parse_mode: "Markdown" });
        }

        const items = stocks[category];
        const itemButtons = items.map((item, index) => [
            {
                text: `🗑️ ${escapeMarkdown(item.description)}`,
                callback_data: `delstock_item|${category}|${index}`
            }
        ]);

        return ctx.editMessageText(`Pilih item dalam kategori *${escapeMarkdown(category)}* yang ingin dihapus:`, {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: itemButtons }
        });
    });

    bot.action(/delstock_item\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const [category, indexStr] = ctx.match[1].split("|");
        const index = parseInt(indexStr);
        const stocks = loadStocks();

        if (!stocks[category] || !stocks[category][index]) {
            return ctx.editMessageText("❌ Item tidak ditemukan.");
        }

        const deletedItem = stocks[category][index];
        stocks[category].splice(index, 1);

        if (stocks[category].length === 0) {
            delete stocks[category];
        }

        saveStocks(stocks);

        return ctx.editMessageText(
            `✅ Item berhasil dihapus!\n\n` +
            `📁 Kategori: ${escapeMarkdown(category)}\n` +
            `📝 Keterangan: ${escapeMarkdown(deletedItem.description)}\n` +
            `💰 Harga: Rp${toRupiah(deletedItem.price)}\n` +
            `🔑 ${deletedItem.accounts.length} akun dihapus`,
            { parse_mode: "Markdown" }
        );
    });

    // ===== GET SCRIPT DETAIL =====
    bot.action(/getscript_detail\|(\d+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');
        const index = Number(ctx.match[1]);

        const scripts = loadScripts();
        const s = scripts[index];
        if (!s) return ctx.editMessageText("❌ Script tidak ditemukan.");

        const detailText = `📋 *DETAIL SCRIPT*

📦 *Nama:* ${escapeMarkdown(s.name)}
💰 *Harga:* Rp${toRupiah(s.price)}
📁 *File:* ${s.file || "-"}
📅 *Ditambahkan:* ${new Date(s.added_date).toLocaleDateString('id-ID')}

📝 *Deskripsi:* 
${escapeMarkdown(s.desk || "-")}`;

        return ctx.editMessageText(detailText, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📤 Download Script", callback_data: `download_script|${index}` },
                        { text: "🗑️ Hapus Script", callback_data: `del_script|${s.name}` }
                    ],
                    [
                        { text: "↩️ Back ke List Script", callback_data: "back_to_script_list" }
                    ]
                ]
            }
        });
    });

    // ===== DOWNLOAD SCRIPT =====
    bot.action(/download_script\|(\d+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');
        const index = Number(ctx.match[1]);

        const scripts = loadScripts();
        const s = scripts[index];
        if (!s) return ctx.reply("❌ Script tidak ditemukan.");

        const filePath = path.resolve(s.file || "");
        if (!fs.existsSync(filePath))
            return ctx.reply("❌ File script tidak ditemukan di server.");

        return ctx.replyWithDocument({ source: filePath }, {
            caption: `📂 Script: ${escapeMarkdown(s.name)}`,
            parse_mode: "Markdown"
        });
    });

    // ===== BACK TO SCRIPT LIST =====
    bot.action("back_to_script_list", async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const allScripts = loadScripts();
        if (!allScripts.length) return ctx.editMessageText("📭 Belum ada script.");

        const buttons = allScripts.map((s, i) => ([
            { text: `📂 ${escapeMarkdown(s.name)} - Rp${s.price}`, callback_data: `getscript_detail|${i}` }
        ]));

        return ctx.editMessageText("*📦 DAFTAR SCRIPT*\n\nPilih Script untuk melihat detail:", {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: buttons }
        });
    });

    bot.action(/del_script\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');
        const name = ctx.match[1];

        let scripts = loadScripts();
        const sc = scripts.find(s => s.name === name);
        if (!sc) return ctx.editMessageText("❌ Tidak ditemukan.");

        const filePath = path.join(__dirname, sc.file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        scripts = scripts.filter(s => s.name !== name);
        saveScripts(scripts);

        return ctx.editMessageText(`✅ Script ${escapeMarkdown(name)} berhasil dihapus.`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "↩️ Kembali ke List Script", callback_data: "back_to_script_list" }]
                ]
            }
        });
    });

    bot.action(/panel_ram\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        const params = ctx.match[1].split("|");
        const ram = params[0];
        const username = params[1];

        const fee = generateRandomFee();

        const priceKey = ram === "unli" ? "unlimited" : `${ram}`;
        const basePrice = hargaPanel[priceKey];

        if (!basePrice) {
            return ctx.editMessageText("Harga panel tidak ditemukan!");
        }

        const price = basePrice;
        const name = `Panel ${ram === "unli" ? "Unlimited" : ram}`;

        const confirmationText = createConfirmationText("panel", name, price, fee, {
            username: username,
            ram: ram
        });

        return ctx.editMessageText(confirmationText, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Konfirmasi", callback_data: `confirm_panel_payment|${ram}|${username}` },
                        { text: "❌ Batalkan", callback_data: "cancel_order" }
                    ]
                ]
            }
        });
    });

    // ===== KONFIRMASI PEMBAYARAN PANEL =====
    bot.action(/confirm_panel_payment\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.deleteMessage();

        const [ram, username] = ctx.match[1].split("|");
        const userId = ctx.from.id;

        const fee = generateRandomFee();

        const priceKey = ram === "unli" ? "unlimited" : `${ram}`;
        const basePrice = hargaPanel[priceKey];

        if (!basePrice) {
            return ctx.reply("Harga panel tidak ditemukan!");
        }

        const price = fee + basePrice;
        const name = `Panel ${ram === "unli" ? "Unlimited" : ram}`;

        const paymentType = config.paymentGateway;
        const pay = await createPayment(paymentType, price, config);

        orders[userId] = {
            type: "panel",
            username,
            ram,
            name,
            amount: price,
            fee,
            orderId: pay.orderId || null,
            paymentType,
            chatId: ctx.chat.id,
            expireAt: Date.now() + 6 * 60 * 1000
        };

        const photo =
            paymentType === "pakasir"
                ? { source: pay.qris }
                : pay.qris;

        const qrMsg = await ctx.replyWithPhoto(photo, {
            caption: textOrder(name, basePrice, fee),
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Batalkan Order", callback_data: "cancel_order" }]
                ]
            }
        });

        orders[userId].qrMessageId = qrMsg.message_id;
        startCheck(userId, ctx);
    });

    bot.action(/script\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        const name = ctx.match[1];
        const scripts = loadScripts();
        const sc = scripts.find(s => s.name === name);
        const now = new Date();
        const waktu = now.toLocaleString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).replace(".", ":");

        if (!sc) return ctx.reply("❌ Script tidak ditemukan.");

        const text = `
*📝 Konfirmasi Pemesanan*

📦 Produk: Script ${escapeMarkdown(sc.name)}
💰 Harga: Rp${Number(sc.price).toLocaleString("id-ID")}
🕒 Waktu: ${waktu}

📝 Deskripsi:
${escapeMarkdown(sc.desk || "-")}

⚠️ Apakah Anda yakin ingin melanjutkan pembayaran?
    `.trim();

        await ctx.editMessageText(text, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Konfirmasi", callback_data: `proceed_script_payment|${sc.name}` },
                        { text: "❌ Batalkan", callback_data: "back_to_script" }
                    ],
                ]
            }
        });
    });

    bot.action(/confirm_script\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        const name = ctx.match[1];
        const userId = ctx.from.id;

        const scripts = loadScripts();
        const sc = scripts.find(s => s.name === name);
        if (!sc) return ctx.reply("❌ Script tidak ditemukan.");

        const fee = generateRandomFee();
        const price = sc.price

        const confirmationText = createConfirmationText("script", sc.name, price, fee, {
            description: sc.desk || "-"
        });

        await ctx.deleteMessage();

        return ctx.reply(confirmationText, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Konfirmasi", callback_data: `proceed_script_payment|${sc.name}` },
                        { text: "❌ Batalkan", callback_data: "back_to_script" }
                    ]
                ]
            }
        });
    });

    // ===== LANJUT KE PEMBAYARAN SCRIPT =====
    bot.action(/proceed_script_payment\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.deleteMessage();

        const name = ctx.match[1];
        const userId = ctx.from.id;

        const scripts = loadScripts();
        const sc = scripts.find(s => s.name === name);
        if (!sc) return ctx.reply("❌ Script tidak ditemukan.");

        const fee = generateRandomFee();
        const price = sc.price + fee;
        const paymentType = config.paymentGateway;

        const pay = await createPayment(paymentType, price, config);

        const photo =
            paymentType === "pakasir"
                ? { source: pay.qris }
                : pay.qris;

        orders[userId] = {
            type: "script",
            name: sc.name,
            amount: price,
            fee,
            file: sc.file,
            orderId: pay.orderId || null,
            paymentType,
            chatId: ctx.chat.id,
            expireAt: Date.now() + 6 * 60 * 1000
        };

        const qrMsg = await ctx.replyWithPhoto(photo, {
            caption: textOrder(sc.name, sc.price, fee),
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Batalkan Order", callback_data: "cancel_order" }]
                ]
            }
        });

        orders[userId].qrMessageId = qrMsg.message_id;
        startCheck(userId, ctx);
    });

bot.action("back_to_script", async (ctx) => {
    await ctx.answerCbQuery();

    const scriptsList = loadScripts();
    if (!scriptsList.length)
        return ctx.editMessageText("<blockquote><b>📭 Stok script sedang kosong.</b></blockquote>", {
            parse_mode: "HTML"
        });

    const scriptButtons = scriptsList.map(s => ([
        {
            text: `📂 ${s.name} • Rp${Number(s.price).toLocaleString("id-ID")}`,
            callback_data: `script|${s.name}`
        }
    ]));

    const caption = `<blockquote><b>┌───「 🛒 SCRIPT STORE 」───┐
├ 📌 Silakan pilih script yang tersedia
├ ⚡ Semua produk sudah siap pakai
├ 💻 Developer Premium Resources
├────────────────────────
├ 📦 Total Script : ${scriptsList.length}
└────────────────────────</b></blockquote>
<blockquote><b>👇 Pilih salah satu script di bawah untuk lanjut checkout.</b></blockquote>`;

    await ctx.editMessageText(caption, {
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: scriptButtons
        }
    });
});

    // ===== KONFIRMASI PEMBAYARAN ADMIN =====
    bot.action(/confirm_admin\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.deleteMessage();

        const user = ctx.match[1];
        const userId = ctx.from.id;

        const fee = generateRandomFee();
        const price = fee + hargaAdminPanel
        const name = "Admin Panel";

        const paymentType = config.paymentGateway;

        const pay = await createPayment(paymentType, price, config);

        orders[userId] = {
            username: user,
            type: "admin",
            name,
            amount: price,
            fee,
            orderId: pay.orderId || null,
            paymentType: paymentType,
            chatId: ctx.chat.id,
            expireAt: Date.now() + 6 * 60 * 1000
        };

        const photo =
            paymentType === "pakasir"
                ? { source: pay.qris }
                : pay.qris;

        const qrMsg = await ctx.replyWithPhoto(photo, {
            caption: textOrder(name, hargaAdminPanel, fee),
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Batalkan Order", callback_data: "cancel_order" }]
                ]
            }
        });

        orders[userId].qrMessageId = qrMsg.message_id;
        startCheck(userId, ctx);
    });

    function startCheck(userId, ctx) {
        const intv = setInterval(async () => {
            const order = orders[userId];
            if (!order) {
                clearInterval(intv);
                return;
            }

            // ===== EXPIRED =====
            if (Date.now() > order.expireAt) {
                clearInterval(intv);

                try {
                    if (order.qrMessageId) {
                        await ctx.telegram.deleteMessage(order.chatId, order.qrMessageId);
                    }
                } catch (e) { }

                await ctx.telegram.sendMessage(
                    order.chatId,
                    "⏰ Pembayaran QR telah expired!\nSilakan order ulang dari .menu",
                    { parse_mode: "Markdown" }
                );

                delete orders[userId];
                return;
            }

            // ===== CEK PEMBAYARAN =====
            const paymentType = order.paymentType || config.paymentGateway;

            const paid = await cekPaid(
                paymentType,
                order,
                config,
                { userId, orders, toRupiah }
            );

            if (!paid) return;

            clearInterval(intv);
            const o = orders[userId];

            updateUserHistory(userId, o);

            const users = loadUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].total_spent = (users[userIndex].total_spent || 0) + o.amount;
                saveUsers(users);
            }

            const buyerInfo = {
                id: userId,
                name: ctx.from.first_name + (ctx.from.last_name ? ' ' + ctx.from.last_name : ''),
                username: ctx.from.username,
                totalSpent: users[userIndex]?.total_spent || 0
            };
            
            await notifyOwner(ctx, o, buyerInfo);

            await ctx.telegram.sendMessage(
                o.chatId,
                `✅ Pembayaran Berhasil!

📦 Produk: ${escapeMarkdown(o.name)}
💰 Harga: Rp${toRupiah(o.amount)} (Fee Rp${o.fee})

Produk sedang dikirim...
Terimakasih sudah membeli produk ♥️`,
                { parse_mode: "Markdown" }
            );

            try {
                if (o.qrMessageId) {
                    await ctx.telegram.deleteMessage(o.chatId, o.qrMessageId);
                }
            } catch (e) { }

            delete orders[userId];

            // ===== KIRIM SCRIPT =====
            if (o.type === "script") {
                await ctx.telegram.sendDocument(
                    o.chatId,
                    { source: o.file },
                    {
                        caption: `Script: ${escapeMarkdown(o.name)}`,
                        parse_mode: "Markdown"
                    }
                );
            }

            // ===== BUAT PANEL =====
            if (o.type === "panel") {
                const ram = o.ram === "unli" ? "Unlimited" : `${o.ram}GB`;
                const username = o.username + randomNumber(3);

                let res = await createPanel(username, ram.toLowerCase());
                if (!res.success) {
                    const errorText = `
❌ Error! Terjadi kesalahan saat membuat panel.\nSilahkan hubungi admin @${config.ownerUsername}
`;

                    return ctx.telegram.sendMessage(o.chatId, errorText, {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "📞 Hubungi Admin",
                                        url: `https://t.me/${config.ownerUsername}`
                                    }
                                ]
                            ]
                        }
                    });
                }

                res = res.data;

                const teksPanel = `✅ Panel Pterodactyl Berhasil Dibuat!

👤 Username: ${escapeMarkdown(res.username)}
🔑 Password: ${escapeMarkdown(res.password)}
💾 RAM: ${ram}
🆔 Server ID: ${res.serverId}
📛 Server Name: ${escapeMarkdown(res.serverName)}
⏳ Expired: 1 Bulan

📌 Cara Login:
1. Klik tombol Login Panel di bawah
2. Masukkan username & password
3. Server siap dipakai!`;

                await ctx.telegram.sendMessage(o.chatId, teksPanel, {
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🔗 Login Panel",
                                    url: res.panelUrl
                                }
                            ]
                        ]
                    }
                });
            }

            // ===== BUAT ADMIN PANEL =====
            if (o.type === "admin") {
                const username = o.username + randomNumber(3);

                let res;
                try {
                    res = await createAdmin(username);
                } catch (e) {
                    const errorText = `
❌ Error! Terjadi kesalahan saat membuat admin panel.\nSilahkan hubungi admin @${config.ownerUsername}
`;

                    return ctx.telegram.sendMessage(o.chatId, errorText, {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "📞 Hubungi Admin",
                                        url: `https://t.me/${config.ownerUsername}`
                                    }
                                ]
                            ]
                        }
                    });
                }

                const teksAdmin = `✅ Admin Panel Berhasil Dibuat!

🆔 User ID: ${res.id}
👤 Username: ${escapeMarkdown(res.username)}
🔑 Password: ${escapeMarkdown(res.password)}
⏳ Expired: 1 Bulan

📌 Cara Login:
1. Klik tombol Login Panel di bawah
2. Masukkan username & password
3. Admin panel siap digunakan!`;

                await ctx.telegram.sendMessage(o.chatId, teksAdmin, {
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🔗 Login Panel",
                                    url: res.panel
                                }
                            ]
                        ]
                    }
                });
            }

            // ===== KIRIM APPS PREMIUM =====
            if (o.type === "app") {
                const stocks = loadStocks();
                if (stocks[o.category] && stocks[o.category][o.itemIndex]) {
                    const item = stocks[o.category][o.itemIndex];

                    const sentAccount = item.accounts.shift();
                    item.stock -= 1;

                    if (item.stock <= 0) {
                        stocks[o.category].splice(o.itemIndex, 1);
                        if (stocks[o.category].length === 0) {
                            delete stocks[o.category];
                        }
                    }

                    saveStocks(stocks);

                    const fileName = `${o.category}_${Date.now()}.txt`;
                    const fileContent = `=== DATA AKUN ${o.category.toUpperCase()} ===\n\n` +
                        `Produk: ${escapeMarkdown(o.name)}\n` +
                        `Keterangan: ${escapeMarkdown(o.description)}\n` +
                        `Harga: Rp${toRupiah(o.amount)}\n` +
                        `Tanggal: ${new Date().toLocaleString('id-ID')}\n\n` +
                        `=== DATA AKUN ===\n` +
                        `${escapeMarkdown(sentAccount)}\n\n` +
                        `=== INSTRUKSI ===\n` +
                        `1. Login dengan akun di atas\n` +
                        `2. Nikmati fitur premium\n` +
                        `3. Jangan bagikan akun ke orang lain\n` +
                        `4. Akun ini untuk personal use\n\n` +
                        `=== SUPPORT ===\n` +
                        `Jika ada masalah, hubungi: @${config.ownerUsername}`;

                    const tempFilePath = path.join(__dirname, 'temp', fileName);
                    const tempDir = path.join(__dirname, 'temp');

                    if (!fs.existsSync(tempDir)) {
                        fs.mkdirSync(tempDir, { recursive: true });
                    }

                    fs.writeFileSync(tempFilePath, fileContent);

                    const appText = `✅ Apps Premium Berhasil Dibeli!

📱 Produk: ${escapeMarkdown(o.name)}
💰 Harga: Rp${toRupiah(o.amount)}

📁 Data akun telah dikirim dalam file .txt
📝 Silakan download file untuk melihat detail akun

📌 Cara Pakai:
1. Login dengan akun yang tersedia
2. Nikmati fitur premium
3. Jangan bagikan akun ke orang lain

⚠️ Note: Akun ini untuk personal use`;

                    try {
                        await ctx.telegram.sendMessage(o.chatId, appText, {
                            parse_mode: "Markdown"
                        });

                        await ctx.telegram.sendDocument(o.chatId, {
                            source: tempFilePath,
                            filename: fileName
                        }, {
                            caption: `📁 File Data Akun: ${escapeMarkdown(o.name)}`,
                            parse_mode: "Markdown"
                        });

                        setTimeout(() => {
                            if (fs.existsSync(tempFilePath)) {
                                fs.unlinkSync(tempFilePath);
                            }
                        }, 5000);

                    } catch (error) {
                        console.error("Error sending file:", error);
                        const fallbackText = `✅ Apps Premium Berhasil Dibeli!

📱 Produk: ${escapeMarkdown(o.name)}
💰 Harga: Rp${toRupiah(o.amount)}

🔑 Data Akun: 
\`${escapeMarkdown(sentAccount)}\`

📌 Cara Pakai:
1. Login dengan akun di atas
2. Nikmati fitur premium
3. Jangan bagikan akun ke orang lain

⚠️ Note: Akun ini untuk personal use`;

                        await ctx.telegram.sendMessage(o.chatId, fallbackText, {
                            parse_mode: "Markdown"
                        });
                    }
                }
            }

            // ===== KIRIM DIGITAL OCEAN ACCOUNT =====
            if (o.type === "do") {
                const doData = loadDO();
                if (doData[o.category] && doData[o.category][o.itemIndex]) {
                    const item = doData[o.category][o.itemIndex];

                    const sentAccount = item.accounts.shift();
                    item.stock -= 1;

                    if (item.stock <= 0) {
                        doData[o.category].splice(o.itemIndex, 1);
                        if (doData[o.category].length === 0) {
                            delete doData[o.category];
                        }
                    }

                    saveDO(doData);

                    const fileName = `DO_${o.category}_${Date.now()}.txt`;
                    const fileContent = `=== DATA AKUN DIGITAL OCEAN ===\n\n` +
                        `Produk: ${escapeMarkdown(o.name)}\n` +
                        `Keterangan: ${escapeMarkdown(o.description)}\n` +
                        `Harga: Rp${toRupiah(o.amount)}\n` +
                        `Tanggal: ${new Date().toLocaleString('id-ID')}\n\n` +
                        `=== DATA AKUN ===\n` +
                        `${escapeMarkdown(sentAccount)}\n\n` +
                        `=== INSTRUKSI ===\n` +
                        `1. Login ke https://cloud.digitalocean.com\n` +
                        `2. Gunakan akun di atas\n` +
                        `3. Nikmati credit yang tersedia\n` +
                        `4. Jangan bagikan akun ke orang lain\n\n` +
                        `=== SUPPORT ===\n` +
                        `Jika ada masalah, hubungi: @${config.ownerUsername}`;

                    const tempFilePath = path.join(__dirname, 'temp', fileName);
                    const tempDir = path.join(__dirname, 'temp');

                    if (!fs.existsSync(tempDir)) {
                        fs.mkdirSync(tempDir, { recursive: true });
                    }

                    fs.writeFileSync(tempFilePath, fileContent);

                    const doText = `✅ Akun Digital Ocean Berhasil Dibeli!

🌊 Produk: ${escapeMarkdown(o.name)}
💰 Harga: Rp${toRupiah(o.amount)}

📁 Data akun telah dikirim dalam file .txt
📝 Silakan download file untuk melihat detail akun

📌 Cara Pakai:
1. Login ke https://cloud.digitalocean.com
2. Gunakan akun yang tersedia
3. Credit siap digunakan untuk membuat VPS/droplet

⚠️ Note: Akun ini untuk personal use`;

                    try {
                        await ctx.telegram.sendMessage(o.chatId, doText, {
                            parse_mode: "Markdown"
                        });

                        await ctx.telegram.sendDocument(o.chatId, {
                            source: tempFilePath,
                            filename: fileName
                        }, {
                            caption: `🌊 File Data Akun Digital Ocean: ${escapeMarkdown(o.name)}`,
                            parse_mode: "Markdown"
                        });

                        setTimeout(() => {
                            if (fs.existsSync(tempFilePath)) {
                                fs.unlinkSync(tempFilePath);
                            }
                        }, 5000);

                    } catch (error) {
                        console.error("Error sending file:", error);
                        const fallbackText = `✅ Akun Digital Ocean Berhasil Dibeli!

🌊 Produk: ${escapeMarkdown(o.name)}
💰 Harga: Rp${toRupiah(o.amount)}

🔑 Data Akun: 
\`${escapeMarkdown(sentAccount)}\`

📌 Cara Pakai:
1. Login ke https://cloud.digitalocean.com
2. Gunakan akun di atas
3. Credit siap digunakan untuk membuat VPS/droplet

⚠️ Note: Akun ini untuk personal use`;

                        await ctx.telegram.sendMessage(o.chatId, fallbackText, {
                            parse_mode: "Markdown"
                        });
                    }
                }
            }

            // ===== BUAT VPS DIGITAL OCEAN SETELAH PEMBAYARAN =====
            if (o.type === "vps") {
                try {
                    if (!config.apiDigitalOcean) {
                        throw new Error("API Digital Ocean tidak dikonfigurasi");
                    }

                    const username = ctx.from.username || `user${ctx.from.id}`;
                    const hostname = `vps-${username}-${randomNumber(6)}`.toLowerCase().substring(0, 63);
                    const pw = generateStrongPassword();
                    const pws = pw
                    const password = pws

                    const processingMsg = await ctx.telegram.sendMessage(
                        o.chatId,
                        `🔄 *Membuat VPS Digital Ocean...*\n\n📊 *Spesifikasi:*\n• ${escapeMarkdown(o.spec.ramCpu.name)}\n• ${escapeMarkdown(o.spec.os.name)}\n• ${o.spec.region.flag} ${escapeMarkdown(o.spec.region.name)}\n\n⏳ Mohon tunggu 2-3 menit...`,
                        { parse_mode: "Markdown" }
                    );

                    const dropletId = await createVPSDroplet(
                        config.apiDigitalOcean,
                        hostname,
                        o.specKey,
                        o.osKey,
                        o.regionKey,
                        password
                    );

                    await new Promise(resolve => setTimeout(resolve, 5000));

                    let ipAddress = "Sedang diprovisioning...";
                    let status = "creating";
                    let dropletInfo = null;

                    try {
                        dropletInfo = await getDropletInfo(config.apiDigitalOcean, dropletId);
                        status = dropletInfo.status || "active";

                        if (dropletInfo.networks && dropletInfo.networks.v4) {
                            const publicIP = dropletInfo.networks.v4.find(net => net.type === "public");
                            if (publicIP) {
                                ipAddress = publicIP.ip_address;
                            }
                        }
                    } catch (infoError) {
                        console.log("Info droplet belum tersedia:", infoError.message);
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        try {
                            dropletInfo = await getDropletInfo(config.apiDigitalOcean, dropletId);
                            status = dropletInfo.status || "active";

                            if (dropletInfo.networks && dropletInfo.networks.v4) {
                                const publicIP = dropletInfo.networks.v4.find(net => net.type === "public");
                                if (publicIP) {
                                    ipAddress = publicIP.ip_address;
                                }
                            }
                        } catch (retryError) {
                            console.log("Masih belum bisa mendapatkan info:", retryError.message);
                        }
                    }

                    try {
                        await ctx.telegram.deleteMessage(o.chatId, processingMsg.message_id);
                    } catch (e) { }

                    const vpsText = `✅ *VPS Digital Ocean Berhasil Dibuat!*

🎯 *Detail Order:*
├ Produk: ${escapeMarkdown(o.name)}
├ Harga: Rp${toRupiah(o.amount)}
└ Status: ${status === 'active' ? '✅ Active' : '🔄 Creating'}

📊 *Spesifikasi:*
├ ${escapeMarkdown(o.spec.ramCpu.name)}
├ ${escapeMarkdown(o.spec.os.name)}
├ ${o.spec.region.flag} ${escapeMarkdown(o.spec.region.name)}
└ ${o.spec.region.latency}

🔧 *Informasi Server:*
├ Server ID: \`${dropletId}\`
├ Hostname: \`${hostname}\`
├ IP Address: \`${ipAddress}\`
├ Username: \`root\`
└ Password: \`${password}\`

📌 *Cara Akses SSH:*
\`\`\`
ssh root@${ipAddress}
\`\`\`
Password: \`${password}\`
`;

                    await ctx.telegram.sendMessage(o.chatId, vpsText, {
                        parse_mode: "Markdown",
                    });

                } catch (error) {
                    console.error("Error creating VPS:", error);

                    const errorText = `
❌ Error! Terjadi kesalahan saat membuat vps.\nSilahkan hubungi admin @${config.ownerUsername}
`;

                    await ctx.telegram.sendMessage(o.chatId, errorText, {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "📞 Hubungi Admin",
                                        url: `https://t.me/${config.ownerUsername}`
                                    }
                                ]
                            ]
                        }
                    });
                }
            }

        }, 15000);
    }

    // Fungsi untuk menjalankan broadcast
    async function startBroadcast(ctx, users, message, hasPhoto, photoFileId, statusMessageId) {
        const totalUsers = users.length;
        let successCount = 0;
        let failedCount = 0;
        const failedUsers = [];
        const startTime = Date.now();

        for (let i = 0; i < users.length; i++) {
            const userId = users[i].id;

            try {
                if (hasPhoto && photoFileId) {
                    await ctx.telegram.sendPhoto(userId, photoFileId, {
                        caption: message,
                        parse_mode: "Markdown"
                    });
                } else {
                    await ctx.telegram.sendMessage(userId, message, {
                        parse_mode: "Markdown"
                    });
                }
                successCount++;

            } catch (error) {
                console.error(`Gagal kirim ke user ${userId}:`, error.message);
                failedCount++;
                failedUsers.push(userId);
            }

            if ((i + 1) % 5 === 0 || i === users.length - 1) {
                try {
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        statusMessageId,
                        null,
                        `🚀 *BROADCAST BERJALAN*\n\n` +
                        `📊 Total User: ${totalUsers}\n` +
                        `✅ Berhasil: ${successCount}\n` +
                        `❌ Gagal: ${failedCount}\n` +
                        `⏳ Progress: ${i + 1}/${totalUsers} (${Math.round((i + 1) / totalUsers * 100)}%)\n` +
                        `⏱️ Waktu: ${Math.floor((Date.now() - startTime) / 1000)} detik`,
                        { parse_mode: "Markdown" }
                    );
                } catch (updateError) {
                    console.error("Gagal update progress:", updateError.message);
                }

                if (i < users.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }

        const duration = Math.floor((Date.now() - startTime) / 1000);

        const finalText = `✅ *BROADCAST SELESAI*\n\n` +
            `📊 Total User: ${totalUsers}\n` +
            `✅ Berhasil dikirim: ${successCount}\n` +
            `❌ Gagal dikirim: ${failedCount}\n` +
            `⏱️ Waktu eksekusi: ${duration} detik\n` +
            `📈 Success Rate: ${totalUsers > 0 ? Math.round((successCount / totalUsers) * 100) : 0}%\n\n` +
            (failedCount > 0 ?
                `⚠️ ${failedCount} user gagal menerima pesan\n` +
                `(Mungkin memblokir bot atau chat tidak ditemukan)` :
                `✨ Semua user berhasil menerima pesan!`);

        try {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMessageId,
                null,
                finalText,
                { parse_mode: "Markdown" }
            );
        } catch (error) {
            await ctx.reply(finalText, { parse_mode: "Markdown" });
        }
    }

    // Handler untuk melihat profile user dari notifikasi owner
    bot.action(/view_profile\|(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Owner Only!');

        const userId = ctx.match[1];
        const users = loadUsers();
        const user = users.find(u => u.id == userId);

        if (!user) {
            return ctx.editMessageText("❌ User tidak ditemukan dalam database.");
        }

        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        const fullName = firstName + (lastName ? ' ' + lastName : '');
        const userUsername = user.username ? '@' + user.username : 'Tidak ada';

        let lastTransactions = '_Belum ada transaksi_';
        if (user.history && user.history.length > 0) {
            lastTransactions = user.history.slice(-5).reverse().map((t, i) => {
                const product = escapeMarkdown(t.product);
                const amount = toRupiah(t.amount);
                const date = new Date(t.timestamp).toLocaleDateString('id-ID');
                return `${i + 1}. ${product} - Rp${amount} (${date})`;
            }).join('\n');
        }

        const profileText = `*👤 Profile User (Owner View)*

*📛 Nama:* ${escapeMarkdown(fullName)}
*🆔 User ID:* \`${user.id}\`
*📧 Username:* ${escapeMarkdown(userUsername)}
*📅 Join Date:* ${new Date(user.join_date).toLocaleDateString('id-ID')}
*💰 Total Spent:* Rp${toRupiah(user.total_spent || 0)}
*📊 Total Transaksi:* ${user.history ? user.history.length : 0}

*📋 Last 5 Transactions:*
${lastTransactions}`;

        const contactButton = {
            text: "📞 Hubungi User",
            url: user.username ? `https://t.me/${user.username}` : `tg://user?id=${user.id}`
        };

        return ctx.editMessageText(profileText, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [contactButton],
                    [{ text: "⬅️ Kembali", callback_data: "back_to_notification" }]
                ]
            }
        });
    });

    bot.action("back_to_notification", async (ctx) => {
        await ctx.answerCbQuery();
        return ctx.editMessageText("Kembali ke notifikasi...");
    });

    return bot;
};

// ===== HOT RELOAD =====
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    delete require.cache[file];
    require(file);
});