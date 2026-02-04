const fs = require("fs");
const path = require("path");

let fetchFn = global.fetch;
try {
  if (!fetchFn) {
    fetchFn = require("node-fetch");
  }
} catch (e) {
  console.error("Error loading node-fetch:", e.message);
}

/** =========================
 *  CONFIG DEFAULTS
 *  ========================= */
const DEFAULT_MODELS = [
      "openai/gpt-oss-120b",
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "moonshotai/kimi-k2-instruct",
      "openai/gpt-oss-20b"
];

const STATE_FILE = path.join(process.cwd(), "data", "elika_state.json");
const INDEX_CACHE_FILE = path.join(process.cwd(), "cache", "elika_index.json");

// folders yang discan (relatif ke root project)
const SCAN_DIRS = ["plugins", "plugins2", "lib", "price", "db", "data", "scrape", "text"];
const SCAN_FILES_AT_ROOT = ["index.js", "config.js", "package.json", "README.md"];

const ALLOWED_EXT = new Set([".js", ".json", ".txt", ".md", ".yml", ".yaml", ".html"]);
const MAX_FILE_BYTES = 400 * 1024; // 400KB per file (biar gak berat)
const MAX_CONTEXT_CHARS = 9000; // context untuk LLM (gabungan)
const MAX_USER_TEXT = 2500; // biar gak boros token
const MAX_HISTORY = 16; // per chat
const CHAT_COOLDOWN_MS = 3000; // anti spam balas per chat
const MODEL_COOLDOWN_MS = 45 * 1000; // cooldown model kalau rate limit
const REQUEST_TIMEOUT_MS = 25 * 1000;

const BOT_NAME_TRIGGERS = ["elika", "eli", "ika"]; // bisa tambah alias

/** =========================
 *  STATE & INDEX
 *  ========================= */
function safeMkdir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    console.error("Error creating directory:", e.message);
  }
}
safeMkdir(path.dirname(STATE_FILE));
safeMkdir(path.dirname(INDEX_CACHE_FILE));

function loadJson(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    console.error(`Error loading JSON from ${file}:`, e.message);
    return fallback;
  }
}

function saveJson(file, obj) {
  try {
    safeMkdir(path.dirname(file));
    fs.writeFileSync(file, JSON.stringify(obj, null, 2));
    return true;
  } catch (e) {
    console.error(`Error saving JSON to ${file}:`, e.message);
    return false;
  }
}

function now() {
  return Date.now();
}

