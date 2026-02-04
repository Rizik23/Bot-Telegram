const os = require("os");
const { performance } = require("perf_hooks");
const moment = require("moment-timezone");
const fs = require("fs");
const { exec } = require("child_process");

module.exports = (bot) => {
  bot.command(["ping", "speed", "info-speed"], async (ctx) => {
    const start = performance.now();
    const end = performance.now();
    const speed = (end - start).toFixed(2);

    const uptime = moment.duration(process.uptime(), "seconds");
    const formattedUptime = `${uptime.hours()}h ${uptime.minutes()}m ${uptime.seconds()}s`;

    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);

    const cpuUsage = await getCpuUsage();

    const vpsUptime = os.uptime();
    const formattedVps = moment.duration(vpsUptime, "seconds");
    const vpsUpText = `${formattedVps.days()}d ${formattedVps.hours()}h ${formattedVps.minutes()}m`;

    const cpuModel = os.cpus()[0].model;
    const osType = os.type();
    const arch = os.arch();
    const hostname = os.hostname();

    const diskUsage = await getDiskUsage();
    const cpuTemp = await getCpuTemperature();

    const msg = `*「 PING BOT 」*

🚀 *Speed:* ${speed} ms
🕐 *Bot Uptime:* ${formattedUptime}
📶 *VPS Uptime:* ${vpsUpText}
💾 *RAM:* ${usedMem} MB / ${totalMem} MB
🧠 *CPU Usage:* ${cpuUsage}%
🌡 *CPU Temp:* ${cpuTemp}
📂 *Disk:* ${diskUsage}

📡 *CPU:* ${cpuModel}
🖥 *OS:* ${osType} (${arch})
📟 *Hostname:* ${hostname}`;

    try {
      await ctx.reply(msg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🛠 Source", url: "https://telegra.ph/file/ec8cf04e3a2890d3dce9c.jpg" }],
          ],
        },
      });
    } catch (err) {
      console.error("Ping error:", err);
      ctx.reply("❌ Terjadi kesalahan saat kirim info.");
    }
  });
};

function getCpuUsage() {
  return new Promise((resolve) => {
    const start = cpuAverage();
    setTimeout(() => {
      const end = cpuAverage();
      const idleDiff = end.idle - start.idle;
      const totalDiff = end.total - start.total;
      const usage = 100 - Math.round(100 * idleDiff / totalDiff);
      resolve(usage);
    }, 100);
  });
}

function cpuAverage() {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) total += cpu.times[type];
    idle += cpu.times.idle;
  }
  return { idle: idle / cpus.length, total: total / cpus.length };
}

function getDiskUsage() {
  return new Promise((resolve) => {
    exec("df -h /", (err, stdout) => {
      if (err) return resolve("Gagal ambil disk");
      const lines = stdout.trim().split("\n");
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        return resolve(`${parts[2]} / ${parts[1]} (${parts[4]})`);
      }
      resolve("Info tidak tersedia");
    });
  });
}

function getCpuTemperature() {
  return new Promise((resolve) => {
    exec("sensors", (err, stdout) => {
      if (err || !stdout) return resolve("Tidak tersedia");
      const match = stdout.match(/(?<=\+)(\d+\.\d)(?=°C)/);
      if (match) return resolve(`${match[1]} °C`);
      resolve("Tidak terbaca");
    });
  });
}
