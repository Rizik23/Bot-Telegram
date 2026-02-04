const fs = require('fs')
const path = require('path')

module.exports = (bot) => {
  bot.command('bankcek', async (ctx) => {
    try {
      const text = ctx.message.text.trim()
      const args = text.split(/\s+/)
      let usernameTag = args[1] // optional @username

      // Load database
      const dbPath = path.join(__dirname, '../database.json')
      const db = JSON.parse(fs.readFileSync(dbPath))

      let userData

      if (usernameTag && usernameTag.startsWith('@')) {
        // cari user by username (misal @ferninexz)
        const userEntry = Object.entries(db.users).find(([_, data]) => data.username === usernameTag)
        if (!userEntry) return ctx.reply(`Pengguna ${usernameTag} tidak ditemukan dalam database.`)
        userData = userEntry[1]
      } else {
        // pakai user sendiri
        let ownUsername = ctx.from.username ? '@' + ctx.from.username : null
        if (!ownUsername) return ctx.reply('Username Telegram kamu tidak ditemukan, tidak bisa cek saldo.')

        const userEntry = Object.entries(db.users).find(([_, data]) => data.username === ownUsername)
        if (!userEntry) return ctx.reply(`Pengguna ${ownUsername} tidak ditemukan dalam database.`)
        userData = userEntry[1]
      }

      const status = userData.premiumTime >= 1
        ? 'Pengguna Premium'
        : (userData.level >= 1000 ? 'Pengguna Elite' : 'Pengguna Biasa')

      const caption = `
▧「 *BANK CEK* 」
│ 👤 Nama: ${userData.registered ? userData.name : (ctx.from.first_name || 'User')}
│ 💳 Atm: ${userData.atm > 0 ? 'Level ' + userData.atm : '✖️'}
│ 🏦 Bank: ${userData.bank.toLocaleString('id-ID')} / ${userData.fullatm.toLocaleString('id-ID')}
│ 💰 Uang: ${userData.money.toLocaleString('id-ID')}
│ 💳 Chip: ${userData.chip.toLocaleString('id-ID')}
│ 🤖 Robo: ${userData.robo > 0 ? 'Level ' + userData.robo : '✖️'}
│ 🪙 BTC: ${userData.btc.toFixed(8)}
│ 🌟 Status: ${status}
│ 📑 Terdaftar: ${userData.registered ? 'Ya' : 'Tidak'}
└────···
`.trim()

      await ctx.replyWithPhoto({ source: './media/bank.jpg' }, { caption })

    } catch (e) {
      console.error(e)
      ctx.reply('Terjadi kesalahan saat mengambil data bank.')
    }
  })
}
