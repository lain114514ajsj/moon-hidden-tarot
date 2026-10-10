/* =========================================================
   月隐 Tarot —— 解读系统本地测试
   运行：node work/reading-tests.js
   不联网、不依赖第三方库、不调用任何模型 API。
   载入顺序与 tarot.html 完全一致，确保测的就是页面在用的那套逻辑。
   ========================================================= */
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const read = function (f) { return fs.readFileSync(path.join(ROOT, f), "utf8"); };

const ctx = { window: {}, console: console };
vm.createContext(ctx);
["js/data.js", "js/cards-meaning.js", "js/reading.js"].forEach(function (f) {
  vm.runInContext(read(f), ctx);
});
vm.runInContext("globalThis.__cards = TAROT_CARDS;", ctx);
const cards = ctx.__cards;
const R = ctx.window.MoonveilReading;
const M = ctx.window.CARD_MEANINGS, J = ctx.window.CARD_JUDGEMENT, T = ctx.window.CARD_TAGS, REL = ctx.window.CARD_REL;

let pass = 0, fail = 0; const fails = [];
function check(name, cond, extra) {
  if (cond) { pass++; } else { fail++; fails.push(name + (extra ? "  → " + extra : "")); }
}
function byId(id) { return cards.filter(function (c) { return c.id === id; })[0]; }
function out(q, pairs, slots) {
  return R.compose(q, pairs, slots || [""]);
}
function single(q, id, rev) { return out(q, [{ card: byId(id), reversed: !!rev }]); }
function flat(o) {
  return [o.verdict || ""]
    .concat((o.cards || []).map(function (c) { return (c.name || "") + " " + (c.ori || "") + " " + c.core + " " + c.apply; }))
    .concat([o.synthesis || "", (o.actions || []).join(" "), o.closing || ""])
    .join(" || ");
}
/* 把解读拆成"展示区块"，用于重复内容检查 */
function blocks(o) {
  return {
    verdict: o.verdict || "",
    core: (o.cards || []).map(function (c) { return c.core; }).join("。"),
    apply: (o.cards || []).map(function (c) { return c.apply; }).join("。"),
    synthesis: o.synthesis || "",
    actions: (o.actions || []).join("。"),
    closing: o.closing || ""
  };
}
function sents(s) {
  return String(s || "").split(/[。；!！？?]/).map(function (x) { return x.trim(); })
    .filter(function (x) { return x.length >= 12; });
}
function dupSentences(o) {
  const b = blocks(o), ks = Object.keys(b), hits = [];
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
    sents(b[ks[i]]).forEach(function (s) {
      if (sents(b[ks[j]]).indexOf(s) >= 0) hits.push(ks[i] + "↔" + ks[j] + "：" + s.slice(0, 24));
    });
  }
  return hits;
}

/* 1. 78 张牌数据完整性 */
{
  const bad = [];
  cards.forEach(function (c) {
    const m = M[c.id], j = J[c.id], t = T[c.id], rel = REL[c.id];
    if (!m) { bad.push(c.id + ":缺牌义"); return; }
    ["up", "rev", "advice", "reflect"].forEach(function (f) { if (!m[f]) bad.push(c.id + "." + f); });
    ["daily", "study", "work", "money", "relation"].forEach(function (f) { if (!m.scene || !m.scene[f]) bad.push(c.id + ".scene." + f); });
    if (!j || typeof j.u !== "number" || typeof j.r !== "number" || !j.ku || !j.kr) bad.push(c.id + ":判断数据");
    if (!t || !t.tu || !t.tr) bad.push(c.id + ":标签");
    if (!rel || !rel.u || !rel.r) bad.push(c.id + ":关系角度(需分正逆)");
  });
  check("78 张牌数据完整", bad.length === 0, bad.slice(0, 5).join(","));
}

/* 2. 同一张牌 × 三个不同问题 → 必须产生实质不同的回答 */
{
  const qs = ["今天吃啥", "她喜欢我吗", "我真的喜欢他吗"];
  const outs = qs.map(function (q) { return flat(single(q, "three-pentacles", true)); });
  check("同牌三问：三份回答互不相同", new Set(outs).size === 3);
  const intents = qs.map(function (q) { return R.detectIntent(q); });
  check("同牌三问：意图识别不同", new Set(intents).size === 3, intents.join(","));
  check("饮食问：出现具体食物", /盖饭|汤面|吃|喝|饭/.test(outs[0]));
  check("饮食问：不出现团队/合作/领导", !/团队|合作|分工|领导|边界/.test(outs[0]), outs[0].slice(0, 60));
  check("对方心意问：围绕对方的心意", /心意|心里|他|她/.test(outs[1]) && !/辞职|跳槽/.test(outs[1]));
  check("自己的感受问：围绕分辨自己的感觉", /自己|分辨|喜欢|感觉/.test(outs[2]));
}

/* 3. 同一个问题 × 三张不同牌 → 回答必须不同 */
{
  const q = "今天下午干什么";
  const outs = ["three-pentacles", "hermit", "sun"].map(function (id) { return flat(single(q, id, false)); });
  check("同问三牌：三份回答互不相同", new Set(outs).size === 3);
  const q2 = "我和他还会在一起吗";
  const o2 = ["two-cups", "eight-cups", "tower"].map(function (id) { return flat(single(q2, id, false)); });
  check("同问三牌（感情）：互不相同", new Set(o2).size === 3);
}

/* 4. 同一张牌 正位 vs 逆位 */
{
  ["eight-cups", "three-pentacles", "king-wands", "six-pentacles"].forEach(function (id) {
    const u = flat(single("我和他还会在一起吗", id, false));
    const v = flat(single("我和他还会在一起吗", id, true));
    check("正逆位不同：" + id, u !== v);
  });
}

/* 5. 单张 vs 三张牌阵 */
{
  const three = out("我和他还会在一起吗", [
    { card: byId("six-cups"), reversed: false },
    { card: byId("eight-cups"), reversed: true },
    { card: byId("tower"), reversed: false }
  ], ["过去", "现在", "未来"]);
  check("三张牌阵：有综合结论", !!three.synthesis && three.synthesis.length > 10);
  check("三张牌阵：每张带位置语", three.cards.every(function (c, i) { return c.core.indexOf(["过去", "现在", "未来"][i]) >= 0; }));
  check("三张牌阵：给出整体倾向", /偏|倾向|信号|方向|拉扯/.test(three.verdict));
}

/* 6. 空白 / 模糊 / 特殊字符 / 超长 —— 不能崩，且要有输出 */
{
  const weird = ["", "   ", "？？？", "唉", "<script>alert(1)</script> 我该吃什么？", "我今天心情有点复杂说不上来但就是不太想动".repeat(3)];
  weird.forEach(function (q) {
    let ok = true, msg = "";
    try { const o = single(q, "moon", false); ok = !!(o && o.verdict && o.verdict.length > 4); msg = o && o.verdict; }
    catch (e) { ok = false; msg = e.message; }
    check("异常输入不崩：" + JSON.stringify(q.slice(0, 12)), ok, msg);
  });
}

