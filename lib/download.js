const fetch = require('node-fetch');

async function downloadMediaMessage(ctx) {
  const doc = ctx.message?.reply_to_message?.document;
  if (!doc) throw new Error('Tidak ada dokumen HTML yang di-reply.');

  const fileLink = await ctx.telegram.getFileLink(doc.file_id);
  const res = await fetch(fileLink.href);
  if (!res.ok) throw new Error(`Gagal download file: ${res.statusText}`);

  return await res.buffer();
}

module.exports = { downloadMediaMessage };