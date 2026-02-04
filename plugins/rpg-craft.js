const fs = require('fs')
const path = require('path')
const dbPath = path.join(__dirname, '../database.json')

module.exports = (bot) => {
  bot.command(['craft', 'crafting'], async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1)
    const command = ctx.message.text.split(' ')[0].replace('/', '')
    const type = (args[0] || '').toLowerCase()
    const userId = String(ctx.from.id)

    // Load database
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
    if (!db.users[userId]) {
      db.users[userId] = {
        pickaxe: 0, pickaxedurability: 0,
        sword: 0, sworddurability: 0,
        fishingrod: 0, fishingroddurability: 0,
        armor: 0, armordurability: 0,
        atm: 0, fullatm: 0,
        wood: 0, rock: 0, iron: 0, string: 0, emerald: 0, diamond: 0,
        money: 0
      }
    }
    const user = db.users[userId]

    const caption = `
Gunakan Format /${command} [type]
Contoh: /${command} pickaxe

乂 List Yang Bisa Di Craft
▧ Pickaxe ⛏️
▧ Sword ⚔️
▧ Fishingrod 🎣
▧ Armor 🥼
▧ Atm 💳

乂 Recipe
▧ Pickaxe ⛏️
〉 10 Kayu, 5 Batu, 5 Iron, 20 String
▧ Sword ⚔️
〉 10 Kayu, 15 Iron
▧ Fishingrod 🎣
〉 10 Kayu, 2 Iron, 20 String
▧ Armor 🥼
〉 30 Iron, 1 Emerald, 5 Diamond
▧ Atm 💳
〉 3 Emerald, 6 Diamond, 10k Money
`.trim()

    try {
      switch (type) {
        case 'pickaxe':
          if (user.pickaxe > 0) return ctx.reply('Kamu sudah punya Pickaxe')
          if (user.wood < 10 || user.rock < 5 || user.iron < 5 || user.string < 20)
            return ctx.reply(`Barang tidak cukup untuk membuat Pickaxe\n${user.wood < 10 ? `Kurang ${10 - user.wood} Kayu🪵` : ''}${user.rock < 5 ? `\nKurang ${5 - user.rock} Batu🪨` : ''}${user.iron < 5 ? `\nKurang ${5 - user.iron} Iron⛓️` : ''}${user.string < 20 ? `\nKurang ${20 - user.string} String🕸️` : ''}`)
          user.wood -= 10
          user.rock -= 5
          user.iron -= 5
          user.string -= 20
          user.pickaxe += 1
          user.pickaxedurability = 40
          ctx.reply("Sukses membuat Pickaxe ⛏️")
          break

        case 'sword':
          if (user.sword > 0) return ctx.reply('Kamu sudah punya Sword')
          if (user.wood < 10 || user.iron < 15)
            return ctx.reply(`Barang tidak cukup untuk membuat Sword\n${user.wood < 10 ? `Kurang ${10 - user.wood} Kayu🪵` : ''}${user.iron < 15 ? `\nKurang ${15 - user.iron} Iron⛓️` : ''}`)
          user.wood -= 10
          user.iron -= 15
          user.sword += 1
          user.sworddurability = 40
          ctx.reply("Sukses membuat Sword ⚔️")
          break

        case 'fishingrod':
          if (user.fishingrod > 0) return ctx.reply('Kamu sudah punya Fishingrod')
          if (user.wood < 10 || user.iron < 2 || user.string < 20)
            return ctx.reply(`Barang tidak cukup untuk membuat Fishingrod\n${user.wood < 10 ? `Kurang ${10 - user.wood} Kayu🪵` : ''}${user.iron < 2 ? `\nKurang ${2 - user.iron} Iron⛓️` : ''}${user.string < 20 ? `\nKurang ${20 - user.string} String🕸️` : ''}`)
          user.wood -= 10
          user.iron -= 2
          user.string -= 20
          user.fishingrod += 1
          user.fishingroddurability = 40
          ctx.reply("Sukses membuat Fishingrod 🎣")
          break

        case 'armor':
          if (user.armor > 0) return ctx.reply('Kamu sudah punya Armor')
          if (user.iron < 30 || user.emerald < 1 || user.diamond < 5)
            return ctx.reply(`Barang tidak cukup untuk membuat Armor\n${user.iron < 30 ? `Kurang ${30 - user.iron} Iron⛓️` : ''}${user.emerald < 1 ? `\nKurang ${1 - user.emerald} Emerald❇️` : ''}${user.diamond < 5 ? `\nKurang ${5 - user.diamond} Diamond💎` : ''}`)
          user.iron -= 30
          user.emerald -= 1
          user.diamond -= 5
          user.armor += 1
          user.armordurability = 50
          ctx.reply("Sukses membuat Armor 🥼")
          break

        case 'atm':
          if (user.atm > 0) return ctx.reply('Kamu sudah punya ATM')
          if (user.emerald < 3 || user.diamond < 6 || user.money < 10000)
            return ctx.reply(`Barang tidak cukup untuk membuat ATM\n${user.emerald < 3 ? `Kurang ${3 - user.emerald} Emerald❇️` : ''}${user.diamond < 6 ? `\nKurang ${6 - user.diamond} Diamond💎` : ''}${user.money < 10000 ? `\nKurang ${10000 - user.money} Uang💹` : ''}`)
          user.emerald -= 3
          user.diamond -= 6
          user.money -= 10000
          user.atm += 1
          user.fullatm = 500000000
          ctx.reply("Sukses membuat ATM 💳")
          break

        default:
          return ctx.reply(caption)
      }

      // Simpan database
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
    } catch (err) {
      console.error(err)
      ctx.reply(`Terjadi error:\n${err.message}`)
    }
  })
}
