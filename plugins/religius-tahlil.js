const axios = require('axios')
const { Markup } = require('telegraf')

const STATE = {} // Penyimpanan state per user

module.exports = (bot) => {
  bot.command('tahlil', async (ctx) => {
    const chatId = ctx.chat.id
    try {
      const res = await axios.get('https://api.fasturl.link/religious/tahlil')
      const data = res.data?.result
      if (!Array.isArray(data)) {
        return ctx.reply('❌ Format data dari API tidak valid.')
      }

      STATE[chatId] = { index: 0, data }
      sendTahlilItem(ctx, data, 0)
    } catch (err) {
      console.error(err)
      ctx.reply('❌ Gagal memuat data tahlil.')
    }
  })

  bot.action(/tahlil:(next|prev)/, async (ctx) => {
    const chatId = ctx.chat.id
    if (!STATE[chatId]) return ctx.answerCbQuery('🔄 Ketik /tahlil dulu.')

    const { data, index } = STATE[chatId]
    const action = ctx.match[1]

    let newIndex = index + (action === 'next' ? 1 : -1)
    if (newIndex < 0) newIndex = 0
    if (newIndex >= data.length) newIndex = data.length - 1

    STATE[chatId].index = newIndex
    await ctx.answerCbQuery()
    await ctx.editMessageText(formatTahlil(data[newIndex]), {
      parse_mode: 'HTML',
      ...tahlilButtons(newIndex, data.length)
    })

    // Kirim audio jika tersedia
    if (data[newIndex].audio) {
      await ctx.replyWithAudio({ url: data[newIndex].audio })
    }
  })
}

// Format tampilan bacaan
function formatTahlil(item) {
  return `<b>${item.title}</b>\n\n<pre>${item.arabic}</pre>\n\n${item.translationId}`
}

// Tombol navigasi
function tahlilButtons(index, total) {
  return Markup.inlineKeyboard([
    [
      ...(index > 0 ? [Markup.button.callback('⬅️ Back', 'tahlil:prev')] : []),
      ...(index < total - 1 ? [Markup.button.callback('Next ➡️', 'tahlil:next')] : [])
    ]
  ])
}