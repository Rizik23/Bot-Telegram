const axios = require("axios");
const { Markup } = require("telegraf");

const API_BASE = "https://api-berita-indonesia.vercel.app";

const SOURCES = {
  antara: ["terbaru","politik","hukum","ekonomi","bola","olahraga","humaniora","lifestyle","hiburan","dunia","tekno","otomotif"],
  cnbc: ["terbaru","investment","news","market","entrepreneur","syariah","tech","lifestyle","opini","profil"],
  cnn: ["terbaru","nasional","internasional","ekonomi","olahraga","teknologi","hiburan","gayahidup"],
  jpnn: ["terbaru"],
  kumparan: ["terbaru"],
  merdeka: ["terbaru","jakarta","dunia","gaya","olahraga","teknologi","otomotif","khas","sehat","jateng"],
  okezone: ["terbaru","celebrity","sports","otomotif","economy","techno","lifestyle","bola"],
  republika: ["terbaru","news","daerah","khazanah","islam","internasional","bola","leisure"],
  sindonews: ["terbaru","nasional","metro","ekbis","international","daerah","sports","otomotif","tekno","sains","edukasi","lifestyle","kalam"],
  suara: ["terbaru","bisnis","bola","lifestyle","entertainment","otomotif","tekno","health"],
  tempo: ["nasional","bisnis","metro","dunia","bola","cantik","tekno","otomotif","seleb","gaya","travel","difabel","creativelab","inforial","event"],
  tribun: ["terbaru","bisnis","superskor","sport","seleb","lifestyle","travel","parapuan","otomotif","techno","kesehatan"],
};

