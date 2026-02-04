const { spawn } = require("child_process");
const { ownerID } = require("../config");

module.exports = (bot) => {
  bot.command("restart", async (ctx) => {
    if (ctx.from.id !== ownerID) {
      return ctx.reply("❌ Kamu tidak memiliki izin untuk merestart bot.");
    }

    await ctx.reply("✅ Restarting bot...");

    // Restart self via spawn
    setTimeout(() => {
      const child = spawn(process.argv[0], process.argv.slice(1), {
        detached: true,
        stdio: "inherit",
      });
      child.unref();
      process.exit();
    }, 500);
  });
};
