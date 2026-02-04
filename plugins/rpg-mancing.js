const { Telegraf } = require('telegraf')
const fs = require('fs')
const path = require('path')
const dbFile = path.join(__dirname, '../database.json')
let conn = {}

function loadDb() {
  return JSON.parse(fs.readFileSync(dbFile))
}

function saveDb(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2))
}

function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

module.exports = (bot) => {
  conn.misi = {}

  bot.command(['mancing', 'fishing', 'memancing'], async (ctx) => {
    const db = loadDb()
    const id = String(ctx.from.id)
    if (!db.users[id]) return ctx.reply('Kamu belum terdaftar dalam RPG, gunakan /mulai untuk memulai!')

    const user = db.users[id]
    const now = Date.now()
    const cooldown = 3600000
    const sisa = cooldown - (now - (user.lastmisi || 0))

    if (id in conn.misi) {
      return ctx.reply(`Selesaikan Misi ${conn.misi[id][0]} Terlebih Dahulu`)
    }

    if (user.umpan <= 0) return ctx.reply('Kamu membutuhkan Umpan 🪱 untuk memancing!')
    if (user.fishingrod <= 0) return ctx.reply('Kamu harus punya Fishing Rod 🎣 terlebih dahulu!')

    if (sisa > 0) {
      return ctx.reply(`Tunggu ${clockString(sisa)} sebelum memancing lagi.`)
    }

    // mulai mancing
    conn.misi[id] = ['Memancing', setTimeout(() => delete conn.misi[id], 20000)]
    user.umpan -= 1
    user.fishingroddurability -= 10

    ctx.reply('Kamu sedang memancing...')

    setTimeout(() => ctx.reply('Kail mu ditarik ikan...'), 9000)
    setTimeout(() => ctx.reply('Kamu menarik kailmu'), 12000)
    setTimeout(() => ctx.reply('Kamu berhasil menarik ikan keluar dari air'), 15000)
    setTimeout(() => ctx.reply('Ini dia hasil tangkapanmu:'), 18000)

    setTimeout(() => {
      const hasil = {
        kepiting: Math.floor(Math.random() * 5),
        lobster: Math.floor(Math.random() * 5),
        udang: Math.floor(Math.random() * 5),
        cumi: Math.floor(Math.random() * 5),
        gurita: Math.floor(Math.random() * 5),
        buntal: Math.floor(Math.random() * 5),
        dory: Math.floor(Math.random() * 5),
        orca: Math.floor(Math.random() * 5),
        lumba: Math.floor(Math.random() * 5),
        paus: Math.floor(Math.random() * 5),
        hiu: Math.floor(Math.random() * 5),
      }

      let resultText = `🎣 *Hasil Tangkapan:*\n`
      for (let ikan in hasil) {
        if (hasil[ikan]) {
          resultText += `• ${ikan.charAt(0).toUpperCase() + ikan.slice(1)}: ${hasil[ikan]}\n`
          user[ikan] = (user[ikan] || 0) + hasil[ikan]
        }
      }

      user.lastmisi = now
      saveDb(db)

      ctx.reply(resultText.trim())
    }, 20000)
  })
}
