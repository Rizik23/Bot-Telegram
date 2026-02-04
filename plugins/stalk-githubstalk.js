const axios = require("axios");

module.exports = (bot) => {
  bot.command(['githubstalk', 'ghstalk'], async (ctx) => {
    const username = ctx.message.text.split(" ").slice(1).join(" ");
    if (!username) {
      return ctx.reply("❌ Contoh penggunaan:\n/githubstalk DGXeon");
    }

    await ctx.react('⏱️');

    try {
      const { data } = await axios.get(`https://api.github.com/users/${username}`);
      if (!data) return ctx.reply("❌ User tidak ditemukan di GitHub.");

      const caption = `
*👤 GitHub Stalker*
────────────────────
🔹 *Username:* ${data.login}
🔹 *Nickname:* ${data.name || '-'}
🔹 *Bio:* ${data.bio || '-'}
🔹 *ID:* ${data.id}
🔹 *Node ID:* ${data.node_id}
🔹 *Type:* ${data.type}
🔹 *Admin:* ${data.site_admin ? '✅ Ya' : '❌ Tidak'}
🔹 *Company:* ${data.company || '-'}
🔹 *Blog:* ${data.blog || '-'}
🔹 *Location:* ${data.location || '-'}
🔹 *Email:* ${data.email || '-'}
🔹 *Public Repo:* ${data.public_repos}
🔹 *Public Gists:* ${data.public_gists}
🔹 *Followers:* ${data.followers}
🔹 *Following:* ${data.following}
🔹 *Created At:* ${data.created_at}
🔹 *Updated At:* ${data.updated_at}
🔗 *URL GitHub:* ${data.html_url}
🔗 *Foto:* ${data.avatar_url}
`.trim();

      await ctx.replyWithPhoto({ url: data.avatar_url }, { caption, parse_mode: "Markdown" });
    } catch (err) {
      console.error("GitHubStalk Error:", err.message);
      ctx.reply("❌ Gagal mengambil data dari GitHub.");
    }
  });
};