function normalizeText(s) {
  return String(s || "").trim();
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Convert Markdown-ish text from LLM -> HTML safe for Telegram parse_mode: "HTML".
 * Fix: **bold**, *italic*, `inline`, ```code``` supaya gak tampil mentah.
 */
function mdToHtmlSafe(input) {
  let s = String(input || "");
  s = s.replace(/\r\n/g, "\n");

  // 1) Ambil dulu codefence biar newline di dalamnya gak ikut diubah jadi yang aneh
  const codeBlocks = [];
  s = s.replace(/```([\w-]*)\n([\s\S]*?)```/g, (all, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push({ lang, code });
    return `@@CODEBLOCK_${idx}@@`;
  });

  // 2) Escape HTML untuk keamanan
  s = escapeHtml(s);

  // 3) Inline code (setelah escape)
  s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  // 4) Bold / italic sederhana
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1<i>$2</i>");
  s = s.replace(/__([^_\n]+)__/g, "<b>$1</b>");
  s = s.replace(/_([^_\n]+)_/g, "<i>$1</i>");

  // 5) Bullet "- " jadi "• "
  s = s.replace(/^\s*[•\-]\s+/gm, "• ");

  // 6) Newline tetap newline (Telegram HTML tidak support <br>)
  // 7) Balikin codefence jadi <pre><code>...</code></pre>
  s = s.replace(/@@CODEBLOCK_(\d+)@@/g, (all, n) => {
    const block = codeBlocks[Number(n)] || { code: "" };
    const code = escapeHtml(block.code);
    return `<pre><code>${code}</code></pre>`;
  });

  // 8) Handle URLs (optional)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  /**
 * Sanitize jawaban untuk user publik (non-owner):
 * - Hilangkan path file/folder
 * - Hilangkan "lokasi file: ..."
 */
function sanitizePublicAnswer(answer) {
  let s = String(answer || "");

  // remove explicit file location lines
  s = s.replace(/^\s*lokasi file\s*:\s*.*$/gim, "");

  // redact common relative paths
  s = s.replace(/\b(?:plugins2?|lib|db|data|cache|price|scrape|text)\/[A-Za-z0-9._\-\/]+\b/g, "[REDACTED_PATH]");
  s = s.replace(/\bindex\.js\b/g, "[REDACTED_FILE]");
  s = s.replace(/\bconfig\.js\b/g, "[REDACTED_FILE]");

  return s.trim();
}

return s;
}

/**
 * Sanitize jawaban untuk user publik (non-owner):
 * - Hilangkan path file/folder
 * - Hilangkan "lokasi file: ..."
 */
function sanitizePublicAnswer(answer) {
  let s = String(answer || "");

  // remove explicit file location lines
  s = s.replace(/^\s*lokasi file\s*:\s*.*$/gim, "");

  // redact common relative paths
  s = s.replace(/\b(?:plugins2?|lib|db|data|cache|price|scrape|text)\/[A-Za-z0-9._\-\/]+\b/g, "[REDACTED_PATH]");
  s = s.replace(/\bindex\.js\b/g, "[REDACTED_FILE]");
  s = s.replace(/\bconfig\.js\b/g, "[REDACTED_FILE]");

  return s.trim();
}


/** Normalisasi owner IDs (string/number/array) biar aman */
function normalizeOwnerIds(config) {
  const raw =
    config?.ownerIds ??
    config?.ownerId ??
    config?.OWNER_ID ??
    config?.ownerID ??
    config?.adminId ??
    config?.adminID ??
    config?.owner ??
    config?.ownerIdx ??
    [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.filter(Boolean).map((x) => String(x));
}

/** Redact secrets dari text file */
function redactSecrets(text) {
  let t = String(text || "");

  // redaksi token/api keys umum
  t = t.replace(/(BOT_TOKEN|TOKEN|API_KEY|APIKEY|API_HASH|APIID|API_ID|SECRET|PASSWORD|PASS|AUTH|BEARER)\s*[:=]\s*["']?([A-Za-z0-9_\-:.]{10,})["']?/gi, "$1: ***REDACTED***");

  // redaksi format telegram bot token (12345:ABC...)
  t = t.replace(/\b\d{6,15}:[A-Za-z0-9_-]{20,}\b/g, "***REDACTED_BOT_TOKEN***");

  // redaksi string panjang yang mirip key
  t = t.replace(/\b[A-Za-z0-9_\-]{32,}\b/g, (m) => {
    // skip jika sudah ter-redact atau common words panjang
    if (m.includes("***") || m.length > 100) return m;
    return "***REDACTED***";
  });

  return t;
}

/** =========================
 *  PROJECT INDEXER
 *  ========================= */
function listFilesRecursive(dir, results = []) {
  let items;
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return results;
  }

  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      // skip node_modules, cache, .git
      if (it.name === "node_modules" || it.name === ".git" || it.name === "cache" || it.name.startsWith(".")) {
        continue;
      }
      listFilesRecursive(full, results);
    } else {
      const ext = path.extname(it.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) continue;

      try {
        const st = fs.statSync(full);
        if (st.size > MAX_FILE_BYTES) continue;
      } catch {
        continue;
      }

      results.push(full);
    }
  }
  return results;
}

function countPluginFiles(rootDir) {
  const pluginsDir = path.join(rootDir, "plugins");
  const plugins2Dir = path.join(rootDir, "plugins2");

  const countJsIn = (d) => {
    try {
      if (!fs.existsSync(d)) return 0;
      const files = fs.readdirSync(d).filter((f) => f.endsWith(".js"));
      return files.length;
    } catch {
      return 0;
    }
  };

  const plugins = countJsIn(pluginsDir);
  const plugins2 = countJsIn(plugins2Dir);
  
  return {
    plugins,
    plugins2,
    total: plugins + plugins2,
  };
}

function extractCommandsFromJs(text) {
  const t = String(text || "");
  const cmds = new Set();

  // bot.command("xxx"
  const re1 = /bot\.command\(\s*["'`]([a-z0-9_]+)["'`]/gi;
  let m;
  while ((m = re1.exec(t))) cmds.add(m[1]);

  // bot.hears("xxx"
  const re2 = /bot\.hears\(\s*["'`]([^"'`]+)["'`]/gi;
  while ((m = re2.exec(t))) {
    const val = m[1];
    if (val && val.length <= 32) cmds.add("hears:" + val);
  }

  // bot.action("xxx"
  const re3 = /bot\.action\(\s*["'`]([^"'`]+)["'`]/gi;
  while ((m = re3.exec(t))) {
    const val = m[1];
    if (val && val.length <= 32) cmds.add("action:" + val);
  }

  return [...cmds];
}

function buildProjectIndex(rootDir) {
  const index = {
    builtAt: new Date().toISOString(),
    rootDir,
    stats: {
      pluginCount: countPluginFiles(rootDir),
      fileCount: 0,
      commandCount: 0,
    },
    commands: [],
    files: [], // { rel, abs, size, mtime }
  };

  const files = [];

  // root files
  for (const f of SCAN_FILES_AT_ROOT) {
    const p = path.join(rootDir, f);
    if (fs.existsSync(p)) files.push(p);
  }

  // scan dirs
  for (const d of SCAN_DIRS) {
    const p = path.join(rootDir, d);
    if (fs.existsSync(p)) listFilesRecursive(p, files);
  }

  index.stats.fileCount = files.length;

  const allCommands = new Set();

  for (const abs of files) {
    let buf;
    try {
      buf = fs.readFileSync(abs, "utf-8");
    } catch (e) {
      console.error(`Error reading file ${abs}:`, e.message);
      continue;
    }
    
    const redacted = redactSecrets(buf);
    const rel = path.relative(rootDir, abs);
    let size = 0;
    let mtime = 0;
    
    try {
      const stat = fs.statSync(abs);
      size = stat.size;
      mtime = stat.mtimeMs;
    } catch (e) {
      console.error(`Error stating file ${abs}:`, e.message);
    }

    index.files.push({ rel, abs, size, mtime });

    // command extract only on js
    if (abs.endsWith(".js")) {
      const cmds = extractCommandsFromJs(redacted);
      for (const c of cmds) allCommands.add(c);
    }
  }

  index.commands = [...allCommands].sort();
  index.stats.commandCount = index.commands.filter((c) => !c.startsWith("action:") && !c.startsWith("hears:")).length;

  return index;
}

function loadOrBuildIndex(rootDir) {
  const cached = loadJson(INDEX_CACHE_FILE, null);
  
  // Rebuild jika cache kosong, root berbeda, atau cache lebih dari 1 jam
  const shouldRebuild = !cached || 
                       cached.rootDir !== rootDir || 
                       (Date.now() - new Date(cached.builtAt).getTime() > 60 * 60 * 1000);
  
  if (shouldRebuild) {
    console.log("Building new project index...");
    const idx = buildProjectIndex(rootDir);
    saveJson(INDEX_CACHE_FILE, idx);
    return idx;
  }
  
  return cached;
}

/** =========================
 *  SIMPLE RETRIEVAL (RAG)
 *  ========================= */
function keywordScore(text, terms) {
  const t = String(text || "").toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    const c = t.split(term).length - 1;
    if (c > 0) score += c * (term.length); // bobot berdasarkan panjang term
  }
  return score;
}

function pickRelevantContexts(rootDir, index, query, exposePaths = false, maxChars = MAX_CONTEXT_CHARS) {
  const q = String(query || "").toLowerCase();
  const terms = q
    .replace(/[^a-z0-9_\s]/g, " ")
    .split(/\s+/)
    .filter((x) => x && x.length >= 3)
    .slice(0, 10);

  // kalau query nanya plugin/command, kasih data index dulu
  const wantStats =
    q.includes("berapa plugin") ||
    q.includes("jumlah plugin") ||
    q.includes("berapa command") ||
    q.includes("fitur") ||
    q.includes("menu") ||
    q.includes("cara pakai") ||
    q.includes("gunakan kamu") ||
    q.includes("cara menggunakan") ||
    q.includes("apa yang bisa") ||
    q.includes("command list") ||
    q.includes("perintah");

  const chunks = [];

  if (wantStats) {
    const pc = index.stats.pluginCount;
    const cmdList = index.commands
      .filter((c) => !c.startsWith("action:") && !c.startsWith("hears:"))
      .slice(0, 80)
      .map((c) => "/" + c)
      .join(", ");

    const pluginLine = exposePaths
  ? `- Total plugin: ${pc.total} (plugins=${pc.plugins}, plugins2=${pc.plugins2})
`
  : `- Total plugin: ${pc.total}
`;
const fileLine = exposePaths ? `- Total file yang di-scan: ${index.stats.fileCount}` : ``;

chunks.push(
  `PROJECT_STATS:
` +
  pluginLine +
  `- Jumlah command yang terdeteksi: ${index.stats.commandCount}
` +
  `- Sample commands: ${cmdList || "(none found)"}
` +
  fileLine
);
  }

  // Ranking file by score: read small snippet
  const scored = [];
  for (const f of index.files) {
    // skip huge json data spam for retrieval unless terms match strong
    const ext = path.extname(f.abs).toLowerCase();
    if (ext === ".json" && terms.length < 2) continue;

    let content;
    try {
      content = fs.readFileSync(f.abs, "utf-8");
    } catch {
      continue;
    }

    content = redactSecrets(content);

    const score = keywordScore(content, terms);
    if (score <= 0) continue;

    // create snippet around first match
    const low = content.toLowerCase();
    let pos = -1;
    for (const term of terms) {
      pos = low.indexOf(term);
      if (pos >= 0) break;
    }
    
    if (pos < 0) continue;
    
    const start = Math.max(0, pos - 600);
    const end = Math.min(content.length, pos + 1200);
    const snippet = content.slice(start, end);
    
    // Add context before and after
    const contextSnippet = (start > 0 ? "[...] " : "") + snippet + (end < content.length ? " [...]" : "");

    scored.push({
      rel: f.rel,
      score,
      snippet: contextSnippet,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  // pick top snippets until maxChars
  let used = chunks.join("\n\n").length;
  for (const s of scored.slice(0, 8)) {
    const fileLabel = exposePaths ? `FILE: ${s.rel}` : `FILE: [REDACTED]`;
    const block = `${fileLabel}
---
${s.snippet}
---`;
    if (used + block.length + 2 > maxChars) break;
    chunks.push(block);
    used += block.length + 2;
  }

  return chunks.join("\n\n");
}

/** =========================
 *  GROQ CLIENT (failover 5 model)
 *  ========================= */
function isRateLimitError(e, bodyText) {
  const msg = (e && (e.message || String(e))) || "";
  const b = String(bodyText || "");
  return (
    msg.includes("429") ||
    msg.toLowerCase().includes("rate") ||
    msg.toLowerCase().includes("limit") ||
    msg.toLowerCase().includes("quota") ||
    b.includes("429") ||
    b.toLowerCase().includes("rate") ||
    b.toLowerCase().includes("limit") ||
    b.toLowerCase().includes("quota")
  );
}

async function groqChat({
  apiKey,
  models,
  system,
  messages,
  temperature = 0.3,
  maxTokens = 700,
  cooldownMap,
}) {
  if (!fetchFn) {
    throw new Error("fetch not available (install node-fetch)");
  }
  
  if (!apiKey || apiKey === "GROQ_API_KEY") {
    throw new Error("API key not configured");
  }
  
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const errs = [];

  for (const model of models) {
    const coolUntil = cooldownMap.get(model) || 0;
    if (coolUntil > now()) {
      errs.push(`model=${model} cooldown`);
      continue;
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const payload = {
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          ...messages,
        ],
      };

      const res = await fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(t);

      const body = await res.text();
      if (!res.ok) {
        // rate limit → cooldown & failover
        if (res.status === 429 || isRateLimitError(new Error(String(res.status)), body)) {
          cooldownMap.set(model, now() + MODEL_COOLDOWN_MS);
          errs.push(`model=${model} rate_limit`);
          continue;
        }
        // other errors → try next model
        const errorMsg = `HTTP ${res.status}: ${body.slice(0, 200)}`;
        errs.push(`model=${model} ${errorMsg}`);
        continue;
      }

      const json = JSON.parse(body);
      const content = json?.choices?.[0]?.message?.content;
      if (!content) {
        errs.push(`model=${model} empty_response`);
        continue;
      }

      return { ok: true, model, content, usage: json.usage };
    } catch (e) {
      clearTimeout(t);
      // abort or network or rate limit → failover
      const msg = e?.name === "AbortError" ? "timeout" : (e?.message || String(e));
      if (isRateLimitError(e)) cooldownMap.set(model, now() + MODEL_COOLDOWN_MS);
      errs.push(`model=${model} err=${msg}`);
      continue;
    }
  }

  return { ok: false, error: errs.join(" | ") || "all_models_failed" };
}

/** =========================
 *  MAIN PLUGIN
 *  ========================= */
module.exports = (bot, config = {}) => {
  console.log("Loading Elika AI (Groq) plugin...");
  
  const rootDir = process.cwd();
  
  // fallback: kalau loader cuma kirim (bot), ambil config dari root project
  try {
    if (!config || Object.keys(config).length === 0) {
      config = require(path.join(rootDir, "config.js"));
    }
  } catch (e) {
    console.log("Config not found, using provided config or defaults");
  }

  const state = loadJson(STATE_FILE, { chats: {}, global: { lastReindex: 0 } });

  // Groq config
  const groqCfg = config.groq || {};
  const GROQ_API_KEY = process.env.GROQ_API_KEY || groqCfg.apiKey || "";
  const MODELS = Array.isArray(groqCfg.models) && groqCfg.models.length ? groqCfg.models : DEFAULT_MODELS;

  const OWNER_IDS = normalizeOwnerIds(config);

  // runtime maps
  const lastChatReplyAt = new Map(); // chatId -> timestamp
  const historyMap = new Map(); // chatId -> [{role, content}]
  const cooldownMap = new Map(); // model -> coolUntil

  // load/build index (cache)
  let projectIndex = loadOrBuildIndex(rootDir);
  console.log(`Project index loaded: ${projectIndex.stats.fileCount} files, ${projectIndex.stats.pluginCount.total} plugins`);

  // helper: get chat mode
  function getMode(chatId) {
    const key = String(chatId);
    const m = state.chats?.[key]?.mode || (isPrivateByChatId(chatId) ? "on" : "silent");
    return m;
  }
  
  function setMode(chatId, mode) {
    const key = String(chatId);
    if (!state.chats) state.chats = {};
    if (!state.chats[key]) state.chats[key] = {};
    state.chats[key].mode = mode;
    state.chats[key].updatedAt = now();
    saveJson(STATE_FILE, state);
  }
  
  function resetChat(chatId) {
    const key = String(chatId);
    if (state.chats?.[key]) delete state.chats[key];
    saveJson(STATE_FILE, state);
    historyMap.delete(String(chatId));
    lastChatReplyAt.delete(String(chatId));
  }

  function isOwner(ctx) {
    return OWNER_IDS.includes(String(ctx.from?.id));
  }

  function isPrivate(ctx) {
    return ctx.chat?.type === "private";
  }
  
  function isPrivateByChatId(chatId) {
    return String(chatId).startsWith("-100") ? false : true;
  }

  // decide if should answer
  function shouldAnswer(ctx) {
    const text = normalizeText(ctx.message?.text || ctx.message?.caption || "");
    if (!text) return false;

    const chatId = String(ctx.chat?.id);
    const mode = getMode(chatId);

    const hasName = BOT_NAME_TRIGGERS.some((n) => text.toLowerCase().includes(n.toLowerCase()));
    const isReplyToBot = Boolean(
      ctx.message?.reply_to_message?.from?.id && 
      ctx.message.reply_to_message.from.id === ctx.botInfo?.id
    );

    // private: default ON (kecuali off)
    if (isPrivate(ctx)) {
      if (mode === "off") return false;
      return true; // selalu jawab di private
    }

    // group/supergroup
    if (mode === "off") return false;
    if (mode === "on") return true;

    // silent: cuma kalau name disebut atau reply ke bot
    return hasName || isReplyToBot;
  }

  function applyChatCooldown(chatId) {
    const last = lastChatReplyAt.get(chatId) || 0;
    if (now() - last < CHAT_COOLDOWN_MS) return false;
    lastChatReplyAt.set(chatId, now());
    return true;
  }

  function pushHistory(chatId, role, content) {
    const key = String(chatId);
    const arr = historyMap.get(key) || [];
    arr.push({ 
      role, 
      content: String(content || "").slice(0, 1500),
      timestamp: now()
    });
    while (arr.length > MAX_HISTORY) arr.shift();
    historyMap.set(key, arr);
    return arr;
  }

  function buildSystemPrompt(isOwnerUser) {
    const pc = projectIndex.stats.pluginCount;
    const cmdCount = projectIndex.stats.commandCount;

    const fileRule = isOwnerUser
      ? "- Jika perlu menyebut file, boleh sebut lokasi file: <path>."
      : "- Jangan sebut nama file/path/folder apa pun ke user biasa. Gunakan istilah umum (misal: modul pembayaran / menu panel).";

    const summaryLine = isOwnerUser
      ? `Ringkasan project saat ini: total plugin=${pc.total} (plugins=${pc.plugins}, plugins2=${pc.plugins2}), commands_terdeteksi=${cmdCount}.`
      : `Ringkasan project saat ini: total plugin=${pc.total}, commands_terdeteksi=${cmdCount}.`;

    return [
      "Kamu adalah ELIKA, AI assistant untuk bot Telegram milik user.",
      "Aturan utama:",
      "- Jawab dalam Bahasa Indonesia (ringkas, jelas, helpful).",
      "- Jangan gunakan Markdown seperti **, *, ``` di output. Kalau perlu code, tulis code polos saja (tanpa ```).",
      "- Kamu boleh menggunakan informasi PROJECT_CONTEXT yang diberikan (hasil scan file lokal).",
      "- Jangan pernah menampilkan token, api key, password, session, atau rahasia (termasuk nama file yang mengandung rahasia). Kalau ada di konteks, abaikan/anggap REDACTED.",
      "- Kalau ditanya sesuatu yang tidak ada di konteks project, bilang jujur 'aku tidak menemukan itu di file project'.",
      "- Kalau user tanya cara menggunakan bot, berikan panduan berdasarkan daftar command yang ditemukan.",
      "",
      summaryLine,
      "Format jawaban:",
      "- Pakai paragraf pendek, bullet jika perlu.",
      fileRule,
    ].join("\n");
  }

  function formatReplyHTML(model, answer) {
    const pc = projectIndex.stats.pluginCount;
    const body = mdToHtmlSafe(answer);

    return (
      `<blockquote><b>┌───「 ᴇʟɪᴋᴀ ᴀɪ 」───┐\n` +
      `├ ◦ ᴍᴏᴅᴇʟ : ${escapeHtml(model || "-")}\n` +
      `├ ◦ ᴘʟᴜɢɪɴs : ${pc.total}\n` +
      `└─────────────────</b>\n\n` +
      `${body}</blockquote>`
    );
  }

  function elikaKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: "✅ ON", callback_data: "elika_on" },
          { text: "🔕 SILENT", callback_data: "elika_silent" },
          { text: "⛔ OFF", callback_data: "elika_off" },
        ],
        [
          { text: "🧹 RESET", callback_data: "elika_reset" },
          { text: "📊 STATUS", callback_data: "elika_status" },
        ],
      ],
    };
  }

  async function answerWithElika(ctx, text) {
    if (!GROQ_API_KEY) {
      return ctx.reply("❌ GROQ_API_KEY belum di-set. Isi env GROQ_API_KEY atau config.groq.apiKey dulu.");
    }

    if (!fetchFn) {
      return ctx.reply("❌ fetch not available. Install node-fetch: npm i node-fetch");
    }

    const chatId = String(ctx.chat.id);

    // anti spam
    if (!applyChatCooldown(chatId)) {
      try {
        await ctx.reply("⏳ Tunggu sebentar ya...", { reply_to_message_id: ctx.message.message_id });
      } catch {}
      return;
    }

    // refresh index kalau owner minta (simple heuristic)
    const low = text.toLowerCase();
    if (isOwner(ctx) && (low.includes("refresh index") || low.includes("scan ulang") || low.includes("update index") || low.includes("reindex"))) {
      projectIndex = buildProjectIndex(rootDir);
      saveJson(INDEX_CACHE_FILE, projectIndex);
      await ctx.sendChatAction("typing");
      await ctx.reply("✅ Index project telah diperbarui!");
    }

    // Build context (RAG)
    const expose = isOwner(ctx);
    const ctxBlock = pickRelevantContexts(rootDir, projectIndex, text, expose);

    // history
    const hist = historyMap.get(chatId) || [];
    const userMsg = text.slice(0, MAX_USER_TEXT);

    const messages = [
      ...hist.slice(-10).map(msg => ({ role: msg.role, content: msg.content })),
      { 
        role: "user", 
        content: `USER_QUESTION:\n${userMsg}\n\nPROJECT_CONTEXT:\n${ctxBlock || "(no relevant context found)"}` 
      },
    ];

    const system = buildSystemPrompt(expose);

    // typing
    try { 
      await ctx.sendChatAction("typing"); 
    } catch {}

    const res = await groqChat({
      apiKey: GROQ_API_KEY,
      models: MODELS,
      system,
      messages,
      temperature: 0.25,
      maxTokens: 800,
      cooldownMap,
    });

    if (!res.ok) {
      // fallback kalau pertanyaan bisa dijawab local
      const pc = projectIndex.stats.pluginCount;
      if (low.includes("berapa plugin") || low.includes("jumlah plugin") || low.includes("total plugin")) {
        const ans = `Aku pakai total ${pc.total} plugin (plugins=${pc.plugins}, plugins2=${pc.plugins2}).`;
        pushHistory(chatId, "user", userMsg);
        pushHistory(chatId, "assistant", ans);
        return ctx.reply(formatReplyHTML("local", ans), { 
          parse_mode: "HTML",
          reply_to_message_id: ctx.message.message_id 
        });
      }

      if (low.includes("command") || low.includes("perintah") || low.includes("fitur")) {
        const cmdList = projectIndex.commands
          .filter(c => !c.startsWith("action:") && !c.startsWith("hears:"))
          .slice(0, 30)
          .map(c => "/" + c)
          .join(", ");
        const ans = `Bot ini memiliki sekitar ${projectIndex.stats.commandCount} command yang terdeteksi.\n\nBeberapa contoh:\n${cmdList}`;
        pushHistory(chatId, "user", userMsg);
        pushHistory(chatId, "assistant", ans);
        return ctx.reply(formatReplyHTML("local", ans), { 
          parse_mode: "HTML",
          reply_to_message_id: ctx.message.message_id 
        });
      }

      return ctx.reply(`❌ Elika lagi penuh/gagal akses model.\nDetail: ${res.error}`, { 
        reply_to_message_id: ctx.message.message_id 
      });
    }

    let answer = String(res.content).trim();

    // privacy: non-owner jangan dapat detail path/file
    if (!expose) {
      answer = sanitizePublicAnswer(answer);
    }

    pushHistory(chatId, "user", userMsg);
    pushHistory(chatId, "assistant", answer);

    return ctx.reply(formatReplyHTML(res.model, answer), { 
      parse_mode: "HTML",
      reply_to_message_id: ctx.message.message_id,
      disable_web_page_preview: true 
    });
  }

  /** =========================
   *  COMMANDS
   *  ========================= */
  bot.command("elika", async (ctx) => {
    const text = normalizeText(ctx.message?.text);
    const args = text.split(/\s+/);
    const arg = args.slice(1).join(" ").toLowerCase();
    const chatId = String(ctx.chat.id);

    // default behavior: show status/help
    const set = (m) => {
      setMode(chatId, m);
      return m;
    };

    if (arg === "on") {
      set("on");
      return ctx.reply("✅ Elika mode: ON (akan merespon semua pesan di chat ini)");
    } else if (arg === "off") {
      set("off");
      return ctx.reply("⛔ Elika mode: OFF (tidak akan merespon)");
    } else if (arg === "silent") {
      set("silent");
      return ctx.reply("🔕 Elika mode: SILENT (hanya merespon jika dipanggil atau reply ke bot)");
    } else if (arg === "reset") {
      resetChat(chatId);
      return ctx.reply("✅ Elika reset: mode & history dibersihkan.");
    } else if (arg === "reindex" || arg === "scan") {
      if (!isOwner(ctx)) return ctx.reply("🚫 Khusus owner.");
      projectIndex = buildProjectIndex(rootDir);
      saveJson(INDEX_CACHE_FILE, projectIndex);
      return ctx.reply("✅ Index project diperbarui (scan ulang).");
    }

    const mode = getMode(chatId);
    const pc = projectIndex.stats.pluginCount;

    const caption =
      `<blockquote><b>┌───「 ᴇʟɪᴋᴀ ᴄᴏɴᴛʀᴏʟ 」───┐\n` +
      `├ ◦ ᴍᴏᴅᴇ : ${escapeHtml(mode)}\n` +
      `├ ◦ ᴘʟᴜɢɪɴs : ${pc.total}\n` +
      `└─────────────────</b>\n\n` +
      `Perintah:\n` +
      `• /elika on (auto jawab)\n` +
      `• /elika silent (jawab kalau disebut "elika" / reply bot)\n` +
      `• /elika off (mati)\n` +
      `• /elika status\n` +
      `• /elika reset\n` +
      (isOwner(ctx) ? `• /elika reindex\n` : ``) +
      `\nTrigger:\n` +
      `• sebut "elika" di chat\n` +
      `• atau reply pesan bot\n` +
      `• atau chat private langsung\n` +
      `</blockquote>`;

    return ctx.reply(caption, { 
      parse_mode: "HTML", 
      reply_markup: elikaKeyboard(),
      disable_web_page_preview: true 
    });
  });

  bot.command("elikastatus", async (ctx) => {
    const chatId = String(ctx.chat.id);
    const mode = getMode(chatId);
    const pc = projectIndex.stats.pluginCount;
    const historySize = historyMap.get(String(chatId))?.length || 0;

    return ctx.reply(
      `<blockquote><b>┌───「 ᴇʟɪᴋᴀ sᴛᴀᴛᴜs 」───┐\n` +
      `├ ◦ ᴍᴏᴅᴇ : ${escapeHtml(mode)}\n` +
      `├ ◦ ᴘʟᴜɢɪɴs : ${pc.total}\n` +
      `├ ◦ ᴄᴏᴍᴍᴀɴᴅs : ${projectIndex.stats.commandCount}\n` +
      `├ ◦ ʜɪsᴛᴏʀʏ : ${historySize} pesan\n` +
      `├ ◦ ꜰɪʟᴇs : ${projectIndex.stats.fileCount} terindex\n` +
      `└─────────────────</b></blockquote>`,
      { parse_mode: "HTML" }
    );
  });

  /** =========================
   *  INLINE BUTTON ACTIONS
   *  ========================= */
  bot.action("elika_on", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    setMode(ctx.chat.id, "on");
    return ctx.editMessageText("✅ Elika mode: ON (akan merespon semua pesan di chat ini)");
  });
  
  bot.action("elika_off", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    setMode(ctx.chat.id, "off");
    return ctx.editMessageText("⛔ Elika mode: OFF (tidak akan merespon)");
  });
  
  bot.action("elika_silent", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    setMode(ctx.chat.id, "silent");
    return ctx.editMessageText("🔕 Elika mode: SILENT (hanya merespon jika dipanggil atau reply ke bot)");
  });
  
  bot.action("elika_reset", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    resetChat(ctx.chat.id);
    return ctx.editMessageText("🧹 Elika reset: history & mode dibersihkan.");
  });
  
  bot.action("elika_status", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const chatId = String(ctx.chat.id);
    const mode = getMode(chatId);
    const pc = projectIndex.stats.pluginCount;
    const historySize = historyMap.get(String(chatId))?.length || 0;

    const statusText = 
      `<blockquote><b>┌───「 ᴇʟɪᴋᴀ sᴛᴀᴛᴜs 」───┐\n` +
      `├ ◦ ᴍᴏᴅᴇ : ${escapeHtml(mode)}\n` +
      `├ ◦ ᴘʟᴜɢɪɴs : ${pc.total}\n` +
      `├ ◦ ᴄᴏᴍᴍᴀɴᴅs : ${projectIndex.stats.commandCount}\n` +
      `├ ◦ ʜɪsᴛᴏʀʏ : ${historySize} pesan\n` +
      `├ ◦ ꜰɪʟᴇs : ${projectIndex.stats.fileCount} terindex\n` +
      `└─────────────────</b></blockquote>`;
    
    return ctx.editMessageText(statusText, { parse_mode: "HTML" });
  });

  /** =========================
   *  AUTO REPLY HANDLER
   *  ========================= */
