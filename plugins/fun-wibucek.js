module.exports = (bot) => {
  bot.command('wibucek', async (ctx) => {
    const wibu = [
      'Wibu Level : 4%\n\nMasih Aman Lah Yaa!',
      'Wibu Level : 7%\n\nMasih Aman',
      'Wibu Level : 12%\n\nAman Kok',
      'Wibu Level : 22%\n\nHampir Aman',
      'Wibu Level : 27%\n\nWibu dikit',
      'Wibu Level : 35%\n\nWibu ¼',
      'Wibu Level : 41%\n\nDah lewat dri Aman',
      'Wibu Level : 48%\n\nSetengah Wibu',
      'Wibu Level : 56%\n\nLu Wibu juga',
      'Wibu Level : 64%\n\nLumayan Wibu',
      'Wibu Level : 71%\n\nPasti Lu Punya Seribu Waifu',
      'Wibu Level : 1%\n\n99% LU GAK Wibu!',
      'Wibu Level : 77%\n\nGak akan Salah Lagi dah Wibunya lu',
      'Wibu Level : 83%\n\nDijamin Sepuhnya Wibu',
      'Wibu Level : 89%\n\nFix Wibu Elite!',
      'Wibu Level : 94%\n\nUdah Elite Sih Ini😂',
      'Wibu Level : 100%\n\nBAU BAWANGNYA SAMPE SINI CUY!!!',
      'Wibu Level : 100%\n\nBAU BAWANGNYA SAMPE SINI CUY!!!',
      'Wibu Level : 100%\n\nBAU BAWANGNYA SAMPE SINI CUY!!!',
      'Wibu Level : 100%\n\nBAU BAWANGNYA SAMPE SINI CUY!!!',
    ];

    const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

    await ctx.reply(`“${pickRandom(wibu)}”`);
  });
};