/* 7. 页面实际调用的函数 = 修复后的函数 */
{
  const tj = read("js/tarot.js");
  const html = read("tarot.html");
  check("tarot.js 调用 ENGINE.compose", /ENGINE\.compose\(state\.question/.test(tj));
  check("tarot.js 使用 window.MoonveilReading", /window\.MoonveilReading/.test(tj));
  check("reading.js 导出 compose", typeof R.compose === "function");
  check("reading.js 导出 detectIntent", typeof R.detectIntent === "function");
  const order = (html.match(/js\/[a-z-]+\.js/g) || []);
  check("cards-meaning 在 reading 之前", order.indexOf("js/cards-meaning.js") < order.indexOf("js/reading.js"));
  check("reading 在 tarot 之前", order.indexOf("js/reading.js") < order.indexOf("js/tarot.js"));
}

/* 8. 无关建议检查：不同意图不能出现明显错位的词 */
{
  const combos = [
    { q: "今天吃啥", forbid: /团队|合作|分工|领导|边界|成长|伴侣|对方/ },
    { q: "今天穿什么", forbid: /团队|合作|分工|领导|复合|辞职/ },
    { q: "周末去哪里好", forbid: /团队|合作|分工|边界|复合|辞职/ },
    { q: "我应该辞职吗", forbid: /复合|表白|暗恋|盖饭|汤面/ },
    { q: "我今天适合复习什么", forbid: /辞职|复合|盖饭|汤面/ }
  ];
  const sample = ["three-pentacles", "king-wands", "six-pentacles", "moon", "sun"];
  combos.forEach(function (c) {
    sample.forEach(function (id) {
      const t = flat(single(c.q, id, false));
      check("无关词检查：" + c.q + "×" + id, !c.forbid.test(t), t.slice(0, 70));
    });
  });
}

/* 8b. 关系类问题不得漏出工作/领导/团队类措辞 */
{
  const loveQs = ["她喜欢我吗", "我真的喜欢他吗", "我和他还会在一起吗", "我要不要主动联系他"];
  const forbid = /带头负责|团队|分工|领导|控制|职场|老板|项目|客户|辞职|跳槽/;
  const sample2 = ["king-wands", "six-pentacles", "knight-wands", "three-pentacles", "emperor"];
  loveQs.forEach(function (q) {
    sample2.forEach(function (id) {
      const t = flat(single(q, id, false));
      check("关系类无工作措辞：" + q + "×" + id, !forbid.test(t), t.slice(0, 70));
    });
  });
}

/* 8c. 工作/学习类问题不得漏出感情类措辞 */
{
  const qs = ["我应该辞职吗", "我今天适合复习什么"];
  const forbid = /复合|表白|暗恋|前任|心动的|被爱的|对方的/;
  ["three-pentacles", "king-wands", "six-pentacles", "two-cups"].forEach(function (id) {
    qs.forEach(function (q) {
      const t = flat(single(q, id, false));
      check("非感情问无感情措辞：" + q + "×" + id, !forbid.test(t), t.slice(0, 70));
    });
  });
}

/* 8d. 质量：结论必须有判断、必须给出牌面依据 */
{
  const judgment = /偏|倾向|信号|机会|可以|别急|先|可能|难|不太|有希望|有戏|看不清|拉|卡/;
  [["我和他还会在一起吗", "eight-cups", true], ["我应该辞职吗", "three-pentacles", true],
   ["她喜欢我吗", "king-wands", false], ["这件衣服值得买吗", "six-pentacles", false],
   ["我今天适合复习什么", "ace-pentacles", false]].forEach(function (p) {
    const o = single(p[0], p[1], p[2]);
    const core = (M[byId(p[1]).id] || {})[p[2] ? "rev" : "up"] || "";
    const t = flat(o);
    check("质量·有明确判断：" + p[0], judgment.test(o.verdict), o.verdict.slice(0, 50));
    check("质量·引用了该牌的具体牌义：" + p[0], core.length > 6 && t.indexOf(core.slice(0, 10)) >= 0, t.slice(0, 60));
  });
}

/* 8e. 关系类：五个子意图必须给出不同重点；正逆位关系素材必须不同 */
{
  const five = ["她喜欢我吗", "我真的喜欢他吗", "我和他还会在一起吗", "我要不要主动联系他", "我们之间到底卡在哪里"];
  const outs = five.map(function (q) { return flat(single(q, "queen-cups", false)); });
  check("关系·五个子意图输出不同", new Set(outs).size >= 4, new Set(outs).size + "/5");
  const rels = five.map(function (q) { const o = single(q, "queen-cups", false); return o.cards[0] ? o.cards[0].apply : ""; });
  const flats5 = five.map(function (q) { return flat(single(q, "queen-cups", false)); });
  check("关系·同一张牌在不同子意图下都用到该牌关系素材", flats5.every(function (x) { return x.indexOf(REL["queen-cups"].u) >= 0; }));
  const intents = five.map(function (q) { return R.detectIntent(q); });
  check("关系·子意图识别有区分", new Set(intents).size >= 4, intents.join(","));

  ["queen-cups", "king-wands", "eight-cups", "six-pentacles"].forEach(function (id) {
    const u = single("她喜欢我吗", id, false), v = single("她喜欢我吗", id, true);
    check("关系·正逆位素材不同：" + id,
      REL[id].u !== REL[id].r && flat(u).indexOf(REL[id].u) >= 0 && flat(v).indexOf(REL[id].r) >= 0,
      REL[id].u + " / " + REL[id].r);
  });
}

/* 8f. 三张牌阵：综合结论必须真正连接三张 */
{
  const t = out("我和他还会在一起吗", [
    { card: byId("six-cups"), reversed: false },
    { card: byId("eight-cups"), reversed: true },
    { card: byId("tower"), reversed: false }
  ], ["过去", "现在", "未来"]);
  const s = t.synthesis || "";
  check("三张阵·综合提到三张牌名", ["圣杯六", "圣杯八", "高塔"].every(function (n) { return s.indexOf(n) >= 0; }), s.slice(0, 60));
  check("三张阵·综合使用位置", (s.indexOf("过去") >= 0) && (s.indexOf("现在") >= 0) && (s.indexOf("未来") >= 0));
  check("三张阵·给出支持/冲突关系", /一致|拉扯|往前推|往后拉/.test(s));
  check("三张阵·指出阻碍与转机", s.indexOf("最需要留意") >= 0 && s.indexOf("转机") >= 0);
}

/* 8g. 无重复句 / 简单问题更短 */
{
  const o = single("我和他还会在一起吗", "eight-cups", true);
  const sents = (flat(o).split(/[。；]/).map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 6; }));
  check("无重复句", new Set(sents).size === sents.length);
  const dailyV = single("今天吃什么好呢", "three-pentacles", true).verdict;
  const loveV = flat(out("我和他还会在一起吗", [
    { card: byId("six-cups"), reversed: false }, { card: byId("eight-cups"), reversed: true }, { card: byId("tower"), reversed: false }
  ], ["过去", "现在", "未来"]));
  check("简单问题更短、复杂问题更长", dailyV.length < 220 && loveV.length > dailyV.length, dailyV.length + " vs " + loveV.length);
}

/* 9. 重复度：多种组合下的唯一性与固定句检查 */
{
  const qs = ["今天吃啥", "今天穿什么", "今天下午干什么", "周末去哪里好", "我和他还会在一起吗",
    "她喜欢我吗", "我真的喜欢他吗", "我要不要主动联系他", "我应该辞职吗", "我今天适合复习什么",
    "这件衣服值得买吗", "我和室友闹矛盾了", "我最近为什么总是没有动力"];
  const set = new Set();
  let n = 0;
  for (let i = 0; i < 39; i++) {
    const q = qs[i % qs.length];
    const c = cards[(i * 17) % 78];
    set.add(flat(single(q, c.id, i % 3 === 0)));
    n++;
  }
  check("多样性：多数组合产生不同解读", set.size / n >= 0.9, set.size + "/" + n);

  const banned = ["大体顺，只是还差你自己那一步", "具体做什么，其实你自己最清楚", "牌面给的是一个状态提示",
    "先解决最扎手的那个", "把该问清楚的问清楚，你会比现在踏实", "决定权一直在你手里", "牌只是陪你想了一遍",
    "更像一面镜子", "你问的是", "牌看不了他心里在想什么", "不用今天就下判断", "先观察一段时间",
    "决定权在你手里", "这张牌给我的方向是", "牌只是陪你想了一遍"];
  const hits = [];
  for (let i = 0; i < 39; i++) {
    const q = qs[i % qs.length];
    const c = cards[(i * 7) % 78];
    const t = flat(single(q, c.id, i % 2 === 0));
    banned.forEach(function (w) { if (t.indexOf(w) >= 0) hits.push(q + "→" + w); });
  }
  check("固定套话已清除", hits.length === 0, hits.slice(0, 3).join(";"));
}

/* ========== 第二阶段：按验收清单扩充 ========== */

/* B. 同一张牌（权杖国王正位）× 四个不同问题 */
{
  const qs = ["她喜欢我吗", "我应该主动联系她吗", "我真的喜欢她吗", "我应该辞职吗"];
  const outs = qs.map(function (q) { return flat(single(q, "king-wands", false)); });
  check("B·同牌四问：输出互不相同", new Set(outs).size >= 4, new Set(outs).size + "/4");
  const intents = qs.map(function (q) { return R.detectIntent(q); });
  check("B·同牌四问：意图分别正确", intents[0] === "loveOther" && intents[1] === "loveAction" && intents[2] === "loveSelf" && intents[3] === "work", intents.join(","));
  check("B·感情两问不含工作词", !/辞职|跳槽|老板|同事|岗位/.test(outs[0] + outs[1]));
  check("B·工作问不含感情词", !/复合|表白|暗恋|对方|这段关系/.test(outs[3]));
  check("B·辞职问未断言辞职", !/一定辞|必须辞|建议辞职|应该辞职/.test(outs[3]), outs[3].slice(0, 60));
}

