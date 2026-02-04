/**
 * domain.js (PLUGIN)
 * Cloudflare Subdomain Manager (Telegram / Telegraf)
 *
 * Commands:
 *  - /subdomain host|ip          => pilih domain via tombol, lalu create
 *  - /createdomain <no> host|ip  => create langsung via index domain (1..n)
 *  - /delsubdo full.domain.tld   => hapus 1 record (auto cari di semua zone)
 *  - /delallsubdo domain.tld     => hapus semua record di domain itu (zone sesuai config)
 *  - /listdns                    => pilih domain, lalu tampilkan list record (paging)
 *  - /res_list_dns_record domain.tld [page] => list record langsung
 *
 * Catatan:
 * - Plugin ini TIDAK memanggil bot.launch(); itu tugas index.js.
 * - File ini asumsi kamu punya: ../config.js dan ../owner.json
 *
 * IMPORTANT:
 * - Telegram callback_data ada limit ukuran. Jadi callback_data dibuat singkat + parsing robust.
 * - Domain list banyak => dipaging 12 per halaman.
 */

const fs = require("fs");         // (boleh tetap ada, biar kompatibel sama project kamu)
const path = require("path");     // (boleh tetap ada, biar kompatibel sama project kamu)
const axios = require("axios");
const config = require("../config");

