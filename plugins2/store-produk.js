const moment = require('moment-timezone')

module.exports = (bot) => {
  bot.command('produk', async (ctx) => {
    const wib = moment().tz('Asia/Jakarta').format('HH:mm:ss')
    const wita = moment().tz('Asia/Makassar').format('HH:mm:ss')
    const wit = moment().tz('Asia/Jayapura').format('HH:mm:ss')

    const caption = `📦 *LIST PRODUK AVAILABLE*

📡 Panel Pterodactyl
👤 Partner Pribadi
🚀 Partner Dragon
📜 Script Md And Bug (Eternal, Dragon, Traz, Twelve)
💳 Payment

⏰ TIME INFO ⏰
• WIB : ${wib}
• WITA: ${wita}
• WIT : ${wit}`

    const buttons = [
      [
        { text: "📡 Panel Pterodactyl", callback_data: "buy_panel" },
        { text: "👤 Partner Pribadi", callback_data: "buy_pt_prib" }
      ],
      [
        { text: "🚀 Partner Dragon", callback_data: "buy_pt_glx" },
        { text: "📜 Script WhatsApp", callback_data: "scriptlist" }
      ],
      [
        { text: "🏦 Payment", callback_data: "pymnt" },
        { text: "🌐 Produk Lain", url: "https://web-shop-Dragon-noxa.vercel.app/" }
      ]
    ]

    await ctx.reply(caption, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons }
    })
  })

  const sendProduk = async (ctx, caption) => {
    await ctx.editMessageText(caption, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔙 Kembali", callback_data: "produk_menu" },
            { text: "💸 Beli Sekarang", url: "https://t.me/Rizzxtzy" }
          ]
        ]
      }
    })
  }

  bot.action('buy_panel', async (ctx) => {
    await sendProduk(ctx, `📡 *LIST PANEL BY NOXXA*

1GB = 1K
2GB = 2K
3GB = 3K
4GB = 4K
5GB = 5K
6GB = 6K
7GB = 7K
8GB = 8K
9GB = 9K
10GB = 10K
UNLI = 12K
RESELLER PANEL PUBLIC = 5K
RESELLER PANEL PRIVATE = 10K
ADMIN PANEL = 15K
OWNER PANEL = 25K
TANGAN KANAN PANEL = 35K

📞 *Contact Admin:* @Rizzxtzy`)
  })

  bot.action('buy_pt_prib', async (ctx) => {
    await sendProduk(ctx, `👑 *PARTNER PRIBADI — 50.000* 🔥

_Benefit:_
• Get Partner Script Eternal Dragon
• Bisa jual reseller & script
• Get Script Twelve Fortunes
• Get Script Dragon MD
• Get No Enc Script Eternal Dragon (Versi Sebelumnya)
• Get Script Database
• Get Script Obf No Enc
• Get Function Setiap Update
• Get Banyak Base Bot
• Free Repo Userbot
• Diajarin Add Function
• Diajarin Buat Database
• Dibuatkan Plugin
• Dibantu Fix Script (Jika Tidak Sibuk)
• Dibantu Naik Nama
• Dipromosikan
• Diadminkan Room Public

📞 *Contact:* @Rizzxtzy`)
  })

  bot.action('buy_pt_glx', async (ctx) => {
    await sendProduk(ctx, `🚀 *PARTNER Dragon — 80.000 -1* 🔥

_Benefit:_
• Get Moderator Script Eternal Dragon
• Bisa jual partner, reseller, dan script
• Get Script Dragon MD (boleh dijual ulang)
• Get No Enc Script Eternal Dragon (Full Update)
• Get Script Twelve Fortunes
• Get Script Database
• Get Script Obf No Enc
• Get Function Setiap Update
• Get Banyak Base Bot
• Free Repo Userbot
• Diajarin Add Function
• Diajarin Buat Database
• Dibuatkan Plugin
• Dibuatkan Web Shop
• Dipromosikan
• Dibantu Fix Script (Jika Tidak Sibuk)
• Dibantu Naik Nama
• Diadminkan Room Public
• Diadminkan di Channel

📞 *Contact:* @Rizzxtzy`)
  })

  bot.action('pymnt', async (ctx) => {
    await sendProduk(ctx, `🏦 *PEMBAYARAN*

Dana : 083839017817
Gopay : 083839017817
Qris : Minta Ke Owner.. 

Setelah transfer, kirim bukti ke Owner atau reply pesan kamu yang berisi bukti transfer lalu ketik /cek nama barang.`)
  })

  bot.action('scriptlist', async (ctx) => {
    await ctx.editMessageText(`📜 *Script WhatsApp Premium*\nPilih script di bawah:`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💾 Eternal", callback_data: "buy_script_eternal" },
            { text: "🌌 Dragon", callback_data: "buy_script_Dragon" }
          ],
          [
            { text: "🎭 Traz", callback_data: "buy_script_traz" },
            { text: "💻 Twelve Fortunes", callback_data: "buy_script_tf" }
          ],
          [
            { text: "🔙 Kembali", callback_data: "produk_menu" }
          ]
        ]
      }
    })
  })

  bot.action('buy_script_eternal', async (ctx) => {
    await sendProduk(ctx, `🪐 *SCRIPT ETERNAL Dragon*
*VERSION 2.1*

💸 *PRICE LIST:*
• NO UPDATE: 20.000
• FREE UPDATE 3x: 35.000
• FULL UPDATE: 50.000

📦 *RESELLER:*
• Free Up 3x: 70.000
• Full Update: 90.000

🤝 *PARTNER:*
• Free Up 3x: 100.000
• Full Update: 115.000

🛡️ *MODS:*
• Free Up 3x: 130.000
• Full Update: 150.000

👑 *OWNER:*
• Free Up 3x: 160.000
• Full Update: 175.000

🔐 *SECURITY:*
• Database: MongoDB
• Encrypt: HARD

📩 *Hubungi Admin untuk Order:*`)
  })

  bot.action('buy_script_Dragon', async (ctx) => {
    await sendProduk(ctx, `🌌 *SCRIPT Dragon MD*
🛠️ *FOR SELL SCRIPT MD VIA TELEGRAM*

🎁 *BENEFIT:*
• GET NO ENC
• FULL UPDATE
• FITUR BANYAK

💵 *PRICE:* 30.000 (3/5 device)
🤝 *MAU NEGO? BOLEH!*

📞 *Contact Admin:* @Rizzxtzy
🤖 *Demo Bot:* @DragonMd100_bot`)
  })

  bot.action('buy_script_traz', async (ctx) => {
    await sendProduk(ctx, `📦 *Script Traz Invictus*\nSilakan hubungi @Rizzxtzy untuk info lebih lanjut.`)
  })

  bot.action('buy_script_tf', async (ctx) => {
    await sendProduk(ctx, `📦 *Script Twelve Fortunes*\nSilakan hubungi @Rizzxtzy untuk info lebih lanjut.`)
  })

  bot.action('produk_menu', async (ctx) => {
    await ctx.deleteMessage()
    ctx.reply('/produk untuk melihat daftar produk kembali.', {
      parse_mode: 'Markdown'
    })
  })
}