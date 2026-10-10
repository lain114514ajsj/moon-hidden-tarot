/* 下载马赛塔罗牌（Lequart, BnF/Gallica, 公有领域）到 assets/tarot/ */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "assets", "tarot");
fs.mkdirSync(OUT, { recursive: true });

// 大阿卡纳：牌 id -> 维基共享资源文件名（注意马赛塔罗 VIII=正义、XI=力量）
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

// 小阿卡纳：花色与点数 -> 文件名编码
const SUIT_CODE = { wands: "B", cups: "C", swords: "S", pentacles: "P" };
const RANK_CODE = {
  ace: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  page: "J", knight: "H", queen: "Q", king: "K"
};

// 生成全部 78 张的映射
const mapping = {};
for (const [id, src] of Object.entries(MAJOR)) mapping[id] = src;
for (const [suit, sc] of Object.entries(SUIT_CODE)) {
  for (const [rank, rc] of Object.entries(RANK_CODE)) {
    mapping[rank + "-" + suit] = rc + sc + " Tarot.png";
  }
}

const API = "https://commons.wikimedia.org/w/api.php";

async function api(params, tries = 5) {
  const url = API + "?action=query&format=json&" + params;
  for (let i = 0; i < tries; i++) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 30000);
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "MoonveilTarot/1.0 (educational)" },
        signal: c.signal
      });
      const j = await r.json();
      clearTimeout(t);
      return j;
    } catch (e) {
      clearTimeout(t);
      if (i === tries - 1) throw e;
      await sleep(1500 * (i + 1));
    }
  }
}

async function download(url, dest, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 30000);
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "MoonveilTarot/1.0 (educational)" },
        signal: c.signal
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(dest, buf);
      clearTimeout(t);
      return buf.length;
    } catch (e) {
      clearTimeout(t);
      if (i === tries - 1) throw e;
      var msg = String(e.message);
      var wait = msg.indexOf("429") >= 0 ? 45000 : (msg.indexOf("fetch failed") >= 0 ? 10000 : 4000);
      await sleep(wait);
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // 1) 批量获取原始文件 URL
  const srcFiles = Object.values(mapping);
  const urlMap = {};
  for (let i = 0; i < srcFiles.length; i += 40) {
    const batch = srcFiles.slice(i, i + 40);
    const params = "titles=" + encodeURIComponent(batch.map((f) => "File:" + f).join("|")) +
      "&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=700";
    const j = await api(params);
    const pages = Object.values(j.query.pages);
    for (const p of pages) {
      const im = p.imageinfo && p.imageinfo[0];
      if (im) urlMap[p.title.replace("File:", "")] = im.thumburl || im.url;
    }
  }
  console.log("获取到 URL 数量:", Object.keys(urlMap).length);

  // 2) 逐张下载
  const manifest = [];
  const failed = [];
  let done = 0;
  const ids = Object.keys(mapping);
  for (const id of ids) {
    const src = mapping[id];
    const url = urlMap[src];
    if (!url) {
      failed.push({ id, src, reason: "no-url" });
      continue;
    }
    const dest = path.join(OUT, id + ".png");
    // 已存在且非空则跳过，避免重复下载
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      manifest.push({ id: id, file: "assets/tarot/" + id + ".png", source: src, bytes: fs.statSync(dest).size, skipped: true });
      done++;
      console.log("SKIP", id, "(已存在)");
      continue;
    }
    try {
      const bytes = await download(url, dest);
      manifest.push({ id, file: "assets/tarot/" + id + ".png", source: src, bytes });
      done++;
      console.log("OK", id, "(" + bytes + " bytes)");
    } catch (e) {
      failed.push({ id, src, reason: e.message });
      console.log("FAIL", id, e.message);
    }
    // 每张之间稍作停顿，避免触发限流
    await sleep(3000);
  }

  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify({
      deck: "Tarot de Marseille — Lequart (Paris), source Bibliothèque nationale de France (Gallica)",
      license: "Public domain",
      sourceUrl: "https://gallica.bnf.fr/ark:/12148/btv1b10539498w",
      commonsCategory: "Category:Tarot de Marseille (Single Cards)",
      downloaded: manifest,
      failed: failed
    }, null, 2)
  );

  console.log("\n下载完成:", done + "/" + ids.length);
  console.log("失败:", failed.length);
  if (failed.length) console.log(JSON.stringify(failed, null, 2));
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
