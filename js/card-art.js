/* =========================================================
   月隐 Tarot —— 塔罗牌面 SVG 插画系统
   说明：
   - 所有牌面使用 200 x 300（约 2:3）的 SVG 绘制。
   - 统一的复古外框 / 内框 / 角饰 / 顶部编号 / 底部铭牌。
   - 22 张大阿卡纳各自拥有独立的构图。
   - 56 张小阿卡纳按权杖、圣杯、宝剑、星币四个花色区分，
     并结合点数（1~10）与人物牌（侍从/骑士/王后/国王）设计。
   后续若要换成真实插画，只需替换 getCardArt() 返回的内容即可。
   ========================================================= */

/* ---------- 配色 ---------- */
var ART = {
  paper: "#E9E1D2",
  paperDeep: "#C9B99A",
  ink: "#292D2B",
  inkSoft: "#4F4E45",
  gold: "#B96F52",
  goldSoft: "#C98B72",
  wands: "#B96F52",
  cups: "#3E5A57",
  swords: "#4C5560",
  pentacles: "#4A574F"
};

/* 中文衬线字体（与网页保持一致） */
var ART_FONT = "'Noto Serif SC','Songti SC','STSong','SimSun',Georgia,serif";

/* ---------- 基础绘图辅助 ---------- */

// 五角星
function star(cx, cy, r, fill, stroke, sw) {
  var pts = [];
  for (var i = 0; i < 10; i++) {
    var ang = -Math.PI / 2 + i * Math.PI / 5;
    var rr = (i % 2 === 0) ? r : r * 0.45;
    pts.push((cx + rr * Math.cos(ang)).toFixed(1) + "," + (cy + rr * Math.sin(ang)).toFixed(1));
  }
  return '<polygon points="' + pts.join(" ") + '" fill="' + (fill || "none") +
    '" stroke="' + (stroke || ART.ink) + '" stroke-width="' + (sw || 1) + '"/>';
}

// 新月（用两个圆 + evenodd 挖出缺口，不依赖背景色）
function crescent(cx, cy, r, fill) {
  var off = r * 0.45;
  var bx = cx - off, by = cy - r * 0.12, cr = r * 0.78;
  function circ(x, y, rr) {
    return "M" + x + " " + (y - rr) + " A" + rr + " " + rr + " 0 1 0 " + x + " " + (y + rr) +
      " A" + rr + " " + rr + " 0 1 0 " + x + " " + (y - rr) + " Z";
  }
  return '<path d="' + circ(cx, cy, r) + " " + circ(bx, by, cr) + '" fill="' + fill + '" fill-rule="evenodd"/>';
}

// 太阳（圆 + 放射光线）
function sun(cx, cy, r, fill, stroke, sw) {
  var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (fill || "none") +
    '" stroke="' + (stroke || ART.ink) + '" stroke-width="' + (sw || 1.3) + '"/>';
  for (var i = 0; i < 12; i++) {
    var a = i * Math.PI / 6;
    var x1 = cx + Math.cos(a) * (r + 2), y1 = cy + Math.sin(a) * (r + 2);
    var x2 = cx + Math.cos(a) * (r + 6), y2 = cy + Math.sin(a) * (r + 6);
    s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) +
      '" y2="' + y2.toFixed(1) + '" stroke="' + (stroke || ART.ink) + '" stroke-width="' + (sw || 1) + '"/>';
  }
  return s;
}

// 放射线（用于星芒、车轮等）
function rays(cx, cy, r1, r2, n, stroke, sw) {
  var s = "";
  for (var i = 0; i < n; i++) {
    var a = i * 2 * Math.PI / n;
    var x1 = cx + Math.cos(a) * r1, y1 = cy + Math.sin(a) * r1;
    var x2 = cx + Math.cos(a) * r2, y2 = cy + Math.sin(a) * r2;
    s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) +
      '" y2="' + y2.toFixed(1) + '" stroke="' + (stroke || ART.ink) + '" stroke-width="' + (sw || 1) + '"/>';
  }
  return s;
}

// 六瓣小花（玫瑰/星花装饰）
function flower(cx, cy, r, petals, stroke) {
  var n = petals || 6, s = "";
  for (var i = 0; i < n; i++) {
    var a = i * 2 * Math.PI / n;
    var px = cx + Math.cos(a) * r * 0.55, py = cy + Math.sin(a) * r * 0.55;
    s += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + (r * 0.4).toFixed(1) +
      '" fill="none" stroke="' + (stroke || ART.ink) + '" stroke-width="1"/>';
  }
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.24).toFixed(1) + '" fill="none" stroke="' +
    (stroke || ART.ink) + '" stroke-width="1"/>';
  return s;
}

