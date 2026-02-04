const fs = require('fs')
const path = require('path')

const xpperlimit = 1

module.exports = (bot) => {
  bot.command(/^(tarik([0-9]+)?|tarikall)$/i, async (ctx) => {
    try {
      // Load database
      const dbPath = path.join(__dirname, '../database.json')
      const db = JSON.parse(fs.readFileSync(dbPath))
      const chatId = ctx.chat.id.toString()

      // Cek apakah fitur RPG di chat ini aktif (global.db.data.chats[m.chat].rpg)
      if (db.chats && db.chats[chatId] && db.chats[chatId].rpg === false && ctx.chat.type.endsWith('group')) {
        return ctx.reply('❗ ᴏᴘᴛɪᴏɴs ʀᴘɢ ɢᴀᴍᴇ ᴅɪᴄʜᴀᴛ ɪɴɪ ʙᴇʟᴜᴍ ᴅɪɴʏᴀʟᴀᴋᴀɴ ᴏʟᴇʜ ᴀᴅᴍɪɴ ɢʀᴏᴜᴘ\nKetik .on rpg untuk mengaktifkan')
      }

      const fromId = ctx.from.id.toString()
      // Cari user di db.users berdasarkan username (kalau username ada)
      const username = ctx.from.username ? '@' + ctx.from.username : null
      let userKey

      // cari user di db.users by username atau by key langsung
      if (username) {
        userKey = Object.keys(db.users).find(k => db.users[k].username === username)
      }
      if (!userKey) userKey = fromId // fallback pakai sender id

      if (!db.users[userKey]) return ctx.reply('User kamu tidak ditemukan dalam database.')

      const user = db.users[userKey]

      // parsing argumen jumlah tarik
      const text = ctx.message.text.trim()
      const args = text.split(/\s+/)
      let countArg = args[1]

      let count
      if (countArg && /all/i.test(countArg)) {
        count = Math.floor(user.bank / xpperlimit)
      } else if (countArg) {
        count = parseInt(countArg)
        if (isNaN(count) || count < 1) count = 1
      } else {
        count = 1
      }

      if (user.atm === 0) return ctx.reply('Kamu belum memiliki kartu ATM!')

      if (user.bank >= xpperlimit * count) {
        user.bank -= xpperlimit * count
        user.money += count

        // Simpan kembali ke database.json
        db.users[userKey] = user
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))

        return ctx.reply(`Sukses menarik sebesar ${count} Money 💹`)
      } else {
        return ctx.reply(`[❗] Uang di bank kamu tidak mencukupi untuk menarik sebesar ${count} Money 💹`)
      }

    } catch (err) {
      console.error(err)
      ctx.reply('Terjadi kesalahan saat melakukan tarik uang.')
    }
  })
}