bot.on("text", async (ctx, next) => {
  // ✅ biarkan command/plugin lain jalan dulu
  if (typeof next === "function") await next();

  try {
    // Skip jika bukan pesan biasa
    if (!ctx.message || ctx.message.via_bot) return;

    const text = normalizeText(ctx.message?.text);
    if (!text) return;

    // jangan respon ke command lain
    if (text.startsWith("/")) return;

    // mode default: private = on, group = silent
    const chatId = String(ctx.chat.id);
    if (!state.chats?.[chatId]?.mode) {
      setMode(chatId, isPrivate(ctx) ? "on" : "silent");
    }

    if (!shouldAnswer(ctx)) return;

    // ignore pesan super pendek kecuali name/reply
    const low = text.toLowerCase();
    const hasName = BOT_NAME_TRIGGERS.some((n) => low.includes(String(n).toLowerCase()));
    const isReplyToBot = Boolean(
      ctx.message?.reply_to_message?.from?.id &&
      ctx.message.reply_to_message.from.id === ctx.botInfo?.id
    );

    if (!hasName && !isReplyToBot && text.length < 5) return;

    await answerWithElika(ctx, text);
  } catch (e) {
    console.error("Elika error in text handler:", e);
    try {
      await ctx.reply("❌ Elika error: " + (e?.message || String(e)).slice(0, 200));
    } catch {}
  }
});

  /** =========================
   *  OPTIONAL: Reindex timer (biar plugin count akurat kalau kamu sering nambah plugin)
   *  ========================= */
  setInterval(() => {
    try {
      // Rebuild setiap 30 menit jika diperlukan
      const currentTime = now();
      if (currentTime - (state.global?.lastReindex || 0) > 30 * 60 * 1000) {
        console.log("Auto-rebuilding project index...");
        projectIndex = buildProjectIndex(rootDir);
        saveJson(INDEX_CACHE_FILE, projectIndex);
        
        state.global = state.global || {};
        state.global.lastReindex = currentTime;
        saveJson(STATE_FILE, state);
      }
    } catch (e) {
      console.error("Error in auto-reindex:", e);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  console.log("Elika AI (Groq) plugin loaded successfully!");
};