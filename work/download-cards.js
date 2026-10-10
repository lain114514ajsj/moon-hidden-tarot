/* =========================================================
   月隐 Tarot —— 马赛塔罗牌图片下载脚本（安全版）
   牌组：Lequart (Paris)，来源 Gallica / 法国国家图书馆（BnF）

   设计要点：
   - 使用「原图 URL」（清晰、统一）。经核对，iiurlwidth=700 返回的缩略图
     实际指向未缩放的原图，分辨率与体积都一样，故统一用原图。
   - 并发 = 1；任意两次请求之间至少间隔 7 秒（满足 5–10 秒要求）。
   - HTTP 429：优先遵循响应头 Retry-After；没有则等待 75 秒再重试；有次数上限。
   - 其它失败（网络超时 / 非 2xx）也有重试上限，不会无限循环。
   - 下载后校验 PNG 文件头；无效 / 残缺文件先移动到 _invalid-backup 备份，再重下。
   - 每处理一张立即写入 manifest.json，记录来源 URL、牌名、授权证据与状态。
   - 授权信息一律取维基共享资源的原始记录；取不到则标记为「待核实」，不默认 PD。
   - 断点续传：有效图片跳过，失败项下次运行继续。
   ========================================================= */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets", "tarot");
const MANIFEST = path.join(OUT, "manifest.json");
const BAD_DIR = path.join(OUT, "_invalid-backup");

fs.mkdirSync(OUT, { recursive: true });

/* ---------- 78 张牌 -> 维基共享资源文件名（命名与映射保持不变） ---------- */
// 注意：马赛塔罗中 VIII = 正义、XI = 力量，与常见编号相反
const MAJOR = {
  fool: "TT Tarot.png",
  magician: "T1 Tarot.png",
  "high-priestess": "T2 Tarot.png",
  empress: "T3 Tarot.png",
  emperor: "T4 Tarot.png",
  hierophant: "T5 Tarot.png",
  lovers: "T6 Tarot.png",
  chariot: "T7 Tarot.png",
  justice: "T8 Tarot.png",
  hermit: "T9 Tarot.png",
  wheel: "T10 Tarot.png",
  strength: "T11 Tarot.png",
  "hanged-man": "T12 Tarot.png",
  death: "T13 Tarot.png",
  temperance: "T14 Tarot.png",
  devil: "T15 Tarot.png",
  tower: "T16 Tarot.png",
  star: "T17 Tarot.png",
  moon: "T18 Tarot.png",
  sun: "T19 Tarot.png",
  judgement: "T20 Tarot.png",
  world: "T21 Tarot.png"
};

const SUIT_CODE = { wands: "B", cups: "C", swords: "S", pentacles: "P" };
const RANK_CODE = {
  ace: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  page: "J", knight: "H", queen: "Q", king: "K"
};

const mapping = {};
for (const [id, src] of Object.entries(MAJOR)) mapping[id] = src;
for (const [suit, sc] of Object.entries(SUIT_CODE)) {
  for (const [rank, rc] of Object.entries(RANK_CODE)) {
    mapping[rank + "-" + suit] = rc + sc + " Tarot.png";
  }
}
const TOTAL = Object.keys(mapping).length;

/* ---------- 从 js/data.js 读取牌名（只读，不改动 data.js） ---------- */
function loadCardNames() {
  const map = {};
  try {
    const src = fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8");
    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(src + "\n;globalThis.__cards = TAROT_CARDS;", ctx);
    (ctx.__cards || []).forEach(function (c) {
      map[c.id] = { name: c.name, en: c.en };
    });
  } catch (e) {
    console.log("提示：未能读取 data.js 的牌名（不影响下载），稍后仅记录 id。");
  }
  return map;
}
const CARD_NAMES = loadCardNames();

/* ---------- 配置 ---------- */
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "MoonveilTarot/1.0 (educational)";
const MIN_GAP_MS = 7000;            // 任意两次请求之间至少 7 秒
const RETRY_AFTER_FALLBACK = 75000; // 无 Retry-After 时等待 75 秒（60–90 秒区间）
const MAX_TRIES = 3;                // 单次请求的重试上限
const DECK = "Tarot de Marseille — Lequart (Paris)，来源 Bibliothèque nationale de France (Gallica)";
const SOURCE_PAGE = "https://gallica.bnf.fr/ark:/12148/btv1b10539498w";
const COMMONS_CAT = "Category:Tarot de Marseille (Single Cards)";

/* ---------- 命令行参数（用于小批量测试） ---------- */
const CLI = process.argv.slice(2);
function cliValue(name) {
  const hit = CLI.find(function (a) { return a.indexOf("--" + name + "=") === 0; });
  return hit ? hit.split("=")[1] : null;
}
const LIMIT = Number(cliValue("limit")) || 0; // --limit=N：只处理前 N 张
const ONLY_IDS = cliValue("ids");             // --ids=a,b,c：只处理指定牌

