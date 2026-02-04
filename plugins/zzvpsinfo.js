const os = require("os");
const si = require("systeminformation");

module.exports = (bot) => {
  bot.command("vpsinfo", async (ctx) => {
    try {
      const vpsUptime = os.uptime(); // seconds
      const botUptime = process.uptime(); // seconds

      const upDays = Math.floor(vpsUptime / 86400);
      const upHours = Math.floor((vpsUptime % 86400) / 3600);
      const upMinutes = Math.floor((vpsUptime % 3600) / 60);

      const botHours = Math.floor(botUptime / 3600);
      const botMinutes = Math.floor((botUptime % 3600) / 60);

      const mem = await si.mem();
      const disk = await si.fsSize();
      const cpu = await si.currentLoad();
      const net = await si.networkStats();

      const totalMem = (mem.total / 1073741824).toFixed(1);
      const usedMem = (mem.active / 1073741824).toFixed(1);
      const diskUsed = (disk[0].used / 1073741824).toFixed(1);
      const diskTotal = (disk[0].size / 1073741824).toFixed(1);
      const cpuLoad = cpu.currentLoad.toFixed(2);
      const cpuCore = os.cpus().length;
      const netDown = (net[0].rx_sec / 1024).toFixed(2);
      const netUp = (net[0].tx_sec / 1024).toFixed(2);

      const info = `📡 *Status VPS:*

• 🕐 Uptime VPS: ${upDays}d ${upHours}h ${upMinutes}m
• 🤖 Bot Uptime: ${botHours}h ${botMinutes}m
• 🧠 RAM: ${usedMem} GB / ${totalMem} GB
• 💽 Disk: ${diskUsed} GB / ${diskTotal} GB
• ⚙️ CPU Load: ${cpuLoad}% (${cpuCore} Core)
• 🌐 Network: ↓ ${netDown} KB/s | ↑ ${netUp} KB/s
• 🖥️ Platform: ${os.type()} (${os.arch()})`;

      ctx.reply(info, { parse_mode: "Markdown" });
    } catch (e) {
      console.error("VPSINFO ERROR:", e.message);
      ctx.reply("❌ Gagal mengambil informasi VPS.");
    }
  });
};