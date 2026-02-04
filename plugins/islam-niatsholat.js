// commands/niatsholat.js
module.exports = (bot) => {
  const niatSholatList = [
    {
      solat: "subuh",
      latin: "Ushalli fardhosh shubhi rok'ataini mustaqbilal qiblati adaa-an lillaahi ta'aala",
      arabic: "اُصَلِّى فَرْضَ الصُّبْحِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً ِللهِ تَعَالَى",
      translation_id: "Aku berniat shalat fardhu Shubuh dua raka'at menghadap kiblat karena Allah Ta'ala",
    },
    {
      solat: "maghrib",
      latin: "Ushalli fardhol maghribi tsalaata raka'aatim mustaqbilal qiblati adaa-an lillaahi ta'aala",
      arabic: "اُصَلِّى فَرْضَ الْمَغْرِبِ ثَلاَثَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً ِللهِ تَعَالَى",
      translation_id: "Aku berniat shalat fardhu Maghrib tiga raka'at menghadap kiblat karena Allah Ta'ala",
    },
    {
      solat: "dzuhur",
      latin: "Ushalli fardhodl dhuhri arba'a raka'aatim mustaqbilal qiblati adaa-an lillaahi ta'aala",
      arabic: "اُصَلِّى فَرْضَ الظُّهْرِاَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً ِللهِ تَعَالَى",
      translation_id: "Aku berniat shalat fardhu Dzuhur empat raka'at menghadap kiblat karena Allah Ta'ala",
    },
    {
      solat: "isha",
      latin: "Ushalli fardhol 'isyaa-i arba'a raka'aatim mustaqbilal qiblati adaa-an lillaahi ta'aala",
      arabic: "صَلِّى فَرْضَ الْعِشَاءِ اَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً ِللهِ تَعَالَى",
      translation_id: "Aku berniat shalat fardhu Isya empat raka'at menghadap kiblat karena Allah Ta'ala",
    },
    {
      solat: "ashar",
      latin: "Ushalli fardhol 'ashri arba'a raka'aatim mustaqbilal qiblati adaa-an lillaahi ta'aala",
      arabic: "صَلِّى فَرْضَ الْعَصْرِاَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ اَدَاءً ِللهِ تَعَالَى",
      translation_id: "Aku berniat shalat fardhu 'Ashar empat raka'at menghadap kiblat karena Allah Ta'ala",
    }
  ]

  bot.command('niatsholat', async (ctx) => {
    const q = ctx.message.text.split(' ').slice(1).join(' ').toLowerCase()
    if (!q) {
      return ctx.reply(`Contoh penggunaan:\n/niatsholat subuh`)
    }

    const data = niatSholatList.find(item => item.solat === q)
    if (!data) {
      return ctx.reply(`Niat untuk "${q}" tidak ditemukan.\n\nList sholat 5 waktu:\n• Subuh\n• Dzuhur\n• Ashar\n• Maghrib\n• Isha`)
    }

    await ctx.replyWithMarkdown(`_*Niat Sholat ${capitalize(q)}*_\n\n*Arab:* ${data.arabic}\n\n*Latin:* ${data.latin}\n\n*Terjemahan:* ${data.translation_id}`)
  })

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }
}