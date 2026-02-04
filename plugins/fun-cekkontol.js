module.exports = (bot) => {
  bot.command('cekkontol', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) return ctx.reply('Ketik Namanya Tolol!');

    const kontolType = pickRandom([
      'ih item', 'Belang wkwk', 'Muluss',
      'Putih Mulus', 'Black Doff', 'Pink wow', 'Item Glossy'
    ]);

    const trueStatus = pickRandom([
      'perjaka', 'ga perjaka', 'udah pernah dimasukin',
      'masih ori', 'jumbo'
    ]);

    const jembutType = pickRandom([
      'lebat', 'ada sedikit', 'gada jembut', 'tipis', 'muluss'
    ]);

    const result = `
╭━━━━°「 *Kontol ${text}* 」°
┃
┊• Nama : ${text}
┃• Kontol : ${kontolType}
┊• True : ${trueStatus}
┃• jembut : ${jembutType}
╰═┅═━––––––๑
    `.trim();

    ctx.reply(result);
  });

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
};