let lastRequest = 0;
function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// 全局节流：保证任意两次请求间隔 >= MIN_GAP_MS
async function throttle() {
  const wait = lastRequest + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
}

// PNG 文件头校验（前 8 字节魔数）
function isPng(file) {
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
    return buf[0] === 137 && buf[1] === 80 && buf[2] === 78 && buf[3] === 71 &&
      buf[4] === 13 && buf[5] === 10 && buf[6] === 26 && buf[7] === 10;
  } catch (e) {
    return false;
  }
}

// 把无效 / 残缺文件移动到备份目录（移动，不删除）
function backupBad(file) {
  try {
    fs.mkdirSync(BAD_DIR, { recursive: true });
    const dest = path.join(BAD_DIR, path.basename(file) + "." + Date.now() + ".bad");
    fs.renameSync(file, dest);
    return dest;
  } catch (e) {
    return null;
  }
}

// 带节流 + 429 处理 + 重试上限的请求
async function request(url, opts) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    await throttle();
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 30000);
    try {
      const r = await fetch(url, Object.assign(
        { headers: { "User-Agent": UA }, signal: ctrl.signal }, opts || {}));
      clearTimeout(timer);

      if (r.status === 429) {
        lastErr = new Error("HTTP 429");
        if (attempt < MAX_TRIES) {
          const ra = Number(r.headers.get("retry-after"));
          const wait = (ra && ra > 0) ? ra * 1000 : RETRY_AFTER_FALLBACK;
          console.log("    429 限流 → 等待 " + Math.round(wait / 1000) + " 秒后重试（第 " + attempt + " 次）");
          await sleep(wait);
          continue;
        }
        break;
      }
      if (!r.ok) {
        lastErr = new Error("HTTP " + r.status);
        if (attempt < MAX_TRIES) { await sleep(6000); continue; }
        break;
      }
      return r;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (attempt < MAX_TRIES) { await sleep(9000); continue; }
      break;
    }
  }
  throw lastErr || new Error("请求失败");
}

