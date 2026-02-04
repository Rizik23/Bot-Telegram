const fs = require('fs')
const path = require('path')

module.exports = (bot) => {
  bot.command('atmup', async (ctx) => {
    try {
      const dbPath = path.join(__dirname, '../database.json')
      const db = JSON.parse(fs.readFileSync(dbPath))

      const text = ctx.message.text || ''
      const args = text.split(' ').slice(1) // ambil args setelah command

      if (args.length < 2) {
        return ctx.reply('Format salah!\n\nTambah level ATM: atmup @username <level baru>')
      }

      let [mention, atmLevelStr] = args

      if (!mention.startsWith('@')) {
        return ctx.reply('Tag pengguna harus menggunakan @username!')
      }

      const atmLevel = parseInt(atmLevelStr)
      if (isNaN(atmLevel)) {
        return ctx.reply('Level ATM harus berupa angka!')
      }

      // Cari user key di db.users berdasarkan username
      let userKey = Object.keys(db.users).find(k => db.users[k].username === mention)

      if (!userKey) {
        return ctx.reply(`Pengguna ${mention} tidak ditemukan dalam database!`)
      }

      if (!db.users[userKey].atm) db.users[userKey].atm = 0
      db.users[userKey].atm = atmLevel

      // Simpan ke database
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))

      await ctx.reply(`Berhasil memperbarui level ATM untuk ${mention} menjadi ${atmLevel}!`)

    } catch (err) {
      console.error(err)
      ctx.reply('Terjadi kesalahan saat memperbarui level ATM.')
    }
  })
}
