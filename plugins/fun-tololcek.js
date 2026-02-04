const { Markup } = require('telegraf');

module.exports = (bot) => {
  bot.command('tololcek', async (ctx) => {
    const tolol = [
      'Tolol Level : 4%\n\nAMAN BANGET!',
      'Tolol Level : 7%\n\nMasih Aman',
      'Tolol Level : 12%\n\nAman Kok',
      'Tolol Level : 22%\n\nHampir Aman',
      'Tolol Level : 27%\n\nTolol dikit',
      'Tolol Level : 35%\n\nTolol ¼',
      'Tolol Level : 41%\n\nDah lewat dri Aman',
      'Tolol Level : 48%\n\nSetengah Tolol',
      'Tolol Level : 56%\n\nLu Tolol juga',
      'Tolol Level : 64%\n\nLumayan Tolol',
      'Tolol Level : 71%\n\nHebatnya ketololan lu',
      'Tolol Level : 1%\n\n99% LU GAK TOLOL!',
      'Tolol Level : 77%\n\nGak akan Salah Lagi dah tololnya lu',
      'Tolol Level : 83%\n\nDijamin tololnyan',
      'Tolol Level : 89%\n\nTolol Banget!',
      'Tolol Level : 94%\n\nSetolol Om Deddy😂',
      'Tolol Level : 100%\n\nLU ORANG TERTOLOL YANG PERNAH ADA!!!',
      'Tolol Level : 100%\n\nLU ORANG TERTOLOL YANG PERNAH ADA!!!',
      'Tolol Level : 100%\n\nLU ORANG TERTOLOL YANG PERNAH ADA!!!',
      'Tolol Level : 100%\n\nLU ORANG TERTOLOL YANG PERNAH ADA!!!',
    ];

    const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

    await ctx.reply(`“${pickRandom(tolol)}”`);
  });
};