/* C. 同一问题（她喜欢我吗）× 四张不同牌 */
{
  const ids = ["king-wands", "two-cups", "eight-cups", "three-swords"];
  const outs = ids.map(function (id) { return flat(single("她喜欢我吗", id, false)); });
  check("C·同问四牌：输出互不相同", new Set(outs).size >= 4, new Set(outs).size + "/4");
  ids.forEach(function (id, i) {
    const nm = byId(id).name;
    check("C·提到自己的牌名：" + id, outs[i].indexOf(nm) >= 0, outs[i].slice(0, 50));
    const rel = REL[id].u;
    check("C·用了该牌的关系素材：" + id, rel.length > 4 && outs[i].indexOf(rel) >= 0);
  });
  const rev = flat(single("她喜欢我吗", "eight-cups", true));
  check("C·同牌正逆位不同", outs[2] !== rev);
}

/* D. 日常活动回归 */
{
  const qs = ["下午我可以干点啥", "今天适合做什么", "我现在很无聊，可以干什么", "今天要不要出门", "我应该休息还是学习"];
  const outs = qs.map(function (q) { return single(q, "king-pentacles", true); });
  qs.forEach(function (q, i) {
    check("D·识别为日常：" + q, outs[i].intent === "daily", outs[i].intent);
    check("D·不出现跨领域词：" + q, !/钱|理财|物质|领导|团队|复合|对方|伴侣|边界/.test(outs[i].verdict), outs[i].verdict.slice(0, 70));
    check("D·不含通用凑数结尾：" + q, outs[i].verdict.indexOf("把担心的事写下来") < 0);
  });
  check("D·出门问回答出门/在家", /出门|待在家/.test(outs[3].verdict), outs[3].verdict.slice(0, 60));
  check("D·休息问回答休息", /休息/.test(outs[4].verdict), outs[4].verdict.slice(0, 60));
  check("D·活动问给出具体活动", /比如|可以/.test(outs[0].verdict + outs[1].verdict + outs[2].verdict));
  check("D·日常回答简短", outs.every(function (o) { return o.verdict.length < 260; }), Math.max.apply(null, outs.map(function (o) { return o.verdict.length; })));
  check("D·日常问之间内容有差异", new Set(outs.map(function (o) { return o.verdict; })).size >= 3, new Set(outs.map(function (o) { return o.verdict; })).size + "/5");
}

/* E. 领域隔离（消费/考试/工作/人际/开放） */
{
  const cases = [
    ["这件衣服值得买吗", "money", /复合|对方|伴侣|领导|团队/],
    ["我今天适合复习什么", "study", /钱|理财|复合|对方|辞职/],
    ["我应该辞职吗", "work", /复合|表白|暗恋|盖饭|汤面/],
    ["我和室友闹矛盾了", "people", /复合|表白|盖饭|汤面/],
    ["我最近有点迷茫", "open", /复合|表白|辞职|盖饭|汤面/]
  ];
  const sample = ["three-pentacles", "king-wands", "six-pentacles", "moon"];
  cases.forEach(function (c) {
    sample.forEach(function (id) {
      const o = single(c[0], id, false);
      check("E·领域识别：" + c[0], o.intent === c[1], o.intent);
      check("E·无跨领域污染：" + c[0] + "×" + id, !c[2].test(flat(o)), flat(o).slice(0, 70));
    });
  });
}

/* F. 三张牌阵：三种组合 */
{
  const combos = [
    { name: "整体偏积极", ids: [["two-cups", false], ["sun", false], ["star", false]] },
    { name: "存在矛盾", ids: [["six-cups", false], ["eight-cups", true], ["tower", false]] },
    { name: "含逆位转折", ids: [["three-swords", false], ["eight-swords", true], ["world", false]] }
  ];
  combos.forEach(function (cb) {
    const t = R.compose("我和他还会在一起吗", cb.ids.map(function (p) { return { card: byId(p[0]), reversed: p[1] }; }), ["过去", "现在", "未来"]);
    const s = t.synthesis || "";
    check("F·" + cb.name + "：提到三张牌名", cb.ids.every(function (p) { return s.indexOf(byId(p[0]).name) >= 0; }), s.slice(0, 60));
    check("F·" + cb.name + "：含牌间关系", /一致|拉扯|偏平/.test(s));
    check("F·" + cb.name + "：含因果链", /换句话说|连起来看/.test(s));
    const lv = cb.ids.map(function (p) { const j = J[byId(p[0]).id]; return p[1] ? j.r : j.u; });
    const hasNeg = lv.some(function (x) { return x < 0; });
    const hasPos = lv.some(function (x) { return x > 0; });
    check("F·" + cb.name + "：有阻碍时才提阻碍", hasNeg ? s.indexOf("最需要留意") >= 0 : s.indexOf("最需要留意") < 0, s.slice(0, 40));
    check("F·" + cb.name + "：提到转机方向", !hasPos || s.indexOf("转机") >= 0);
    check("F·" + cb.name + "：有整体倾向", /偏|倾向|信号|方向/.test(t.verdict));
  });
}

/* ========== 第三轮：领域路由、牌义应用与重复输出 ========== */
{
  // G1 饮食推荐
  const o = single("晚上我可以吃点什么", "lovers", true);
  check("G1·饮食识别为 food", o.intent === "food", o.intent);
  check("G1·给出具体食物方向", /汤面|盖饭|家常菜|粥|炒饭|小炒|砂锅|炖菜/.test(o.verdict), o.verdict.slice(0, 70));
  check("G1·给出选择标准", /标准|挑|选/.test(o.verdict));
  check("G1·说明只是思路、不能替决定", /不能真的替你决定|选择思路/.test(o.verdict));
  check("G1·没有把通用牌义当答案", !/讨好别人|在两边摇摆/.test(o.verdict), o.verdict.slice(0, 60));

  // G2 饮食二选一
  const o2 = single("今晚吃炒饭还是面条", "lovers", true);
  check("G2·饮食二选一识别为 food", o2.intent === "food", o2.intent);
  check("G2·提到两个选项", /炒饭/.test(o2.verdict) && /面条/.test(o2.verdict), o2.verdict.slice(0, 60));
  check("G2·给出选择标准", /标准|挑/.test(o2.verdict));

  // G3 日常活动
  const o3 = single("下午我可以干点啥", "king-pentacles", true);
  check("G3·日常活动识别为 daily", o3.intent === "daily");
  check("G3·给出具体活动", /比如/.test(o3.verdict), o3.verdict.slice(0, 60));

  // G4 感情
  const o4 = single("她喜欢我吗", "lovers", true);
  check("G4·感情识别为 loveOther", o4.intent === "loveOther");
  check("G4·围绕关系展开", /关系|对方|心意|靠近|行为/.test(flat(o4)));
  check("G4·没有食物建议", !/汤面|盖饭|炒饭/.test(flat(o4)));

  // G5 购物
  const o5 = single("我应该买这件衣服吗", "lovers", true);
  check("G5·购物识别为 money", o5.intent === "money", o5.intent);
  check("G5·围绕购买决策", /买|下单|上限|值得|情绪/.test(flat(o5)));
  check("G5·没有食物建议", !/汤面|盖饭|炒饭/.test(flat(o5)));

  // G6 时间安排
  const o6 = single("我应该怎么安排今晚的时间", "hermit", false);
  check("G6·时间安排识别为 timePlanning", o6.intent === "timePlanning", o6.intent);
  check("G6·给出具体安排", /比如/.test(o6.verdict), o6.verdict.slice(0, 60));

  // G7 易混淆表达与回退优先级
  check("G7·她在想什么→感情", R.detectIntent("她到底在想什么") === "loveOther", R.detectIntent("她到底在想什么"));
  check("G7·人生怎么办→开放", R.detectIntent("我接下来的人生应该怎么办") === "open");
  check("G7·休息还是学习→日常（不被学习抢走）", R.detectIntent("我应该休息还是学习") === "daily");
  check("G7·吃什么→饮食（不被工作抢走）", R.detectIntent("我今天吃什么") === "food");
  check("G7·辞职→工作（不被日常抢走）", R.detectIntent("我应该辞职吗") === "work");
  check("G7·买衣服→购物（不被日常抢走）", R.detectIntent("我应该买这件衣服吗") === "money");
  check("G7·干点啥→日常", R.detectIntent("下午我可以干点啥") === "daily");

  // G8 重复输出检查
  [o, o2, o3, o4, o5, o6].forEach(function (x, i) {
    const body = (x.verdict || "") + (x.cards || []).map(function (c) { return c.core + c.apply; }).join("") + (x.synthesis || "");
    const act = x.actions || [];
    check("G8·行动建议不在正文重复#" + i, act.every(function (a) { return body.indexOf(a.slice(0, 12)) < 0; }), act.join(" / ").slice(0, 60));
    check("G8·行动建议内部无重复#" + i, new Set(act).size === act.length);
    if (x.closing) check("G8·收尾不在正文重复#" + i, body.indexOf(x.closing.slice(0, 12)) < 0);
  });

  // G9 三张牌阵与具体问题的一致性
  const t = R.compose("我应该辞职吗", [
    { card: byId("three-pentacles"), reversed: true },
    { card: byId("king-wands"), reversed: false },
    { card: byId("eight-cups"), reversed: false }
  ], ["过去", "现在", "未来"]);
  check("G9·三张阵综合提到三张牌", ["星币三", "权杖国王", "圣杯八"].every(function (n) { return t.synthesis.indexOf(n) >= 0; }));
  check("G9·结论不混入无关领域", !/复合|表白|汤面|盖饭/.test(t.verdict));
  check("G9·每张带位置语", t.cards.every(function (c, i) { return c.core.indexOf(["过去", "现在", "未来"][i]) >= 0; }));
  check("G9·牌面信息带名称与正逆位", t.cards.every(function (c) { return c.name && /正位|逆位/.test(c.ori); }));
}

