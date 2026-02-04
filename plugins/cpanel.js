const fs = require('fs');
const fetch = require('node-fetch');

const premiumUsersFile = './premiumUser.json';
const settings = require('../config.js');

const domain = settings.domain;
const plta = settings.apikey;
const pltc = settings.capikey;
const egg = settings.egg;
const loc = settings.nestid;
const owner = settings.adminId;
const adminId = settings.adminId;

module.exports = (bot) => {
  const commands = Array.from({ length: 64 }, (_, i) => `${i + 1}gb`);

  for (const cmd of commands) {
    bot.command(cmd, async (ctx) => {
      const fromId = ctx.from.id;
      const text = ctx.message.text.split(' ').slice(1).join(' ');

      const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
      if (!premiumUsers.includes(String(fromId))) {
        return ctx.reply('Perintah Hanya Untuk User Premium.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'OWNER', url: 'https://t.me/Rizzxtzy' }]
            ]
          }
        });
      }

      const args = text.split(',');
      if (args.length < 2) {
        return ctx.reply(`Format salah. Contoh: /${cmd} namapanel,idtele`);
      }

      const username = args[0];
      const targetId = args[1]; 
      const name = `${username}${cmd}`;
      const email = `${username}@gmail.com`;
      const password = `${username}001`;

      const gb = parseInt(cmd.replace('gb', ''));
      const memory = 1024 * gb;
      const disk = 1024 * gb;
      const cpu = 30 * gb;

      try {
        const userRes = await fetch(`${domain}/api/application/users`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${plta}`
          },
          body: JSON.stringify({
            email,
            username,
            first_name: username,
            last_name: username,
            language: 'en',
            password
          })
        });

        const userData = await userRes.json();
        if (userData.errors) {
          const errorMsg = userData.errors[0].meta.rule === 'unique'
            ? 'Email sudah terdaftar.'
            : `Error: ${JSON.stringify(userData.errors[0])}`;
          return ctx.reply(errorMsg);
        }

        const user = userData.attributes;

        const serverRes = await fetch(`${domain}/api/application/servers`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${plta}`
          },
          body: JSON.stringify({
            name,
            description: '',
            user: user.id,
            egg: parseInt(egg),
            docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
            startup: 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}',
            environment: {
              INST: 'npm',
              USER_UPLOAD: '0',
              AUTO_UPDATE: '0',
              CMD_RUN: 'npm start'
            },
            limits: {
              memory,
              swap: 0,
              disk,
              io: 500,
              cpu
            },
            feature_limits: {
              databases: 5,
              backups: 5,
              allocations: 1
            },
            deploy: {
              locations: [parseInt(loc)],
              dedicated_ip: false,
              port_range: []
            }
          })
        });

        const server = (await serverRes.json()).attributes;

        ctx.reply(`✅ Panel Berhasil Dibuat

📛 NAMA: ${username}
📩 EMAIL: ${email}
🆔 ID: ${user.id}
💾 MEMORY: ${memory} MB
🧠 CPU: ${cpu}%
🗂️ DISK: ${disk} MB`);

        if (settings.pp) {
          ctx.telegram.sendPhoto(targetId, settings.pp, {
            caption: `Hai @${targetId}

┏━⬣ Berikut data panel Anda
│Login : ${domain}
│Username : ${user.username}
│Password : ${password}
┗━━━━━━━━━━━━━━⬣
│Peraturan:
│• Tidak boleh DDoS
│• Tidak boleh disebar
│• Tidak untuk dibagi gratis
┗━━━━━━━━━━━━━━⬣`
          });
        }

      } catch (err) {
        ctx.reply(`❌ Gagal membuat panel: ${err.message}`);
      }
    });
  }

    bot.command('unli', async ctx => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    
    const isPremium = premiumUsers.includes(String(ctx.from.id));

    if (!isPremium) {
      return ctx.reply('Perintah Hanya Untuk User Premium.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Hubungi Developer', url: 'https://t.me/noxxasoloo' }]
          ]
        }
      });
    }

    const t = text.split(',');
    if (t.length < 2) {
      return ctx.reply('Format salah. Contoh penggunaan:\n/unli namapanel,idtele');
    }

    const username = t[0];
    const u = t[1];
    const name = `${username}unli`;
    
    const memo = '0';
    const cpu = '0';
    const disk = '0';
    const email = `${username}@gmail.com`;
    const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
    const password = `${username}001`;

    let user, server;

    try {
      const resUser = await fetch(`${domain}/api/application/users`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${plta}`
        },
        body: JSON.stringify({
          email, username, first_name: username, last_name: username,
          language: 'en', password
        })
      });

      const data = await resUser.json();
      if (data.errors) {
        if (data.errors[0].meta.rule === 'unique') {
          return ctx.reply('Email sudah digunakan, silakan pakai nama lain.');
        } else {
          return ctx.reply(`Gagal: ${JSON.stringify(data.errors[0], null, 2)}`);
        }
      }

      user = data.attributes;

      const resServer = await fetch(`${domain}/api/application/servers`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${plta}`
        },
        body: JSON.stringify({
          name,
          description: '',
          user: user.id,
          egg: parseInt(egg),
          docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
          startup: spc,
          environment: {
            INST: 'npm',
            USER_UPLOAD: '0',
            AUTO_UPDATE: '0',
            CMD_RUN: 'npm start'
          },
          limits: {
            memory: memo,
            swap: 0,
            disk: disk,
            io: 500,
            cpu: cpu
          },
          feature_limits: {
            databases: 5,
            backups: 5,
            allocations: 1
          },
          deploy: {
            locations: [parseInt(loc)],
            dedicated_ip: false,
            port_range: []
          }
        })
      });

      const data2 = await resServer.json();
      server = data2.attributes;

    } catch (err) {
      return ctx.reply(`Error: ${err.message}`);
    }

    if (user && server) {
      await ctx.reply(`ʙᴇʀɪᴋᴜᴛ ᴅᴀᴛᴀ ᴘᴀɴᴇʟ ᴀɴᴅᴀ
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);

      if (settings.pp) {
        await bot.telegram.sendPhoto(u, settings.pp, {
          caption: `ʜᴀɪ @${u}

┏━⬣ ʙᴇʀɪᴋᴜᴛ ᴅᴀᴛᴀ ᴘᴀɴᴇʟ ᴀɴᴅᴀ 
│ʟᴏɢɪɴ : ${domain}
│ᴜꜱᴇʀɴᴀᴍᴇ : ${user.username}
│ᴘᴀꜱꜱᴡᴏʀᴅ : ${password} 
┗━━━━━━━━━━⬣
│ᴘᴇʀᴀᴛᴜʀᴀɴ :
│•ɴᴏ ᴅᴅᴏꜱ
│•ɴᴏ ꜱʜᴀʀᴇ/ꜱᴇʙᴀʀ ʟɪɴᴋ
│•ɴᴏ ᴋᴀꜱɪʜ ᴋᴇ ᴏʀɴɢ ꜰʀᴇᴇ
┗━━━━━━━━━━━━━━⬣`
        });
        await ctx.reply('Data panel berhasil dikirim ke ID Telegram yang ditentukan.');
      }
    } else {
      ctx.reply('Gagal membuat data panel. Silakan coba lagi.');
    }
  });


    
    
const adminfile = './adminID.json';


let premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
    let adminUsers = JSON.parse(fs.readFileSync(adminfile));

    const isOwner = (id) => id.toString() === owner;
    const isAdmin = (id) => adminUsers.includes(id.toString());

    bot.command('listsrv', async (ctx) => {
        if (!isAdmin(ctx.from.id)) {
            return ctx.reply('ᴘᴇʀɪɴᴛᴀʜ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴏᴡɴᴇʀ...', {
                reply_markup: {
                    inline_keyboard: [[{ text: 'OWNER', url: 'https://t.me/noxxasoloo' }]]
                }
            });
        }

        try {
            const res = await fetch(`${domain}/api/application/servers?page=1`, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${plta}`
                }
            });
            const json = await res.json();
            let message = 'Daftar server aktif:\n\n';

            for (const server of json.data) {
                const s = server.attributes;
                const uuid = s.uuid.split('-')[0];

                const stat = await fetch(`${domain}/api/client/servers/${uuid}/resources`, {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${pltc}`
                    }
                });

                const statData = await stat.json();
                const status = statData.attributes ? statData.attributes.current_state : 'unknown';

                message += `ID Server: ${s.id}\nNama: ${s.name}\nStatus: ${status}\n\n`;
            }

            ctx.reply(message);
        } catch (e) {
            console.error(e);
            ctx.reply('Terjadi kesalahan saat mengambil data.');
        }
    });

    bot.command('delsrv', async (ctx) => {
        const args = ctx.message.text.split(' ')[1];
        if (!isAdmin(ctx.from.id)) return ctx.reply('ᴘᴇʀɪɴᴛᴀʜ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴏᴡɴᴇʀ...');
        if (!args) return ctx.reply('Contoh: /delsrv 1');

        try {
            const res = await fetch(`${domain}/api/application/servers/${args}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${plta}`
                }
            });

            if (!res.ok) return ctx.reply('SERVER NOT FOUND');
            ctx.reply('SUCCESSFULLY DELETE THE SERVER');
        } catch (e) {
            console.error(e);
            ctx.reply('Terjadi kesalahan saat menghapus server.');
        }
    });

    bot.command('listusr', async (ctx) => {
        if (!isAdmin(ctx.from.id)) {
            return ctx.reply('ᴘᴇʀɪɴᴛᴀʜ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴏᴡɴᴇʀ...');
        }

        try {
            const res = await fetch(`${domain}/api/application/users?page=1`, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${plta}`
                }
            });

            const json = await res.json();
            let message = 'Daftar user aktif:\n\n';

            for (const user of json.data) {
                const u = user.attributes;
                message += `ID: ${u.id}\nUsername: ${u.username}\n\n`;
            }

            message += `Page: ${json.meta.pagination.current_page}/${json.meta.pagination.total_pages}\n`;
            message += `Total User: ${json.meta.pagination.count}`;
            ctx.reply(message);
        } catch (e) {
            console.error(e);
            ctx.reply('Terjadi kesalahan.');
        }
    });

    bot.command('delusr', async (ctx) => {
        const args = ctx.message.text.split(' ')[1];
        if (!isAdmin(ctx.from.id)) return ctx.reply('ᴘᴇʀɪɴᴛᴀʜ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴏᴡɴᴇʀ...');
        if (!args) return ctx.reply('Contoh: /delusr 1');

        try {
            const res = await fetch(`${domain}/api/application/users/${args}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${plta}`
                }
            });

            if (!res.ok) return ctx.reply('USER NOT FOUND');
            ctx.reply('SUCCESSFULLY DELETE THE USER');
        } catch (e) {
            console.error(e);
            ctx.reply('Terjadi kesalahan saat menghapus user.');
        }
    });

    bot.command('addprem', (ctx) => {
        const args = ctx.message.text.split(' ')[1];
        if (!isOwner(ctx.from.id)) return ctx.reply('Only the owner can perform this action.');

        if (!premiumUsers.includes(args)) {
            premiumUsers.push(args);
            fs.writeFileSync(premiumUsersFile, JSON.stringify(premiumUsers));
            ctx.reply(`User ${args} added to premium users.`);
        } else {
            ctx.reply(`User ${args} is already premium.`);
        }
    });

    bot.command('delprem', (ctx) => {
        const args = ctx.message.text.split(' ')[1];
        if (!isOwner(ctx.from.id)) return ctx.reply('Only the owner can perform this action.');

        const index = premiumUsers.indexOf(args);
        if (index !== -1) {
            premiumUsers.splice(index, 1);
            fs.writeFileSync(premiumUsersFile, JSON.stringify(premiumUsers));
            ctx.reply(`User ${args} removed from premium users.`);
        } else {
            ctx.reply(`User ${args} is not a premium user.`);
        }
    });

    bot.command('addowner', (ctx) => {
        const args = ctx.message.text.split(' ')[1];
        if (!isOwner(ctx.from.id)) return ctx.reply('SOK ASIK LU, LU BUKAN OWNER😂');

        if (!adminUsers.includes(args)) {
            adminUsers.push(args);
            fs.writeFileSync(adminfile, JSON.stringify(adminUsers));
            ctx.reply(`User ${args} added to admin.`);
        } else {
            ctx.reply(`User ${args} already admin.`);
        }
    });

    bot.command('delowner', (ctx) => {
        const args = ctx.message.text.split(' ')[1];
        if (!isOwner(ctx.from.id)) return ctx.reply('SOK ASIK LU, LU BUKAN OWNER😂');

        const index = adminUsers.indexOf(args);
        if (index !== -1) {
            adminUsers.splice(index, 1);
            fs.writeFileSync(adminfile, JSON.stringify(adminUsers));
            ctx.reply(`User ${args} removed from admin.`);
        } else {
            ctx.reply(`User ${args} not found in admin list.`);
        }
    });

      bot.command('admin', async (ctx) => {
    const msg = ctx.message;
    const chatId = msg.chat.id;
    const adminUsers = JSON.parse(fs.readFileSync(adminfile));
    const isAdmin = adminUsers.includes(String(msg.from.id));

    if (!isAdmin) {
      return ctx.reply('ᴘᴇʀɪɴᴛᴀʜ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴏᴡɴᴇʀ...', {
        reply_markup: {
          inline_keyboard: [[{ text: 'OWNER', url: 'https://t.me/noxxasoloo' }]]
        }
      });
    }

    const args = msg.text.split(' ').slice(1).join(' ').split(',');
    if (args.length < 2) {
      return ctx.reply('Format Salah! Penggunaan: /admin namapanel,idtele');
    }

    const panelName = args[0].trim();
    const telegramId = args[1].trim();
    const password = panelName + "117";

    try {
      const res = await fetch(`${domain}/api/application/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${plta}`
        },
        body: JSON.stringify({
          email: `${panelName}@gmail.com`,
          username: panelName,
          first_name: panelName,
          last_name: "Memb",
          language: "en",
          root_admin: true,
          password
        })
      });

      const data = await res.json();
      if (data.errors) {
        return ctx.reply(JSON.stringify(data.errors[0], null, 2));
      }

      const user = data.attributes;

      ctx.reply(`
TYPE: user
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
➟ LOGIN: ${domain}
      `);

      ctx.telegram.sendMessage(telegramId, `
┏━⬣「 DATA ADMIN PANEL 」
┃➥  Login : ${domain}
┃➥  Username : ${user.username}
┃➥  Password : ${password} 
┗━━━━━━━━━━━━⬣
│ᴘᴇʀᴀᴛᴜʀᴀɴ :
│•ɴᴏ ᴅᴅᴏꜱ
│•ɴᴏ ꜱʜᴀʀᴇ/ꜱᴇʙᴀʀ ʟɪɴᴋ
│•ɴᴏ ᴋᴀꜱɪʜ ᴋᴇ ᴏʀɴɢ ꜰʀᴇᴇ
┗━━━━━━━━━━━━━━⬣`);
    } catch (error) {
      console.error(error);
      ctx.reply('Terjadi kesalahan dalam pembuatan admin.');
    }
  });
bot.command('listadmin', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
            return ctx.reply('ᴘᴇʀɪɴᴛᴀʜ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴏᴡɴᴇʀ...', {
                reply_markup: {
                    inline_keyboard: [[{ text: 'OWNER', url: 'https://t.me/noxxasoloo' }]]
                }
            });
        }
    try {
      const response = await fetch(`${domain}/api/application/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${plta}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!data || !data.data) {
        return ctx.reply('Gagal mengambil data admin.');
      }

      const adminUsers = data.data.filter(u => u.attributes.root_admin === true);

      if (!adminUsers.length) {
        return ctx.reply('Tidak ada admin panel yang terdaftar.');
      }

      const message = adminUsers.map((u, i) => (
        `• ${i + 1}. <b>${u.attributes.username}</b>\n` +
        `  🆔 ID: <code>${u.attributes.id}</code>\n` +
        `  📧 Email: <code>${u.attributes.email}</code>\n`
      )).join('\n');

      await ctx.replyWithHTML(`<b>🧑‍💼 Daftar Admin Panel:</b>\n\n${message}`);
    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat mengambil data admin panel.');
    }
  });




    
};
