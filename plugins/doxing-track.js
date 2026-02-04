const fetch = require('node-fetch');
const config = require('../config');

module.exports = (bot) => {
  const commands = ['trackip', 'doxip'];

  bot.command(commands, async (ctx) => {
    const userId = String(ctx.from.id);
    if (!config.ownerIds.includes(userId)) {
      return ctx.reply('❌ Fitur ini hanya untuk *Owner* bot.', { parse_mode: 'Markdown' });
    }

    const text = ctx.message.text.split(' ').slice(1).join(' ').trim();
    const command = ctx.message.text.split(' ')[0].slice(1);

    if (!text) {
      return ctx.reply(`*Example:* /${command} 112.90.150.204`, { parse_mode: 'Markdown' });
    }

    try {
      const res = await fetch(`https://ipwho.is/${text}`).then(r => r.json());

      if (!res.success) throw new Error(`IP ${text} not found.`);

      const formatIPInfo = (info) => `
*IP Information*
• IP: ${info.ip || 'N/A'}
• Type: ${info.type || 'N/A'}
• Country: ${info.country || 'N/A'}
• Region: ${info.region || 'N/A'}
• City: ${info.city || 'N/A'}
• Latitude: ${info.latitude}
• Longitude: ${info.longitude}
• ISP: ${info.connection?.isp || 'N/A'}
• Org: ${info.connection?.org || 'N/A'}
• Domain: ${info.connection?.domain || 'N/A'}
• Timezone: ${info.timezone?.id || 'N/A'}
• Local Time: ${info.timezone?.current_time || 'N/A'}
• Flag: ${info.flag?.emoji || 'N/A'}
`;

      if (res.latitude && res.longitude) {
        await ctx.replyWithLocation(res.latitude, res.longitude);
      }

      await ctx.reply(formatIPInfo(res), { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(err);
      ctx.reply(`❌ Error: Tidak dapat mengambil data IP ${text}`);
    }
  });
};