// 王冠
function crownPath(cx, y, w, stroke) {
  var c = stroke || ART.gold;
  return '<path d="M' + (cx - w / 2) + " " + y + " L" + (cx - w / 2) + " " + (y - w * 0.5) +
    " L" + (cx - w / 4) + " " + (y - w * 0.2) + " L" + cx + " " + (y - w * 0.58) +
    " L" + (cx + w / 4) + " " + (y - w * 0.2) + " L" + (cx + w / 2) + " " + (y - w * 0.5) +
    " L" + (cx + w / 2) + " " + y + ' Z" fill="none" stroke="' + c + '" stroke-width="1.2"/>';
}

/* ---------- 小阿卡纳：四种花色符号 ---------- */

// 权杖（抽芽的枝条）
function wandSym(x, y, s, color) {
  var c = color || ART.wands;
  return '<line x1="' + x + '" y1="' + (y - s) + '" x2="' + x + '" y2="' + (y + s) + '" stroke="' + c + '" stroke-width="2"/>' +
    '<circle cx="' + x + '" cy="' + (y - s - 3.5) + '" r="3.2" fill="' + c + '"/>' +
    '<path d="M' + x + " " + (y - s + 1) + " q -5 -4 -2 -9 q 6 2 2 9 Z" + '" fill="none" stroke="' + c + '" stroke-width="1.2"/>' +
    '<path d="M' + x + " " + (y - s + 3) + " q 5 -4 2 -9 q -6 2 -2 9 Z" + '" fill="none" stroke="' + c + '" stroke-width="1.2"/>' +
    '<line x1="' + (x - 5) + '" y1="' + (y + s) + '" x2="' + (x + 5) + '" y2="' + (y + s) + '" stroke="' + c + '" stroke-width="1.2"/>';
}

// 圣杯（高脚杯）
function cupSym(x, y, s, color) {
  var c = color || ART.cups;
  var w = s * 0.8, h = s * 1.05, top = y - h / 2;
  return '<ellipse cx="' + x + '" cy="' + top + '" rx="' + w + '" ry="' + (w * 0.28) +
    '" fill="none" stroke="' + c + '" stroke-width="1.5"/>' +
    '<path d="M' + (x - w) + " " + top + " L" + (x - w * 0.55) + " " + (top + h * 0.6) +
    " L" + (x + w * 0.55) + " " + (top + h * 0.6) + " L" + (x + w) + " " + top +
    '" fill="none" stroke="' + c + '" stroke-width="1.5"/>' +
    '<line x1="' + x + '" y1="' + (top + h * 0.6) + '" x2="' + x + '" y2="' + (top + h * 0.9) + '" stroke="' + c + '" stroke-width="1.5"/>' +
    '<path d="M' + (x - w * 0.5) + " " + (top + h * 0.9) + " q 0 " + (h * 0.18) + " " + w + ' 0" fill="none" stroke="' + c + '" stroke-width="1.5"/>';
}

// 宝剑（剑刃 + 护手 + 剑柄）
function swordSym(x, y, s, color) {
  var c = color || ART.swords;
  var h = s * 1.35;
  return '<path d="M' + x + " " + (y - h / 2) + " L" + (x + 3) + " " + (y - h / 2 + 6) +
    " L" + (x + 3) + " " + (y + h * 0.16) + " L" + x + " " + (y + h * 0.24) +
    " L" + (x - 3) + " " + (y + h * 0.16) + " L" + (x - 3) + " " + (y - h / 2 + 6) +
    ' Z" fill="none" stroke="' + c + '" stroke-width="1.4"/>' +
    '<line x1="' + (x - 6) + '" y1="' + (y + h * 0.16) + '" x2="' + (x + 6) + '" y2="' + (y + h * 0.16) + '" stroke="' + c + '" stroke-width="2"/>' +
    '<line x1="' + x + '" y1="' + (y + h * 0.24) + '" x2="' + x + '" y2="' + (y + h * 0.42) + '" stroke="' + c + '" stroke-width="2.4"/>' +
    '<circle cx="' + x + '" cy="' + (y + h * 0.44) + '" r="2.4" fill="' + c + '"/>';
}

// 星币（圆环 + 五芒星）
function pentacleSym(x, y, s, color) {
  var c = color || ART.pentacles;
  var pts = [];
  for (var i = 0; i < 5; i++) {
    var a = -Math.PI / 2 + i * 2 * Math.PI / 5;
    pts.push((x + s * 0.88 * Math.cos(a)).toFixed(1) + "," + (y + s * 0.88 * Math.sin(a)).toFixed(1));
  }
  return '<circle cx="' + x + '" cy="' + y + '" r="' + s + '" fill="none" stroke="' + c + '" stroke-width="1.5"/>' +
    '<polygon points="' + pts.join(" ") + '" fill="none" stroke="' + c + '" stroke-width="1.2"/>';
}

