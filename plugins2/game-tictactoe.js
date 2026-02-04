const { Markup } = require('telegraf')

const sessions = new Map()
const emoji = { X: '❌', O: '⭕', '': '⬜' }

function createBoard() {
  return Array.from({ length: 3 }, () => Array(3).fill(''))
}

function renderBoard(board) {
  return Markup.inlineKeyboard(
    board.map((row, i) =>
      row.map((cell, j) => Markup.button.callback(emoji[cell], `ttc_${i}_${j}`))
    )
  )
}

function checkWin(board, symbol) {
  const lines = [
    [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
    [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
    [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]]
  ]
  return lines.some(line => line.every(([x,y]) => board[x][y] === symbol))
}

function isFull(board) {
  return board.flat().every(cell => cell !== '')
}

module.exports = (bot) => {
  bot.command('tictactoe', async (ctx) => {
    const mention = ctx.message.text.split(' ')[1]
    const from = ctx.from
    const chatId = ctx.chat.id

    if (!mention || !mention.startsWith('@')) {
      return ctx.reply('Gunakan format: /tictactoe @username')
    }

    if (sessions.has(chatId)) {
      return ctx.reply('Masih ada game yang berlangsung di chat ini.')
    }

    const players = {
      X: { id: from.id, name: from.first_name },
      O: { id: null, username: mention.slice(1), name: mention }
    }

    const board = createBoard()
    sessions.set(chatId, { board, players, turn: 'X' })

    await ctx.reply(
      `🎮 *Tic-Tac-Toe*\n` +
      `❌ ${players.X.name} vs ⭕ ${mention}\n\n` +
      `Giliran: *${players.X.name}* (❌)`,
      {
        parse_mode: 'Markdown',
        ...renderBoard(board)
      }
    )
  })

  bot.action(/^ttc_\d_\d$/, async (ctx) => {
    const chatId = ctx.chat.id
    const session = sessions.get(chatId)
    if (!session) return ctx.answerCbQuery('Tidak ada permainan.')

    const [ , i, j ] = ctx.match[0].split('_').map(Number)
    const { board, players, turn } = session
    const symbol = turn
    const user = ctx.from

    // Daftarkan player O kalau dia klik duluan
    if (symbol === 'O' && !players.O.id && user.username === players.O.username) {
      players.O.id = user.id
      players.O.name = user.first_name
    }

    if (players[symbol].id !== user.id) {
      return ctx.answerCbQuery('❌ Bukan giliranmu!')
    }

    if (board[i][j] !== '') {
      return ctx.answerCbQuery('Kotak sudah diisi!')
    }

    board[i][j] = symbol

    // Menang?
    if (checkWin(board, symbol)) {
      await ctx.editMessageText(
        `🏆 *${players[symbol].name}* (${emoji[symbol]}) menang!`,
        {
          parse_mode: 'Markdown',
          ...renderBoard(board)
        }
      )
      sessions.delete(chatId)
      return
    }

    // Seri?
    if (isFull(board)) {
      await ctx.editMessageText(`🤝 Permainan seri!`, renderBoard(board))
      sessions.delete(chatId)
      return
    }

    // Lanjut giliran
    session.turn = symbol === 'X' ? 'O' : 'X'
    const next = session.turn
    const nextPlayer = players[next]

    await ctx.editMessageText(
      `🎮 *Tic-Tac-Toe*\n❌ ${players.X.name} vs ⭕ @${players.O.username}\n\n` +
      `Giliran: *${nextPlayer.name || '@' + nextPlayer.username}* (${emoji[next]})`,
      {
        parse_mode: 'Markdown',
        ...renderBoard(board)
      }
    )
  })
}