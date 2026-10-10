/* =========================================================
   月隐 Tarot —— 塔罗占卜交互（提问 → 扇形抽牌 → 个性化解读）
   流程：输入问题 → 扇形摊开 → 亲手选牌 → 揭开命运 → 逐张翻牌 → 解读
   说明：
   - 沿用 78 张牌数据、assets/tarot 图片、牌背样式、解读数据与大图弹窗。
   - 解读由 js/reading.js 用本地模板组合，全程离线。
   - 用户输入的问题只用 textContent 渲染，不拼进 HTML。
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  var askStep = document.getElementById("askStep");
  var drawStep = document.getElementById("drawStep");
  var questionInput = document.getElementById("questionInput");
  var askError = document.getElementById("askError");
  var startBtn = document.getElementById("startBtn");
  var editQuestionBtn = document.getElementById("editQuestionBtn");
  var questionShown = document.getElementById("questionShown");

  var stage = document.getElementById("deckStage");
  var hintEl = document.getElementById("drawHint");
  var resetBtn = document.getElementById("resetBtn");
  var revealBtn = document.getElementById("revealBtn");
  var reading = document.getElementById("reading");

  // 大图弹窗
  var modal = document.getElementById("cardModal");
  var modalImg = document.getElementById("modalImg");
  var modalName = document.getElementById("modalName");
  var modalOri = document.getElementById("modalOri");
  var modalMeaning = document.getElementById("modalMeaning");
  var modalAdvice = document.getElementById("modalAdvice");
  var modalClose = document.getElementById("modalClose");

  if (!stage || !hintEl || !revealBtn || !askStep || !drawStep) return;

  var SLOT_LABELS = { single: [""], three: ["过去", "现在", "未来"] };
  var ENGINE = window.MoonveilReading || null;

  var state = {
    question: "",
    mode: "single",
    deck: [],
    cards: [],        // [{ i, card, el, img, selected, slot, reversed }]
    slotEls: [],
    selectedCount: 0,
    phase: "select",  // select | revealing | done
    timers: [],
    layout: null
  };

  /* ---------- 小工具 ---------- */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function getSelectedRadio(name) {
    var checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : null;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function requiredCount() { return state.mode === "three" ? 3 : 1; }

  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    state.timers.push(id);
    return id;
  }

  function clearTimers() {
    state.timers.forEach(function (id) { clearTimeout(id); });
    state.timers = [];
  }

  function cardImagePath(card) { return "assets/tarot/" + card.id + ".png"; }

  /* ---------- 大图弹窗 ---------- */
  function openCardModal(card, reversed) {
    var oriText = reversed ? "逆位" : "正位";
    var meaning = reversed ? card.reversed : card.upright;

    modalImg.src = cardImagePath(card);
    modalImg.alt = card.name;
    modalImg.className = "card-img" + (reversed ? " reversed" : "");

    modalName.textContent = card.name + " · " + card.en;
    modalOri.textContent = (reversed ? "↓ " : "↑ ") + oriText;
    modalOri.className = "orientation" + (reversed ? " reversed" : "");
    modalMeaning.textContent = oriText + "含义：" + meaning;
    modalAdvice.textContent = "现实建议：" + card.advice;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCardModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  /* ---------- 结果解读（本地模板组合，用户文本一律 textContent） ---------- */
  function appendParagraph(parent, className, text) {
    var p = document.createElement("p");
    p.className = className;
    p.textContent = text;
    parent.appendChild(p);
    return p;
  }

  function renderReading() {
    reading.innerHTML = "";
    reading.classList.remove("reading--show");

    var results = state.cards
      .filter(function (c) { return c.selected; })
      .sort(function (a, b) { return a.slot - b.slot; })
      .map(function (c) { return { card: c.card, reversed: c.reversed }; });
    var slots = SLOT_LABELS[state.mode];

    var data;
    if (ENGINE) {
      data = ENGINE.compose(state.question, results, slots);
    } else {
      // 兜底：引擎缺失时退回最简结构
      data = {
        verdict: "关于你问的「" + state.question + "」，下面这几张牌或许能给你一点提示。",
        cards: results.map(function (r, i) {
          return {
            pos: slots[i] || "",
            name: r.card.name,
            en: r.card.en,
            ori: r.reversed ? "逆位" : "正位",
            core: r.reversed ? r.card.reversed : r.card.upright,
            apply: ""
          };
        }),
        synthesis: "",
        actions: results.map(function (r) { return r.card.advice; }),
        actionsTitle: "现实中可以怎么做",
        closing: ""
      };
    }

    var title = document.createElement("h3");
    title.className = "section-title";
    title.textContent = "牌面解读";
    reading.appendChild(title);

    var ask = document.createElement("div");
    ask.className = "reading-ask";
    var askLabel = document.createElement("div");
    askLabel.className = "label";
    askLabel.textContent = "你问的是";
    var askText = document.createElement("div");
    askText.className = "text";
    askText.textContent = state.question; // 安全渲染
    ask.appendChild(askLabel);
    ask.appendChild(askText);
    reading.appendChild(ask);

    var verdict = document.createElement("div");
    verdict.className = "reading-verdict";
    verdict.textContent = data.verdict || "";
    reading.appendChild(verdict);

    var cardsWrap = document.createElement("div");
    cardsWrap.className = "reading-cards";
    (data.cards || []).forEach(function (c) {
      var block = document.createElement("div");
      block.className = "reading-card";

      var head = document.createElement("div");
      head.className = "reading-card-head";
      if (c.pos) {
        var pos = document.createElement("span");
        pos.className = "pos";
        pos.textContent = c.pos;
        head.appendChild(pos);
      }
      var name = document.createElement("span");
      name.className = "name";
      name.textContent = c.name;
      var en = document.createElement("span");
      en.className = "en";
      en.textContent = c.en;
      var ori = document.createElement("span");
      ori.className = "ori";
      ori.textContent = c.ori;
      head.appendChild(name);
      head.appendChild(en);
      head.appendChild(ori);
      block.appendChild(head);

      if (c.core) block.appendChild(document.createElement("p")).textContent = c.core;
      if (c.apply) block.appendChild(document.createElement("p")).textContent = c.apply;

      // 可展开：这张牌的完整正逆位牌义（按需查看，不与"行动建议"重复）
      var cm = (window.CARD_MEANINGS || {})[c.id] || {};
      if (cm.up || cm.rev) {
        var details = document.createElement("details");
        details.className = "reading-more";
        var summ = document.createElement("summary");
        summ.textContent = "看这张牌的完整牌义（正位 / 逆位）";
        details.appendChild(summ);
        [["正位", cm.up], ["逆位", cm.rev]].forEach(function (pair) {
          if (!pair[1]) return;
          var p = document.createElement("p");
          var b = document.createElement("strong");
          b.textContent = pair[0] + "：";
          var v = document.createElement("span");
          v.textContent = pair[1];
          p.appendChild(b);
          p.appendChild(v);
          details.appendChild(p);
        });
        block.appendChild(details);
      }
      cardsWrap.appendChild(block);
    });
    if (cardsWrap.children.length) reading.appendChild(cardsWrap);

    if (data.synthesis) {
      appendParagraph(reading, "reading-synth", data.synthesis);
    }

    if (data.actions && data.actions.length) {
      var doWrap = document.createElement("div");
      doWrap.className = "reading-do";
      var dh = document.createElement("h4");
      dh.textContent = data.actionsTitle || "现实中可以怎么做";
      doWrap.appendChild(dh);
      var ul = document.createElement("ul");
      data.actions.forEach(function (a) {
        var li = document.createElement("li");
        li.textContent = a;
        ul.appendChild(li);
      });
      doWrap.appendChild(ul);
      reading.appendChild(doWrap);
    }

    if (data.closing) {
      appendParagraph(reading, "reading-close", data.closing);
    }

    reading.classList.add("reading--show");
  }

  /* ---------- 扇形几何 ---------- */
  function fanParams(W) {
    var mobile = W < 640;
    var N = mobile ? 13 : 21;
    var maxAngle = mobile ? 42 : 44;
    var cardW = mobile ? clamp(W * 0.17, 44, 62) : clamp(W * 0.108, 90, 112);
    var cardH = Math.round(cardW * 32 / 17);
    var spacingRatio = 0.42;
    var maxRad = maxAngle * Math.PI / 180;
    var R = spacingRatio * cardW * (N - 1) / (2 * maxRad);
    return { mobile: mobile, N: N, maxAngle: maxAngle, cardW: cardW, cardH: cardH, R: R };
  }

  function fanCenter(i, count, F, Cx, pivotY) {
    var t = count > 1 ? (i - (count - 1) / 2) / ((count - 1) / 2) : 0;
    var phi = t * F.maxAngle;
    var rad = phi * Math.PI / 180;
    return { cx: Cx + F.R * Math.sin(rad), cy: pivotY - F.R * Math.cos(rad), phi: phi };
  }

  function fanBBox(F, count, Cx, pivotY) {
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    var hw = F.cardW / 2, hh = F.cardH / 2;
    for (var i = 0; i < count; i++) {
      var p = fanCenter(i, count, F, Cx, pivotY);
      var rad = p.phi * Math.PI / 180, cs = Math.cos(rad), sn = Math.sin(rad);
      var pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
      for (var j = 0; j < 4; j++) {
        var x = p.cx + pts[j][0] * cs - pts[j][1] * sn;
        var y = p.cy + pts[j][0] * sn + pts[j][1] * cs;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY, w: maxX - minX, h: maxY - minY };
  }

  function computeLayout() {
    var W = stage.clientWidth || (stage.parentNode && stage.parentNode.clientWidth) || 900;
    var F = fanParams(W);
    var bb = fanBBox(F, F.N, 0, 0);

    var avail = W - 10;
    if (bb.w > avail) {
      var k = avail / bb.w;
      var nw = F.cardW * k;
      var maxRad = F.maxAngle * Math.PI / 180;
      F = {
        mobile: F.mobile, N: F.N, maxAngle: F.maxAngle,
        cardW: nw, cardH: Math.round(nw * 32 / 17),
        R: 0.42 * nw * (F.N - 1) / (2 * maxRad)
      };
      bb = fanBBox(F, F.N, 0, 0);
    }

    var Cx = (W - bb.w) / 2 - bb.minX;
    var pivotY = -bb.minY;

    var n = requiredCount();
    var slotW = F.mobile ? Math.min(96, Math.floor((W - 24) / 3)) : 116;
    var slotH = Math.round(slotW * 32 / 17);
    var slotGap = F.mobile ? 12 : 24;
    var totalSlots = n * slotW + (n - 1) * slotGap;
    var slotStartX = Math.max(0, (W - totalSlots) / 2);
    var slotsTop = bb.h + (F.mobile ? 40 : 48);
    var slotCy = slotsTop + slotH / 2;
    var stageH = slotsTop + slotH + (F.mobile ? 26 : 30);

    return {
      W: W, F: F, Cx: Cx, pivotY: pivotY, bb: bb,
      slotW: slotW, slotH: slotH, slotGap: slotGap,
      slotStartX: slotStartX, slotCy: slotCy, stageH: stageH
    };
  }

  /* ---------- 摆放 ---------- */
  function placeFan(el, p, F, s, z) {
    el.style.setProperty("--w", F.cardW + "px");
    el.style.setProperty("--h", F.cardH + "px");
    el.style.setProperty("--tx", (p.cx - F.cardW / 2).toFixed(1) + "px");
    el.style.setProperty("--ty", (p.cy - F.cardH / 2).toFixed(1) + "px");
    el.style.setProperty("--r", p.phi.toFixed(2) + "deg");
    el.style.setProperty("--s", s.toFixed(3));
    el.style.setProperty("--z", String(z));
  }

  function slotCenterX(L, k) {
    return L.slotStartX + L.slotW / 2 + k * (L.slotW + L.slotGap);
  }

  function placeSlotCard(el, k, L) {
    el.style.setProperty("--w", L.F.cardW + "px");
    el.style.setProperty("--h", L.F.cardH + "px");
    el.style.setProperty("--tx", (slotCenterX(L, k) - L.F.cardW / 2).toFixed(1) + "px");
    el.style.setProperty("--ty", (L.slotCy - L.F.cardH / 2).toFixed(1) + "px");
    el.style.setProperty("--r", "0deg");
    el.style.setProperty("--s", (L.slotW / L.F.cardW).toFixed(3));
    el.style.setProperty("--z", String(4000 + k));
  }

  function placeSlotEl(se, k, L) {
    se.style.setProperty("--w", L.slotW + "px");
    se.style.setProperty("--h", L.slotH + "px");
    se.style.setProperty("--tx", (slotCenterX(L, k) - L.slotW / 2).toFixed(1) + "px");
    se.style.setProperty("--ty", (L.slotCy - L.slotH / 2).toFixed(1) + "px");
  }

  function layoutAll() {
    var L = state.layout;
    if (!L || !state.cards.length) return;

    var active = state.cards.filter(function (c) { return !c.selected; });
    active.forEach(function (c, idx) {
      var p = fanCenter(idx, active.length, L.F, L.Cx, L.pivotY);
      placeFan(c.el, p, L.F, 1, idx + 1);
    });

    state.cards.filter(function (c) { return c.selected; }).forEach(function (c) {
      placeSlotCard(c.el, c.slot, L);
    });

    state.slotEls.forEach(function (se, k) { placeSlotEl(se, k, L); });
  }

  function entrance() {
    var L = state.layout;
    if (!L) return;
    var F = L.F;
    var cards = state.cards;

    cards.forEach(function (c, idx) {
      c.el.style.transitionDelay = "0ms";
      c.el.style.opacity = "0";
      placeFan(c.el, { cx: L.Cx, cy: L.pivotY - F.R + 26, phi: 0 }, F, 0.9, idx + 1);
    });

    void stage.offsetWidth;

    var mid = (cards.length - 1) / 2;
    cards.forEach(function (c, idx) {
      var delay = Math.round(Math.abs(idx - mid) * 42);
      c.el.style.transitionDelay = delay + "ms";
      var p = fanCenter(idx, cards.length, F, L.Cx, L.pivotY);
      placeFan(c.el, p, F, 1, idx + 1);
      c.el.style.opacity = "1";
    });

    later(function () {
      cards.forEach(function (c) { c.el.style.transitionDelay = "0ms"; });
    }, Math.round(mid * 42) + 720);
  }

  /* ---------- 文案与按钮 ---------- */
  function updateUI() {
    var n = requiredCount();
    var sel = state.selectedCount;

    if (state.phase === "revealing") {
      hintEl.textContent = "命运正在揭开……";
    } else if (state.phase === "done") {
      hintEl.textContent = "解读已经生成，可在下方查看，或点击「重新抽牌」再抽一次。";
    } else if (sel >= n) {
      hintEl.textContent = "已选好 " + n + " 张牌，点击「揭开命运」查看结果。";
    } else if (n > 1) {
      hintEl.textContent = "请选择 3 张牌（已选 " + sel + " / 3）。";
    } else {
      hintEl.textContent = "请凭直觉选择 1 张牌。";
    }

    revealBtn.disabled = !(state.phase === "select" && sel >= n);
    revealBtn.textContent = state.phase === "revealing" ? "正在揭开…" : "揭开命运";
    if (resetBtn) resetBtn.disabled = state.phase === "revealing";
  }

  /* ---------- 建立扇形牌组 ---------- */
  function buildDeck() {
    clearTimers();
    stage.innerHTML = "";
    reading.innerHTML = "";
    reading.classList.remove("reading--show");
    state.cards = [];
    state.slotEls = [];
    state.selectedCount = 0;
    state.phase = "select";
    state.deck = shuffle(TAROT_CARDS);

    var L = computeLayout();
    state.layout = L;
    if (!L) return;

    stage.style.height = L.stageH + "px";

    var labels = SLOT_LABELS[state.mode];
    labels.forEach(function (label) {
      var se = document.createElement("div");
      se.className = "sel-slot";
      if (label) {
        var lab = document.createElement("span");
        lab.className = "sel-label";
        lab.textContent = label;
        se.appendChild(lab);
      }
      stage.appendChild(se);
      state.slotEls.push(se);
    });

    var N = L.F.N;
    for (var i = 0; i < N; i++) {
      var card = state.deck[i];

      var el = document.createElement("button");
      el.type = "button";
      el.className = "fan-card";
      el.setAttribute("aria-label", "第 " + (i + 1) + " 张牌");

      var lift = document.createElement("span");
      lift.className = "fan-card-lift";
      var inner = document.createElement("span");
      inner.className = "fan-card-inner";

      var backFace = document.createElement("span");
      backFace.className = "fan-card-face card-back";
      backFace.innerHTML = '<span class="back-symbol">☾</span><span class="back-word">月隐</span>';

      var frontFace = document.createElement("span");
      frontFace.className = "fan-card-face fan-card-front";
      var img = document.createElement("img");
      img.className = "card-img";
      img.alt = card.name;
      img.src = cardImagePath(card);
      img.loading = "lazy";
      frontFace.appendChild(img);

      inner.appendChild(backFace);
      inner.appendChild(frontFace);
      lift.appendChild(inner);
      el.appendChild(lift);
      stage.appendChild(el);

      var rec = { i: i, card: card, el: el, img: img, selected: false, slot: -1, reversed: false };
      (function (r) {
        el.addEventListener("click", function () { onPick(r); });
      })(rec);
      state.cards.push(rec);
    }

    layoutAll();
    updateUI();
    entrance();
  }

  /* ---------- 选牌 ---------- */
  function onPick(rec) {
    if (state.phase === "done") {
      openCardModal(rec.card, rec.reversed);
      return;
    }
    if (state.phase !== "select") return;
    if (rec.selected) return;
    if (state.selectedCount >= requiredCount()) return;

    rec.selected = true;
    rec.slot = state.selectedCount;
    rec.reversed = Math.random() < 0.5;
    state.selectedCount++;

    rec.el.classList.add("selected", "lifted");

    later(function () {
      rec.el.classList.remove("lifted");
      rec.el.classList.add("picked");
      layoutAll();
      updateUI();
    }, 180);
  }

  /* ---------- 揭牌 ---------- */
  function reveal() {
    if (state.phase !== "select") return;
    var n = requiredCount();
    if (state.selectedCount < n) return;

    state.phase = "revealing";
    updateUI();

    var ordered = state.cards
      .filter(function (c) { return c.selected; })
      .sort(function (a, b) { return a.slot - b.slot; });

    var base = 360;
    var gap = 760;
    ordered.forEach(function (c, k) {
      later(function () {
        if (c.reversed) c.img.classList.add("reversed");
        c.el.classList.add("flipped");
      }, base + k * gap);
    });

    later(function () {
      state.phase = "done";
      renderReading();
      updateUI();
      reading.scrollIntoView({ behavior: "smooth", block: "start" });
    }, base + ordered.length * gap + 420);
  }

  /* ---------- 重新抽牌 ---------- */
  function reset() {
    if (state.phase === "revealing") return;
    buildDeck();
  }

  /* ---------- 提问步骤 ---------- */
  function submitQuestion() {
    var v = (questionInput && questionInput.value ? questionInput.value : "").trim();
    if (!v) {
      askError.textContent = "先把你现在最在意的那件事写下来吧，哪怕只有一句也好。";
      if (questionInput) questionInput.focus();
      return;
    }
    askError.textContent = "";
    state.question = v;
    questionShown.textContent = v; // 安全渲染
    askStep.hidden = true;
    drawStep.hidden = false;
    buildDeck();
    drawStep.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function editQuestion() {
    clearTimers();
    stage.innerHTML = "";
    reading.innerHTML = "";
    reading.classList.remove("reading--show");
    state.cards = [];
    state.slotEls = [];
    state.selectedCount = 0;
    state.phase = "select";
    state.layout = null;

    drawStep.hidden = true;
    askStep.hidden = false;
    askError.textContent = "";
    if (questionInput) {
      questionInput.value = state.question;
      questionInput.focus();
    }
  }

  /* ---------- 事件绑定 ---------- */
  if (startBtn) startBtn.addEventListener("click", submitQuestion);

  if (questionInput) {
    questionInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submitQuestion();
      }
    });
    questionInput.addEventListener("input", function () {
      if (askError.textContent) askError.textContent = "";
    });
  }

  if (editQuestionBtn) editQuestionBtn.addEventListener("click", editQuestion);

  revealBtn.addEventListener("click", reveal);
  if (resetBtn) resetBtn.addEventListener("click", reset);

  document.querySelectorAll('input[name="mode"]').forEach(function (input) {
    input.addEventListener("change", function () {
      if (!input.checked) return;
      if (state.phase === "revealing") return;
      state.mode = input.value;
      if (drawStep.hidden) return; // 尚未进入抽牌，无需重建
      buildDeck();
    });
  });

  if (modalClose && modal) {
    modalClose.addEventListener("click", closeCardModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeCardModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeCardModal();
    });
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (state.phase === "revealing" || drawStep.hidden) return;
      var L = computeLayout();
      if (!L) return;
      state.layout = L;
      stage.style.height = L.stageH + "px";
      layoutAll();
    }, 160);
  });

  /* ---------- 初始化：停在提问步骤 ---------- */
  var modeVal = getSelectedRadio("mode");
  state.mode = modeVal || "single";
  askStep.hidden = false;
  drawStep.hidden = true;
  if (questionInput) questionInput.focus();
});
