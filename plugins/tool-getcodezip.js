const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs/promises');
const path = require('path');
const AdmZip = require('adm-zip');
const { tmpdir } = require('os');
const { mkdirSync, existsSync } = require('fs');

module.exports = (bot) => {
  bot.command('getcodezip', async (ctx) => {
    const reply = ctx.message.reply_to_message;
    const url = reply?.text?.trim();

    if (!url || !/^https?:\/\//i.test(url)) {
      return ctx.reply('❌ Reply pesan yang berisi link website valid.');
    }

    await ctx.reply(`⏳ Mengambil source dari: ${url}`);

    try {
      const res = await axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36'
  },
  maxRedirects: 5
});

      const $ = cheerio.load(res.data);

      const baseFolder = path.join(tmpdir(), `sitecode_${Date.now()}`);
      const assetsFolder = path.join(baseFolder, 'assets');
      if (!existsSync(baseFolder)) mkdirSync(baseFolder);
      if (!existsSync(assetsFolder)) mkdirSync(assetsFolder);

      const downloadResource = async (src, folder) => {
        try {
          const fileUrl = new URL(src, url).href;
          const fileName = path.basename(fileUrl.split('?')[0]);
          const filePath = path.join(assetsFolder, folder || '', fileName);

          const assetRes = await axios.get(fileUrl, { responseType: 'arraybuffer' });
          const folderPath = path.dirname(filePath);
          if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true });
          await fs.writeFile(filePath, assetRes.data);

          return `assets/${folder ? folder + '/' : ''}${fileName}`;
        } catch (e) {
          return null;
        }
      };

      const tags = [
        { tag: 'link[rel="stylesheet"]', attr: 'href', folder: 'css' },
        { tag: 'script[src]', attr: 'src', folder: 'js' },
        { tag: 'img[src]', attr: 'src', folder: 'img' },
        { tag: 'video[src]', attr: 'src', folder: 'video' },
        { tag: 'audio[src]', attr: 'src', folder: 'audio' },
        { tag: 'source[src]', attr: 'src', folder: 'media' },
      ];

      for (const { tag, attr, folder } of tags) {
        const elems = $(tag);
        for (let i = 0; i < elems.length; i++) {
          const el = elems[i];
          const link = $(el).attr(attr);
          if (!link || link.startsWith('data:')) continue;
          const localPath = await downloadResource(link, folder);
          if (localPath) $(el).attr(attr, localPath);
        }
      }

      const htmlFinal = $.html();
      await fs.writeFile(path.join(baseFolder, 'index.html'), htmlFinal);

      const zip = new AdmZip();
      zip.addLocalFolder(baseFolder);
      const zipPath = path.join(tmpdir(), `web_${Date.now()}.zip`);
      zip.writeZip(zipPath);

      await ctx.replyWithDocument({ source: zipPath, filename: 'website_code.zip' });
    } catch (err) {
      console.error('Gagal:', err);
      ctx.reply('❌ Gagal mengambil kode. Pastikan link bisa diakses.');
    }
  });
};