// 批量查询图片信息：原图 URL + 授权证据（extmetadata）
async function fetchImageInfo(files) {
  const info = {};
  for (let i = 0; i < files.length; i += 40) {
    const batch = files.slice(i, i + 40);
    const params = "action=query&format=json&prop=imageinfo&iiprop=url|size|mime|extmetadata&titles=" +
      encodeURIComponent(batch.map(function (f) { return "File:" + f; }).join("|"));
    const r = await request(API + "?" + params);
    const d = await r.json();
    const pages = (d.query && d.query.pages) || {};
    Object.values(pages).forEach(function (p) {
      const im = p.imageinfo && p.imageinfo[0];
      if (!im) return;
      const m = im.extmetadata || {};
      const clean = function (k) {
        return m[k] ? String(m[k].value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";
      };
      info[p.title.replace("File:", "")] = {
        url: im.url,                 // 原图 URL
        width: im.width,
        height: im.height,
        size: im.size,
        mime: im.mime,
        pageUrl: im.descriptionurl || ("https://commons.wikimedia.org/wiki/" + p.title.replace(/ /g, "_")),
        license: clean("LicenseShortName") || "待核实",
        licenseUrl: clean("LicenseUrl"),
        artist: clean("Artist") || "未知",
        credit: clean("Credit"),
        usageTerms: clean("UsageTerms")
      };
    });
    await sleep(MIN_GAP_MS);
  }
  return info;
}

// 载入旧 manifest（兼容旧的 downloaded/failed 结构，避免丢失已有记录）
function loadOld() {
  const map = {};
  if (!fs.existsSync(MANIFEST)) return map;
  try {
    const old = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    if (Array.isArray(old.cards)) old.cards.forEach(function (c) { map[c.id] = c; });
    if (Array.isArray(old.downloaded)) old.downloaded.forEach(function (c) {
      if (!map[c.id]) map[c.id] = { id: c.id, sourceFile: c.source, bytes: c.bytes, status: "ok" };
    });
    if (Array.isArray(old.failed)) old.failed.forEach(function (c) {
      if (!map[c.id]) map[c.id] = { id: c.id, sourceFile: c.src, status: "failed", reason: c.reason };
    });
  } catch (e) { /* 旧清单损坏则忽略 */ }
  return map;
}

async function main() {
  const old = loadOld();

  // 本次要处理的牌（支持 --ids=a,b,c 与 --limit=N，便于小批量测试）
  let ids = Object.keys(mapping);
  if (ONLY_IDS) {
    const want = ONLY_IDS.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    const unknown = want.filter(function (id) { return !mapping[id]; });
    if (unknown.length) console.log("忽略未知牌 id:", unknown.join(", "));
    ids = want.filter(function (id) { return mapping[id]; });
  }
  if (LIMIT > 0) ids = ids.slice(0, LIMIT);
  console.log("本次处理 " + ids.length + " 张: " + (ids.join(", ") || "（无）"));

  console.log("查询图片信息…");
  const info = await fetchImageInfo(ids.map(function (id) { return mapping[id]; }));
  console.log("已获取信息:", Object.keys(info).length, "张");

  // 合并旧记录，避免局部运行覆盖整份清单
  const cards = {};
  Object.keys(old).forEach(function (id) { if (mapping[id]) cards[id] = old[id]; });

  function writeManifest() {
    const list = Object.keys(mapping).map(function (id) { return cards[id]; }).filter(Boolean);
    const okN = list.filter(function (c) { return c.status === "ok"; }).length;
    const failN = list.filter(function (c) { return c.status === "failed"; }).length;
    fs.writeFileSync(MANIFEST, JSON.stringify({
      deck: DECK,
      sourcePage: SOURCE_PAGE,
      commonsCategory: COMMONS_CAT,
      note: "各张牌的授权以 Wikimedia Commons 页面记录的原始证据为准；无法确认者标记为『待核实』，未默认视为公有领域。",
      generatedAt: new Date().toISOString(),
      summary: { total: TOTAL, known: list.length, ok: okN, failed: failN, pending: TOTAL - list.length },
      cards: list
    }, null, 2));
  }

  let consecutive429 = 0;
  for (const id of ids) {
    const src = mapping[id];
    const dest = path.join(OUT, id + ".png");
    const meta = info[src] || {};
    const nm = CARD_NAMES[id] || {};
    const prev = old[id] || {};

    const entry = {
      id: id,
      name: nm.name || prev.name || "",
      en: nm.en || prev.en || "",
      file: "assets/tarot/" + id + ".png",
      sourceFile: src,
      sourceUrl: meta.url || prev.sourceUrl || "",
      pageUrl: meta.pageUrl || prev.pageUrl || "",
      width: meta.width || prev.width || null,
      height: meta.height || prev.height || null,
      license: meta.license || prev.license || "待核实",
      licenseUrl: meta.licenseUrl || prev.licenseUrl || "",
      artist: meta.artist || prev.artist || "未知",
      credit: meta.credit || prev.credit || "",
      status: "pending"
    };

    // 已存在 -> 校验是否有效
    if (fs.existsSync(dest)) {
      if (isPng(dest)) {
        entry.status = "ok";
        entry.bytes = fs.statSync(dest).size;
        entry.note = "已存在且校验有效，跳过下载";
        cards[id] = entry;
        writeManifest();
        console.log("SKIP", id);
        continue;
      } else {
        const b = backupBad(dest);
        console.log("WARN", id, "现有文件不是有效 PNG，已备份到", b);
      }
    }

    if (!meta.url) {
      entry.status = "failed";
      entry.reason = "未能获取图片 URL";
      cards[id] = entry;
      writeManifest();
      console.log("FAIL", id, "no-url");
      continue;
    }

    // 下载（request 内部已含 429 / 超时的有限重试）
    try {
      const r = await request(meta.url);
      const buf = Buffer.from(await r.arrayBuffer());
      const tmp = dest + ".part";
      fs.writeFileSync(tmp, buf);
      if (isPng(tmp)) {
        fs.renameSync(tmp, dest);
        entry.status = "ok";
        entry.bytes = buf.length;
        entry.note = "下载并校验成功";
        console.log("OK", id, "(" + buf.length + " bytes)");
        consecutive429 = 0;
      } else {
        backupBad(tmp);
        entry.status = "failed";
        entry.reason = "下载内容不是有效 PNG";
        console.log("FAIL", id, entry.reason);
      }
    } catch (e) {
      entry.status = "failed";
      entry.reason = e.message;
      console.log("FAIL", id, e.message);
      if (String(e.message).indexOf("429") >= 0) consecutive429++;
      else consecutive429 = 0;
    }

    cards[id] = entry;
    writeManifest();

    // 连续多次 429 → 暂停本轮，保留已完成结果，避免继续冲击限流
    if (consecutive429 >= 3) {
      console.log("\n连续 3 次遇到 429：暂停本次下载。已完成的图片和清单均已保存，可稍后重跑续传。");
      break;
    }
  }

  const okN = ids.filter(function (id) { return cards[id] && cards[id].status === "ok"; }).length;
  console.log("\n本次结束：有效 " + okN + " / " + TOTAL + "；待补 " + (TOTAL - okN));
  console.log("已更新清单: " + MANIFEST);
}

main().catch(function (e) {
  console.error("FATAL", e);
  process.exit(1);
});
