const fs = require('fs');
const path = require('path');
const config = require('../config');
const hutangFile = path.join(__dirname, '../src/hutang.json');

// Muat data awal
let hutangList = [];
if (fs.existsSync(hutangFile)) {
  hutangList = JSON.parse(fs.readFileSync(hutangFile));
}

// Waktu WIB
function getWaktuWIB() {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 3600000 * 7);
  return wib.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Format tanggal telat
function getTelat(days) {
  const deadline = new Date(Date.now() + days * 86400000);
  return deadline.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

module.exports = (bot) => {
  const addCommand = (typeCmd, typeValue) => {
    bot.command(typeCmd, async (ctx) => {
      if (!config.OWNER_ID.includes(ctx.from.id)) {
        return ctx.reply('❌ *Perintah ini hanya untuk owner!*', { parse_mode: 'Markdown' });
      }

      if (!ctx.message.reply_to_message) {
        return ctx.reply(`⚠️ *Kamu harus membalas pesan pengguna yang ingin ditambahkan hutang/dp!*`, { parse_mode: 'Markdown' });
      }

      const text = ctx.message.text.split(' ').slice(1).join(' ');
      if (!text.includes('|')) {
        return ctx.reply(`⚠️ *Format salah!* Gunakan:\n/${typeCmd} nominal|Telat(hari)|tipe(hutang/dp)|deskripsi (balas pesan user)`, { parse_mode: 'Markdown' });
      }

      const [nominal, days, type, ...deskripsi] = text.split('|').map(v => v.trim());
      const repliedUser = ctx.message.reply_to_message.from;

      if (!nominal || !days || !type || deskripsi.length < 1) {
        return ctx.reply(`⚠️ *Semua field wajib diisi.*\nFormat: nominal|hari|tipe|deskripsi`, { parse_mode: 'Markdown' });
      }

      if (!['Hutang', 'Dp'].includes(type)) {
        return ctx.reply(`⚠️ *Tipe salah!* Hanya "Hutang" atau "Dp".`, { parse_mode: 'Markdown' });
      }

      const orang = `${repliedUser.id}@telegram`;
      const sudahAda = hutangList.find(h => h.user === orang && h.type.toLowerCase() === type.toLowerCase());
      if (sudahAda) {
        return ctx.reply(`❌ *User sudah memiliki data aktif dengan tipe ${type}.*`);
      }

      const newData = {
        user: orang,
        userId: repliedUser.id,
        nama: repliedUser.username ? `@${repliedUser.username}` : `${repliedUser.first_name || 'User'}`,
        nominal: parseInt(nominal),
        deskripsi: deskripsi.join(" "),
        waktu: getWaktuWIB(),
        Telat: getTelat(parseInt(days)),
        type,
        deadline: Date.now() + parseInt(days) * 86400000,
        groupId: ctx.chat.id
      };

      hutangList.push(newData);
      fs.writeFileSync(hutangFile, JSON.stringify(hutangList, null, 2));

      return ctx.reply(
        `✅ *${type} berhasil ditambahkan untuk ${newData.nama}:*\n` +
        `💵 Rp${newData.nominal}\n` +
        `📝 ${newData.deskripsi}\n` +
        `⏰ ${newData.waktu} — Deadline: ${newData.Telat}\n\n` +
        `⚠️ Jika lewat waktu, user akan dikeluarkan dari grup.`,
        { parse_mode: 'Markdown' }
      );
    });
  };

  // Daftarkan command: /addhutang dan /adddp
  addCommand('addhutang', 'Hutang');
  addCommand('adddp', 'Dp');

  // Proses auto-kick user lewat deadline
  setInterval(async () => {
    const now = Date.now();
    let updated = false;

    for (let i = hutangList.length - 1; i >= 0; i--) {
      const h = hutangList[i];
      if (h.deadline <= now) {
        try {
          await bot.telegram.kickChatMember(h.groupId, h.userId);
          await bot.telegram.sendMessage(
            h.groupId,
            `⚠️ *${h.nama} dikeluarkan dari grup karena melewati batas waktu hutang/dp!*`,
            { parse_mode: 'Markdown' }
          );
          hutangList.splice(i, 1);
          updated = true;
        } catch (err) {
          console.error(`❌ Gagal mengeluarkan ${h.userId}:`, err.message);
        }
      }
    }

    if (updated) {
      fs.writeFileSync(hutangFile, JSON.stringify(hutangList, null, 2));
    }
  }, 60000); // setiap 60 detik
};