/* ---------- 小阿卡纳：点数布局 ---------- */
var PIP_LAYOUT = {
  2: [[100, 95], [100, 205]],
  3: [[100, 88], [100, 150], [100, 212]],
  4: [[78, 100], [122, 100], [78, 200], [122, 200]],
  5: [[78, 92], [122, 92], [100, 150], [78, 208], [122, 208]],
  6: [[78, 88], [122, 88], [78, 150], [122, 150], [78, 212], [122, 212]],
  7: [[78, 88], [122, 88], [78, 138], [122, 138], [100, 150], [78, 188], [122, 188]],
  8: [[78, 85], [122, 85], [78, 125], [122, 125], [78, 175], [122, 175], [78, 215], [122, 215]],
  9: [[72, 90], [100, 90], [128, 90], [72, 150], [100, 150], [128, 150], [72, 210], [100, 210], [128, 210]],
  10: [[72, 90], [100, 90], [128, 90], [58, 150], [86, 150], [114, 150], [142, 150], [72, 210], [100, 210], [128, 210]]
};

// 根据花色取符号绘制函数
function suitSymbolFn(group) {
  if (group === "wands") return wandSym;
  if (group === "cups") return cupSym;
  if (group === "swords") return swordSym;
  return pentacleSym;
}

function suitColor(group) {
  if (group === "wands") return ART.wands;
  if (group === "cups") return ART.cups;
  if (group === "swords") return ART.swords;
  return ART.pentacles;
}

/* ---------- 人物牌（侍从/骑士/王后/国王） ---------- */
function personFigure(cx, by, h, opts) {
  var headR = h * 0.11, headY = by - h;
  var s = '<circle cx="' + cx + '" cy="' + headY + '" r="' + headR + '" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>' +
    '<path d="M' + (cx - h * 0.22) + " " + (by - h * 0.72) + " L" + (cx + h * 0.22) + " " + (by - h * 0.72) +
    " L" + (cx + h * 0.34) + " " + by + " L" + (cx - h * 0.34) + " " + by + ' Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
  if (opts.arms === "up") {
    s += '<path d="M' + (cx - h * 0.18) + " " + (by - h * 0.62) + " L" + (cx - h * 0.36) + " " + (by - h * 0.95) + '" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>' +
      '<path d="M' + (cx + h * 0.18) + " " + (by - h * 0.62) + " L" + (cx + h * 0.36) + " " + (by - h * 0.95) + '" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>';
  } else if (opts.arms === "down") {
    s += '<path d="M' + (cx - h * 0.18) + " " + (by - h * 0.62) + " L" + (cx - h * 0.3) + " " + (by - h * 0.28) + '" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>' +
      '<path d="M' + (cx + h * 0.18) + " " + (by - h * 0.62) + " L" + (cx + h * 0.3) + " " + (by - h * 0.28) + '" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>';
  }
  if (opts.crown) {
    s += crownPath(cx, headY - headR, headR * 2.4);
  }
  return s;
}

// 简化的马
function horseFigure(cx, by, h) {
  var w = h * 1.1;
  return '<path d="M' + (cx - w * 0.32) + " " + by + " L" + (cx - w * 0.32) + " " + (by - h * 0.5) +
    " q 0 -" + (h * 0.16) + " " + (w * 0.18) + " 0" +
    " L" + (cx + w * 0.02) + " " + (by - h * 0.72) +
    " L" + (cx + w * 0.2) + " " + (by - h * 0.78) +
    " L" + (cx + w * 0.28) + " " + (by - h * 0.5) +
    " q " + (h * 0.14) + " 0 " + (h * 0.12) + " " + (h * 0.14) +
    " L" + (cx + w * 0.4) + " " + (by - h * 0.18) +
    " q " + (h * 0.1) + " " + (h * 0.28) + " 0 " + (h * 0.34) +
    " q -" + (h * 0.08) + " " + (h * 0.06) + " -" + (h * 0.12) + " 0" +
    " L" + (cx + w * 0.3) + " " + (by - h * 0.05) +
    " L" + (cx + w * 0.22) + " " + by +
    " L" + (cx - w * 0.32) + " " + by + ' Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>' +
    '<circle cx="' + (cx + w * 0.22) + '" cy="' + (by - h * 0.82) + '" r="' + (h * 0.06) + '" fill="' + ART.ink + '"/>' +
    '<line x1="' + (cx - w * 0.32) + '" y1="' + (by - h * 0.02) + '" x2="' + (cx - w * 0.34) + '" y2="' + by + '" stroke="' + ART.ink + '" stroke-width="1.2"/>' +
    '<line x1="' + (cx + w * 0.1) + '" y1="' + (by - h * 0.02) + '" x2="' + (cx + w * 0.1) + '" y2="' + by + '" stroke="' + ART.ink + '" stroke-width="1.2"/>' +
    '<line x1="' + (cx + w * 0.3) + '" y1="' + (by - h * 0.02) + '" x2="' + (cx + w * 0.3) + '" y2="' + by + '" stroke="' + ART.ink + '" stroke-width="1.2"/>';
}

