const { createCanvas, loadImage } = require('canvas');

async function generateAndSendCertificate(recipientName, achievementText, ctx) {
  const width = 1000;
  const height = 700;
  const canvas = createCanvas(width, height);
  const c = canvas.getContext("2d");

  const backgroundUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMXesWUGxIerARGsveu1mOdGdXM0icRcBLtSA-L5UNSdUaRjEYRez9ngnc&s=10";

  try {
    const background = await loadImage(backgroundUrl);
    c.drawImage(background, 0, 0, width, height);
  } catch (error) {
    console.error("Error loading background image:", error);
    c.fillStyle = "#f8f8f8";
    c.fillRect(0, 0, width, height);
  }

  const gradient = c.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(255,255,255,0.3)");
  gradient.addColorStop(1, "rgba(255,255,255,0.7)");
  c.fillStyle = gradient;
  c.fillRect(0, 0, width, height);

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Border
  c.lineWidth = 8;
  const borderGradient = c.createLinearGradient(0, 0, width, height);
  borderGradient.addColorStop(0, "#ff7f50");
  borderGradient.addColorStop(1, "#ff1493");
  c.strokeStyle = borderGradient;
  drawRoundedRect(c, 10, 10, width - 20, height - 20, 30);
  c.stroke();

  // Title
  c.shadowColor = "rgba(0,0,0,0.3)";
  c.shadowBlur = 10;
  c.shadowOffsetX = 2;
  c.shadowOffsetY = 2;
  c.fillStyle = "#333";
  c.font = "bold 50px Georgia";
  c.textAlign = "center";
  c.fillText("SERTIFIKAT SIFAT", width / 2, 120);

  c.shadowColor = "transparent";
  c.font = "italic 30px Georgia";
  c.fillStyle = "#555";
  c.fillText("Presented To", width / 2, 180);

  // Name
  c.font = "bold 40px Georgia";
  c.fillStyle = "#000";
  c.fillText(recipientName, width / 2, 260);

  // Achievement
  c.font = "30px Georgia";
  c.fillStyle = "#333";
  c.fillText(achievementText, width / 2, 330);

  // Garis
  c.strokeStyle = "#ff1493";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(width / 4, 360);
  c.lineTo(width * 3 / 4, 360);
  c.stroke();

  // Footer
  const today = new Date();
  c.font = "20px Georgia";
  c.textAlign = "right";
  c.fillStyle = "#000";
  c.fillText(`Tanggal: ${today.toLocaleDateString()}`, width - 40, height - 40);
  c.font = "24px Georgia";
  c.textAlign = "left";
  c.fillText("DinzID", 50, height - 50);

  // Kirim
  const buffer = canvas.toBuffer("image/png");
  await ctx.replyWithPhoto({ source: buffer }, {
    caption: `_Sukses Membuat Sertifikat Dengan Nama: ${recipientName}_`,
    parse_mode: "Markdown"
  });
}

module.exports = {
  generateAndSendCertificate
};