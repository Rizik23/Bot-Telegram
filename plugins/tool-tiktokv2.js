const { Markup } = require("telegraf");
const axios = require("axios");
const FileType = require("file-type"); // npm i file-type

function escapeHTML(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseTikTokUrl(text) {
  // Ambil URL TikTok dari teks
  const urlRegex = /(?:https?:\/\/)?(?:www\.|vm\.|vt\.)?tiktok\.com\/[^\s]+/i;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

// Download cover jadi buffer biar Telegram gak fetch sendiri (anti IMAGE_PROCESS_FAILED)
async function fetchAsBuffer(url, timeout = 30000) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout,
    maxRedirects: 5,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return Buffer.from(res.data);
}

// Kirim cover dengan aman + fallback kalau formatnya bikin Telegram rewel
async function sendCoverSafe(ctx, coverUrl, caption, extra, timeout = 30000) {
  if (!coverUrl) return false;

  try {
    const buf = await fetchAsBuffer(coverUrl, timeout);

    // Deteksi mime (buat ngindarin webp/avif yang sering bikin sendPhoto gagal)
    const ft = await FileType.fromBuffer(buf);
    const mime = ft?.mime || "application/octet-stream";

    const badForSendPhoto =
      mime.includes("webp") ||
      mime.includes("avif") ||
      mime.includes("svg") ||
      mime === "application/octet-stream";

    // Kalau format “rawan”, fallback: kirim caption aja (paling stabil)
    if (badForSendPhoto) {
      await ctx.reply(caption, extra);
      return true;
    }

    // Kirim foto pakai buffer (Telegram ga perlu download dari URL)
    await ctx.replyWithPhoto({ source: buf }, { caption, ...extra });
    return true;
  } catch (e) {
    // Kalau cover error (redirect/CDN/timeout), fallback: caption aja
    await ctx.reply(caption, extra);
    return true;
  }
}

module.exports = (bot, config = {}) => {
  const API_BASE =
    config.apiBase || "https://api.vreden.my.id/api/v1/download/tiktok";
  const timeout = config.timeout || 30000;

  async function hitVreden(tiktokUrl) {
    // Pastikan URL punya protokol
    if (!tiktokUrl.startsWith("http")) {
      tiktokUrl = "https://" + tiktokUrl;
    }

    const apiUrl = `${API_BASE}?url=${encodeURIComponent(tiktokUrl)}`;
    const { data } = await axios.get(apiUrl, {
      timeout,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!data || data.status !== true || data.status_code !== 200 || !data.result) {
      throw new Error(data?.message || "API error: Respons tidak valid");
    }
    return data.result;
  }

  function pickVideo(result, type) {
    if (!result || !result.data) return null;

    const arr = Array.isArray(result.data) ? result.data : [];

    // Coba cocokkan tipe dulu
    const exactMatch = arr.find((x) => x.type === type && x.url);
    if (exactMatch) return exactMatch.url;

    // Fallback: cari video tanpa watermark
    if (type.includes("watermark")) {
      const noWatermark = arr.find(
        (x) => x.type && x.type.includes("nowatermark") && x.url
      );
      if (noWatermark) return noWatermark.url;
    }

    // Pilihan terakhir: ambil URL video pertama yang valid
    return arr.find((x) => x.url)?.url || null;
  }

  // Command /tt <url>
  bot.command(["tt", "tiktok", "tiktokvreden"], async (ctx) => {
    let waitMsg = null;

    try {
      const messageText = ctx.message.text;
      const urlArg = messageText.split(" ").slice(1).join(" ").trim();

      if (!urlArg) {
        return ctx.reply(
          "❓ <b>Cara Pakai:</b>\n" +
            "<code>/tt &lt;link_tiktok&gt;</code>\n\n" +
            "Contoh:\n" +
            "<code>/tt https://vt.tiktok.com/xxxxxx</code>\n" +
            "<code>/tt https://www.tiktok.com/@user/video/123</code>",
          { parse_mode: "HTML" }
        );
      }

      // Coba ekstrak URL dari teks
      let tiktokUrl = parseTikTokUrl(urlArg);
      if (!tiktokUrl) tiktokUrl = urlArg;

      waitMsg = await ctx.reply("⏳ <i>Sedang mengunduh data dari TikTok...</i>", {
        parse_mode: "HTML",
      });

      const result = await hitVreden(tiktokUrl);

      const title = result.title || "Video TikTok";
      const cover = result.cover || null;
      const authorNick = result.author?.nickname || "Tidak Diketahui";
      const authorUser =
        result.author?.unique_id || result.author?.fullname || "unknown";
      const duration =
        result.duration || (result.durations ? `${result.durations} detik` : "-");
      const takenAt = result.taken_at || "-";

      // Format statistik
      let statsText = "";
      if (result.stats) {
        const stats = result.stats;
        const views = stats.views ? parseInt(stats.views).toLocaleString("id-ID") : "0";
        const likes = stats.likes ? parseInt(stats.likes).toLocaleString("id-ID") : "0";
        const comments = stats.comment
          ? parseInt(stats.comment).toLocaleString("id-ID")
          : "0";
        const shares = stats.share ? parseInt(stats.share).toLocaleString("id-ID") : "0";
        statsText = `👁️ ${views} | ❤️ ${likes} | 💬 ${comments} | 📤 ${shares}`;
      }

      const musicTitle = result.music_info?.title || "-";
      const musicAuthor = result.music_info?.author || "-";

      // Buat caption
      const caption =
        `🎬 <b>${escapeHTML(title)}</b>\n\n` +
        `👤 <b>Pembuat:</b> ${escapeHTML(authorNick)} (@${escapeHTML(authorUser)})\n` +
        `⏱️ <b>Durasi:</b> ${escapeHTML(duration)}\n` +
        `📅 <b>Upload:</b> ${escapeHTML(takenAt)}\n` +
        (statsText ? `\n${escapeHTML(statsText)}\n` : "\n") +
        `🎵 <b>Musik:</b> ${escapeHTML(musicTitle)}\n` +
        `🎤 <b>Artis:</b> ${escapeHTML(musicAuthor)}`;

      const encodedUrl = encodeURIComponent(tiktokUrl);

      // Buat keyboard inline
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback("📥 Video SD", `ttv_sd:${encodedUrl}`),
          Markup.button.callback("📥 Video HD", `ttv_hd:${encodedUrl}`),
        ],
        [
          Markup.button.callback("🎵 Audio", `ttv_audio:${encodedUrl}`),
          Markup.button.url("🔗 Original", tiktokUrl),
        ],
      ]);

      const extra = {
        parse_mode: "HTML",
        ...keyboard,
        reply_to_message_id: ctx.message.message_id,
      };

      // Kirim hasil (ANTI IMAGE_PROCESS_FAILED)
      if (cover) {
        await sendCoverSafe(ctx, cover, caption, extra, timeout);
      } else {
        await ctx.reply(caption, extra);
      }

      // Hapus pesan tunggu
      if (waitMsg) {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      }
    } catch (error) {
      console.error("Error command TikTok:", error);

      // Coba hapus pesan tunggu kalau ada
      if (waitMsg) {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      }

      let errorMessage = "❌ <b>Gagal memproses TikTok!</b>\n";

      if (error.code === "ECONNABORTED") {
        errorMessage += "Timeout: API tidak merespon (30 detik).";
      } else if (error.response) {
        errorMessage += `Error API: Status ${error.response.status}`;
      } else if (String(error.message || "").includes("link tidak valid")) {
        errorMessage += "Link TikTok tidak valid atau sudah dihapus.";
      } else {
        errorMessage += `Error: ${escapeHTML(String(error.message || "").slice(0, 200))}`;
      }

      await ctx.reply(errorMessage + "\n\nCoba lagi atau gunakan link yang berbeda.", {
        parse_mode: "HTML",
        reply_to_message_id: ctx.message.message_id,
      });
    }
  });

  // Handle tombol callback
  bot.action(/^ttv_(sd|hd|audio):(.+)$/i, async (ctx) => {
    try {
      const mode = ctx.match[1].toLowerCase();
      const tiktokUrl = decodeURIComponent(ctx.match[2]);

      await ctx.answerCbQuery(
        `⏳ Mengambil ${mode === "audio" ? "audio" : `video ${mode.toUpperCase()}`}...`
      );

      const result = await hitVreden(tiktokUrl);

      if (mode === "audio") {
        const audioUrl = result.music_info?.url;
        if (!audioUrl) throw new Error("Audio tidak tersedia");

        await ctx.replyWithAudio(
          { url: audioUrl },
          {
            title: result.music_info?.title || "Audio TikTok",
            performer: result.music_info?.author || "Tidak Diketahui",
            reply_to_message_id: ctx.callbackQuery.message.message_id,
          }
        );

        return ctx.answerCbQuery("✅ Audio berhasil dikirim!");
      }

      // Untuk video
      let videoUrl = null;
      if (mode === "hd") {
        videoUrl =
          pickVideo(result, "nowatermark_hd") ||
          pickVideo(result, "nowatermark") ||
          result.video_url;
      } else {
        videoUrl =
          pickVideo(result, "nowatermark") ||
          pickVideo(result, "nowatermark_hd") ||
          result.video_url;
      }

      if (!videoUrl) throw new Error("Video tidak ditemukan");

      await ctx.replyWithVideo(
        { url: videoUrl },
        {
          caption:
            `📥 TikTok ${mode.toUpperCase()} (Tanpa Watermark)\n` +
            `Via @${ctx.botInfo.username}`,
          reply_to_message_id: ctx.callbackQuery.message.message_id,
          parse_mode: "HTML",
        }
      );

      return ctx.answerCbQuery(`✅ Video ${mode.toUpperCase()} berhasil dikirim!`);
    } catch (error) {
      console.error("Error tombol TikTok:", error);

      let errorMsg = "❌ Gagal mengunduh ";
      if (String(error.message || "").includes("Audio")) {
        errorMsg += "audio. Video mungkin menggunakan suara asli (original sound).";
      } else if (String(error.message || "").includes("Video")) {
        errorMsg += "video. Coba lagi nanti atau link mungkin sudah tidak valid.";
      } else if (String(error.message || "").includes("API")) {
        errorMsg += "media. API sedang bermasalah, coba beberapa menit lagi.";
      } else {
        errorMsg += "media. Terjadi kesalahan.";
      }

      return ctx.answerCbQuery(errorMsg, { show_alert: true });
    }
  });

  return true;
};