// 绘制小阿卡纳主体
function renderMinorArt(card) {
  var group = card.group;
  var color = suitColor(group);
  var fn = suitSymbolFn(group);

  // 人物牌
  if (card.num === "P") {
    return personFigure(100, 230, 60, { arms: "up" }) + fn(100, 92, 15, color);
  }
  if (card.num === "Kt") {
    return horseFigure(100, 218, 46) + personFigure(100, 176, 46, { arms: "up" }) + fn(100, 88, 14, color);
  }
  if (card.num === "Q") {
    return personFigure(88, 232, 58, { arms: "down", crown: true }) + fn(140, 150, 18, color) + crownPath(88, 174, 20);
  }
  if (card.num === "K") {
    return personFigure(112, 232, 58, { arms: "down", crown: true }) + fn(66, 150, 18, color) + crownPath(112, 174, 20);
  }

  // 王牌：单张放大符号 + 装饰
  if (card.num === "A") {
    return rays(100, 150, 40, 54, 12, color, 1) + fn(100, 150, 22, color);
  }

  // 点数牌
  var n = Number(card.num);
  var layout = PIP_LAYOUT[n];
  var s = "";
  if (layout) {
    for (var i = 0; i < layout.length; i++) {
      s += fn(layout[i][0], layout[i][1], n === 10 ? 10 : 12, color);
    }
  }
  return s;
}

