const { OWNER_ID } = require('../config')

module.exports = (bot) => {
  bot.command('reqfitur', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ')
    if (!text) {
      return ctx.reply('❌ Format salah. Contoh:\n/reqfitur Tambahkan fitur translate')
    }

    const user = ctx.from
    const messageToOwner = `📩 *Permintaan Fitur*\n\n` +
      `👤 Dari: [${user.first_name}](tg://user?id=${user.id})\n` +
      `🆔 ID: \`${user.id}\`\n\n` +
      `💬 Pesan:\n${text}`

    try {
      await ctx.telegram.sendMessage(OWNER_ID, messageToOwner, {
        parse_mode: 'Markdown',
      })
      await ctx.reply('✅ Permintaanmu sudah dikirim ke developer. Terima kasih!')
    } catch (err) {
      console.error('Gagal kirim ke owner:', err)
      await ctx.reply('⚠️ Gagal mengirim ke developer.')
    }
  })
}