const fs = require('fs')
const path = require('path')
const dbPath = path.join(__dirname, '../database.json')

function loadDB() {
    if (!fs.existsSync(dbPath)) return { users: {} }
    return JSON.parse(fs.readFileSync(dbPath))
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
}

const rpg = {
    emoticon(string) {
        string = string.toLowerCase()
        const emot = {
            money: '💵'
        }
        let results = Object.keys(emot).filter(v => string.includes(v))
        return results.length ? emot[results[0]] : ''
    }
}

module.exports = (bot) => {
    bot.command('kerja', async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1)
        const type = (args[0] || '').toLowerCase()

        let db = loadDB()
        const userId = String(ctx.from.id)

        if (!db.users[userId]) {
            db.users[userId] = {
                money: 0,
                lastkerja: 0
            }
        }

        let user = db.users[userId]
        let now = Date.now()
        let cooldown = 300000 // 5 menit
        let remaining = user.lastkerja + cooldown - now

        if (remaining > 0) {
            return ctx.reply(`Kamu sudah bekerja!\nSaatnya istirahat selama ${clockString(remaining)}`)
        }

        let hasil = Math.floor(Math.random() * 150000)

        const responses = {
            ojek: `Kamu Sudah Mengantarkan *${pickRandom(['mas mas', 'bapak bapak', 'cewe sma', 'bocil epep', 'emak emak'])}* 🚗\nDan mendapatkan uang senilai *Rp ${hasil} ${rpg.emoticon('money')}*`,
            pedagang: `Ada pembeli yg membeli *${pickRandom(['wortel', 'sawi', 'selada', 'tomat', 'seledri', 'cabai', 'daging', 'ikan', 'ayam'])}* 🛒\nDan mendapatkan uang senilai *Rp ${hasil} ${rpg.emoticon('money')}*`,
            dokter: `Kamu menyembuhkan pasien *${pickRandom(['sakit kepala', 'cedera', 'luka bakar', 'patah tulang'])}* 💉\nDan mendapatkan uang senilai *Rp ${hasil} ${rpg.emoticon('money')}*`,
            petani: `${pickRandom(['Wortel', 'Kubis', 'stowbery', 'teh', 'padi', 'jeruk', 'pisang', 'semangka', 'durian', 'rambutan'])} Sudah Panen!🌽 Dan menjualnya 🧺\nDan mendapatkan uang senilai *Rp ${hasil} ${rpg.emoticon('money')}*`,
            montir: `Kamu Baru saja memperbaiki *${pickRandom(['mobil', 'motor', 'becak', 'bajai', 'bus', 'angkot', 'sepeda'])}* 🔧\nDan mendapatkan uang senilai *Rp ${hasil} ${rpg.emoticon('money')}*`,
            kuli: `Kamu baru saja selesai ${pickRandom(['Membangun Rumah', 'Membangun Gedung', 'Memperbaiki Rumah', 'Memperbaiki Gedung', 'Membangun Fasilitas Umum', 'Memperbaiki Fasilitas Umum'])} 🔨\nDan mendapatkan uang senilai *Rp ${hasil} ${rpg.emoticon('money')}*`
        }

        if (!responses[type]) {
            return ctx.reply(`_*Pilih Pekerjaan Yang Kamu Inginkan*_\n\n• Kuli\n• Montir\n• Petani\n• Dokter\n• Pedagang\n• Ojek\n\nContoh: /kerja kuli`)
        }

        user.money += hasil
        user.lastkerja = now
        saveDB(db)

        return ctx.replyWithMarkdown(responses[type])
    })
}
