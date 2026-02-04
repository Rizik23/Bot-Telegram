const fs = require('fs')
const path = require('path')

module.exports = (bot) => {
  bot.command('addbank', async (ctx) => {
    const args = ctx.message.text.trim().split(/\s+/)
    const usernameTag = args[1]
    const amount = parseInt(args[2])

    if (!usernameTag || !usernameTag.startsWith('@')) {
      return ctx.reply('Gunakan format: /addbank @username jumlah')
    }

    if (isNaN(amount)) {
      return ctx.reply('Jumlah yang Anda masukkan bukan angka.')
    }

    // Tetap gunakan username dengan '@'
    const username = usernameTag

    // Load database
    const dbPath = path.join(__dirname, '../database.json')
    const db = JSON.parse(fs.readFileSync(dbPath))

    // Cari user berdasarkan field "username"
    const userEntry = Object.entries(db.users).find(([_, data]) => data.username === username)

    if (!userEntry) {
      return ctx.reply(`Pengguna ${username} tidak ditemukan dalam database.`)
    }

    const [userId, userData] = userEntry

    // Tambah saldo bank
    userData.bank += amount

    // Simpan kembali ke database
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))

    const caption = `
▧「 *TAMBAH SALDO BANK* 」
│ 👤 Nama: ${userData.name || username}
│ 💰 Saldo Bank: ${userData.bank}
└────···
`.trim()

    await ctx.replyWithPhoto({ source: './media/bank.jpg' }, { caption })
  })
}
