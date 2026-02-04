const fs = require('fs')
const path = require('path')

module.exports = (bot) => {
  bot.command('bonus', async (ctx) => {
    try {
      const dbPath = path.join(__dirname, '../database.json')
      const db = JSON.parse(fs.readFileSync(dbPath))

      const mention = '@' + ctx.from.username
      const userKey = Object.keys(db.users).find(k => db.users[k].username === mention)

      if (!userKey) return ctx.reply(`❌ Pengguna ${mention} tidak ditemukan di database.`)

      const user = db.users[userKey]
      const now = Date.now()
      const bonusCooldown = 86400000 // 24 jam

      if (user.lastbonus && now - user.lastbonus < bonusCooldown) {
        const wait = msToTime(bonusCooldown - (now - user.lastbonus))
        return ctx.reply(`⏳ Kamu sudah ambil bonus hari ini\nTunggu ${wait} lagi.`)
      }

      const money = Math.floor(Math.random() * 50000000)
      user.money = (user.money || 0) + money
      user.lastbonus = now

      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
      ctx.reply(`🎉 Selamat kamu mendapatkan bonus:\n+${money.toLocaleString('id-ID')} Money 💰`)
    } catch (e) {
      console.error(e)
      ctx.reply('❌ Terjadi kesalahan saat mengambil bonus.')
    }
  })
}

// Fungsi waktu
function msToTime(duration) {
  const seconds = Math.floor((duration / 1000) % 60)
  const minutes = Math.floor((duration / (1000 * 60)) % 60)
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

  return `${hours} jam ${minutes} menit ${seconds} detik`
}