/* ---------- 大阿卡纳（22 张，各自独立构图） ---------- */
var MAJOR_ART = {

  // 0 愚者：旅人、悬崖、白玫瑰、行囊、太阳
  fool: function () {
    var s = sun(158, 72, 11, "none", ART.gold, 1.1);
    s += '<path d="M20 220 L54 186 L82 210 L110 176 L140 212 L180 190 L180 220 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M36 250 L48 210 L80 205 L82 250 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<circle cx="74" cy="170" r="6" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M74 176 L66 206 L74 202 L82 206 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<line x1="74" y1="181" x2="64" y2="192" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<line x1="74" y1="181" x2="84" y2="192" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<line x1="84" y1="181" x2="103" y2="165" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<circle cx="105" cy="163" r="5" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += flower(58, 194, 7, 5);
    return s;
  },

  // I 魔术师：无限符号、人物、桌上四元素
  magician: function () {
    var s = '<path d="M82 82 C72 72 92 72 100 82 C108 72 128 72 118 82 C108 92 92 92 100 82" fill="none" stroke="' + ART.gold + '" stroke-width="1.4"/>';
    s += '<circle cx="100" cy="118" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 125 L88 172 L112 172 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<line x1="90" y1="142" x2="76" y2="126" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<line x1="110" y1="142" x2="124" y2="158" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<rect x="58" y="178" width="84" height="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<line x1="58" y1="185" x2="58" y2="200" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<line x1="142" y1="185" x2="142" y2="200" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += cupSym(76, 172, 8, ART.cups) + wandSym(100, 171, 9, ART.wands) + swordSym(124, 172, 8, ART.swords) + pentacleSym(142, 190, 5, ART.pentacles);
    s += '<line x1="40" y1="206" x2="160" y2="206" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // II 女祭司：双柱、帷幕、端坐人物、新月、石榴
  "high-priestess": function () {
    var s = '<rect x="46" y="58" width="10" height="150" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<rect x="144" y="58" width="10" height="150" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M41 58 h20 M41 62 h20 M139 58 h20 M139 62 h20" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<path d="M58 70 q 42 -18 84 0" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<circle cx="100" cy="112" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 119 L88 172 L112 172 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M84 172 h32 l-4 26 h-24 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<rect x="90" y="130" width="20" height="16" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += crescent(100, 216, 13, ART.gold);
    s += '<circle cx="100" cy="223" r="1.5" fill="' + ART.ink + '"/>';
    return s;
  },

  // III 皇后：星冠、麦穗、维纳斯符号
  empress: function () {
    var s = "";
    for (var i = 0; i < 5; i++) {
      var a = Math.PI + i * Math.PI / 4;
      s += star(100 + Math.cos(a) * 19, 95 + Math.sin(a) * 19, 4, "none", ART.gold, 1);
    }
    s += '<circle cx="100" cy="118" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 125 L86 178 L114 178 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M80 178 h40 l-6 30 h-28 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<path d="M126 126 l12 0 M132 120 l0 22 M132 134 c5 0 9 4 9 9 c0 5 -4 9 -9 9 c-5 0 -9 -4 -9 -9" fill="none" stroke="' + ART.gold + '" stroke-width="1.3"/>';
    for (var j = 0; j < 3; j++) {
      s += '<path d="M60 ' + (148 + j * 10) + ' q 8 -6 0 -14" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
      s += '<path d="M140 ' + (148 + j * 10) + ' q -8 -6 0 -14" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    }
    s += '<line x1="40" y1="208" x2="160" y2="208" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // IV 皇帝：石座、公羊、权杖、山
  emperor: function () {
    var s = '<path d="M30 150 L58 110 L78 140 L100 105 L128 145 L158 112 L170 150 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<rect x="72" y="96" width="56" height="82" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<circle cx="77" cy="108" r="6" fill="none" stroke="' + ART.gold + '" stroke-width="1.1"/>';
    s += '<circle cx="123" cy="108" r="6" fill="none" stroke="' + ART.gold + '" stroke-width="1.1"/>';
    s += '<circle cx="100" cy="122" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 129 L88 172 L112 172 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<line x1="100" y1="140" x2="100" y2="112" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<circle cx="100" cy="110" r="3" fill="' + ART.gold + '"/>';
    s += '<line x1="40" y1="178" x2="160" y2="178" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // V 教皇：双柱、三重冠、手杖、钥匙
  hierophant: function () {
    var s = '<rect x="48" y="64" width="9" height="140" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<rect x="143" y="64" width="9" height="140" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += crownPath(100, 88, 20);
    s += '<circle cx="100" cy="118" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 125 L88 176 L112 176 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<line x1="124" y1="140" x2="124" y2="96" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<path d="M120 96 h8 M122 92 v8" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<circle cx="76" cy="150" r="5" fill="none" stroke="' + ART.gold + '" stroke-width="1.1"/>';
    s += '<line x1="76" y1="150" x2="76" y2="176" stroke="' + ART.gold + '" stroke-width="1.1"/>';
    s += '<line x1="73" y1="176" x2="79" y2="176" stroke="' + ART.gold + '" stroke-width="1.1"/>';
    s += '<line x1="40" y1="204" x2="160" y2="204" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // VI 恋人：太阳、树、两个人物
  lovers: function () {
    var s = sun(100, 72, 11, "none", ART.gold, 1.1);
    s += '<line x1="100" y1="176" x2="100" y2="104" stroke="' + ART.ink + '" stroke-width="1.4"/>';
    s += '<path d="M100 104 q -18 -4 -12 -20 M100 104 q 18 -4 12 -20 M100 104 q -4 -18 -8 -22 M100 104 q 4 -18 8 -22" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<circle cx="72" cy="146" r="6" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M72 152 L64 178 L80 178 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<circle cx="128" cy="146" r="6" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M128 152 L120 178 L136 178 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<line x1="40" y1="190" x2="160" y2="190" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // VII 战车：星幕、车体、车轮、驭者、双兽
  chariot: function () {
    var s = '<path d="M46 90 h108" stroke="' + ART.ink + '" stroke-width="1"/>';
    for (var i = 0; i < 5; i++) { s += star(50 + i * 24, 84, 3, "none", ART.gold, 1); }
    s += '<rect x="62" y="100" width="76" height="66" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<circle cx="78" cy="172" r="12" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<circle cx="122" cy="172" r="12" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += rays(78, 172, 0, 11, 8, ART.ink, 0.8) + rays(122, 172, 0, 11, 8, ART.ink, 0.8);
    s += '<circle cx="100" cy="120" r="6" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 126 L92 148 L108 148 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<path d="M44 150 q 8 -12 16 -4 l0 12 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<path d="M156 150 q -8 -12 -16 -4 l0 12 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<line x1="36" y1="184" x2="164" y2="184" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // VIII 力量：人物安抚狮子、无限符号
  strength: function () {
    var s = '<path d="M82 80 C74 72 92 72 100 80 C108 72 126 72 118 80 C110 88 92 88 100 80" fill="none" stroke="' + ART.gold + '" stroke-width="1.3"/>';
    s += '<circle cx="76" cy="138" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M76 145 L66 186 L88 186 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<line x1="72" y1="152" x2="106" y2="146" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<path d="M120 186 q -4 -14 4 -22 q 8 8 4 22 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<circle cx="126" cy="150" r="8" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M120 151 l-4 -3 M132 151 l4 -3" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<line x1="40" y1="196" x2="160" y2="196" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // IX 隐者：雪山、提灯、拐杖、星空
  hermit: function () {
    var s = "";
    for (var i = 0; i < 6; i++) { s += star(36 + i * 26, 58 + (i % 3) * 18, 2, "none", ART.gold, 0.8); }
    s += '<path d="M28 210 L58 148 L82 196 L108 140 L138 200 L172 154 L178 210 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M58 148 L66 160 L50 160 Z M108 140 L116 152 L100 152 Z" fill="' + ART.paper + '" stroke="' + ART.ink + '" stroke-width="0.8"/>';
    s += '<circle cx="100" cy="126" r="6" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 132 L92 182 L108 182 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<line x1="112" y1="150" x2="124" y2="196" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<line x1="90" y1="150" x2="78" y2="170" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<path d="M70 170 L86 170 L84 184 L72 184 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += star(78, 177, 4, "none", ART.gold, 1);
    return s;
  },

  // X 命运之轮：轮、辐条、云、四角符号
  wheel: function () {
    var s = '<path d="M30 86 q 8 -8 18 0 q 6 -8 16 0" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M130 86 q 8 -8 18 0 q 6 -8 16 0" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<circle cx="100" cy="150" r="42" fill="none" stroke="' + ART.ink + '" stroke-width="1.5"/>';
    s += '<circle cx="100" cy="150" r="34" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<circle cx="100" cy="150" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += rays(100, 150, 9, 42, 8, ART.ink, 1);
    s += '<polygon points="36,62 44,74 28,74" fill="none" stroke="' + ART.gold + '" stroke-width="1.2"/>';
    s += '<circle cx="164" cy="68" r="6" fill="none" stroke="' + ART.gold + '" stroke-width="1.2"/>';
    s += '<rect x="31" y="228" width="11" height="11" fill="none" stroke="' + ART.gold + '" stroke-width="1.2"/>';
    s += crescent(164, 233, 7, ART.gold);
    return s;
  },

  // XI 正义：双柱、天平、宝剑
  justice: function () {
    var s = '<rect x="52" y="60" width="8" height="130" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<rect x="140" y="60" width="8" height="130" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<circle cx="100" cy="116" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 123 L88 176 L112 176 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<line x1="118" y1="138" x2="146" y2="120" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<line x1="132" y1="116" x2="132" y2="132" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<line x1="120" y1="114" x2="144" y2="114" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<path d="M120 114 l-6 8 h12 Z M144 114 l-6 8 h12 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += swordSym(64, 122, 13, ART.swords);
    s += '<line x1="40" y1="190" x2="160" y2="190" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // XII 倒吊人：T 形树、倒吊人物、光环
  "hanged-man": function () {
    var s = '<line x1="100" y1="70" x2="100" y2="196" stroke="' + ART.ink + '" stroke-width="1.5"/>';
    s += '<line x1="64" y1="70" x2="136" y2="70" stroke="' + ART.ink + '" stroke-width="1.5"/>';
    s += '<path d="M64 70 q 8 -8 16 0 M104 70 q 8 -8 16 0" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<circle cx="100" cy="150" r="12" fill="none" stroke="' + ART.gold + '" stroke-width="1"/>';
    s += '<circle cx="100" cy="150" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 143 L88 100 L112 100 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<line x1="90" y1="143" x2="84" y2="130" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<line x1="110" y1="143" x2="116" y2="130" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<line x1="100" y1="132" x2="100" y2="70" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    return s;
  },

  // XIII 死神：日出、骑马者、白玫瑰旗
  death: function () {
    var s = sun(100, 96, 10, "none", ART.gold, 1);
    s += '<line x1="20" y1="108" x2="180" y2="108" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += horseFigure(100, 196, 40);
    s += '<circle cx="100" cy="124" r="6" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 130 L92 158 L108 158 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<line x1="126" y1="120" x2="126" y2="76" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<path d="M126 76 L150 84 L126 92 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += flower(134, 84, 5, 5);
    return s;
  },

  // XIV 节制：翅膀、两杯、水流、通往王冠之路
  temperance: function () {
    var s = '<path d="M86 120 q -14 -6 -18 -18 q 12 -2 18 8 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M114 120 q 14 -6 18 -18 q -12 -2 -18 8 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<circle cx="100" cy="128" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 135 L90 178 L110 178 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += cupSym(82, 116, 8, ART.cups) + cupSym(118, 116, 8, ART.cups);
    s += '<path d="M82 116 q 8 12 18 0" fill="none" stroke="' + ART.gold + '" stroke-width="1.2"/>';
    s += '<line x1="90" y1="140" x2="82" y2="120" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<line x1="110" y1="140" x2="118" y2="120" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<path d="M36 200 q 8 -6 16 0 q 8 6 16 0" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<line x1="108" y1="200" x2="164" y2="200" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M88 178 L76 150 L100 128" fill="none" stroke="' + ART.ink + '" stroke-width="0.9"/>';
    s += crownPath(100, 92, 14);
    return s;
  },

  // XV 恶魔：倒五芒星、有角带翅主体、被链小人
  devil: function () {
    var s = star(100, 76, 14, "none", ART.gold, 1.2);
    s += '<path d="M84 116 l4 -18 l8 14 l8 -14 l4 18 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<circle cx="100" cy="126" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 133 L86 188 L114 188 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M84 140 q -16 -4 -22 -18 q 14 0 22 10 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M116 140 q 16 -4 22 -18 q -14 0 -22 10 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<circle cx="70" cy="176" r="5" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<path d="M70 181 L64 202 L76 202 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<circle cx="130" cy="176" r="5" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<path d="M130 181 L124 202 L136 202 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<path d="M70 174 q 15 8 30 0 M130 174 q -15 8 -30 0" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<line x1="44" y1="208" x2="156" y2="208" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // XVI 高塔：闪电、塔、火焰、坠落的王冠
  tower: function () {
    var s = '<path d="M128 60 L112 96 L122 96 L104 132" fill="none" stroke="' + ART.gold + '" stroke-width="1.6"/>';
    s += '<path d="M60 120 L70 96 L92 96 L92 70 L108 70 L108 96 L130 96 L140 120 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<rect x="78" y="104" width="16" height="24" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M86 96 q 8 -8 16 0 q -4 8 -8 8 q 2 6 -4 6 q -8 0 -4 -14 Z" fill="none" stroke="' + ART.gold + '" stroke-width="1"/>';
    s += '<path d="M112 96 q 8 -8 16 0 q -4 8 -8 8 q 2 6 -4 6 q -8 0 -4 -14 Z" fill="none" stroke="' + ART.gold + '" stroke-width="1"/>';
    s += crownPath(100, 176, 16);
    s += '<path d="M100 182 q 2 10 10 12" fill="none" stroke="' + ART.ink + '" stroke-width="0.8"/>';
    s += '<line x1="40" y1="210" x2="160" y2="210" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // XVII 星星：大星、跪坐倒水人物、水池、树
  star: function () {
    var s = star(100, 76, 20, "none", ART.gold, 1.4);
    s += star(52, 64, 5, "none", ART.gold, 1) + star(146, 60, 4, "none", ART.gold, 1) + star(60, 96, 3, "none", ART.gold, 0.8) + star(142, 96, 3, "none", ART.gold, 0.8);
    s += '<circle cx="78" cy="146" r="6" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M78 152 L68 186 L88 186 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += cupSym(62, 158, 8, ART.cups);
    s += '<path d="M62 166 q 6 10 2 22 M62 166 q 2 10 8 16" fill="none" stroke="' + ART.gold + '" stroke-width="1"/>';
    s += '<path d="M52 206 q 10 -8 20 0 q 10 8 20 0" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<line x1="136" y1="168" x2="136" y2="196" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<path d="M136 168 q -10 -4 -7 -12 M136 168 q 10 -4 7 -12" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<line x1="40" y1="220" x2="160" y2="220" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // XVIII 月亮：新月、双塔、小路、犬狼、水中生物
  moon: function () {
    var s = crescent(100, 78, 22, ART.gold);
    s += '<path d="M54 132 L58 96 L70 96 L70 132 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<path d="M130 132 L134 96 L146 96 L146 132 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.2"/>';
    s += '<path d="M92 214 L100 142 L108 214 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M64 176 q 8 0 8 8 l0 8 q -8 2 -14 -2 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<circle cx="72" cy="172" r="4" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<line x1="75" y1="168" x2="80" y2="160" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M128 176 q 8 0 8 8 l0 8 q -8 2 -14 -2 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<circle cx="136" cy="172" r="4" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<line x1="133" y1="168" x2="128" y2="160" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M88 230 q 12 -5 24 0 q -6 7 -16 5 q -4 5 -12 5 q -8 0 -12 -5 q 6 -2 16 -5 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M44 240 q 8 -5 16 0 q 8 5 16 0 q 8 -5 16 0 q 8 5 16 0 q 8 -5 16 0" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // XIX 太阳：大太阳、向日葵、骑马孩童、墙
  sun: function () {
    var s = '<circle cx="100" cy="90" r="28" fill="none" stroke="' + ART.gold + '" stroke-width="1.5"/>';
    s += rays(100, 90, 32, 42, 16, ART.gold, 1);
    s += '<path d="M90 82 q 10 8 20 0" stroke="' + ART.ink + '" stroke-width="1" fill="none"/>';
    s += '<circle cx="90" cy="80" r="1.5" fill="' + ART.ink + '"/><circle cx="110" cy="80" r="1.5" fill="' + ART.ink + '"/>';
    s += '<rect x="40" y="150" width="120" height="10" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += flower(62, 176, 10, 8) + '<line x1="62" y1="186" x2="62" y2="206" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += flower(138, 176, 10, 8) + '<line x1="138" y1="186" x2="138" y2="206" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += horseFigure(100, 214, 34);
    s += '<circle cx="100" cy="150" r="6" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<line x1="40" y1="226" x2="160" y2="226" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // XX 审判：放射光、吹号天使、复活的人
  judgement: function () {
    var s = rays(100, 96, 8, 52, 12, ART.gold, 0.8);
    s += '<circle cx="100" cy="100" r="7" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 107 L90 150 L110 150 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M88 116 q -14 -5 -18 -16 q 12 -1 18 8 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M112 116 q 14 -5 18 -16 q -12 -1 -18 8 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M116 118 L138 108 L140 116 L120 128 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<circle cx="71" cy="188" r="4" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M60 196 h22 l-3 22 h-16 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<circle cx="129" cy="188" r="4" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<path d="M118 196 h22 l-3 22 h-16 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1"/>';
    s += '<line x1="40" y1="222" x2="160" y2="222" stroke="' + ART.ink + '" stroke-width="1"/>';
    return s;
  },

  // XXI 世界：环形花冠、中央人物、四角象征
  world: function () {
    var s = '<ellipse cx="100" cy="150" rx="42" ry="60" fill="none" stroke="' + ART.ink + '" stroke-width="1.4"/>';
    for (var i = 0; i < 16; i++) {
      var a = i * Math.PI / 8;
      var lx = (100 + 42 * Math.cos(a)).toFixed(0), ly = (150 + 60 * Math.sin(a)).toFixed(0);
      s += '<path d="M' + lx + ' ' + ly + ' q 3 -4 6 0 q -3 4 -6 0 Z" fill="none" stroke="' + ART.ink + '" stroke-width="0.8"/>';
    }
    s += '<circle cx="100" cy="142" r="6" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M100 148 L90 178 L110 178 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.3"/>';
    s += '<path d="M90 178 L82 194 L96 192 Z M110 178 L118 194 L104 192 Z" fill="none" stroke="' + ART.ink + '" stroke-width="1.1"/>';
    s += '<polygon points="36,60 46,74 26,74" fill="none" stroke="' + ART.gold + '" stroke-width="1.2"/>';
    s += '<circle cx="164" cy="67" r="7" fill="none" stroke="' + ART.gold + '" stroke-width="1.2"/>';
    s += '<rect x="31" y="228" width="14" height="10" fill="none" stroke="' + ART.gold + '" stroke-width="1.2"/>';
    s += crescent(164, 233, 8, ART.gold);
    return s;
  }
};

/* ---------- 顶部编号与牌名 ---------- */
function topLabel(card) {
  if (card.group === "major") return card.num;
  if (card.num === "A") return "A";
  if (card.num === "P") return "侍";
  if (card.num === "Kt") return "骑";
  if (card.num === "Q") return "后";
  if (card.num === "K") return "王";
  return card.num;
}

function getCardArt(card) {
  if (card.group === "major") {
    var f = MAJOR_ART[card.id];
    return f ? f() : "";
  }
  return renderMinorArt(card);
}

/* ---------- 角饰 ---------- */
function cornerOrnaments() {
  return '<path d="M14 14 l9 0 M14 14 l0 9 M20 20 l0 0" stroke="' + ART.gold + '" stroke-width="1.1" fill="none"/>' +
    '<path d="M186 14 l-9 0 M186 14 l0 9" stroke="' + ART.gold + '" stroke-width="1.1" fill="none"/>' +
    '<path d="M14 286 l9 0 M14 286 l0 -9" stroke="' + ART.gold + '" stroke-width="1.1" fill="none"/>' +
    '<path d="M186 286 l-9 0 M186 286 l0 -9" stroke="' + ART.gold + '" stroke-width="1.1" fill="none"/>';
}

/* ---------- 生成完整牌面 SVG ---------- */
function renderCardFaceSVG(card, reversed) {
  var art = getCardArt(card);
  var num = topLabel(card);
  var accent = card.group === "major" ? ART.gold : suitColor(card.group);
  var uid = card.id || "card";

  var suitGlyph = "";
  if (card.group !== "major") {
    var sf = suitSymbolFn(card.group);
    suitGlyph = sf(30, 28, 5, accent) + sf(170, 28, 5, accent);
  }

  var rot = reversed ? '<g transform="rotate(180 100 150)">' + art + "</g>" : art;

  var defs =
    '<defs>' +
    '<filter id="noise-' + uid + '" x="0" y="0" width="100%" height="100%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3"/>' +
    '<feColorMatrix type="saturate" values="0"/>' +
    "</filter>" +
    '<radialGradient id="age-' + uid + '" cx="50%" cy="42%" r="75%">' +
    '<stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>' +
    '<stop offset="100%" stop-color="#7a5c34" stop-opacity="0.13"/>' +
    "</radialGradient>" +
    "</defs>";

  return '<svg class="tarot-svg" viewBox="0 0 200 300" role="img" aria-label="' + card.name + '" xmlns="http://www.w3.org/2000/svg">' +
    defs +
    '<rect x="0" y="0" width="200" height="300" fill="' + ART.paper + '"/>' +
    '<rect x="0" y="0" width="200" height="300" fill="url(#age-' + uid + ')"/>' +
    '<rect x="0" y="0" width="200" height="300" filter="url(#noise-' + uid + ')" opacity="0.05"/>' +
    '<rect x="7" y="7" width="186" height="286" fill="none" stroke="' + ART.ink + '" stroke-width="1.6"/>' +
    '<rect x="12" y="12" width="176" height="276" fill="none" stroke="' + ART.inkSoft + '" stroke-width="0.7"/>' +
    cornerOrnaments() +
    '<text x="100" y="32" text-anchor="middle" font-size="14" letter-spacing="1" fill="' + ART.ink + '" font-family="' + ART_FONT + '">' + num + "</text>" +
    suitGlyph +
    rot +
    '<rect x="28" y="264" width="144" height="24" fill="' + ART.paperDeep + '" stroke="' + ART.ink + '" stroke-width="0.8"/>' +
    '<text x="100" y="278" text-anchor="middle" font-size="11" fill="' + ART.ink + '" font-family="' + ART_FONT + '">' + card.name + "</text>" +
    '<text x="100" y="286" text-anchor="middle" font-size="5.5" letter-spacing="0.5" fill="' + ART.inkSoft + '" font-family="Georgia,serif">' + card.en.toUpperCase() + "</text>" +
    "</svg>";
}
