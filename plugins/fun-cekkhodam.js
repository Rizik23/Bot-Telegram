module.exports = (bot) => {
  bot.command('cekkhodam', async (ctx) => {
    const input = ctx.message.text.split(' ').slice(1).join(' ');
    const nama = input.trim();

    if (!nama) {
      return ctx.reply('ɴᴀᴍᴀɴʏᴀ ᴍᴀɴᴀ ᴀɴᴊᴇɴɢ🤓');
    }

    const khodamList = [
      'lonte gurun',
      'dugong',
      'macan yatim',
      'buaya darat',
      'kanjut terbang',
      'kuda kayang',
      'janda salto',
      'lonte alas',
      'jembut singa',
      'gajah terbang',
      'kuda cacat',
      'jembut pink',
      'sabun bolong'
    ];

    const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];
    const hasil = `
<b>𖤐 ʜᴀsɪʟ ᴄᴇᴋ ᴋʜᴏᴅᴀᴍ:</b>
╭───────────────────────
├ •ɴᴀᴍᴀ : ${nama}
├ •ᴋʜᴏᴅᴀᴍɴʏᴀ : ${pickRandom(khodamList)}
├ •ɴɢᴇʀɪ ʙᴇᴛ ᴊɪʀ ᴋʜᴏᴅᴀᴍɴʏᴀ
╰────────────────────────
**ɴᴇxᴛ ᴄᴇᴋ ᴋʜᴏᴅᴀᴍɴʏᴀ sɪᴀᴘᴀ ʟᴀɢɪ.**
`;

    await ctx.replyWithHTML(hasil);
  });
};
