module.exports = (bot) => {
  bot.command('bisakah', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) return ctx.reply('Contoh: /bisakah aku jadian sama dia?');

    const jawab = pickRandom([
      'Iya',
      'Bisa',
      'Tentu saja bisa',
      'Tentu bisa',
      'Sudah pasti',
      'Sudah pasti bisa',
      'Tidak',
      'Tidak bisa',
      'Tentu tidak',
      'Tentu tidak bisa',
      'Sudah pasti tidak'
    ]);

    ctx.reply(`*🌎Pertanyaan:* bisakah ${text}\n*💬Jawaban:* ${jawab}`, {
      parse_mode: 'Markdown'
    });
  });

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
};