/* ========== 第四轮：未来事件 / 行动建议 / 领域隔离 / 差异与逻辑 ========== */

/* A. 未来事件：给倾向、说清边界、不做确定性断言、正文不重复 */
{
  const evCases = [
    ["我明天会不会在路上捡到钱", "emperor", false, /偶然|猜不出来/, /捡到钱/],
    ["这周会不会有意外之财", "wheel", false, /偶然|猜不出来/, /意外之财/],
    ["我明天出门会不会遇到好事", "sun", false, /出门|娱乐/, /遇到好事/],
    ["我这次考试能通过吗", "three-pentacles", true, /准备|复习|备考/, /考试|能通过/],
    ["我会不会收到工资", "ten-pentacles", false, /现实|可核实/, /工资/],
    ["我明天会不会遇到她", "two-cups", false, /安排|巧合/, /遇到她/]
  ];
  const verdicts = [];
  evCases.forEach(function (c) {
    const o = single(c[0], c[1], c[2]);
    const v = o.verdict;
    verdicts.push(v);
    check("A·识别为未来事件：" + c[0], o.intent === "futureEvent", o.intent);
    check("A·点到具体事件：" + c[0], c[4].test(v), v.slice(0, 50));
    check("A·说明无法可靠预测：" + c[0], /没法可靠预测|给不了准数|预测不了/.test(v), v.slice(0, 50));
    check("A·没有确定性断言：" + c[0], !/一定会|一定不会|肯定会|肯定能|必然会|百分之|绝对会|肯定不/.test(v), v.slice(0, 50));
    check("A·给事件类型补边界：" + c[0], c[3].test(v), v.slice(0, 70));
    check("A·提到抽到的牌与正逆位：" + c[0],
      v.indexOf(byId(c[1]).name) >= 0 && new RegExp(c[2] ? "逆位" : "正位").test(v));
    check("A·正文无重复句：" + c[0], dupSentences(o).length === 0, dupSentences(o).join(" | "));
  });
  check("A·六种事件解读互不相同", new Set(verdicts).size >= 5, new Set(verdicts).size + "/6");
  check("A·将来时≠行动建议：我明天应该做什么→daily", R.detectIntent("我明天应该做什么") === "daily", R.detectIntent("我明天应该做什么"));
  check("A·关系行动：我明天要不要主动联系她→loveAction", R.detectIntent("我明天要不要主动联系她") === "loveAction", R.detectIntent("我明天要不要主动联系她"));
  check("A·未来事件不落到 open",
    R.detectIntent("我明天会不会遇到她") === "futureEvent" && R.detectIntent("我明天会不会在路上捡到钱") === "futureEvent");
}

/* B. 行动建议：分类正确，且回答的是"怎么做" */
{
  const cases = [
    ["我应该怎样准备明天的考试", "hermit", false, "study", /复习|备考|准备|计划|专注|安排|学/],
    ["我明天要不要主动联系她", "king-wands", false, "loveAction", /主动|联系|回应|行动|对方|她|感受/],
    ["我下午可以干点什么", "king-pentacles", true, "daily", /比如|可以/],
    ["我应该怎么安排今晚的时间", "hermit", false, "timePlanning", /安排|比如|时间/]
  ];
  cases.forEach(function (c) {
    const o = single(c[0], c[1], c[2]);
    check("B·意图：" + c[0], o.intent === c[3], o.intent);
    check("B·回答对应问题：" + c[0], c[4].test(flat(o)), o.verdict.slice(0, 60));
    check("B·长度适中：" + c[0], o.verdict.length > 20 && o.verdict.length < 300, o.verdict.length);
  });
  check("B·学习问不含饮食/感情词", !/汤面|盖饭|复合|表白|暗恋/.test(flat(single("我应该怎样准备明天的考试", "hermit", false))));
  check("B·日常问不含跨领域词", !/团队|领导|复合|对方|伴侣|辞职/.test(flat(single("我下午可以干点什么", "king-pentacles", true))));
  check("B·活动问给出具体活动", /比如/.test(single("我下午可以干点什么", "king-pentacles", true).verdict));
  check("B·时间安排问给出安排", /比如|安排/.test(single("我应该怎么安排今晚的时间", "hermit", false).verdict));
}

/* C. 领域隔离：六个代表性问题 */
{
  const cases = [
    { q: "晚上我可以吃点什么", id: "lovers", rev: true, intent: "food",
      need: /汤面|盖饭|家常菜|粥|炒饭|小炒|砂锅|炖菜/, forbid: /讨好别人|在两边摇摆|团队|合作|分工/ },
    { q: "今晚吃炒饭还是面条", id: "lovers", rev: true, intent: "food",
      need: /炒饭/ , forbid: /讨好别人|团队|复合|辞职/ },
    { q: "我应该买这件衣服吗", id: "lovers", rev: true, intent: "money",
      need: /买|下单|上限|值得|情绪|需要/, forbid: /汤面|盖饭|复合|表白/ },
    { q: "她喜欢我吗", id: "lovers", rev: true, intent: "loveOther",
      need: /关系|心意|对方|靠近|行为/, forbid: /汤面|盖饭|辞职/ },
    { q: "我真的喜欢她吗", id: "lovers", rev: true, intent: "loveSelf",
      need: /自己|感觉|分辨|喜欢|心动/, forbid: /汤面|盖饭|辞职/ },
    { q: "我接下来的人生应该怎么办", id: "lovers", rev: true, intent: "open",
      need: /./, forbid: /汤面|盖饭|辞职|复合/ }
  ];
  cases.forEach(function (c) {
    const o = single(c.q, c.id, c.rev);
    check("C·意图识别：" + c.q, o.intent === c.intent, o.intent);
    check("C·回答切题：" + c.q, c.need.test(flat(o)), flat(o).slice(0, 70));
    check("C·无跨领域污染：" + c.q, !c.forbid.test(flat(o)), flat(o).slice(0, 70));
  });
  check("C·二选一问保留两个选项", /炒饭/.test(single("今晚吃炒饭还是面条", "lovers", true).verdict) &&
    /面条/.test(single("今晚吃炒饭还是面条", "lovers", true).verdict));
  check("C·饮食问说明只是思路", /不能真的替你决定|选择思路/.test(single("晚上我可以吃点什么", "lovers", true).verdict));
}

