const axios = require('axios');

module.exports = (bot) => {
  bot.command('githubstalk', async (ctx) => {
    const input = ctx.message.text.split(' ').slice(1).join(' ');
    if (!input) {
      return ctx.reply('Usage: /githubstalk <username>');
    }

    try {
      const response = await axios.post(
        'https://api.siputzx.my.id/api/stalk/github',
        { user: input },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data = response.data;
      if (!data.status) {
        return ctx.reply('User not found or API error.');
      }

      const profile = data.data;

      let replyText = `GitHub Profile Info:\n\n` +
        `👤 Username: ${profile.username}\n` +
        `📝 Nickname: ${profile.nickname || 'N/A'}\n` +
        `📄 Bio: ${profile.bio || 'N/A'}\n` +
        `🏢 Company: ${profile.company || 'N/A'}\n` +
        `🔗 Blog: ${profile.blog || 'N/A'}\n` +
        `📍 Location: ${profile.location || 'N/A'}\n` +
        `📧 Email: ${profile.email || 'N/A'}\n` +
        `📦 Public Repos: ${profile.public_repo}\n` +
        `📝 Public Gists: ${profile.public_gists}\n` +
        `👥 Followers: ${profile.followers}\n` +
        `👣 Following: ${profile.following}\n` +
        `🆔 ID: ${profile.id}\n` +
        `📅 Created at: ${new Date(profile.created_at).toLocaleDateString()}\n` +
        `🔗 URL: ${profile.url}`;

      return ctx.replyWithPhoto(profile.profile_pic, { caption: replyText });
    } catch (error) {
      console.error(error);
      return ctx.reply('Error fetching data from GitHub API.');
    }
  });
};