function pickNewsList(payload) {
  // API umumnya ngasih bentuk: { status, total, data: [...] } atau { data: { posts: [...] } }
  if (!payload) return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.posts)) return payload.data.posts;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function fetchNews(source, category) {
  const url = `${API_BASE}/${encodeURIComponent(source)}/${encodeURIComponent(category)}`;
  const res = await axios.get(url, { timeout: 15000, validateStatus: () => true });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP ${res.status} dari API`);
  }
  return res.data;
}

function buildResultText(source, category, items, limit) {
  const top = items.slice(0, limit);

  if (!top.length) {
    return `📰 <b>Berita ${escapeHtml(source)}/${escapeHtml(category)}</b>\n\nTidak ada data (atau format API berubah).`;
  }

  const lines = top.map((it, i) => {
    const title = escapeHtml(it.title || it.judul || "Tanpa judul");
    const link = it.link || it.url || it.guid || "";
    const date = escapeHtml(it.pubDate || it.isoDate || it.date || "");

    const linkPart = link ? `\n<a href="${link}">Buka berita</a>` : "";
    const datePart = date ? `\n<i>${date}</i>` : "";

    return `• <b>${i + 1}.</b> ${title}${datePart}${linkPart}`;
  });

  return `📰 <b>Berita ${escapeHtml(source)}/${escapeHtml(category)}</b>\n` +
         `<i>Ambil dari ${escapeHtml(API_BASE)}</i>\n\n` +
         lines.join("\n\n");
}

function sourceKeyboard() {
  const keys = Object.keys(SOURCES).sort();
  const rows = [];
  for (let i = 0; i < keys.length; i += 3) {
    rows.push(keys.slice(i, i + 3).map(k => Markup.button.callback(k, `news:src:${k}`)));
  }
  return Markup.inlineKeyboard([
    ...rows,
    [Markup.button.callback("❌ Tutup", "news:close")]
  ]);
}

function categoryKeyboard(source) {
  const cats = (SOURCES[source] || []).slice();
  const rows = [];
  for (let i = 0; i < cats.length; i += 2) {
    rows.push(cats.slice(i, i + 2).map(c => Markup.button.callback(c, `news:cat:${source}:${c}`)));
  }
  return Markup.inlineKeyboard([
    ...rows,
    [Markup.button.callback("⬅️ Ganti sumber", "news:back")],
    [Markup.button.callback("❌ Tutup", "news:close")]
  ]);
}

module.exports = (bot) => {
  // Command: /berita <sumber> <kategori> [limit]
  // contoh: /berita cnn nasional 5
  bot.command(["berita", "news"], async (ctx) => {
    const args = (ctx.message?.text || "").split(/\s+/).slice(1);
    const source = (args[0] || "").toLowerCase();
    const category = (args[1] || "").toLowerCase();
    const limit = Math.max(1, Math.min(10, parseInt(args[2] || "5", 10) || 5));

    if (!source || !category) {
      const help =
        `📰 <b>Berita Indonesia</b>\n\n` +
        `Pakai:\n` +
        `<code>/berita &lt;sumber&gt; &lt;kategori&gt; [limit]</code>\n\n` +
        `Contoh:\n` +
        `<code>/berita cnn nasional 5</code>\n` +
        `<code>/berita cnbc market 5</code>\n\n` +
        `Atau buka menu pilihan di bawah:`;
      return ctx.reply(help, { parse_mode: "HTML", ...sourceKeyboard() });
    }

    if (!SOURCES[source]) {
      return ctx.reply(`❌ Sumber "<b>${escapeHtml(source)}</b>" gak dikenal.\nKetik <code>/berita</code> buat lihat menu.`, { parse_mode: "HTML" });
    }
    if (!SOURCES[source].includes(category)) {
      return ctx.reply(
        `❌ Kategori "<b>${escapeHtml(category)}</b>" gak valid untuk <b>${escapeHtml(source)}</b>.\n` +
        `Kategori valid: <code>${SOURCES[source].join(", ")}</code>`,
        { parse_mode: "HTML" }
      );
    }

    try {
      await ctx.reply("⏳ Ambil berita...", { reply_to_message_id: ctx.message.message_id });
      const data = await fetchNews(source, category);
      const items = pickNewsList(data);
      const text = buildResultText(source, category, items, limit);
      return ctx.reply(text, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
    } catch (e) {
      return ctx.reply(`⚠️ Gagal ambil berita: <code>${escapeHtml(e.message)}</code>`, { parse_mode: "HTML" });
    }
  });

  // Menu callbacks
  bot.action(/^news:src:(.+)$/i, async (ctx) => {
    const source = String(ctx.match[1] || "").toLowerCase();
    if (!SOURCES[source]) return ctx.answerCbQuery("Sumber tidak valid", { show_alert: true });

    await ctx.answerCbQuery();
    return ctx.editMessageText(
      `🗞️ Pilih kategori untuk <b>${escapeHtml(source)}</b>:`,
      { parse_mode: "HTML", ...categoryKeyboard(source) }
    );
  });

  bot.action(/^news:cat:([^:]+):(.+)$/i, async (ctx) => {
    const source = String(ctx.match[1] || "").toLowerCase();
    const category = String(ctx.match[2] || "").toLowerCase();
    if (!SOURCES[source] || !SOURCES[source].includes(category)) {
      return ctx.answerCbQuery("Kategori tidak valid", { show_alert: true });
    }

    await ctx.answerCbQuery("⏳ Ambil berita...");
    try {
      const data = await fetchNews(source, category);
      const items = pickNewsList(data);
      const text = buildResultText(source, category, items, 5);
      return ctx.editMessageText(text, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Kategori lain", `news:src:${source}`)],
          [Markup.button.callback("🏠 Pilih sumber", "news:back")],
          [Markup.button.callback("❌ Tutup", "news:close")],
        ])
      });
    } catch (e) {
      return ctx.editMessageText(`⚠️ Gagal ambil berita: <code>${escapeHtml(e.message)}</code>`, {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🏠 Pilih sumber", "news:back")],
          [Markup.button.callback("❌ Tutup", "news:close")],
        ])
      });
    }
  });

  bot.action("news:back", async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.editMessageText("📰 Pilih sumber berita:", { parse_mode: "HTML", ...sourceKeyboard() });
  });

  bot.action("news:close", async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch {}
  });
};