const fs = require('fs');
const fetch = require('node-fetch');
const similarity = require('similarity');

const session = { family100: {} };
const SALDO_FILE = './saldo.json';

// Helper: Load saldo
function loadSaldo() {
  try {
    return JSON.parse(fs.readFileSync(SALDO_FILE));
  } catch {
    return {};
  }
}

// Helper: Save saldo
function saveSaldo(data) {
  fs.writeFileSync(SALDO_FILE, JSON.stringify(data, null, 2));
}

module.exports = (bot) => {
  const threshold = 0.72;
  const winScore = 25000;

  bot.command('family100', async (ctx) => {
    const id = ctx.chat.id;
    if (!ctx.chat.type.includes('group')) return ctx.reply('❌ Command ini hanya bisa digunakan di grup.');
    if (id in session.family100) return ctx.reply('❗ Masih ada sesi Family100 yang belum selesai.');

    try {
      const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/family100.json');
      const src = await res.json();
      const json = src[Math.floor(Math.random() * src.length)];

      const soal = `*GAME FAMILY100*\n\n` +
        `*Soal:* ${json.soal}\n\n` +
        `🎁 Hadiah: ${winScore.toLocaleString()} money\n` +
        `📦 Terdapat *${json.jawaban.length}* jawaban${
          json.jawaban.find(v => v.includes(' ')) ? ' (beberapa jawaban terdapat spasi)' : ''
        }`;

      const msg = await ctx.replyWithMarkdown(soal);

      session.family100[id] = {
        id,
        msg,
        ...json,
        terjawab: Array.from(json.jawaban, () => false),
        winScore,
        usedClues: [],
      };
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal mengambil soal.');
    }
  });

  bot.on('text', async (ctx, next) => {
    const id = ctx.chat.id;
    const sender = ctx.from.id.toString();
    const text = ctx.message.text.toLowerCase().replace(/[^\w\s\-]+/g, '');
    const isSurrender = /^((me)?nyerah|surr?ender)$/i.test(text);
    const isClue = /^(clue|hint)$/i.test(text);

    if (!(id in session.family100)) return next();
    if (ctx.message.text.startsWith('/')) return next();

    const room = session.family100[id];

    // Load dan inisialisasi saldo
    const saldo = loadSaldo();
    if (!saldo[sender]) saldo[sender] = { money: 0 };

    // Handle clue
    if (isClue) {
      const belumTerjawab = room.jawaban
        .map((j, i) => (!room.terjawab[i] && !room.usedClues.includes(i) ? { index: i, value: j } : null))
        .filter(Boolean);

      if (!belumTerjawab.length) return ctx.reply('⚠️ Semua jawaban sudah terjawab atau sudah diberi clue.');

      const random = belumTerjawab[Math.floor(Math.random() * belumTerjawab.length)];
      room.usedClues.push(random.index);

      return ctx.reply(`💡 *Clue*: Jawaban nomor ${random.index + 1} dimulai dengan huruf *${random.value[0].toUpperCase()}*`);
    }

    let index = room.jawaban.findIndex((jawaban, i) => jawaban.toLowerCase() === text && !room.terjawab[i]);

    if (index < 0 && !isSurrender) {
      const kemungkinan = room.jawaban
        .map((j, i) => (!room.terjawab[i] ? similarity(j.toLowerCase(), text) : 0));
      if (Math.max(...kemungkinan) >= threshold) {
        return ctx.reply('💡 Dikit lagi!');
      } else {
        return ctx.reply('❌ Salah! Coba lagi.');
      }
    }

    if (!isSurrender && index >= 0) {
      if (room.terjawab[index]) return;
      room.terjawab[index] = sender;
      saldo[sender].money += room.winScore;
      saveSaldo(saldo); // Simpan saldo
    }

    const isWin = room.terjawab.every(v => v);

    const caption = `*GAME FAMILY100*\n\n*Soal:* ${room.soal}\n\n` +
      `Terdapat ${room.jawaban.length} jawaban${room.jawaban.find(v => v.includes(' ')) ? ' (beberapa jawaban terdapat spasi)' : ''}\n\n` +
      `${isWin ? `*SEMUA JAWABAN TERJAWAB ✅*` : isSurrender ? '*MENYERAH ❌*' : ''}\n` +
      `${Array.from(room.jawaban, (jawaban, i) => {
        const jawab = room.terjawab[i];
        return jawab
          ? `(${i + 1}) ${jawaban} ✓ [user](tg://user?id=${jawab})`
          : isSurrender ? `(${i + 1}) ${jawaban}` : false;
      }).filter(Boolean).join('\n')}\n\n` +
      `${isSurrender ? '' : `💰 +${room.winScore} Money tiap jawaban benar`}`.trim();

    await ctx.replyWithMarkdown(caption);

    if (isWin || isSurrender) {
      delete session.family100[id];
    }
  });
};