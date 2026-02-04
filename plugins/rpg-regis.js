const { Telegraf } = require('telegraf')
const fs = require('fs')
const path = './database.json'

// Load database function
function loadDatabase() {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({ users: {} }, null, 2))
  }
  const data = fs.readFileSync(path)
  return JSON.parse(data)
}

// Save database function
function saveDatabase(db) {
  fs.writeFileSync(path, JSON.stringify(db, null, 2))
}

module.exports = (bot) => {
  bot.command('regis', (ctx) => {
    const userId = ctx.from.id.toString()  // Gunakan ID asli Telegram user
    let db = loadDatabase()

    if (db.users[userId]) {
      return ctx.reply(`User dengan ID \`${userId}\` sudah terdaftar.`)
    }

    // Default RPG data object (contoh)
    const defaultUserData = {
      btc: 0,
      money: 0,
      exp: 1109,
      limit: 20,
      freelimit: 0,
      lastclaim: 0,
      skata: 0,
      registered: true,
      name: ctx.from.first_name || 'NoName',
  username: ctx.from.username ? '@' + ctx.from.username : '-',
  pc: 0,
      joinlimit: 1,
      age: -1,
      regTime: Date.now(),
      unreg: false,
      afk: -1,
      listafk: -1,
      afkReason: '',
      banned: false,
      warning: 0,
      warn: 0,
      level: 0,
      rokets: 0,
      role: "Newbie ㋡",
      makanan: 0,
      ojekk: 0,
      BannedReason: '',
      WarnReason: '',
      anakkucing: 0,
      kucing: 0,
      kucinglastclaim: 0,
      ramuankucinglast: 0,
      anakgriffin: 0,
      griffin: 0,
      griffinexp: 0,
      griffinlastclaim: 0,
      griffinlastfeed: 0,
      makanangriffin: 0,
      ramuangriffinlast: 0,
      anaknaga: 0,
      makanannaga: 0,
      naga: 0,
      nagalastclaim: 0,
      ramuannagalast: 0,
      anakphonix: 0,
      makananphonix: 0,
      phonix: 0,
      phonixexp: 0,
      phonixlastclaim: 0,
      phonixlastfeed: 0,
      ramuanphonixlast: 0,
      anakkyubi: 0,
      kyubi: 0,
      kyubilastclaim: 0,
      makanankyubi: 0,
      ramuankyubilast: 0,
      chip: 0,
      bank: 0,
      atm: 0,
      fullatm: 0,
      health: 100,
      potion: 10,
      trash: 0,
      wood: 0,
      rock: 0,
      string: 0,
      emerald: 0,
      diamond: 0,
      gold: 0,
      iron: 0,
      common: 0,
      uncommon: 0,
      mythic: 0,
      legendary: 0,
      umpan: 0,
      pet: 0,
      horse: 0,
      horseexp: 0,
      horselastfeed: 0,
      cat: 0,
      catexp: 0,
      catlastfeed: 0,
      fox: 0,
      foxexp: 0,
      foxlastfeed: 0,
      robo: 0,
      roboexp: 0,
      robolastfeed: 0,
      dog: 0,
      dogexp: 0,
      doglastfeed: 0,
      koin: 0,
      paus: 0,
      kepiting: 0,
      gurita: 0,
      cumi: 0,
      buntal: 0,
      dory: 0,
      lumba: 0,
      lobster: 0,
      hiu: 0,
      udang: 0,
      ikan: 0,
      orca: 0,
      banteng: 0,
      harimau: 0,
      gajah: 0,
      kambing: 0,
      buaya: 0,
      kerbau: 0,
      sapi: 0,
      monyet: 0,
      babi: 0,
      ayam: 0,
      armor: 0,
      armordurability: 0,
      sword: 0,
      sworddurability: 0,
      pickaxe: 0,
      pickaxedurability: 0,
      fishingrod: 0,
      fishingroddurability: 0,
      robodurability: 0,
      apel: 20,
      pisang: 0,
      anggur: 0,
      mangga: 0,
      jeruk: 0,
      lastadventure: 0,
      lastkill: 0,
      lastmisi: 0,
      lastdungeon: 0,
      lastwar: 0,
      lastsda: 0,
      lastduel: 0,
      lastmining: 0,
      lasthunt: 0,
      lastgift: 0,
      lastberkebon: 0,
      lastdagang: 0,
      lasthourly: 0,
      lastbansos: 0,
      lastrampok: 0,
      lastnebang: 0,
      lastweekly: 0,
      lastmonthly: 0,
      premium: false,
      premiumTime: 0,
      lastBanned: 0,
      skill: '',
      pasangan: '',
      catatan: '',
      ultah: '',
      petfood: 0,
      kyubiexp: 0,
      kyubilastfeed: 0,
      anakcentaur: 0,
      centaur: 0,
      makanancentaur: 0,
      botol: 0,
      kardus: 0,
      kaleng: 0,
      gelas: 0,
      plastik: 0,
      skillexp: 0,
      panda: 0,
      babihutan: 0,
      bibitanggur: 0,
      bibitpisang: 0,
      bibitapel: 0,
      bibitmangga: 0,
      bibitjeruk: 0,
      vipDate: 0,
      vip: false,
      lastSentTime: new Date().toISOString(),
      otp: '',
      otpExpiry: 0
    }

    db.users[userId] = defaultUserData
    saveDatabase(db)

    return ctx.reply(`User dengan ID \`${userId}\` berhasil didaftarkan.`)
  })
    
    
  // Profile command, tanpa argumen, langsung pakai ID user yang kirim pesan
  bot.command('profile', (ctx) => {
    const idtele = String(ctx.from.id).toLowerCase()
    let db = loadDatabase()

    if (!db.users[idtele]) {
      return ctx.reply(`User dengan ID \`${idtele}\` tidak ditemukan. Silakan daftar dulu dengan /regis ${idtele}`)
    }

    const user = db.users[idtele]

    const profileMessage = `
📋 *Profil User* 📋

👤 Nama: ${user.name}
🆔 ID: \`${idtele}\`
🏷️ Role: ${user.role}
⭐ Level: ${user.level}
💰 Money: ${user.money}
💎 BTC: ${user.btc}
🚀 Exp: ${user.exp}
📅 Terdaftar: ${new Date(user.lastSentTime).toLocaleString()}
    `.trim()

    return ctx.replyWithMarkdown(profileMessage)
  });
    
    bot.command('unreg', (ctx) => {
    const db = loadDatabase();
    const id = String(ctx.from.id);

    if (!db.users || !db.users[id]) {
      return ctx.reply('❌ Kamu belum terdaftar di sistem.');
    }

    delete db.users[id];
    saveDatabase(db);
    ctx.reply('✅ Kamu berhasil dihapus dari sistem RPG.');
  });
}


