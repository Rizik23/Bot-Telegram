const fs = require('fs')
const path = require('path')
const dbPath = path.join(__dirname, '../database.json')

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
}

function loadDatabase() {
    return JSON.parse(fs.readFileSync(dbPath))
}

function saveDatabase(db) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
}

module.exports = (bot) => {
    const activeSlots = {}

    bot.command(['slot', 'jackpot'], async (ctx) => {
        const chatId = ctx.chat.id
        const userId = ctx.from.id.toString()

        if (activeSlots[chatId]) return ctx.reply('❗ Masih ada yang bermain slot di sini, tunggu hingga selesai.')

        activeSlots[chatId] = true
        try {
            const args = ctx.message.text.split(' ').slice(1)
            if (args.length < 1 || isNaN(args[0])) {
                delete activeSlots[chatId]
                return ctx.reply(`Gunakan format /slot [jumlah]\nContoh: /slot 10`)
            }

            const count = Math.max(parseInt(args[0]), 1)
            const db = loadDatabase()
            const user = db.users[userId] = db.users[userId] || { money: 0, inventory: {}, rpg: {} }

            if (user.money < count) {
                delete activeSlots[chatId]
                return ctx.reply(`💸 Uang kamu tidak cukup untuk taruhan sebesar ${count}`)
            }

            user.money -= count

            const spins = Array.from({ length: 9 }, () => pickRandom(['🦁', '🐼', '🐷', '🐮', '🦊']))

            // Kirim animasi awal
            for (let i = 0; i < 3; i++) {
                await ctx.reply(`
🎰 ᴠɪʀᴛᴜᴀʟ sʟᴏᴛ 🎰

${pickRandom(['🦁', '🐼', '🐷', '🐮', '🦊'])}|${pickRandom(['🦁', '🐼', '🐷', '🐮', '🦊'])}|${pickRandom(['🦁', '🐼', '🐷', '🐮', '🦊'])}
${pickRandom(['🦁', '🐼', '🐷', '🐮', '🦊'])}|${pickRandom(['🦁', '🐼', '🐷', '🐮', '🦊'])}|${pickRandom(['🦁', '🐼', '🐷', '🐮', '🦊'])} <<==
${pickRandom(['🦁', '🐼', '🐷', '🐮', '🦊'])}|${pickRandom(['🦁', '🐼', '🐷', '🐮', '🦊'])}|${pickRandom(['🦁', '🐼', '🐷', '🐮', '🦊'])}
                `)
            }

            let WinOrLose, Hadiah
            const [a, b, c, d, e, f, g, h, i] = spins

            if (a === b && b === c && c === d && d === e && e === f && f === g && g === h && h === i) {
                WinOrLose = '🎉 JACKPOT BESAR!'
                Hadiah = `+${count * 4}`
                user.money += count * 4
            } else if (d === e && e === f) {
                WinOrLose = '✨ JACKPOT!'
                Hadiah = `+${count * 2}`
                user.money += count * 2
            } else if ((a === b && b === c) || (g === h && h === i)) {
                WinOrLose = '😥 Hampir Menang!'
                Hadiah = `-${count}`
            } else {
                WinOrLose = '💔 Kamu kalah!'
                Hadiah = `-${count}`
            }

            // Tampilkan hasil
            await ctx.reply(`
🎰 ᴠɪʀᴛᴜᴀʟ sʟᴏᴛ 🎰

${a}|${b}|${c}
${d}|${e}|${f} <<==
${g}|${h}|${i}

${WinOrLose} ${Hadiah}
💰 Sisa Uang: ${user.money}
            `.trim())

            saveDatabase(db)
        } catch (e) {
            console.error(e)
            ctx.reply('Terjadi kesalahan saat menjalankan slot.')
        } finally {
            delete activeSlots[chatId]
        }
    })
}