/* D. 差异性与逻辑 */
{
  /* D1 同一张牌，四个不同领域 */
  const q4 = ["晚上我可以吃点什么", "我应该买这件衣服吗", "她喜欢我吗", "我明天会不会遇到她"];
  const o4 = q4.map(function (q) { return single(q, "lovers", true); });
  check("D1·同牌跨领域输出不同", new Set(o4.map(flat)).size === 4);
  check("D1·四个意图各不相同", new Set(o4.map(function (o) { return o.intent; })).size === 4, o4.map(function (o) { return o.intent; }).join(","));
  check("D1·饮食给食物", /汤面|盖饭|家常菜|粥/.test(flat(o4[0])));
  check("D1·购物谈购买", /买|下单|上限|情绪/.test(flat(o4[1])));
  check("D1·感情谈关系", /关系|对方|心意|行为/.test(flat(o4[2])));
  check("D1·未来事件不做断言", /没法可靠预测|给不了准数|预测不了/.test(o4[3].verdict) && !/一定会/.test(o4[3].verdict));

  /* D2 同一个问题，不同牌 */
  const acts = ["king-pentacles", "hermit", "sun", "three-pentacles", "tower"]
    .map(function (id) { return single("我下午可以干点什么", id, false).verdict; });
  check("D2·同问换牌：活动建议有差异", new Set(acts).size >= 4, new Set(acts).size + "/5");
  const evs = ["emperor", "sun", "three-pentacles"].map(function (id) { return single("这周会不会有意外之财", id, false).verdict; });
  check("D2·同问换牌：未来事件倾向有差异", new Set(evs).size === 3);
  const loves = ["king-wands", "two-cups", "eight-cups", "three-swords"].map(function (id) { return single("她喜欢我吗", id, false).verdict; });
  check("D2·同问换牌：感情倾向有差异", new Set(loves).size >= 4, new Set(loves).size + "/4");

  /* D3 建议必须切题 */
  const money = single("我应该买这件衣服吗", "six-pentacles", false);
  check("D3·购物建议围绕购买", (money.actions || []).length > 0 &&
    /买|上限|情绪|重复|代价|划算|消费|需要|决定|东西|用/.test((money.actions || []).join(" ")),
    (money.actions || []).join(" / ").slice(0, 60));
  const study = single("我应该怎样准备明天的考试", "hermit", false);
  check("D3·学习建议围绕行动", (study.actions || []).length === 0 ||
    /专注|时间|想清楚|复习|安排|标准|计划/.test((study.actions || []).join(" ")));
  const love = single("我明天要不要主动联系她", "king-wands", false);
  check("D3·感情建议围绕关系", /主动|对方|回应|感受|行动|她|他/.test((love.actions || []).join(" ")));
  check("D3·日常问不硬塞建议", (single("我下午可以干点什么", "king-pentacles", true).actions || []).length === 0);

  /* D4 结论 / 依据 / 建议 / 完整牌义 不重复 */
  [["我和他还会在一起吗", "eight-cups", true], ["我应该辞职吗", "three-pentacles", true],
    ["我今天适合复习什么", "ace-pentacles", false], ["这件衣服值得买吗", "six-pentacles", false],
    ["晚上我可以吃点什么", "lovers", true], ["我明天会不会在路上捡到钱", "emperor", false],
    ["她喜欢我吗", "queen-cups", false], ["我真的喜欢她吗", "lovers", true]].forEach(function (c) {
    const o = single(c[0], c[1], c[2]);
    check("D4·正文无重复句：" + c[0], dupSentences(o).length === 0, dupSentences(o).join(" | "));
  });
  const advInMeaning = cards.filter(function (c) {
    const m = M[c.id] || {};
    return m.advice && ((m.up || "") + (m.rev || "")).indexOf(m.advice) >= 0;
  });
  check("D4·建议不出现在完整牌义里", advInMeaning.length === 0, advInMeaning.slice(0, 3).map(function (c) { return c.id; }).join(","));

  /* D5 三张牌阵：真正表达牌与牌的关系，并贴住问题 */
  const trio = [{ card: byId("six-cups"), reversed: false }, { card: byId("eight-cups"), reversed: true }, { card: byId("tower"), reversed: false }];
  const love3 = out("我和他还会在一起吗", trio, ["过去", "现在", "未来"]);
  check("D5·综合表达牌间关系", /一致|拉扯|往前推|往后拉/.test(love3.synthesis), love3.synthesis.slice(0, 60));
  check("D5·综合给出综合口径", /放回|取舍点/.test(love3.synthesis), love3.synthesis.slice(-40));
  check("D5·综合贴住问题领域", /关系/.test(love3.synthesis));
  check("D5·三张阵无重复句", dupSentences(love3).length === 0, dupSentences(love3).join(" | "));
  const work3 = out("我应该辞职吗", trio, ["过去", "现在", "未来"]);
  check("D5·同三张牌换问题：综合口径不同", work3.synthesis !== love3.synthesis);
  check("D5·工作问综合不混感情", !/这段关系|你们/.test(work3.synthesis), work3.synthesis.slice(-50));
  const open3 = out("我接下来的人生应该怎么办", trio, ["过去", "现在", "未来"]);
  check("D5·开放问综合口径也不同", open3.synthesis !== love3.synthesis && open3.synthesis !== work3.synthesis);

  /* D6 open 不能抢走本可明确回答的具体问题 */
  [["晚上我可以吃点什么", "food"], ["我明天会不会在路上捡到钱", "futureEvent"],
    ["我下午可以干点什么", "daily"], ["我应该买这件衣服吗", "money"],
    ["我应该怎么安排今晚的时间", "timePlanning"], ["她喜欢我吗", "loveOther"]].forEach(function (p) {
    check("D6·具体问题不被 open 抢走：" + p[0], R.detectIntent(p[0]) === p[1], R.detectIntent(p[0]));
  });

  /* D7 无法确认的事不能写成确定结果 */
  check("D7·不把牌当读心术", !/她一定喜欢你|对方一定喜欢你|她肯定喜欢你|对方肯定爱你/.test(flat(single("她喜欢我吗", "two-cups", false))));
  ["我明天会不会遇到她", "我会不会收到工资", "我明天会不会在路上捡到钱"].forEach(function (q) {
    const o = single(q, "sun", false);
    check("D7·未来事件不写成确定结果：" + q, !/一定会|肯定会|百分之|必然/.test(o.verdict), o.verdict.slice(0, 50));
  });
  const fact = single("现在几点", "sun", false);
  check("D7·事实类承认答不了", fact.intent === "fact" && /答不了|不能/.test(flat(fact)), fact.verdict.slice(0, 40));
}