module.exports = (bot) => {
  // ===== Utils =====
  function isOwnerId(userId) {
    return (config.ownerIds || []).map(String).includes(String(userId));
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function sanitizeHost(hostRaw) {
    return String(hostRaw || "")
      .toLowerCase()
      .replace(/[^a-z0-9.-]/gi, "")
      .replace(/\.+/g, ".")
      .replace(/^\.+|\.+$/g, "");
  }

  function sanitizeIP(ipRaw) {
    // support ip biasa / ipv4
    return String(ipRaw || "").replace(/[^0-9.]/g, "");
  }

  // Telegram sering error "message is not modified", jadi bungkus
  async function safeEditMarkup(ctx, markup) {
    try {
      return await ctx.editMessageReplyMarkup(markup);
    } catch (e) {
      const msg = String(e?.description || e?.message || "");
      if (msg.includes("message is not modified")) return;
      // fallback: coba edit text kosong? tidak perlu
      return;
    }
  }

  // ===== Paging Config =====
  const LISTDNS_PER_PAGE = 12;
  const DOMAIN_PER_PAGE = 12;

  function buildListdnsKeyboard(rows, page = 1) {
    const totalPages = Math.ceil(rows.length / LISTDNS_PER_PAGE) || 1;
    page = Math.max(1, Math.min(page, totalPages));

    const start = (page - 1) * LISTDNS_PER_PAGE;
    const slice = rows.slice(start, start + LISTDNS_PER_PAGE);

    const keyboard = slice.map((r) => [{ text: r.title, callback_data: r.cb }]);

    const nav = [];
    if (page > 1) nav.push({ text: "⬅ Prev", callback_data: `listdns_page ${page - 1}` });
    nav.push({ text: `📄 ${page}/${totalPages}`, callback_data: "noop" });
    if (page < totalPages) nav.push({ text: "Next ➡", callback_data: `listdns_page ${page + 1}` });

    keyboard.push(nav);
    return { inline_keyboard: keyboard };
  }

  function buildDomainKeyboard(domains, host, ip, page = 1) {
    const totalPages = Math.ceil(domains.length / DOMAIN_PER_PAGE) || 1;
    page = Math.max(1, Math.min(page, totalPages));

    const start = (page - 1) * DOMAIN_PER_PAGE;
    const slice = domains.slice(start, start + DOMAIN_PER_PAGE);

    // callback_data: create_domain <domain> <host>|<ip>
    const rows = slice.map((d) => ([
      { text: `${host}.${d}`, callback_data: `create_domain ${d} ${host}|${ip}` }
    ]));

    const nav = [];
    if (page > 1) nav.push({ text: "⬅ Prev", callback_data: `subdom_page ${page - 1} ${host}|${ip}` });
    nav.push({ text: `📄 ${page}/${totalPages}`, callback_data: "noop" });
    if (page < totalPages) nav.push({ text: "Next ➡", callback_data: `subdom_page ${page + 1} ${host}|${ip}` });

    rows.push(nav);
    return { inline_keyboard: rows };
  }

  // tombol dummy
  bot.action("noop", (ctx) => ctx.answerCbQuery("✅"));

  // ===== Subdomain Config Loader =====
  // Kamu bisa taruh data subdomain di config.js:
  // module.exports = { subdomain: { "example.com": { zone: "...", apitoken: "..." } } }
  //
  // Kalau config kosong, fallback ke hardcode di bawah (sesuai file kamu).
  const FALLBACK_SUBDOMAIN = {
    "aditt-store.my.id": { zone: "7e91d270e6852dbcf3843d55f05f167f", apitoken: "5mrHAyGUu4PcabM5d0S0aWOr3ScNxf27jL09ki0f" },
    "agcloud.my.id": { zone: "09c637a74efd85e94e035eeae2aa3c31", apitoken: "Hi5A5xlLHR8q1glXHCAB1p-hOMf2Z1AVgLkFwwRn" },
    "bokepp.biz.id": { zone: "46b8cab5631c6c23c5ec4a7ef1f10803", apitoken: "A8df8PxnKIcxLUTE7XS4TRZBoLslvt4XjJb1XEyi" },
    "brannmarket.biz.id": { zone: "d8fcdee77abf68fc1fd39e8c8ff4fe3f", apitoken: "_d5Sm2sdygEcA8ycWT05bfKkTlJNy-vKcOBPjWdz" },
    "cafee.my.id": { zone: "0d7044fc3e0d66189724952fa3b850ce", apitoken: "wAOEzAfvb-L3vKYE2Xg8svJpHfNS_u2noWSReSzJ" },
    "celestialhost.my.id": { zone: "8ebca468945d4ce2ca5ca3c3e9cfae00", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "celestialnet.biz.id": { zone: "c926c4b135796bd3eba2e5fd27537cbf", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "centzzcloud.my.id": { zone: "749f1d7d69e9329195761b570010c00f", apitoken: "9Su8A1EDXnt9-yGDb7YSGlY_ogJAw2vR9IDtpFrQ" },
    "chizyy.my.id": { zone: "057cbf622eed270982769d5557dcee59", apitoken: "BUg6UBu_68M1fG21nD6QzZkkpa9_Zp3hP54LsxX3" },
    "cloud-hosting.my.id": { zone: "47510cfd81f2c9991c693224fac38ef0", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "cloudnet.biz.id": { zone: "a88065c5d2ee79fedff60df97e002d09", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "cloudspace.my.id": { zone: "c091d8d7d101c6b254d86458a705b85f", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "cupenpendiem.shop": { zone: "a70c572f7c8f8bc0ad5ac2552e42e516", apitoken: "VEtKD6sBAvgwQd1pYBV957Rno1feXoxqXPo1biij" },
    "digihost.biz.id": { zone: "0552c8910cc9dbbb2f4056c580504b7b", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "digital-market.web.id": { zone: "652c4800932a51249d42099dcfd55d0d", apitoken: "wUQ8mx8_thiR0lq_sZ0bhyEjdo-UIs9iZojgTi7g" },
    "ekiofficial.my.id": { zone: "df33365b44b11cbe51570a7ed981cae5", apitoken: "rMJGbyeuwFVZJifsB3rIX-nRpIOOa4Wkrhu7V5Jo" },
    "ekiofficial.web.id": { zone: "e1b037c00268cae95076b58f7f78b1f6", apitoken: "EJO7mHrBORH9XoQrnUvBqotMYxNm5bjB5UO2PeQE" },
    "eki-panelpvrt.my.id": { zone: "6b4cb792b77b6118e91d8604253ca572", apitoken: "DsftwwFCAKrbSo-9r9hxqcscMw8Xvx8gQzTXMSz4" },
    "gacorr.biz.id": { zone: "cff22ce1965394f1992c8dba4c3db539", apitoken: "v9kYfj5g2lcacvBaJHA_HRgNqBi9UlsVy0cm_EhT" },
    "googlehost.biz.id": { zone: "aab7652200b19a2d3309f4fc09b60d09", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "googlex.my.id": { zone: "dda9e25dac2556c7494470ee6152fc7f", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "heavencraft.my.id": { zone: "9e7239dcda7cbd6be79d7615257f56f8", apitoken: "aHvYYKk7YIADVOfpG3i1eaIqTeWCdPS25FAPreDQ" },
    "hilman-store.web.id": { zone: "4e214dfe36faa7c942bc68b5aecdd1e9", apitoken: "wpQCANKLRAtWb0XvTRed3vwSkOMMWKO2C75uwnKE" },
    "hilmanofficial.tech": { zone: "c8705bfbfdca9c4e8e61eb2663ee87d6", apitoken: "hjqWa_eFAfoJNJyBu9WAlg8WO0ICtN5AYpZURgqe" },
    "hilmanzoffc.web.id": { zone: "2627badfda28951bfb936fce0febc5b0", apitoken: "wZ3QAKn7zDx-tyb04HgCvmogqeM6je8jDNmiPZXq" },
    "host-panel.web.id": { zone: "74b3192f7c3b0925cdb8606bb7db95c4", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "hostingers-vvip.my.id": { zone: "2341ae01634b852230b7521af26c261f", apitoken: "Ztw1ouD8_lJf-QzRecgmijjsDJODFU4b-y697lPw" },
    "hostingnusantara.my.id": { zone: "156715abae5f34849a0f936753c986c8", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "hostpanel.biz.id": { zone: "76acbc398ab09c2bc0b179a7fa9ef488", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "hostsatoruu.biz.id": { zone: "30ea1aac05ca26dda61540e172f52ff4", apitoken: "eZp1wNcc0Mj-btUQQ1cDIek2NZ6u1YW1Bxc2SB3z" },
    "hypertech.my.id": { zone: "49cb6f9b5bba0de92b82ea96bbaccb29", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "indopanel.my.id": { zone: "efa9ae7dc01901c96f669e7d3d4961ec", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "jstpiwz.my.id": { zone: "f1901becfbd79f39048f7698de71d53b", apitoken: "g8_D70UKwk0hBeuPqdXgWmZcoNjwXMkfd3OEUL4k" },
    "jokowii.my.id": { zone: "67a887a21f43fea088a47902a436c400", apitoken: "FwLKNhNL5LhI_LhAzH7pD-v6BrIcQ5dsdKRtaytS" },
    "kenz-host.my.id": { zone: "df24766ae8eeb04b330b71b5facde5f4", apitoken: "fyaxLxD0jNONtMWK3AmnaiLkkWi5Wg3Y9h8nqJh6" },
    "lexcz.me": { zone: "7a4e7ca1131daf5a4c7ef03191432a6a", apitoken: "DTxnQFaoI9p2YtZUL7PLikauBvXcL_CWzpBbQx2b" },
    "lexczalok.xyz": { zone: "dd510b41fc4d7074c5be6f47f9f5b722", apitoken: "IsRLdOOP7OVrB95PUWaW_eq1n5T2T8OUcnwGhP_q" },
    "mafiapnel.my.id": { zone: "34e28e0546feabb87c023f456ef033bf", apitoken: "bHNaEBwaVSdNklVFzPSkSegxOd9OtKzWtY7P9Zwt" },
    "markethosting.web.id": { zone: "605164b2473c56bc63ab93f729ad60b3", apitoken: "cNx00jgbyhIQXbDUQ3iptLPmjgxRmz2P4jJ4q0nx" },
    "market-store.my.id": { zone: "4ae70eaa56096fdb94ef9050dde52220", apitoken: "_T1fxXQLd6864mYGwgHmciZMiLURKNkyomaPv0sy" },
    "marketrikishop.my.id": { zone: "33970794e3373167a9c9556ad19fdb6a", apitoken: "TWf7dzMAu1dOc0XNuE98auJiSryxkUkQBbJpkwgr" },
    "metabot.biz.id": { zone: "d326a4d2754a82ccfbacd7a7d32115c4", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "mypanel.web.id": { zone: "b8233801ad0b684d315c19b4b3963463", apitoken: "Jxwpvdw2IkwtuS-Dv97c0DQFZOQcrvDaM31HtiiU" },
    "nextgenhost.my.id": { zone: "2844e71ed4f3da615d190b5a0a3628c6", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "nusantarahost.biz.id": { zone: "11739916a6aed214d45c679317fbb574", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "nusantarahost.my.id": { zone: "2389dab552f48c793e188ab8cc6d15e9", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "nusantarahost.web.id": { zone: "83398bb8adb915deb77d4fb6e7595fb4", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "pakvinsen.me": { zone: "3b8cb89265c0e026abaf3bc50ed57e76", apitoken: "ttt0IHK50UKP2HltWUauuyDzkVPqnOEkx7M-5CFs" },
    "panel-pvrt.my.id": { zone: "ee4060e03b223e8e0724908575b70c3b", apitoken: "6HxTQ0VJZVcAJISlKsezttCNzpAAf7ubPy5EDOGR" },
    "paneldo.biz.id": { zone: "21540fba8e682ddc1b73ad5603aaeccb", apitoken: "lkgTTdCe7LQvmU4eYuoseuR0qyFugLB8QHCz5gFn" },
    "panelhost.my.id": { zone: "380d161fa020353cd874bdd6b2d4318b", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "panelkishop.web.id": { zone: "8f4812b3c78ca478b5d162b6cb35d1b3", apitoken: "3Y0cW3cVVIhyeWHytqFEbGDrdWaAC-k8twOEeFP2" },
    "panelku-ptero.my.id": { zone: "ea719beeec3cfe39b58f0195f848498f", apitoken: "Gb8j0xFasrWB1k80b4BFrIL_f2IgAQ5n66CamFbP" },
    "panelku-vip.my.id": { zone: "0d9911cf588f189a626249a082af24be", apitoken: "jsli552xYmcVeVyX2-ulWeepLK_-XCqiar0PxO7l" },
    "panelprivate.biz.id": { zone: "a6ac45aec9d526564078cde7a449780d", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "panelpro.fun": { zone: "a5c4697e86cf1cda49c0f81a699a690e", apitoken: "k-ZxmwqjyZf7iu4zNSJDTIx2tH6JZ--JQgfZReM9" },
    "panelpublic.biz.id": { zone: "92ed47fdfb94db589708b8057d44087f", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "panelstore-vvip.biz.id": { zone: "a99445e7459f95735af8e44f43b03834", apitoken: "pOKX689oVlJCQBq1awwHkok-o3cKyOEk6vq8AGoe" },
    "panelvip.biz.id": { zone: "70969a584446a244efe1461f5bb41ff5", apitoken: "pzj2mcvQL1KUQCjj5XjSVPjLqKGCy8U7PtVFuOXr" },
    "panelzone.my.id": { zone: "e7d8d6265266607e97e798db02bef310", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "prabowoo.my.id": { zone: "af679c959583e9eff1685ef4c7cbf048", apitoken: "gGQeMyeo8jM5xNGMsfChkwrawZ3UiX3QUnBnvwTe" },
    "privatehost.biz.id": { zone: "6ffb0b15b396774ebc8f4342351fdc83", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "privatesrvr.xyz": { zone: "b488e5d4635431243cab94d5fec4a3d2", apitoken: "Wv6SqCo8772I6WG-EGnD4w272sJsYVSXd-LpPc7C" },
    "publicserver.my.id": { zone: "b1b16801d28009e899a843b0c8faee34", apitoken: "y_0WKCNCnOgx0sgbcQr-puVTXyTQPN9KErR9vlzN" },
    "pterodactyl-io.web.id": { zone: "40e7e47e12e091756d491cb0e8500a5d", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "pterodactyl-panel.web.id": { zone: "d69feb7345d9e4dd5cfd7cce29e7d5b0", apitoken: "32zZwadzwc7qB4mzuDBJkk1xFyoQ2Grr27mAfJcB" },
    "pterodaytl.my.id": { zone: "828ef14600aaaa0b1ea881dd0e7972b2", apitoken: "75HrVBzSVObD611RkuNS1ZKsL5A_b8kuiCs26-f9" },
    "ptero-panellku.web.id": { zone: "429c740cae756ab9958481108e851092", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "rapziexdserverbotwa.web.id": { zone: "490a3eaced4eb712ae90d50e5d581cc7", apitoken: "79rgceVB_twEtUEwYMpa9ECuY4hX36tZn9l3ME9P" },
    "rexxa.my.id": { zone: "b0d37cb6e9d6a7c2b0a82395cbdfd8b9", apitoken: "fR2LO4Hz2y0U8dP3IHRwMHnWi_xKKa5RCZjWaXv3" },
    "rexxaoffc.my.id": { zone: "f972ed410a833b28c8b5f166d6620d6a", apitoken: "liq8sBPHwvbU2jWQYTCjo4BXafVPeopkAU4avUlP" },
    "rikionline.shop": { zone: "082ec80d7367d6d4f7c52600034ac635", apitoken: "r3XUyNYtxNQYwZtGUIAChRqe0uTzwV4eVO7JpJ_l" },
    "roompanelpriv.my.id": { zone: "73f4d0171fe1f48db80aed6323e9330d", apitoken: "2c29LWyyTHGXNtccxA62QWCGmxRcLoGcB9Y35jrH" },
    "sanoofficial.my.id": { zone: "86baa73720986cb2197874ea944d0dd4", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "sanoofficial.web.id": { zone: "ff6deb4d464da2c98495a1d296c32f2c", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "sanoofc.web.id": { zone: "3b73e863885615fd2c868e04da4ceee6", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "sanoku.my.id": { zone: "bfc41b55bed6504cdf0c82e582e28e09", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "sanoku.web.id": { zone: "b87085523ab13773d2dc25f13ec53eb2", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "satoruuhost.tech": { zone: "086b2b4e1c65c22bfd8d5d86cbfa947f", apitoken: "62XZSKEzz4mKM_1wAHK7-_JaA14VrQJDoWI2GeHT" },
    "servemcpec.my.id": { zone: "bb0b767035e14c69cecfdd3eb757b322", apitoken: "S9-2ht3ZxW0B8JjkTI720WaM743nvJKwXfMw3pXI" },
    "serverpanell.biz.id": { zone: "225512a558115605508656b7bdf29b28", apitoken: "XasxSSnGp8M9QixvT6AAlh1vEm4icVgzDyz7KDiF" },
    "sevsbotz.xyz": { zone: "594ebd64574548c2cdda04f500059bf3", apitoken: "IDjXUZTsJejkc4hGIU3j-_7h7_i531MxOlb3drVf" },
    "shop-panel.biz.id": { zone: "62e0683ee057e0e2a39eaf73d18e6eb1", apitoken: "opUN9xsI7mlS3CP8cJA9RbO5SB4gUpcyof9Yaeb7" },
    "storedigital.web.id": { zone: "2ce8a2f880534806e2f463e3eec68d31", apitoken: "v5_unJTqruXV_x-5uj0dT5_Q4QAPThJbXzC2MmOQ" },
    "storeid.my.id": { zone: "c651c828a01962eb3c530513c7ad7dcf", apitoken: "N-D6fN6la7jY0AnvbWn9FcU6ZHuDitmFXd-JF04g" },
    "store-panell.my.id": { zone: "0189ecfadb9cf2c4a311c0a3ec8f0d5c", apitoken: "eVI-BXIXNEQtBqLpdvuitAR5nXC2bLj6jw365JPZ" },
    "tamaoffc.biz.id": { zone: "177538af7fb12443a80892554d01206f", apitoken: "ZaVSjxa96NQDV6lQgspAVsVXrvVzdOpqL1z6PG0Z" },
    "tokopanelkishop.biz.id": { zone: "d87d4f320d9902f31fbbcc5ee23fafe8", apitoken: "D00akOLxF3qzBzpYBp5SbpaLTmwYeybNsyAcDfiB" },
    "vipstoree.my.id": { zone: "72fd03404485ddba1c753fc0bf47f0b3", apitoken: "J2_c07ypFEaen92RMS7irszQSrgZ_VFMfgNgzmp0" },
    "wannhosting.biz.id": { zone: "4e6fe33fb08c27d97389cad0246bfd9b", apitoken: "75HrVBzSVObD611RkuNS1ZKsL5A_b8kuiCs26-f9" },
    "wannhosting.my.id": { zone: "0b36d11edd793b3f702e0591f0424339", apitoken: "OsSjhDZLdHImYTX8fdeiP1wocKwVnoPw5EiI85IF" },
    "webpanelku.my.id": { zone: "b41c3bb25273c4059b542c381250c9f9", apitoken: "GuT5rNQSr_V2kxb-QZdJ4YbFlEvzE-upzhey9Ezl" },
    "xnxxx.tech": { zone: "639f9cde20c22b1d2f33b2fee54f8f59", apitoken: "MtWI3a9-9Za-fGKmwl0uNznqM94eljKgobkF36h1" },
    "xyro.me": { zone: "a1c08ecd2f96516f2a85250b98850e8b", apitoken: "f3IBOeIjRHYSsRhzxBO7yiwl-Twn3fqjmdkLdwlf" },
    "xyro.web.id": { zone: "46d0cd33a7966f0be5afdab04b63e695", apitoken: "CygwSHXRSfZnsi1qZmyB8s4qHC12jX_RR4mTpm62" },
    "xyroku.my.id": { zone: "f6d1a73a272e6e770a232c39979d5139", apitoken: "0Mae_Rtx1ixGYenzFcNG9bbPd-rWjoRwqN2tvNzo" },
    "xpanelprivate.my.id": { zone: "f6bd04c23d4de3ec6d60d8eeabe1ff40", apitoken: "su_zz3Amd5WkrOv95OA6uQb1Y6ky6qVtjkhQnPCi" },
    "zainhosting.my.id": { zone: "c3eeb2afb2e4073fe4c55ad7145395e9", apitoken: "RNlg5vrTwt73uAPTYAad_nJzBmDhhjbUZKiWFORZ" },
    "zhirastoreid.me": { zone: "fc6c7f786d01a0c7558a313549134a06", apitoken: "STOIGXwGftk-OjdgCbqpCDaBWCYUpo5RgvmJ-rXe" },
    "zyydev.my.id": { zone: "337aaf9a6689c7a7145480ef3ccaffdb", apitoken: "jnNO465SjNC-Ss6CDM2WDIy7jwzbKWHJuOXA5xak" }
  };

  function loadSubdomainConfig() {
    // urutan prioritas: config.subdomain -> config.global.subdomain -> global.subdomain -> fallback
    const fromConfig =
      (config && (config.subdomain || config?.global?.subdomain)) ||
      null;

    const cfg = fromConfig || global.subdomain || FALLBACK_SUBDOMAIN;

    // pastikan global.subdomain ada dan bentuknya object
    if (!global.subdomain || typeof global.subdomain !== "object") {
      global.subdomain = cfg;
    } else if (fromConfig) {
      // kalau dari config ada, override global.subdomain
      global.subdomain = cfg;
    }
    return global.subdomain;
  }

  // load sekali saat plugin di-require
  loadSubdomainConfig();

  // Cache buat inline keyboard listdns dan pilihan record (biar gak register handler berkali-kali)
  const listdnsCache = new Map();   // key: chatId -> rows[]
  const dnsSelectCache = new Map(); // key: chatId:domain:page -> inline_keyboard

  // ===== Cloudflare API wrappers =====
  async function cfCreateARecord({ zone, apitoken, name, ip }) {
    const res = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`,
      {
        type: "A",
        name,
        content: ip,
        ttl: 3600,
        priority: 10,
        proxied: false,
      },
      {
        headers: {
          Authorization: `Bearer ${apitoken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.data?.success) return { success: true, result: res.data.result };
    return {
      success: false,
      error: res.data?.errors?.[0]?.message || "Gagal membuat subdomain",
    };
  }

  async function cfListRecords({ zone, apitoken, page = 1, perPage = 100 }) {
    const res = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`,
      {
        headers: {
          Authorization: `Bearer ${apitoken}`,
          "Content-Type": "application/json",
        },
        params: { page, per_page: perPage },
      }
    );

    if (res.data?.success) {
      return {
        success: true,
        records: res.data.result || [],
        totalCount: res.data.result_info?.total_count || 0,
        totalPages: res.data.result_info?.total_pages || 1,
      };
    }

    return {
      success: false,
      error: res.data?.errors?.[0]?.message || "Gagal mengambil DNS records.",
    };
  }

  async function cfDeleteRecord({ zone, apitoken, recordId }) {
    const res = await axios.delete(
      `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${recordId}`,
      {
        headers: {
          Authorization: `Bearer ${apitoken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.data?.success) return { success: true };
    return {
      success: false,
      error: res.data?.errors?.[0]?.message || "Gagal menghapus DNS record.",
    };
  }

  function formatDateWithDay(dateString) {
    const date = new Date(dateString);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const day = days[date.getDay()];
    const datePart = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `${day}, ${datePart} Pukul ${timePart}`;
  }

  // ===== /subdomain host|ip =====
  bot.command("subdomain", async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const input = ctx.message.text.split(" ").slice(1).join(" ");
    if (!input || !input.includes("|")) {
      return ctx.reply("Contoh:\n`/subdomain host|ip`", { parse_mode: "Markdown" });
    }

    const [hostRaw, ipRaw] = input.split("|").map((x) => x.trim());
    const host = sanitizeHost(hostRaw);
    const ip = sanitizeIP(ipRaw);

    if (!host) return ctx.reply("⚠️ Host kosong / tidak valid.");
    if (!ip) return ctx.reply("⚠️ IP kosong / tidak valid.");

    const subCfg = loadSubdomainConfig();
    const dom = Object.keys(subCfg || {}).sort();
    if (!dom.length) return ctx.reply("❌ Tidak ada domain yang tersedia.");

    const kb = buildDomainKeyboard(dom, host, ip, 1);

    const info =
      `🔹 *Pilih domain yang tersedia:*\n` +
      `• Host: \`${host}\`\n` +
      `• IP: \`${ip}\`\n` +
      `• Total domain: *${dom.length}*`;

    return ctx.reply(info, { parse_mode: "Markdown", reply_markup: kb });
  });

  // paging domain keyboard
  bot.action(/^subdom_page\s+(\d+)\s+(.+)$/i, async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) return ctx.answerCbQuery("Khusus owner/premium.");

    const page = parseInt(ctx.match?.[1] || "1", 10) || 1;
    const hostIp = String(ctx.match?.[2] || "");

    if (!hostIp.includes("|")) return ctx.answerCbQuery("Data invalid.");

    const [hostRaw, ipRaw] = hostIp.split("|");
    const host = sanitizeHost(hostRaw);
    const ip = sanitizeIP(ipRaw);

    const subCfg = loadSubdomainConfig();
    const dom = Object.keys(subCfg || {}).sort();
    const kb = buildDomainKeyboard(dom, host, ip, page);

    await ctx.answerCbQuery();
    return safeEditMarkup(ctx, kb);
  });

  // ===== Callback: create_domain <domain> <host|ip> =====
  bot.action(/^create_domain\s+(\S+)\s+(.+)$/i, async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const domain = String(ctx.match?.[1] || "").trim();
    const hostIp = String(ctx.match?.[2] || "").trim();

    if (!domain || !hostIp.includes("|")) return ctx.answerCbQuery("⚠️ Data tidak valid.");

    const [hostRaw, ipRaw] = hostIp.split("|");
    const host = sanitizeHost(hostRaw);
    const ip = sanitizeIP(ipRaw);

    const subCfg = loadSubdomainConfig();
    const domainCfg = subCfg?.[domain];
    const fullSub = `${host}.${domain}`;

    if (!domainCfg) return ctx.answerCbQuery("❌ Domain tidak tersedia!");
    if (!host || !ip) return ctx.answerCbQuery("⚠️ Host/IP tidak valid.");

    await ctx.answerCbQuery("Membuat...");
    await ctx.reply(`🔧 Membuat subdomain *${fullSub}*...`, { parse_mode: "Markdown" });

    try {
      const res = await cfCreateARecord({
        zone: domainCfg.zone,
        apitoken: domainCfg.apitoken,
        name: fullSub,
        ip,
      });

      if (res.success) {
        const result = res.result || {};
        return ctx.reply(
          `✅ *Subdomain berhasil dibuat:*\n\n🌐 *Subdomain:* ${result.name || fullSub}\n📌 *IP:* ${result.content || ip}`,
          { parse_mode: "Markdown" }
        );
      }

      return ctx.reply(`❌ Gagal membuat subdomain:\n${res.error}`);
    } catch (e) {
      const msg = e?.response?.data?.errors?.[0]?.message || e.message || "Terjadi kesalahan";
      return ctx.reply(`❌ Gagal membuat subdomain:\n${msg}`);
    }
  });

  // ===== /createdomain <index> host|ip =====
  bot.command("createdomain", async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const input = ctx.message.text.split(" ").slice(1);
    if (!input[0] || isNaN(input[0])) return ctx.reply("⚠️ Domain tidak ditemukan!");

    const subCfg = loadSubdomainConfig();
    const dom = Object.keys(subCfg || {}).sort();
    const domainIndex = Number(input[0]) - 1;

    if (domainIndex < 0 || domainIndex >= dom.length) {
      return ctx.reply("⚠️ Index domain tidak valid!");
    }

    if (!input[1] || !input[1].includes("|")) {
      return ctx.reply("⚠️ Format salah!\n\nContoh:\n/createdomain 1 host|1.2.3.4");
    }

    const tldnya = dom[domainIndex];
    const [hostRaw, ipRaw] = input[1].split("|").map((x) => x.trim());
    const host = sanitizeHost(hostRaw);
    const ip = sanitizeIP(ipRaw);

    if (!host || !ip) return ctx.reply("⚠️ Host/IP tidak valid.");

    const cfg = subCfg[tldnya];

    try {
      const res = await cfCreateARecord({
        zone: cfg.zone,
        apitoken: cfg.apitoken,
        name: `${host}.${tldnya}`,
        ip,
      });

      if (res.success) {
        return ctx.reply(
          `✅ *Berhasil membuat subdomain*\n\n🌐 *Subdomain:* ${res.result?.name || `${host}.${tldnya}`}\n📌 *IP Server:* ${res.result?.content || ip}`,
          { parse_mode: "Markdown" }
        );
      }

      return ctx.reply(`❌ Gagal membuat subdomain:\n${res.error}`);
    } catch (e) {
      const msg = e?.response?.data?.errors?.[0]?.message || e.message || "Terjadi kesalahan";
      return ctx.reply(`❌ Gagal membuat subdomain:\n${msg}`);
    }
  });

  // ===== /delsubdo full.domain.tld =====
  bot.command("delsubdo", async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const args = ctx.message.text.split(" ").slice(1);
    const cmd = "/" + ctx.message.text.split(" ")[0].substring(1);

    if (!args[0]) {
      return ctx.reply(
        `Contoh:\n*${cmd}* panel.example.com\n\n> Note: Hanya bisa menghapus subdomain yang domainnya ada pada subdomain`,
        { parse_mode: "Markdown" }
      );
    }

    const recordName = String(args[0]).toLowerCase();
    const subCfg = loadSubdomainConfig();
    const dom = Object.keys(subCfg || {}).sort();
    if (!dom.length) return ctx.reply("❌ Tidak ada domain yang tersedia.");

    // Cari record di semua zone sampai ketemu (simple scan)
    for (const tld of dom) {
      const zoneCfg = subCfg[tld];
      if (!zoneCfg?.zone || !zoneCfg?.apitoken) continue;

      const listRes = await cfListRecords({
        zone: zoneCfg.zone,
        apitoken: zoneCfg.apitoken,
        page: 1,
        perPage: 200,
      });

      if (!listRes.success) continue;

      const found = (listRes.records || []).find(
        (r) => String(r.name || "").toLowerCase() === recordName
      );

      if (!found) continue;

      const delRes = await cfDeleteRecord({
        zone: zoneCfg.zone,
        apitoken: zoneCfg.apitoken,
        recordId: found.id,
      });

      if (delRes.success) {
        return ctx.reply(
          `✅ *Berhasil menghapus DNS record*\n\n📌 *Type:* ${found.type}\n🌐 *Name:* ${found.name}\n🔗 *Alamat IP:* ${found.content}`,
          { parse_mode: "Markdown" }
        );
      }

      return ctx.reply(`❌ Gagal menghapus DNS record: ${delRes.error}`);
    }

    return ctx.reply(`⚠️ DNS record dengan nama *${recordName}* tidak ditemukan.`, {
      parse_mode: "Markdown",
    });
  });

  // ===== /delallsubdo domain.tld =====
  bot.command("delallsubdo", async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const args = ctx.message.text.split(" ").slice(1);
    if (!args[0]) return ctx.reply("⚠️ Contoh: /delallsubdo example.com");

    const domainInput = String(args[0]).toLowerCase();
    const subCfg = loadSubdomainConfig();

    const tldnya = Object.keys(subCfg || {}).find((k) => k.toLowerCase() === domainInput);
    if (!tldnya) {
      return ctx.reply(`Domain *${domainInput}* tidak ditemukan!`, { parse_mode: "Markdown" });
    }

    const zoneCfg = subCfg[tldnya];

    // Ambil semua record (paging sederhana)
    let all = [];
    let page = 1;
    while (true) {
      const pageRes = await cfListRecords({
        zone: zoneCfg.zone,
        apitoken: zoneCfg.apitoken,
        page,
        perPage: 500,
      });

      if (!pageRes.success) {
        return ctx.reply(
          `Gagal mengambil daftar DNS records untuk domain *${domainInput}*.\n${pageRes.error}`,
          { parse_mode: "Markdown" }
        );
      }

      all.push(...(pageRes.records || []));
      if (page >= pageRes.totalPages) break;
      page++;
      await sleep(250);
    }

    if (!all.length) {
      return ctx.reply(`Tidak ada DNS records untuk domain *${domainInput}*.`, { parse_mode: "Markdown" });
    }

    let successCount = 0;
    let failCount = 0;
    const failDetails = [];

    await ctx.reply(
      `⏳ Sedang menghapus *${all.length}* DNS records dari domain *${domainInput}*...\n\nHarap tunggu.`,
      { parse_mode: "Markdown" }
    );

    for (const record of all) {
      const delRes = await cfDeleteRecord({
        zone: zoneCfg.zone,
        apitoken: zoneCfg.apitoken,
        recordId: record.id,
      });

      if (delRes.success) successCount++;
      else {
        failCount++;
        failDetails.push({ name: record.name, error: delRes.error });
      }

      await sleep(350);
    }

    let teks = `*Hasil Penghapusan DNS Records*\n\n`;
    teks += `*Domain:* ${domainInput}\n`;
    teks += `*Berhasil Dihapus:* ${successCount}\n`;
    teks += `*Gagal Dihapus:* ${failCount}\n`;

    if (failCount > 0) {
      teks += `\n*Detail Kegagalan:*\n`;
      failDetails.forEach((f, idx) => {
        teks += `${idx + 1}. *Name:* ${f.name}\n   *Error:* ${f.error}\n`;
      });
    }

    return ctx.reply(teks, { parse_mode: "Markdown" });
  });

  // ===== /listdns =====
  bot.command("listdns", async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const subCfg = loadSubdomainConfig();
    const dom = Object.keys(subCfg || {}).sort();
    if (!dom.length) return ctx.reply("❌ Tidak ada domain yang tersedia saat ini.");

    const rows = dom.map((d) => ({
      title: `Lihat List DNS Record ${d}`,
      cb: `res_list_dns_record ${d} 1`,
    }));

    listdnsCache.set(String(ctx.chat.id), rows);

    return ctx.reply("Pilih Domain Yang Ingin Dilihat List DNS Recordnya", {
      reply_markup: {
        inline_keyboard: [[{ text: "Pilih Domain", callback_data: "pilih_domain_listdns" }]],
      },
    });
  });

  // Action: pilih domain untuk /listdns
  bot.action("pilih_domain_listdns", async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const rows = listdnsCache.get(String(ctx.chat.id)) || [];
    if (!rows.length) {
      return ctx.editMessageText("⚠️ List domain belum ada. Jalankan /listdns dulu.");
    }

    const kb = buildListdnsKeyboard(rows, 1);

    return ctx.editMessageText(
      "𝗣𝗜𝗟𝗜𝗛 𝗗𝗢𝗠𝗔𝗜𝗡\n# Silahkan Pilih Salah Satu Domain Di Bawah",
      { reply_markup: kb }
    );
  });

  bot.action(/^listdns_page\s+(\d+)$/i, async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) return ctx.answerCbQuery("Khusus owner.");

    const page = parseInt(ctx.match?.[1] || "1", 10) || 1;

    const rows = listdnsCache.get(String(ctx.chat.id)) || [];
    if (!rows.length) return ctx.answerCbQuery("Data kosong.");

    const kb = buildListdnsKeyboard(rows, page);

    await ctx.answerCbQuery();
    return safeEditMarkup(ctx, kb);
  });

  // ===== /res_list_dns_record domain [page] =====
  bot.command("res_list_dns_record", async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const args = ctx.message.text.split(" ").slice(1);
    if (!args[0]) return;

    const domain = String(args[0]).toLowerCase();
    const page = args[1] ? parseInt(args[1], 10) : 1;

    return sendDNSList(ctx, domain, page, false);
  });

  // Callback: res_list_dns_record <domain> <page>
  bot.action(/^res_list_dns_record\s+(\S+)\s+(\d+)$/i, async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const domain = String(ctx.match?.[1] || "").toLowerCase();
    const page = parseInt(ctx.match?.[2] || "1", 10) || 1;

    return sendDNSList(ctx, domain, page, true);
  });

  async function sendDNSList(ctx, domain, page, isEdit) {
    const perPage = 25;
    const subCfg = loadSubdomainConfig();

    if (!subCfg?.[domain]) {
      const msg = `❌ Subdomain *${domain}* tidak ditemukan!`;
      return isEdit ? ctx.editMessageText(msg, { parse_mode: "Markdown" }) : ctx.reply(msg, { parse_mode: "Markdown" });
    }

    const zoneCfg = subCfg[domain];

    const dnsRecords = await cfListRecords({
      zone: zoneCfg.zone,
      apitoken: zoneCfg.apitoken,
      page,
      perPage,
    });

    if (!dnsRecords.success) {
      const msg = `❌ ${dnsRecords.error}`;
      return isEdit ? ctx.editMessageText(msg) : ctx.reply(msg);
    }

    if ((dnsRecords.records || []).length === 0) {
      const msg = `⚠ Tidak ada DNS records untuk domain *${domain}*.`;
      return isEdit ? ctx.editMessageText(msg, { parse_mode: "Markdown" }) : ctx.reply(msg, { parse_mode: "Markdown" });
    }

    let teks = `📌 *Daftar DNS Records untuk domain:* *${domain}*\n`;
    teks += `━━━━━━━━━━━━━━━━━━━━━━\n`;

    const list = [];
    dnsRecords.records.forEach((record, index) => {
      teks += `🔹 *${index + 1 + (page - 1) * perPage}.*\n`;
      teks += `   ➜ *Nama:* ${record.name}\n`;
      teks += `   ➜ *Tipe:* ${record.type}\n`;
      teks += `   ➜ *Tujuan:* ${record.content}\n`;
      teks += `   ➜ *Proxy:* ${record.proxied ? "✔ Diaktifkan" : "❌ Tidak aktif"}\n`;
      teks += `   ➜ *Dibuat:* ${formatDateWithDay(record.created_on)}\n`;
      teks += `   ➜ *Diubah:* ${formatDateWithDay(record.modified_on)}\n`;
      teks += `━━━━━━━━━━━━━━━━━━━━━━\n`;

      list.push([{
        text: `🗑 ${record.name} (${record.type})`,
        callback_data: `delsubdo_inline_id ${domain} ${record.id}`,
      }]);
    });

    teks += `📌 *Halaman:* ${page}/${dnsRecords.totalPages}\n`;
    teks += `📌 *Total DNS Records:* ${dnsRecords.totalCount}\n`;

    dnsSelectCache.set(`${ctx.chat.id}:${domain}:${page}`, list);

    const keyboard = [
      [{ text: "🗑 Hapus Semua DNS Records", callback_data: `delallsubdo_inline ${domain}` }],
      [{ text: "🛠️ Pilih DNS Record", callback_data: `dns_select_list ${domain} ${page}` }],
    ];

    if (dnsRecords.totalPages > 1) {
      const nav = [];
      if (page > 1) nav.push({ text: `⬅️ Halaman ${page - 1}`, callback_data: `res_list_dns_record ${domain} ${page - 1}` });
      if (page < dnsRecords.totalPages) nav.push({ text: `➡️ Halaman ${page + 1}`, callback_data: `res_list_dns_record ${domain} ${page + 1}` });
      if (nav.length) keyboard.push(nav);
    }

    const payload = { parse_mode: "Markdown", reply_markup: { inline_keyboard: keyboard } };
    return isEdit ? ctx.editMessageText(teks, payload) : ctx.reply(teks, payload);
  }

  // hapus record via ID (langsung)
  bot.action(/^delsubdo_inline_id\s+(\S+)\s+(\S+)$/i, async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) return ctx.answerCbQuery("Khusus owner/premium.");

    const domain = String(ctx.match?.[1] || "").toLowerCase();
    const recordId = String(ctx.match?.[2] || "");

    const subCfg = loadSubdomainConfig();
    const zoneCfg = subCfg?.[domain];
    if (!zoneCfg) return ctx.answerCbQuery("Domain tidak ditemukan.");

    await ctx.answerCbQuery("Menghapus...");

    const delRes = await cfDeleteRecord({
      zone: zoneCfg.zone,
      apitoken: zoneCfg.apitoken,
      recordId,
    });

    if (delRes.success) {
      return ctx.reply(`✅ Berhasil hapus record ID: ${recordId}`);
    }
    return ctx.reply(`❌ Gagal hapus record:\n${delRes.error}`);
  });

  // Action: tampilkan list tombol hapus per-record
  bot.action(/^dns_select_list\s+(\S+)\s+(\d+)$/i, async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const domain = String(ctx.match?.[1] || "").toLowerCase();
    const page = parseInt(ctx.match?.[2] || "1", 10) || 1;

    const list = dnsSelectCache.get(`${ctx.chat.id}:${domain}:${page}`);
    if (!list) {
      return ctx.editMessageText("⚠️ Data list belum ada. Buka list record dulu ya.");
    }

    // tambah tombol back ke halaman list
    const keyboard = [...list, [{ text: "⬅️ Kembali", callback_data: `res_list_dns_record ${domain} ${page}` }]];

    return ctx.editMessageText("HAPUS DNS RECORD\n# Silahkan Pilih Record Yang Ingin Dihapus", {
      reply_markup: { inline_keyboard: keyboard },
    });
  });

  // Action: hapus 1 record dari tombol (kirim instruksi command biar simpel & anti-error)
  bot.action(/^delsubdo_inline\s+(.+)$/i, async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const recordName = String(ctx.match?.[1] || "").trim();
    if (!recordName) return ctx.reply("⚠️ Nama record kosong.");

    return ctx.reply(`Ketik command ini:\n/delsubdo ${recordName}`);
  });

  // Action: hapus semua record dari tombol
  bot.action(/^delallsubdo_inline\s+(\S+)$/i, async (ctx) => {
    const senderId = String(ctx.from.id);
    if (!isOwnerId(senderId)) {
      return ctx.reply("Perintah Hanya Untuk User Premium / Owner.", {
        reply_markup: { inline_keyboard: [[{ text: "Hubungi Developer", url: "https://t.me/Rizzxtzy" }]] },
      });
    }

    const domain = String(ctx.match?.[1] || "").toLowerCase();
    if (!domain) return ctx.reply("⚠️ Domain kosong.");

    return ctx.reply(`Ketik command ini:\n/delallsubdo ${domain}`);
  });
};
