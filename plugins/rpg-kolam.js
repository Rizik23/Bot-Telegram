const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../database.json')

function loadDb() {
  return JSON.parse(fs.readFileSync(dbPath))
}

module.exports = (bot) => {
  bot.command(['kolam', 'kolamikan', 'kotakikan', 'kotak'], async (ctx) => {
    const userId = ctx.from.id.toString()

    let data
    try {
      data = loadDb()
    } catch (e) {
      return ctx.reply('⚠️ Gagal membaca database.')
    }

    if (!data.users || !data.users[userId]) {
      return ctx.reply('❌ Kamu belum terdaftar dalam RPG.')
    }

    const user = data.users[userId]
    const name = user.registered ? user.name : ctx.from.first_name

    const total = (
      user.kepiting + user.lobster + user.udang + user.cumi +
      user.gurita + user.buntal + user.dory + user.orca +
      user.lumba + user.paus + user.hiu
    )

    const message = `
╭━━━━「 *BIO* 」   
┊ *💌 Name :* ${name}
┊ *📊 Level :* ${user.level}
┊ *✨ Exp :* ${user.exp}
╰═┅═━––––––─ׄ✧

╭━━━━「 *ISI KOLAM* 」
┊🦀 Kepiting: ${user.kepiting}
┊🦞 Lobster: ${user.lobster}
┊🦐 Udang: ${user.udang}
┊🦑 Cumi: ${user.cumi}
┊🐙 Gurita: ${user.gurita}
┊🐡 Buntal: ${user.buntal}
┊🐠 Dory: ${user.dory}
┊🐳 Orca: ${user.orca}
┊🐬 Lumba: ${user.lumba}
┊🐋 Paus: ${user.paus}
┊🦈 Hiu: ${user.hiu}
╰═┅═━––––––─ׄ✧
🎏 Total Isi: *${total}* Jenis
`.trim()

    await ctx.reply(message)
  })
}