/* H. 项目一致性（静态检查；真实浏览器未运行的项在交付报告中说明） */
{
  const missing = cards.filter(function (c) { return !fs.existsSync(path.join(ROOT, "assets/tarot", c.id + ".png")); });
  const pngs = fs.readdirSync(path.join(ROOT, "assets/tarot")).filter(function (f) { return /\.png$/i.test(f); });
  check("H·78 张牌图都在 assets/tarot", missing.length === 0 && pngs.length === 78,
    missing.slice(0, 3).map(function (c) { return c.id; }).join(",") + " / 共" + pngs.length + "张");

  const tj = read("js/tarot.js"), html = read("tarot.html");
  const usedIds = Array.from(new Set((tj.match(/getElementById\("([^"]+)"\)/g) || [])
    .map(function (x) { return x.replace(/getElementById\("|"\)/g, ""); })));
  const missIds = usedIds.filter(function (id) { return html.indexOf('id="' + id + '"') < 0; });
  check("H·tarot.js 引用的元素页面都存在", missIds.length === 0, missIds.join(","));

  const files = ["js/reading.js", "js/cards-meaning.js", "js/tarot.js", "js/data.js", "js/main.js", "js/birthday.js",
    "js/card-art.js", "tarot.html", "index.html", "about.html", "birthday.html", "css/style.css"];
  const net = files.filter(function (f) { return /fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\baxios\b/.test(read(f)); });
  check("H·没有网络请求代码", net.length === 0, net.join(","));
  const keys = files.filter(function (f) { return /(api[_-]?key|secret[_-]?key|\bsk-[A-Za-z0-9]{10,}|Bearer\s+[A-Za-z0-9._-]{10,})/i.test(read(f)); });
  check("H·没有 API Key / 密钥", keys.length === 0, keys.join(","));

  check("H·建议区为空时隐藏", /if \(data\.actions && data\.actions\.length\)/.test(tj) && /if \(data\.closing\)/.test(tj));
  check("H·完整牌义按需展开且含正逆位", /看这张牌的完整牌义/.test(tj) && /\[\["正位", cm\.up\], \["逆位", cm\.rev\]\]/.test(tj));
  check("H·用户问题用 textContent 渲染", /askText\.textContent = state\.question/.test(tj));
  check("H·牌面信息含牌名/正逆位/核心牌义字段", /name: r\.card\.name/.test(read("js/reading.js")) && /ori: ori\(r\)/.test(read("js/reading.js")));
}

/* I. 解读输出 ⇄ 页面渲染 的字段契约（静态 + 结构检查，非真实浏览器） */
{
  const tj = read("js/tarot.js"), css = read("css/style.css");
  const samples = [
    single("她喜欢我吗", "lovers", true),
    single("晚上我可以吃点什么", "lovers", true),
    single("我明天会不会在路上捡到钱", "emperor", false),
    single("我应该买这件衣服吗", "six-pentacles", false),
    single("我下午可以干点什么", "king-pentacles", true),
    out("我和他还会在一起吗", [
      { card: byId("six-cups"), reversed: false },
      { card: byId("eight-cups"), reversed: true },
      { card: byId("tower"), reversed: false }
    ], ["过去", "现在", "未来"])
  ];
  const badShape = samples.filter(function (o) {
    if (typeof o.verdict !== "string" || typeof o.synthesis !== "string" || typeof o.closing !== "string") return true;
    if (typeof o.actionsTitle !== "string" || typeof o.intent !== "string") return true;
    if (!Array.isArray(o.actions) || o.actions.some(function (a) { return typeof a !== "string"; })) return true;
    if (!Array.isArray(o.cards)) return true;
    return o.cards.some(function (c) {
      return typeof c.pos !== "string" || typeof c.name !== "string" || typeof c.en !== "string" ||
        typeof c.ori !== "string" || typeof c.core !== "string" || typeof c.apply !== "string" || !byId(c.id);
    });
  });
  check("I·输出结构与渲染层契约一致", badShape.length === 0);
  check("I·牌面条目带 id / 正逆位 / 核心牌义（供牌面信息与完整牌义）",
    samples.every(function (o) {
      return o.cards.every(function (c) { return !!byId(c.id) && /正位|逆位/.test(c.ori); });
    }));
  check("I·渲染层读取的字段都存在", /data\.verdict/.test(tj) && /data\.cards/.test(tj) && /data\.actions/.test(tj) &&
    /data\.actionsTitle/.test(tj) && /data\.synthesis/.test(tj) && /data\.closing/.test(tj) &&
    /c\.core/.test(tj) && /c\.apply/.test(tj) && /c\.ori/.test(tj) && /c\.id/.test(tj));
  check("I·78 张牌都能展开完整正逆位牌义", cards.every(function (c) {
    const m = M[c.id] || {}; return !!m.up && !!m.rev;
  }));
  check("I·牌面图片路径与现有素材一致", cards.every(function (c) {
    return fs.existsSync(path.join(ROOT, "assets/tarot", c.id + ".png"));
  }));
  check("I·牌背沿用项目 CSS 牌背（未引入新素材）", /\.card-back\s*\{/.test(css) && /fan-card-face card-back/.test(tj));
  check("I·单张与三张牌阵都产出综合/收尾字段", samples.every(function (o) { return typeof o.synthesis === "string" && typeof o.closing === "string"; }));
}

/* ========== 第五轮：整体运势 / 未来事件分类 / 日常与牌义关联 / 三张阵综合 / 去重 ========== */

/* J1 意图分类：几组必须分开的意图 */
{
  const cls = [
    ["明天我运气怎么样", "fortune"], ["明天整体运势如何", "fortune"], ["最近运气怎么样", "fortune"],
    ["明天出门会不会遇到好事", "futureEvent"], ["明天会不会遇到倒霉的事", "futureEvent"],
    ["我明天会不会在路上捡到钱", "futureEvent"], ["我明天能收到工资吗", "futureEvent"],
    ["我明天考试会顺利吗", "futureEvent"], ["我考试会不会通过", "futureEvent"],
    ["我明天适合主动做一件新事情吗", "daily"], ["我明天适合开始一个新计划吗", "daily"],
    ["我应该怎样准备考试", "study"], ["我应该怎样准备明天的考试", "study"],
    ["她喜不喜欢我", "loveOther"], ["我应该主动联系她吗", "loveAction"],
    ["晚上我可以吃点什么", "food"], ["我应该买这件衣服吗", "money"],
    ["我应该辞职吗", "work"], ["我接下来的人生应该怎么办", "open"],
    ["我应该怎么安排今晚的时间", "timePlanning"]
  ];
  cls.forEach(function (p) {
    check("J1·意图：" + p[0], R.detectIntent(p[0]) === p[1], R.detectIntent(p[0]));
  });
  check("J1·整体运势≠偶然事件", R.detectIntent("明天我运气怎么样") !== R.detectIntent("我明天会不会捡到钱"));
  check("J1·结果≠准备", R.detectIntent("我考试会不会通过") !== R.detectIntent("我应该怎样准备考试"));
  check("J1·对方心意≠自己要不要主动", R.detectIntent("她喜不喜欢我") !== R.detectIntent("我应该主动联系她吗"));
  check("J1·泛化词不抢领域意图：明天+应该仍是学习", R.detectIntent("我明天应该怎么准备考试") === "study", R.detectIntent("我明天应该怎么准备考试"));
}

/* J2 整体运势：先回应整体状态，再给象征角度；不回避、不自相矛盾、不套同一模板 */
{
  const ids = ["wheel", "sun", "emperor", "star", "moon"];
  const outs = ids.map(function (id, i) { return single("明天我运气怎么样", id, i === 0 || i === 4); });
  outs.forEach(function (o, i) {
    const v = o.verdict;
    check("J2·识别为 fortune#" + i, o.intent === "fortune", o.intent);
    check("J2·先回应整体状态#" + i, /整体|大方向|底色|调子/.test(v), v.slice(0, 40));
    check("J2·给出牌面象征角度#" + i, /它讲的是|三张分别在讲/.test(v), v.slice(0, 60));
    check("J2·不用回避式开场#" + i, !/答不细|答不了|给不出答案|猜不出来/.test(v), v.slice(0, 40));
    check("J2·提到牌名与正逆位#" + i, v.indexOf(byId(ids[i]).name) >= 0 && /正位|逆位/.test(v));
    check("J2·不确定性只说一次#" + i,
      (v.match(/给不了准数|没法可靠预测|预测不了|不是对结果的保证|拿不准/g) || []).length <= 1, v);
    check("J2·不出现矛盾结论#" + i, !(/偏顺/.test(v) && /无法判断|看不清|不好说/.test(v)), v.slice(0, 50));
    check("J2·正文无重复句#" + i, dupSentences(o).length === 0, dupSentences(o).join(" | "));
  });
  check("J2·不同牌面的整体运势不同", new Set(outs.map(function (o) { return o.verdict; })).size >= 4,
    new Set(outs.map(function (o) { return o.verdict; })).size + "/5");

  const f3 = out("明天我运气怎么样", [
    { card: byId("six-cups"), reversed: false },
    { card: byId("wheel"), reversed: true },
    { card: byId("sun"), reversed: false }
  ], ["过去", "现在", "未来"]);
  check("J2·三张牌的整体运势也回应整体状态", f3.intent === "fortune" && /整体|大方向|底色|调子/.test(f3.verdict));
  check("J2·三张牌的整体运势列出三张牌", ["圣杯六", "命运之轮", "太阳"].every(function (n) { return f3.verdict.indexOf(n) >= 0; }), f3.verdict.slice(0, 80));
  check("J2·三张牌运势无重复句", dupSentences(f3).length === 0, dupSentences(f3).join(" | "));
}

/* J3 未来事件：按事件类型给不同逻辑，只在牌义相关时给倾向 */
{
  const chance = ["emperor", "wheel", "sun"].map(function (id) { return single("我明天会不会在路上捡到钱", id, false); });
  chance.forEach(function (o, i) {
    check("J3·捡钱类识别#" + i, o.intent === "futureEvent", o.intent);
    check("J3·不机械分配倾向#" + i, !/偏顺|稳中偏顺|五五开|百分比|概率很大|机会很大/.test(o.verdict), o.verdict.slice(0, 50));
    check("J3·说明偶然事件不可预期#" + i, /偶然事件|没什么可预期/.test(o.verdict));
    check("J3·不确定性只说一次#" + i, (o.verdict.match(/给不了准数|没法可靠预测|预测不了/g) || []).length === 1, o.verdict);
  });
  check("J3·皇帝不把规则/边界当成捡钱的信号",
    !/规则[\s\S]{0,24}捡到钱|捡到钱[\s\S]{0,24}规则/.test(chance[0].verdict), chance[0].verdict.slice(0, 70));
  check("J3·同问换牌有实质差异", new Set(chance.map(function (o) { return o.verdict; })).size === 3);

  const salary = single("我明天能收到工资吗", "ten-pentacles", false);
  check("J3·工资类识别为 futureEvent", salary.intent === "futureEvent", salary.intent);
  check("J3·工资类给现实核对建议", /发薪日/.test(salary.verdict) && /工资单|银行|流水|到账/.test(salary.verdict), salary.verdict.slice(-60));
  check("J3·工资类不预测结果", !/偏顺|一定会到账|肯定能到|必然会到/.test(salary.verdict));

  const exam = ["sun", "three-pentacles"].map(function (id) { return single("我明天考试会顺利吗", id, false); });
  exam.forEach(function (o, i) {
    check("J3·考试类识别#" + i, o.intent === "futureEvent", o.intent);
    check("J3·考试类谈准备#" + i, /准备/.test(o.verdict));
    check("J3·考试类不许诺结果#" + i, !/一定能过|肯定能过|包过|必然通过|一定顺利/.test(o.verdict), o.verdict.slice(0, 60));
    check("J3·考试类结合牌面状态#" + i, /它讲的是/.test(o.verdict));
  });
  check("J3·考试换牌有差异", exam[0].verdict !== exam[1].verdict);

  const bad = single("明天会不会遇到倒霉的事", "sun", false);
  check("J3·倒霉类不预言坏事", bad.intent === "futureEvent" && !/一定|肯定|必然|注定/.test(bad.verdict), bad.verdict.slice(0, 60));
  const going = single("明天出门会不会遇到好事", "sun", false);
  check("J3·出门类回到现实条件", going.intent === "futureEvent" && /出门/.test(going.verdict));
  check("J3·未来事件正文无重复句", chance.concat([salary], exam, [bad, going]).every(function (o) { return dupSentences(o).length === 0; }));
}

/* J4 日常问题：先解决实际问题，牌义只在说得通时才接上 */
{
  const foodL = single("晚上我可以吃点什么", "lovers", true);
  check("J4·饮食给出具体方向", /汤面|盖饭|家常菜|粥|炒饭|小炒|砂锅|炖菜/.test(foodL.verdict), foodL.verdict.slice(0, 60));
  check("J4·饮食给出选择标准", /标准|挑|先看/.test(foodL.verdict));
  check("J4·不声称牌代表某种食物", !/牌面偏向「稳|它的意思是「稳|牌面代表(清淡|家常菜|汤面|盖饭)/.test(foodL.verdict), foodL.verdict.slice(0, 70));
  check("J4·引用的牌义忠于原意", /在两端之间摇摆/.test(foodL.verdict));
  const foodS = single("晚上我可以吃点什么", "sun", false);
  check("J4·换牌后实际建议保持稳定", /汤面|盖饭|家常菜/.test(foodS.verdict) && /汤面|盖饭|家常菜/.test(foodL.verdict));
  check("J4·换牌后牌义角度不同", foodL.verdict !== foodS.verdict && /不是食物/.test(foodS.verdict), foodS.verdict.slice(-50));

  const newPlan = single("我明天适合开始一个新计划吗", "wheel", true);
  check("J4·新计划问题识别为 daily", newPlan.intent === "daily", newPlan.intent);
  check("J4·新计划给可执行的一小步", /试水|拆到最小|一小步|小到/.test(newPlan.verdict), newPlan.verdict.slice(0, 60));
  check("J4·问明天时不再说今天", !/今天/.test(newPlan.verdict), newPlan.verdict);
  check("J4·新计划建议与牌面状态一致", /偏稳|偏有劲/.test(newPlan.verdict));

  const wear = single("我明天穿什么好", "queen-cups", false);
  check("J4·穿衣问不出现饮食建议", !/汤面|盖饭|家常菜|火锅/.test(flat(wear)));
}

/* J5 三张阵：辞职案要解释冲突并回到现实 */
{
  const trio = [
    { card: byId("six-cups"), reversed: false },
    { card: byId("eight-cups"), reversed: true },
    { card: byId("tower"), reversed: false }
  ];
  const slots = ["过去", "现在", "未来"];
  const quit = out("我应该辞职吗", trio, slots);
  check("J5·综合围绕辞职这个问题", /辞职|离开|走/.test(quit.synthesis + quit.verdict), quit.synthesis.slice(0, 50));
  check("J5·解释留恋与变化之间的冲突", /舍不得|守住|留/.test(quit.synthesis) && /变|打破/.test(quit.synthesis), quit.synthesis.slice(0, 120));
  check("J5·给出需要核实的现实条件", /收入|下家|缓冲|合同|社保/.test(quit.synthesis), quit.synthesis.slice(-70));
  check("J5·未来位置的牌不被当成必然", /不是注定|方向/.test(quit.synthesis));
  check("J5·综合仍包含阻碍与转机", /最需要留意/.test(quit.synthesis) && /转机/.test(quit.synthesis));
  check("J5·三张阵无重复句", dupSentences(quit).length === 0, dupSentences(quit).join(" | "));

  const loveSame = out("我和他还会在一起吗", trio, slots);
  check("J5·同三张牌换问题：综合口径不同", loveSame.synthesis !== quit.synthesis);
  check("J5·感情问不混入辞职的现实条件", !/社保|合同|下家|缓冲期/.test(loveSame.synthesis), loveSame.synthesis.slice(-60));
  check("J5·感情问综合回到关系", /关系/.test(loveSame.synthesis));
}

/* J6 去重：新分支也不能出现正文重复 */
{
  [["明天我运气怎么样", "wheel", true], ["明天我运气怎么样", "sun", false],
    ["我明天会不会在路上捡到钱", "emperor", false], ["我明天能收到工资吗", "ten-pentacles", false],
    ["我明天考试会顺利吗", "sun", false], ["晚上我可以吃点什么", "lovers", true],
    ["晚上我可以吃点什么", "sun", false], ["我明天适合开始一个新计划吗", "wheel", true],
    ["我应该买这件衣服吗", "lovers", true], ["我接下来的人生应该怎么办", "fool", false]].forEach(function (c) {
    const o = single(c[0], c[1], c[2]);
    check("J6·正文无重复句：" + c[0] + "×" + c[1], dupSentences(o).length === 0, dupSentences(o).join(" | "));
  });
}

/* ========== 第六轮：感情类问题专项（对方心意 / 回避 / 关系发展） ========== */

/* K1 分类：这几句必须进感情类，且不能落到 open */
{
  const cls = [
    ["她对我有感觉吗", "loveOther"], ["他喜欢我吗", "loveOther"], ["对方是不是对我有意思", "loveOther"],
    ["她对我什么感觉", "loveOther"], ["她对我是不是没感觉", "loveOther"], ["他对我怎么看", "loveOther"],
    ["她对我有好感吗", "loveOther"], ["她对我到底什么想法", "loveOther"],
    ["对方是不是在躲着我", "loveOther"], ["他是不是在回避我", "loveOther"],
    ["她还想和我继续发展吗", "loveFuture"], ["我们还会继续走下去吗", "loveFuture"]
  ];
  cls.forEach(function (p) { check("K1·分类：" + p[0], R.detectIntent(p[0]) === p[1], R.detectIntent(p[0])); });
  check("K1·不误伤工作：我对工作没感觉→work", R.detectIntent("我对工作没感觉") === "work", R.detectIntent("我对工作没感觉"));
  check("K1·不误伤工作：公司的发展方向→work", R.detectIntent("公司的发展方向是什么") === "work", R.detectIntent("公司的发展方向是什么"));
  check("K1·不误伤开放：她今天怎么样→open", R.detectIntent("她今天怎么样") === "open", R.detectIntent("她今天怎么样"));
  check("K1·与其它意图隔离",
    R.detectIntent("她对我有感觉吗") === "loveOther" && R.detectIntent("明天我运气怎么样") === "fortune" &&
    R.detectIntent("我应该辞职吗") === "work" && R.detectIntent("晚上我可以吃点什么") === "food" &&
    R.detectIntent("我应该怎样准备考试") === "study");
}

/* K2 两个原案例：必须围绕"对方有没有感觉"回答，而不是通用牌义 + 牌面反思问句 */
{
  const a = single("她对我有感觉吗", "nine-cups", true);
  const b = single("她对我有感觉吗", "page-wands", false);
  [["圣杯九逆位", a, "nine-cups"], ["权杖侍从正位", b, "page-wands"]].forEach(function (p) {
    const v = p[1].verdict;
    check("K2·识别为询问对方心意：" + p[0], p[1].intent === "loveOther", p[1].intent);
    check("K2·围绕对方的心意/态度：" + p[0], /对方|心意|态度|好感|靠近/.test(v), v.slice(0, 60));
    check("K2·在牌义之外给出针对问题的判断：" + p[0], /倾向|好感|态度|距离|看不出|偏|热度/.test(v), v.slice(0, 70));
    check("K2·不再用开放式回避：" + p[0], !/本来就开放|牌给不出结论|答不细/.test(v), v.slice(0, 50));
    check("K2·不再问用户自己的兴趣：" + p[0],
      v.indexOf((M[p[2]] || {}).reflect || "###") < 0 && !/你最近对什么起了兴趣|你真正想要的那个/.test(v));
  });
  check("K2·圣杯九逆位如实说明它讲的是自己这一侧", /这一侧|回答不了对方心里怎么想/.test(a.verdict), a.verdict.slice(0, 80));
  check("K2·权杖侍从正位给出对方向的好感倾向", /好感|靠近|热度/.test(b.verdict), b.verdict.slice(0, 80));
  check("K2·两例输出不同", a.verdict !== b.verdict);
  check("K2·两例都引用各自牌义",
    /得到了，却发现没那么开心/.test(a.verdict) && /有点新鲜感，还不成熟|冒出新/.test(b.verdict));
}

/* K3 同一问题 × 多张牌：解读与牌义差异，且不许诺对方的心意 */
{
  const ids = ["two-cups", "page-wands", "nine-cups", "eight-cups", "tower", "three-swords"];
  const outs = ids.map(function (id) { return single("她对我有感觉吗", id, id === "nine-cups" || id === "eight-cups"); });
  check("K3·同问换牌：输出互不相同", new Set(outs.map(function (o) { return o.verdict; })).size >= 5,
    new Set(outs.map(function (o) { return o.verdict; })).size + "/6");
  check("K3·每例都用到了该牌的关系素材", ids.every(function (id, i) {
    const rel = (REL[id] || {})[((i === 2 || i === 3) ? "r" : "u")];
    return rel && outs[i].verdict.indexOf(rel) >= 0;
  }));
  outs.forEach(function (o, i) {
    check("K3·不把对方的心意说成事实#" + i,
      !/对方一定|他一定对你|她一定对你|肯定喜欢你|一定是喜欢你|必然喜欢你/.test(o.verdict), o.verdict.slice(0, 60));
    check("K3·区分牌面与事实#" + i, /牌|倾向|看得出|看不出|回答不了/.test(o.verdict), o.verdict.slice(0, 50));
    check("K3·正文无重复句#" + i, dupSentences(o).length === 0, dupSentences(o).join(" | "));
  });
  const lo = single("她对我有感觉吗", "eight-cups", false);
  check("K3·偏冷的牌给出偏冷倾向", /偏冷|后退|热度并不高|缺/.test(lo.verdict), lo.verdict.slice(0, 80));
}

/* K4 追问/建议必须服务当前问题：观察现实里的关系信号，而不是问用户自己的兴趣 */
{
  ["two-cups", "page-wands", "nine-cups", "queen-cups"].forEach(function (id) {
    const o = single("她对我有感觉吗", id, false);
    const act = (o.actions || []).join(" ");
    check("K4·建议观察现实信号：" + id, /行为|行动|找你|单独相处|回应|证据|做了什么/.test(act), act.slice(0, 60));
    check("K4·建议不是牌面反思问句：" + id, act.indexOf((M[id] || {}).reflect || "###") < 0, act.slice(0, 40));
    check("K4·建议不带用户自身兴趣话题：" + id, !/你最近对什么起了兴趣|你自己的兴趣/.test(act));
  });
}

/* K5 "对方是不是在躲着我"：走回避类回答，观察点仍可现实核对 */
{
  const h = single("对方是不是在躲着我", "hermit", false);
  check("K5·识别为询问对方态度", h.intent === "loveOther", h.intent);
  check("K5·围绕距离/回避而非喜不喜欢",
    /距离|回避|拉开|靠近|冷淡|态度|温度/.test(h.verdict) && !/喜不喜欢你|喜欢你/.test(h.verdict), h.verdict.slice(0, 70));
  check("K5·结合隐者的「需要空间」", /需要空间|空间/.test(h.verdict), h.verdict.slice(0, 90));
  check("K5·建议可在现实里核对",
    /单独见面|单独相处|一致性|主动找你|绕开|本身就是一种回答/.test((h.actions || []).join(" ")), (h.actions || []).join(" "));
  const c = single("对方是不是在躲着我", "two-cups", false);
  check("K5·换牌后不否定对方在靠近", /不像在回避|往你这边来|互相回应/.test(c.verdict), c.verdict.slice(0, 80));
  check("K5·冷/退的牌与热的牌结论不同", h.verdict !== c.verdict);
}

/* K6 关系发展类：结合牌义谈走向，不用开放类兜底 */
{
  const o = single("她还想和我继续发展吗", "eight-cups", false);
  check("K6·识别为关系发展", o.intent === "loveFuture", o.intent);
  check("K6·给出走向倾向", /偏|倾向|机会|可能|缺/.test(o.verdict), o.verdict.slice(0, 70));
  check("K6·结合该牌关系素材", /有人想走，只是还没下定决心/.test(o.verdict));
  check("K6·不用开放类兜底", !/本身就开放|牌给不出结论|答不细/.test(o.verdict));
  const same = single("她还想和我继续发展吗", "star", false);
  check("K6·换牌后走向不同", same.verdict !== o.verdict);
}

/* K7 全牌面结构检查：78 张 × 正逆位问"她对我有感觉吗"，都不能跑题 */
{
  const bad = { intent: [], other: [], reflect: [], generic: [], dup: [] };
  cards.forEach(function (c) {
    [false, true].forEach(function (rev) {
      const o = single("她对我有感觉吗", c.id, rev);
      const v = o.verdict || "";
      const tag = c.id + (rev ? "逆" : "正");
      if (o.intent !== "loveOther") bad.intent.push(tag);
      if (v.indexOf("对方") < 0) bad.other.push(tag);
      if (v.indexOf((M[c.id] || {}).reflect || "###") >= 0) bad.reflect.push(tag);
      if (/本来就开放|牌给不出结论|答不细|你最近对什么起了兴趣/.test(v)) bad.generic.push(tag);
      if (dupSentences(o).length) bad.dup.push(tag);
    });
  });
  check("K7·全部识别为对方心意", bad.intent.length === 0, bad.intent.slice(0, 5).join(","));
  check("K7·全部围绕对方展开", bad.other.length === 0, bad.other.slice(0, 5).join(","));
  check("K7·没有一张牌误用反思问句", bad.reflect.length === 0, bad.reflect.slice(0, 5).join(","));
  check("K7·没有一张牌退回开放类套话", bad.generic.length === 0, bad.generic.slice(0, 5).join(","));
  check("K7·正文无重复句", bad.dup.length === 0, bad.dup.slice(0, 5).join(","));
}

/* 输出 */
console.log("通过：" + pass + "  失败：" + fail);
if (fails.length) {
  console.log("— 失败项 —");
  fails.forEach(function (f) { console.log("  ✗ " + f); });
  process.exitCode = 1;
} else {
  console.log("全部通过。");
}
