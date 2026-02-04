const fetch = require('node-fetch')

module.exports = (bot) => {
  bot.command('kisahnabi', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1)
    const text = args.join(' ').toLowerCase()

    if (!text) {
      return ctx.reply('Masukkan nama nabi\nContoh: /kisahnabi adam')
    }

    try {
      const res = await fetch(`https://raw.githubusercontent.com/ZeroChanBot/Api-Freee/a9da6483809a1fbf164cdf1dfbfc6a17f2814577/data/kisahNabi/${text}.json`)
      if (!res.ok) throw new Error('Not found')

      const kisah = await res.json()

      const hasil = `
_*👳 Nabi:*_ ${kisah.name}
_*📅 Tanggal Lahir:*_ ${kisah.thn_kelahiran}
_*📍 Tempat Lahir:*_ ${kisah.tmp}
_*📊 Usia:*_ ${kisah.usia}

📖 *Kisah Singkat:*
${kisah.description}
      `.trim()

      await ctx.replyWithMarkdown(hasil)
    } catch (e) {
      return ctx.reply('❌ Kisah nabi tidak ditemukan.')
    }
  })
}