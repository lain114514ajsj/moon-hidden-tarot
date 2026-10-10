/* =========================================================
   月隐 Tarot —— 解读生成
   流程：识别意图 → 取真实抽牌(正逆位/位置) → 取该牌对应素材
        → 按意图组织分析 → 结论 → 建议 →（三张阵）综合判断
   意图：food 饮食 / daily 日常活动 / timePlanning 时间安排 / money 购物消费 /
        loveOther 对方心意 / loveSelf 自己的感受 / loveFuture 关系发展 /
        loveAction 是否主动 / loveConflict 矛盾阻碍 / study / work / people /
        futureEvent 未来事件（只给象征倾向，不预测事实）/ fact / open
   全程离线，不联网、不调用任何 API。
   ========================================================= */
(function () {
  "use strict";
  function one(a) { return a[Math.floor(Math.random() * a.length)]; }
  function pickN(a, n) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; }
    return b.slice(0, Math.min(n, b.length));
  }
  function uniqCap(a, c) {
    var s = {}, o = [];
    a.forEach(function (x) { if (!x || s[x]) return; s[x] = 1; o.push(x); });
    return o.slice(0, c);
  }
  function fill(t, v) { return String(t).split("{{K}}").join(v); }
  function shortOf(s) {
    var t = String(s || "");
    var i = t.search(/[，。；]/);
    return i > 0 ? t.slice(0, i) : t;
  }
  function noDot(s) { return String(s || "").replace(/[。，；]+$/, ""); }
  /* 从一段牌义里挑出与当前问题最相关的那一小句（用于"情境解读"，避免整段照搬） */
  function facetOf(text, keys) {
    var s = String(text || "");
    var parts = s.split(/[，,；;。]/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (parts.length < 2) return cleanFacet(noDot(s));
    var best = parts[0], bs = 0;
    parts.forEach(function (p) {
      var sc = 0;
      keys.forEach(function (k) { if (p.indexOf(k) >= 0) sc++; });
      if (sc > bs) { bs = sc; best = p; }
    });
    return cleanFacet(best);
  }
  /* 去掉句首的连接词和内部引号，避免拼出"「或者…」"这种读不顺的片段 */
  function cleanFacet(s) {
    return String(s || "")
      .replace(/^[，,、；;。]*(或者|或是|又或者|要么|而是|也|还)/, "")
      .replace(/[「」【】]/g, "")
      .trim();
  }
  /* 问题问的是"明天/后天"时，把素材里的"今天"改过来，避免答非所问 */
  function dayAdjust(text, q) {
    var s = String(text || "");
    if (/(后天)/.test(q)) return s.replace(/今天/g, "后天");
    if (/(明天|明日)/.test(q)) return s.replace(/今天/g, "明天");
    if (/(今晚|晚上|夜里)/.test(q)) return s.replace(/今天/g, "今晚");
    return s;
  }
  /* 问题问的是哪一天，用于"具体到X"这类衔接语 */
  function dayWord(q) {
    if (/(后天)/.test(q)) return "后天";
    if (/(明天|明日)/.test(q)) return "明天";
    if (/(周末)/.test(q)) return "周末";
    if (/(今晚|晚上|夜里)/.test(q)) return "今晚";
    return "今天";
  }
  /* 归一化用于重复判断：忽略标点，只比对真正的句子 */
  function normText(s) {
    return String(s || "").replace(/[\s。，、；：！？!?「」『』（）()·—\-…]/g, "");
  }

  /* ---------- 意图识别 ---------- */
  function detectIntent(q) {
    var s = String(q || "");
    /* 1) 需要外部证据才能确认的事实 */
    if (/(几点|日期|星期几|天气|多少钱|比分|涨跌|哪一天|实时)/.test(s)) return "fact";
    /* 人际（朋友/室友/家人等）：先于感情类，避免"和室友闹矛盾"被归入感情 */
    if (/(朋友|室友|家人|父母|亲戚|邻里|邻居|同事关系|合作|团队|边界)/.test(s)) return "people";
    /* 2) 感情类（先于"未来事件"，避免"她会不会喜欢我"被归入未来事件） */
    if (/(我|自己)[^，。？?]{0,6}(是不是|真的|到底|还|算不算)[^，。？?]{0,4}(喜欢|爱|在意|想要|放不下|舍不得)/.test(s)) return "loveSelf";
    if (/(他|她|对方|人家)[^，。？?]{0,8}(喜欢|爱|在意|有意思|动心|怎么想|心里有|想不想|在想什么|在想|想什么|什么态度|什么意思)/.test(s)) return "loveOther";
    if (/(喜欢|爱)我(吗|不)|爱不爱我|对我有意思|他对我/.test(s)) return "loveOther";
    /* "对我有感觉 / 对我什么感觉 / 对我怎么看"：也是在问对方的好感，别落到 open */
    if (/(对我|于我)[^，。？?]{0,6}(有感觉|没感觉|有没有感觉|是什么感觉|什么感觉|有想法|什么想法|心动|有意思|好感|怎么样|怎么看|怎么想|什么态度|什么意思)/.test(s)) return "loveOther";
    /* "对方是不是在躲着我 / 冷淡 / 疏远"：问的是对方的态度，仍属"对方心意" */
    if (/(躲着我|躲我|在躲|回避|冷淡|疏远|不理我|不主动|冷落|态度冷)/.test(s)) return "loveOther";
    if (/(要不要|该不该|应不应该|是否应该|我应该|我想)[^，。？?]{0,10}(主动|联系|表白|说出口|开口|等他|找他|见他|问他|发消息|复合|挽回)/.test(s)) return "loveAction";
    if (/(矛盾|冷战|闹别扭|走不通|卡在哪|问题出在哪|为什么.{0,6}(吵|冷|不开心)|总吵架|又吵)/.test(s)) return "loveConflict";
    if (/(复合|在一起|还有可能|有希望|能成|走到一起|长久|结婚|异地恋|感情|关系|前任|分手|继续发展|发展下去|继续下去|走下去|还想和我|想和我)/.test(s)) return "loveFuture";
    /* 3) 整体运势：问的是一段时间的整体状态，不是某件具体的事（先于未来事件，避免"运气会不会好"被当成具体事件） */
    if (/(运气|运势|运程|整体运|手气)/.test(s)) return "fortune";
    /* 4) 未来事件：在问"某件事会不会发生"（结果倾向，不是行动建议） */
    if (/(会不会|能不能|能否|可不可以|有没有可能|是否可能|会不会有|有没有机会|有没有可能|会顺利吗|能通过吗|能过吗|能成吗|会成功吗|会不会遇到|会不会收到|会不会中|能收到|能拿到|能领到|能到账|能发到|能顺利)/.test(s)) return "futureEvent";
    /* 行动/尝试类："要不要开始一件新事"是在问怎么做，不是问会不会发生 */
    if (/(要不要|该不该|应不应该|适合|想)[^，。？?]{0,12}(开始|尝试|试一下|试一试|迈出|迈|动手|做一件|起个|开个头|新计划|新事情|新项目)/.test(s)) return "daily";
    /* 强日常信号（明确在问"做点什么/要不要出门/休息还是…"）：优先于领域词，避免被"学习/工作"抢走 */
    if (/(干点啥|干点什么|干点|做点啥|做点什么|有什么可做|有啥可做|做什么好|无聊|打发时间|要不要出门|该不该出门|休息还是|还是休息|要不要休息|该不该休息|放松一下|出去走走)/.test(s)) return "daily";
    /* 时间安排 */
    if (/(怎么安排|安排一下|怎么规划|规划一下|怎么过|时间怎么用|怎么分配时间|几点做|什么时候做)/.test(s)) return "timePlanning";
    /* 饮食：提到吃喝 + 带「选/推荐」意图（吃什么 / 吃点什么 / 吃A还是B…） */
    if (/(吃|喝|饭|餐|早餐|午餐|晚餐|夜宵|加餐|外卖|食堂|奶茶|咖啡|火锅|烧烤|点餐|菜单|零食|甜点)/.test(s) &&
      /(什么|啥|哪|还是|或者|推荐|点|选)/.test(s)) return "food";
    /* 购物消费 */
    if (/(值得买|值不值|要不要买|买不买|该不该买|划算|价格|预算|花销|消费|省钱|退货|剁手)/.test(s) ||
      (/(买|购)/.test(s) && /(吗|要不要|该不该|值得|还是|哪个|划不划算)/.test(s))) return "money";
    if (/(学习|考试|复习|备考|考研|考公|论文|作业|成绩|升学|分数|专业|课程|上课|老师|背书|刷题)/.test(s)) return "study";
    if (/(工作|职场|老板|领导|面试|跳槽|升职|加薪|创业|加班|离职|岗位|职业|公司|业务|客户|辞职|同事)/.test(s)) return "work";
    /* 日常活动 / 穿衣 / 出行 / 安排 */
    if (/(穿什么|穿啥|穿哪件|去哪|去哪儿|去哪里|上哪|干什么|做什么|干嘛|玩什么)/.test(s) ||
      /(下午|今天|明天|周末|晚上|这会儿|现在)[^，。？?]{0,10}(干|做|去|玩|安排|放松|出门)/.test(s)) return "daily";
    return "open";
  }

  /* ---------- 日常：标签 -> 具体建议 ---------- */
  var TAG = {
    solo: { food: "一个人也好解决的，比如一份有肉有菜的盖饭、一碗汤面", wear: "穿得简单舒服就行，不用特意打扮", place: "找个安静、人不多的地方", act: "一个人也能安静做完的小事，比如整理桌面、看会儿书、出门散散步", why: "这张牌有一层意思是：不必为了配合别人而折腾", note: "先照顾自己的需要就行" },
    shared: { food: "适合叫上人一起吃的，比如几道家常菜或者一顿火锅", wear: "可以稍精神一点，见人也不失礼", place: "约上人一起去热闹一点的地方", act: "约一个想见的人，一起喝杯东西、走一走", why: "它在说这件事有人一起会更好", note: "有人一起会更顺" },
    simple: { food: "做法简单、不用折腾的那种，别给自己加难度", wear: "简单基础款就够，别为搭配费太多劲", place: "就近走走，别折腾太远", act: "挑一件不用准备太久的事，比如收拾一下房间、把这周的待办清两件", why: "它也在提醒别把简单的事搞复杂", note: "别把它搞复杂" },
    hearty: { food: "能吃饱、扎实一点的，比如牛肉面、烤鸡腿饭", wear: "穿得利落一点", place: "能走动起来的地方，比如公园或者山边", act: "做点要动手动脚的事，比如出去运动一场，或者把拖了很久的家务干掉", why: "它偏向实打实把力气花出去", note: "实打实地来" },
    fresh: { food: "清淡爽口的，比如蒸菜配一碗粥", wear: "颜色清爽一点的", place: "去有水有绿的地方，透透气", act: "做点让脑子清醒的事，比如出门走走、换条没走过的路", why: "它在说让状态轻一点", note: "让状态清爽一点" },
    quick: { food: "十分钟能搞定的，别把时间耗在纠结上", wear: "抓起就能穿的", place: "半小时能到的地方就行", act: "挑一件十分钟能做完的小事，比如回个消息、把桌面的东西归位", why: "它提醒你别拖，先动起来", note: "别拖着" },
    warming: { food: "热乎的，比如汤面、砂锅或者一碗热汤", wear: "保暖一点，别只顾好看", place: "找个能坐下来慢慢待的地方", act: "做点让自己暖起来的事，比如泡个热水澡、煮点热的喝", why: "它偏向温和、慢慢来", note: "慢一点、暖一点" },
    light: { food: "别太油太撑的，肠胃舒服最重要", wear: "轻便、不勒的那种", place: "别去太累的地方，轻松点", act: "安排轻松一点，比如看一部想看的片、泡杯茶发会儿呆", why: "它在说别再给自己加负担", note: "别给自己加负担" },
    treat: { food: "可以稍微放纵一下，吃你一直想吃的那口", wear: "穿那件你一直想穿的", place: "去一个你一直想去但还没去的地方", act: "做一件纯粹让自己开心的事，比如买杯想喝的、去逛逛想逛的店", why: "它有一点「今天可以对自己好一点」的意思", note: "今天可以对自己好一点" },
    plain: { food: "老老实实的家常菜就很好", wear: "素净、干净的", place: "去你熟悉的那条路、那个公园", act: "按老办法把该做的做完就好，比如收拾房间、把该回的消息回掉", why: "它偏向稳、不折腾", note: "稳一点就行" },
    new: { food: "换一家没吃过的，当作今天的小新鲜", wear: "试试平时不常穿的风格", place: "去一个你没去过的地方", act: "做点以前没做过的小事，比如试一条新路线、尝一家没去过的店", why: "它在说可以来点新鲜的", note: "来点新鲜的" },
    familiar: { food: "回到你熟悉的那家、那一味", wear: "穿你穿着最自在的那套", place: "回你熟悉的地方走走", act: "做你熟悉又拿手的事，比如把常做的那件事做得更顺手", why: "它偏念旧、偏稳", note: "熟悉的最踏实" },
    comfort: { food: "让胃和心情都舒服的，比如粥、汤、软一点的", wear: "怎么舒服怎么穿", place: "找个能让你放松下来的地方", act: "做点能让自己放松下来的事，比如听歌、睡个午觉", why: "它在说先把自己安顿好", note: "舒服最重要" },
    careful: { food: "悠着点，别太辣太油，先看胃受不受得了", wear: "别为了好看硬撑，天气优先", place: "先看天气和交通，别硬去", act: "做之前先想一下风险，别硬来", why: "它提醒你多留个心眼", note: "多留个心眼" }
  };
  var DAILY_OPEN = {
    food: ["今天吃什么这事，别太纠结。", "吃饭这件小事，可以随便一点。", "不用在吃上纠结太久。"],
    wear: ["穿什么不用想太复杂。", "今天穿衣服，舒服优先。", "搭配这事，简单点反而好。"],
    place: ["去哪儿其实比你想的自由。", "地点不用挑得太纠结。", "去哪这件事，先定个大方向就行。"],
    act: ["今天的时间可以松一点。", "不用把下午排得太满。", "具体做什么，从轻的开始就行。"]
  };
  var DAILY_HONEST = {
    food: "这只是借牌面给你的饮食灵感，牌并不能真的算出你今天该吃什么。",
    wear: "牌只给个方向，穿什么最后还是你自己最清楚。",
    place: "牌给不了具体地点，只能给个偏向。",
    act: "牌只是给个灵感，具体做什么还是你定。"
  };
  /* ---------- 饮食：完成"吃什么 / 吃A还是B"的实际任务 ---------- */
  var FOOD_EXTRA_LIST = "一碗热汤面、一份盖饭，或者简单的家常菜配米饭";
  var FOOD_HONEST = "上面只是帮你定个方向，牌不能真的替你决定今天吃什么。";
  var PLANNING_OPEN = [
    "时间怎么安排，先看你现在最缺什么。",
    "安排不用排得太满，留点弹性反而更顺。",
    "怎么过这一段时间，先定个大概就行。"
  ];

  /* ---------- 关系类：五种意图各自的框定 + 观察点 ---------- */
  var LOVE_FRAME = {
    loveOther: [
      "想知道对方喜不喜欢你。牌读不了别人的心意，但你们这段关系现在是什么气氛，它说得出来。",
      "这类问题牌答不了「对方心里有没有你」，不过能看出你们这段关系现在的状态。",
      "对方的心意，牌没法替你确认。但可以看出你们之间现在是什么气氛。"
    ],
    loveSelf: [
      "你在问自己的心意。牌给不了标准答案，但能把这份感觉拆开看看。",
      "想知道自己到底是不是喜欢对方。答案本来就在你身上，牌能做的是帮你分辨。",
      "这种问题牌不会替你回答，但可以提示你现在更接近哪一种感觉。"
    ],
    loveFuture: [
      "你在问这段关系往后会怎样。牌给的是倾向，不是保证。",
      "想知道这段关系还有没有可能。先看牌面现在的样子，再谈走向。",
      "这类问题牌会给出偏向，但不会替你打包票。"
    ],
    loveAction: [
      "你在犹豫要不要迈这一步。牌能说的是现在这个动作合不合适。",
      "要不要主动——牌给的是眼下的局势，决定还得你来做。",
      "你想知道现在动是不是好时机。那先看牌面给的倾向。"
    ],
    loveConflict: [
      "你在问你们之间卡在哪。牌能把问题的形状描出来。",
      "想知道矛盾出在哪里——牌给的是一条线索，不是判决。",
      "关系里的疙瘩，牌说不清全部，但能指出大概卡在哪一层。"
    ]
  };
  var REL_LEAD = [
    "这张牌描述的关系状态是——",
    "从这张牌看，更像是——",
    "牌面呈现出来的关系是——",
    "在这里，这段关系的气质是——"
  ];
  /* 对方心意：给出有分寸的倾向判断（不是断言，也不回避） */
  var OTHER_LEAN = {
    hi: ["从牌面看，对方对你是偏有好感的，也像是愿意靠近。", "这张牌偏向对方那边是有热度、也有点主动的，这段关系的走向偏正面。"],
    mid: ["从牌面看，对方的态度偏向中性，看不出明确的心意。", "这张牌里对方的偏向很含糊，还谈不上明确。"],
    lo: ["从牌面看，对方那边偏向冷，这段关系里热度并不高。", "这张牌显示，对方那边更偏后退，而不是靠近。"]
  };
  /* 问"对方是不是在躲着我"时，用更贴合"回避/冷淡"的说法，而不是通用中性句 */
  var OTHER_AVOID = {
    hi: ["从牌面看，对方不太像是在刻意躲你，那边更像是有热度、愿意靠近的。", "这张牌里，对方那边的气流是往你这边来的，不像在回避。"],
    mid: ["从牌面看，看不出对方在刻意回避，但也谈不上明显在靠近——更像是各自留了点距离。", "这张牌里对方的态度是含糊的：没有明确的冷淡，也没有明确的主动。"],
    lo: ["从牌面看，对方那边确实偏冷、偏后退，这和你「他是不是在躲我」的直觉是接近的。", "这张牌更像是有人在往后退——如果你有这样的感觉，牌面并没有否定它。"]
  };
  /* 回避类问题的观察点：都是可以在现实里核对的行为 */
  var AVOID_TAIL = [
    "想确认是不是在躲，看三件事：回消息的速度、愿不愿意单独见面、会不会主动找你。",
    "比起猜，不如看一致性：是偶尔忙，还是长期回避见面和单独相处。",
    "如果你已经问过，而对方总在绕开，那本身就是一种回答。"
  ];
  /* "对方是不是在躲着我"的框定语：把问题定位到"距离感/态度"，而不是"喜不喜欢" */
  var LOVE_FRAME_AVOID = [
    "你在问对方是不是在躲你。牌读不了别人的心思，但能看出你们现在的距离感。",
    "想知道对方为什么躲着你——牌给的是这段关系里的温度，不是对方的真实想法。",
    "这类问题牌答不了「对方到底怎么想」，但能看出你们之间现在是靠近还是拉开。"
  ];
  var LOVE_TAIL = {
    loveOther: [
      "与其猜，不如看对方有没有持续、具体的行动：主动找你、记得你说过的事、愿意为你腾出时间、愿意单独相处。",
      "真正的证据在行为里，而不是在说了什么。",
      "别在想象里找答案，看对方接下来实际做了什么。"
    ],
    loveSelf: [
      "一个办法是分开想：如果对方明天不再对你这么好，你还想不想见面。",
      "留意一下：让你心动的是这个人本身，还是对方给你的那点重视和回应。",
      "对方不在的时候，你更惦记这个人，还是更惦记那种被在意的感觉。"
    ],
    loveFuture: [
      "真正决定走向的，还是那个老问题有没有被处理。",
      "能不能往前走，看的是你们愿不愿意为它做点实际的事。",
      "别只看眼下的情绪，关键在问题本身有没有改变。"
    ],
    loveAction: [
      "动之前先想清楚：你主动之后，对方是往前接，还是往后退。",
      "可以先把想说的话理一遍，只讲自己的感受，不逼对方表态。",
      "给自己定个小预期：不要求马上有回应，先看对方的态度。"
    ],
    loveConflict: [
      "先别急着分谁对谁错，把最近一次不舒服的具体场景写下来。",
      "沟通时只讲自己的感受，别用「你总是…」开头。",
      "如果是同一件事反复吵，那多半不是这件事本身，而是背后没被说出来的需要。"
    ]
  };
  var LOVE_CLOSINGS = [
    "别急着要个答案，先看接下来这段时间。",
    "你可以慢慢想，但别把自己耗着。",
    "先把这一件事看清，再决定要不要往前。",
    "答案会在往后的相处里慢慢显出来。",
    "这件事不用急着定，先把能确认的确认掉。"
  ];

  /* ---------- 倾向语句 ---------- */
  var V = {
    outcome: {
      "2": ["偏向有机会，而且是那种要靠行动接住的机会，不是干等来的。", "这组牌偏正面：事情在往能成的方向走。"],
      "1": ["偏有希望，但还不算稳，能不能成更多看接下来怎么做。", "倾向是「有戏」，不过得有人先动，光等不会自己变好。"],
      "0": ["暂时看不清，牌面没有明显偏向，现在下结论太早。", "倾向不算明朗，更像是要再观察一阵、把信息补齐。"],
      "-1": ["偏弱。不是完全没可能，但眼下缺一个能推动它变好的条件。", "牌面信号偏冷：机会还在，但得先把卡住的地方解决掉。"],
      "-2": ["不太乐观。牌面更像在说，这件事现在卡在比表面更根本的地方。", "偏难。牌面显示的问题不在你想的那一层。"]
    },
    decide: {
      "2": ["更倾向可以去做。", "从牌面看，现在是偏可以动的时候。"],
      "1": ["偏可以往前试，但别一次把退路都堵上。", "可以做，不过先把最关键的那一步准备好。"],
      "0": ["两边都有代价，牌面没有明显偏向，现在更适合先补信息。", "不好直接说该不该——牌面没有明显偏向，关键看你更愿意承担哪一种代价。"],
      "-1": ["倾向先缓一缓：牌面显示的障碍还没解决。", "现在偏早，把挡路的那件事处理掉再谈。"],
      "-2": ["倾向先别做。现在动的代价可能比想的大。", "从牌面看，眼下不是好时机。"]
    },
    open: {
      "2": ["牌面整体偏顺，这件事目前是在往好的方向走的。", "这组牌给的信号是正面的，可以推进，也可以期待。"],
      "1": ["牌面略偏正面，但还没到「稳了」的程度。", "整体偏顺，只是还需要你再推一把。"],
      "0": ["牌面偏中性，好坏很大程度取决于接下来怎么做。", "现在更像是一个还没定型的阶段。"],
      "-1": ["牌面偏紧，眼下的阻力大于助力。", "现在不适合硬推，先把问题看清楚。"],
      "-2": ["压力比较大，这件事现在处在比较难的位置。", "整体偏吃力，硬来的话消耗会很大。"]
    }
  };
  var CLOSINGS = [
    "先把最要紧的那一步走掉，别的可以等一下。",
    "给自己一个期限，到点再回头看这件事。",
    "这段时间多留意实际的变化，别只靠感觉。",
    "可以先把担心的事写下来，你会发现它没那么大。"
  ];
  var MONEY_CHECK = [
    "先问自己一句：这件东西你会用超过五次吗？",
    "放 24 小时再决定，第二天还想要再说。",
    "看看它和你已经有的东西是不是重复了。",
    "给自己设一个上限，超出就等下次。",
    "如果是为了情绪买单，先分清你想要的是东西，还是那份感觉。"
  ];
  /* 各领域的关键词：该牌的"现实建议"若与当前问题完全对不上，就不硬塞进建议区 */
  var DOMAIN_KEYS = {
    money: /买|钱|价|预算|花|省|值得|消费|上限|代价|实用|重复|需要|决定|想要|用/,
    study: /学|复习|考|背|刷题|计划|练习|理解|记|专注|时间|进度|错题|安排|标准|想清楚|方法/,
    work: /工作|职|老板|同事|项目|任务|汇报|决定|辞职|岗位|团队|客户|职责|底线|讨论|意见|想清楚|边界/,
    people: /说|沟通|边界|对方|误会|表达|分工|听|感受|期待|约定/
  };
  var PEOPLE_POOL = [
    "先把你想说的整理成两三句话，只讲事实和感受，别指责。",
    "边界这件事，你不说出来，对方不会自己知道。",
    "如果是误会，找个双方都不赶时间的时机把话说开。",
    "别急着判定谁对谁错，先弄清你们争的是不是同一件事。",
    "合作上的事，把分工和标准先讲明白，比事后补救省力。"
  ];
  var POS = ["过去", "现在", "未来"];
  var POS_LINE = {
    "过去": "先在「过去」这个位置：",
    "现在": "再看「现在」：",
    "未来": "「未来」这一次给的是方向，不是注定："
  };

  /* ---------- 三张牌阵：真正综合三张的关系 ---------- */
  /* 根据牌面自身的措辞判断这张牌在"守成 / 推进 / 停滞 / 变动"里偏向哪一类 */
  function synthTone(r) {
    var m = window.CARD_MEANINGS[r.card.id] || {};
    var rel = window.CARD_REL[r.card.id] || {};
    var txt = ((r.reversed ? m.rev : m.up) || "") + " " + ((r.reversed ? rel.r : rel.u) || "");
    var B = {
      hold: /恋旧|怀旧|念旧|熟悉|稳|长久|积累|秩序|守住|家|过去|传统|延续|习惯/,
      move: /机会|推进|主动|开始|前进|变好|顺利|活力|亮|敞|牵头|行动|往前/,
      stuck: /反复|卡|犹豫|摇摆|放不下|藕断丝连|拖|等|停在|退|僵|原地/,
      brk: /打破|突然|崩塌|失去|损失|结束|断裂|破坏|冲击|推翻|骤变/
    };
    var best = "", bs = 0;
    Object.keys(B).forEach(function (k) {
      var c = (txt.match(new RegExp(B[k].source, "g")) || []).length;
      if (c > bs) { bs = c; best = k; }
    });
    if (best) return best;
    var j = window.CARD_JUDGEMENT[r.card.id] || {};
    var l = r.reversed ? (j.r || 0) : (j.u || 0);
    return l > 0 ? "move" : l < 0 ? "stuck" : "hold";
  }
  function buildSynthesis(results, leans, question) {
    var s = results.map(function (r) {
      var m = window.CARD_MEANINGS[r.card.id] || {};
      return shortOf((r.reversed ? m.rev : m.up) || "");
    });
    var minI = 0, maxI = 0;
    leans.forEach(function (v, i) {
      if (v < leans[minI]) minI = i;
      if (v > leans[maxI]) maxI = i;
    });
    var allPos = leans.every(function (x) { return x > 0; });
    var allNeg = leans.every(function (x) { return x < 0; });
    var tones = results.map(synthTone);
    var hasHold = tones.indexOf("hold") >= 0, hasBrk = tones.indexOf("brk") >= 0;
    var hasMove = tones.indexOf("move") >= 0, hasStuck = tones.indexOf("stuck") >= 0;
    var TONE_DESC = { hold: "在讲想守住的那部分", move: "在讲往前推的那股劲", stuck: "卡在要不要动之间", brk: "指向一次挡不住的改变" };
    function synthTonePhrase(i) { return POS[i] + "的" + results[i].card.name + (TONE_DESC[tones[i]] || "有自己的说法"); }
    var maxV = leans[maxI], minV = leans[minI];
    var t = one(["把三张连起来看：", "三张其实是一条线：", "把三张放在一起读："]);
    t += "「过去」的" + results[0].card.name + "讲的是「" + s[0] + "」，这是这件事的来路；";
    t += "到了「现在」的" + results[1].card.name + "，焦点变成「" + s[1] + "」，你眼下最直接要处理的就是这里；";
    t += "「未来」的" + results[2].card.name + "指向「" + s[2] + "」，那是一个方向，不是注定。";
    if (allPos) t += " 三张方向一致，都在支持你往前走。";
    else if (allNeg) t += " 三张方向一致，都在提醒你眼下不适合硬推。";
    else if (maxV > 0 && minV < 0) t += " 三张之间是有拉扯的：" + POS[maxI] + "的" + results[maxI].card.name +
      "在往前推，" + POS[minI] + "的" + results[minI].card.name + "在往后拉，这正是你难下决心的原因。";
    else if ((hasHold && hasBrk) || (hasStuck && hasMove) || (hasHold && hasMove))
      t += " 三张之间是有拉扯的：" + synthTonePhrase(0) + "，" + synthTonePhrase(1) + "，" + synthTonePhrase(2) +
        (hasHold && hasBrk ? "，一边舍不得旧的，一边又确实在变" : "") + "，这正是你难以下定决心的原因。";
    else t += " 三张整体偏平，没有明显往前推的力量，更像是先要你把问题看清。";
    t += one([
      " 换句话说，「过去」留下的东西，直接影响了「现在」你为什么会卡在这里；而「未来」那张，是照着这个走法可能出现的走向。",
      " 连起来看就是：「过去」埋下的因，长成了「现在」的局面；如果不做调整，「未来」那张就是它自然的延续。"
    ]);
    if (maxV > 0 && minV < 0) t += " 也就是说，「现在」这一步要是不动，「未来」那张大概率就照着它原本的样子长下去。";
    // 综合口径要贴着用户问的那件事，而不是三张牌各自说完就收
    var dq = String(question || "");
    if (/(还会|在一起|复合|喜欢|爱|他|她|关系|分手|前任|表白)/.test(dq)) t += " 放回你问的这段关系上：真正决定走向的不是牌怎么说，而是那个一直没被处理的老问题，你们愿不愿意一起面对。";
    else if (/(辞职|工作|职|老板|同事|面试|升职|跳槽|客户|加薪)/.test(dq)) t += " 放回你问的这件事上：重点不是牌替你拍板，而是先把最现实的那道坎看清，再谈下一步。";
    else if (/(学|考|复习|论文|作业|上岸|背)/.test(dq)) t += " 放回学习这件事上：把「现在」那张的要求落成具体的安排，比反复权衡更管用。";
    else t += " 取舍点就落在「现在」这一步，先动它，比反复权衡更有效。";
    // 回到现实：告诉用户下一步可以核实/动手的具体条件
    if (/(还会|在一起|复合|喜欢|爱|他|她|关系|分手|前任|表白)/.test(dq))
      t += " 现实中可以先确认的是：你们最近一次把话说明白是什么时候，以及你自己想要的结果具体是什么。";
    else if (/(辞职|工作|职|老板|同事|面试|升职|跳槽|客户|加薪)/.test(dq))
      t += " 现实中需要核实的是：离开之后收入怎么接、有没有下家或缓冲期、合同和社保怎么处理。";
    else if (/(学|考|复习|论文|作业|上岸|背)/.test(dq))
      t += " 现实中可以先做的是：把最没把握的那部分排进这两天的具体时段里。";
    if (minV < 0) t += " 综合来看，最需要留意的是「" + POS[minI] + "」的" + results[minI].card.name + "。";
    if (maxV > 0) t += " 转机也更可能出在「" + POS[maxI] + "」的" + results[maxI].card.name + "这边。";
    else if (maxI !== minI) t += " 如果说转机，更可能在「" + POS[maxI] + "」的" + results[maxI].card.name + "那边——它相对不那么拖后腿。";
    return t;
  }

  /* ---------- 主流程 ---------- */
  function compose(question, results, slots) {
    var q = String(question || "");
    var intent = detectIntent(q);
    var M = window.CARD_MEANINGS || {};
    var J = window.CARD_JUDGEMENT || {};
    var T = window.CARD_TAGS || {};
    var REL = window.CARD_REL || {};
    function lean(r) { var j = J[r.card.id] || {}; return r.reversed ? (j.r || 0) : (j.u || 0); }
    function keyOf(r) { var j = J[r.card.id] || {}; return r.reversed ? (j.kr || "") : (j.ku || ""); }
    function coreOf(r) { var m = M[r.card.id] || {}; return (r.reversed ? m.rev : m.up) || (r.reversed ? r.card.reversed : r.card.upright); }
    function sceneOf(r, d) { var m = M[r.card.id] || {}; return (m.scene && m.scene[d]) || ""; }
    function adviceOf(r) { var m = M[r.card.id] || {}; return m.advice || r.card.advice; }
    function relOf(r) { var x = REL[r.card.id]; return x ? (r.reversed ? x.r : x.u) : ""; }
    /* 该牌的现实建议：与当前问题领域完全对不上时，不硬塞进建议区 */
    function adviceList(r, domain) {
      var a = adviceOf(r), k = DOMAIN_KEYS[domain];
      return (a && (!k || k.test(a))) ? [a] : [];
    }
    var leans = results.map(lean);
    var net = leans.length ? leans.reduce(function (a, b) { return a + b; }, 0) / leans.length : 0;
    var lvl = net >= 1.5 ? "2" : net >= 0.5 ? "1" : net > -0.5 ? "0" : net > -1.5 ? "-1" : "-2";
    var weak = results[0];
    results.forEach(function (r) { if (lean(r) < lean(weak)) weak = r; });
    var key = keyOf(weak) || keyOf(results[0]);
    var ori = function (r) { return r.reversed ? "逆位" : "正位"; };
    // 统一的牌面信息条目（名称/正逆位/核心牌义；完整牌义由页面按需展开）
    function mkCard(r, posText, applyText, withCore) {
      var pos = posText || "";
      var posLine = (pos && results.length > 1 && POS_LINE[pos]) ? POS_LINE[pos] : "";
      return {
        id: r.card.id, pos: pos, name: r.card.name, en: r.card.en, ori: ori(r),
        core: (withCore === false ? "" : posLine + coreOf(r)),
        apply: applyText || ""
      };
    }

    /* 事实类 */
    if (intent === "fact") {
      return {
        intent: intent, compact: true,
        verdict: "这类具体事实（几点、多少钱、具体会不会发生），塔罗答不了，它只能提供一个看事情的角度。这次抽到「" +
          results[0].card.name + "·" + ori(results[0]) + "」，它的意思是：" + noDot(coreOf(results[0])) + "。",
        cards: [], synthesis: "", actions: [], actionsTitle: "", closing: ""
      };
    }

    /* 饮食：先把"吃什么"答掉（给方向 / 给二选一的标准），再看牌义是否真有可关联的角度 */
    if (intent === "food") {
      var f0 = results[0];
      var fv;
      var sep = q.match(/还是|或者|或是/);
      if (sep) {
        var idx = q.search(/还是|或者|或是/);
        var A = q.slice(0, idx).replace(/^.*?(?:吃|喝|选|要|去|是|点)/, "").replace(/[，,。：:\s]/g, "");
        var B = q.slice(idx + sep[0].length).replace(/[，,。？?！!；;].*$/, "").replace(/^(吃|喝|选|要|去|点)/, "").replace(/\s/g, "");
        var pair = (A && B) ? ("「" + A + "」还是「" + B + "」") : "这两个";
        fv = "你在" + pair + "之间拿不定主意。挑的时候先看两件事：现在更想吃哪一口，以及哪个能更快吃上。" +
          " 两个都差不多，就先吃上——这顿不用选到最优。";
      } else {
        fv = "吃点什么其实不用太纠结。可以往这几个方向挑：" + FOOD_EXTRA_LIST +
          "。拿不定就按一个标准：选你现在最想吃的那口，而不是看起来最「对」的那口。";
      }
      fv = dayAdjust(fv, q);
      // 牌义只在确实说得出关联时才接上；否则如实说明它谈的不是食物
      var fFacet = facetOf(coreOf(f0), ["选", "挑", "摇摆", "犹豫", "纠结", "想要", "需要", "不合", "权衡", "取舍", "拿不定"]);
      var fLinked = /选|挑|摇摆|犹豫|纠结|想要|不合/.test(fFacet);
      fv += " " + (fLinked
        ? ("另外，「" + f0.card.name + "·" + ori(f0) + "」讲的是「" + noDot(fFacet) + "」——放到点菜上，就是别在两个念头之间来回耗，先选你现在最想吃的那口。")
        : ("牌面本身讲的是「" + noDot(fFacet) + "」，那说的不是食物；这顿就按你现在的胃口来。"));
      fv += " " + FOOD_HONEST;
      return {
        intent: intent, compact: false, verdict: fv,
        cards: [mkCard(f0, "", "", false)], synthesis: "", actions: [], actionsTitle: "", closing: ""
      };
    }

    /* 整体运势：先回应对"这段时间整体状态"的关心，再给牌面角度（不预测吉凶，也不回避） */
    if (intent === "fortune") {
      // 多张时以"现在"这张为这段时间的参照，单张就用这张
      var g0 = results.length > 1 ? results[1] : results[0];
      var gNames = results.map(function (r) { return "「" + r.card.name + "·" + ori(r) + "」"; }).join("、");
      var gl = lean(g0);
      var gMood = gl >= 2 ? ["整体底色偏亮，属于状态不错的一段", "大方向是往上走的，心情和状态都比较打开"]
        : gl === 1 ? ["整体偏顺，但不至于事事如意", "大方向是顺的，别指望一点波折都没有"]
          : gl === 0 ? ["整体比较平，谈不上好也谈不上坏", "起伏不会太大，更像平常的一段日子"]
            : gl === -1 ? ["整体偏紧，容易有些磕绊或反复", "不太是顺水的一段，事儿容易卡一下"]
              : ["整体偏低，更像需要收着点、别硬来的一段", "大方向不轻松，硬推的性价比不高"];
      var gFacet = facetOf(coreOf(g0), ["节奏", "变", "转", "反复", "等", "时机", "顺", "稳", "秩序", "边界", "规则", "亮", "清楚", "活力", "沉", "想", "空间", "积累", "连接"]);
      var gFacetLine = results.length > 1
        ? (" 三张分别在讲：" + results.map(function (r) {
          return "「" + noDot(facetOf(coreOf(r), ["节奏", "变", "转", "反复", "等", "时机", "顺", "稳", "秩序", "边界", "规则", "亮", "清楚", "活力", "沉", "想", "空间", "积累", "连接"])) + "」";
        }).join("、") + "，这段时间的调子大致就在这里。")
        : (" 它讲的是「" + noDot(gFacet) + "」，这段时间的调子大致就在这里。");
      var gNote = g0.reversed ? "" : sceneOf(g0, "daily");
      if (!gNote) {
        var gTags = ((T[g0.card.id] || {})[g0.reversed ? "tr" : "tu"] || []);
        gNote = (TAG[gTags[0]] || TAG.plain).note;
      }
      var gv = one([
        "问整体运势，牌不给吉凶，但能给个底色。",
        "整体运势这类问题，牌不给分数，只给个调子。",
        "这一段时间大概是个什么状态，可以从这张牌看出来。"
      ]) + " 这次抽到" + gNames + "，" + one(gMood) + "。" +
        gFacetLine +
        " 对应到具体的安排上，" + noDot(dayAdjust(gNote, q)).replace(/^(今天|明天|后天|周末|今晚)/, "") + "。" +
        " 这只是牌面给出的象征性底色，不是对结果的保证。";
      return {
        intent: intent, compact: false, verdict: gv,
        cards: results.map(function (r, i) { return mkCard(r, slots[i] || "", "", true); }),
        synthesis: "", actions: [], actionsTitle: "", closing: ""
      };
    }

    /* 未来事件：先分清是哪一类事，只在牌义确实相关时给倾向；相关不足就诚实收窄，不说套话 */
    if (intent === "futureEvent") {
      var e0 = results[0];
      var m0 = q.match(/(?:会不会|能不能|能否|可不可以|有没有可能|是否可能|会不会有|有没有机会|能(?:收到|拿到|领到|到账|发到|通过|顺利))([^，。？?]*)/);
      var ev = (m0 && m0[1]) ? m0[1].replace(/^(在|有)/, "").trim() : "";
      ev = ev.replace(/^[，,。？?\s]+/, "").replace(/[吗呢吧啊哦呀，,。？?\s]+$/, "");
      // "能收到工资吗"这类只截到名词、或只截到语气词时，回退到整句并去掉时间词
      if (ev.length < 4) ev = q.replace(/[？?吗]/g, "").trim().replace(/^(我|你)/, "").replace(/^(明天|今天|后天|今晚|周末|这周|下周)/, "");
      if (!ev) ev = "这件事";
      var el = lean(e0);
      var eFacet = facetOf(coreOf(e0), ["节奏", "变", "转", "反复", "等", "时机", "稳", "秩序", "边界", "规则", "亮", "清楚", "活力", "坦荡", "积累", "长远", "连接", "回应", "力", "沉", "想", "独"]);
      var eKind = "general";
      if (/(捡到|意外之财|横财|中奖|中彩|彩票|白捡|外快)/.test(q)) eKind = "chance";
      else if (/(工资|薪水|报销|发薪|到账|收入|奖金|尾款|退款)/.test(q)) eKind = "payout";
      else if (/(面试|录用|offer|录取)/.test(q)) eKind = "interview";
      else if (/(考试|分数|成绩|通过|过线|及格|考研|考公|上岸)/.test(q)) eKind = "exam";
      else if (/(遇到|见到|碰到|遇见)[^，。？?]{0,4}(他|她|对方|那个人|喜欢的人|某人)/.test(q)) eKind = "meet";
      else if (/(倒霉|不顺|出事|麻烦|受伤|生病)/.test(q)) eKind = "misfortune";
      else if (/(出门|顺利|顺不顺|顺不顺利)/.test(q)) eKind = "going";
      var eOpen = one([
        "关于「" + ev + "」——具体结果，塔罗没法可靠预测，它只能从象征上给个倾向。",
        "「" + ev + "」这件事，牌给不了准数，只能提供一个象征性的角度。",
        "先说「" + ev + "」：牌预测不了具体会不会发生，它能给的只是象征上的倾向。"
      ]);
      var eCardLine = " 这次抽到「" + e0.card.name + "·" + ori(e0) + "」，它讲的是「" + noDot(eFacet) + "」。";
      var eBody;
      if (eKind === "chance" || eKind === "misfortune") {
        var eWhat = eKind === "chance" ? ev : "会不会碰上不顺";
        eBody = " 这是关于你状态和做事方式的一句话，不是「" + eWhat + "」这类偶然事件的信号——这种事本来就没什么可预期的。" +
          one([
            " 真要从中拿一点参考：" + dayWord(q) + "的安排按你平时的节奏走就行，不必为小概率的事提前改计划。",
            " 用得上的部分只有一个：别因为惦记它而分心，该干嘛干嘛。"
          ]);
      } else if (eKind === "payout") {
        eBody = " 这一点和「" + ev + "」没有直接关系——到没到账，看的是现实里的记录，而不是状态。" +
          " 想确认的话，直接核对发薪日、工资单上的应发应扣、以及银行到账流水，比任何解读都可靠。";
      } else if (eKind === "exam" || eKind === "interview") {
        var eScene = sceneOf(e0, eKind === "exam" ? "study" : "work");
        eBody = " 顺不顺利主要看你准备到什么程度" + (eScene ? "；放到准备上，这张牌提示的是「" + noDot(eScene) + "」" : "") + "。" +
          one([
            " 所以现在更有用的动作，是把最没底的那一块再走一遍，而不是反复猜结果。",
            " 与其提前担心，不如把力气放回还能改动的那部分。"
          ]);
      } else if (eKind === "meet") {
        eBody = " 能不能碰到一个人，更多取决于你们各自的安排和一点巧合，这部分牌替不了。" +
          (el >= 1 ? " 如果真有照面的机会，它提示你状态偏打开，打个招呼并不难。"
            : el <= -1 ? " 它更像是提醒你：先别把这次见面想得太重，自然一点反而好。"
              : " 它没有给出明显偏向，按平时的样子去就好。");
      } else {
        var eState = el >= 2 ? "偏亮、有余力" : el === 1 ? "偏顺、还有余量" : el === 0 ? "比较平"
          : el === -1 ? "偏紧、容易分心" : "偏低、需要先顾好自己";
        eBody = " 它更像是描述你" + dayWord(q) + "的状态：" + eState + "。" +
          (eKind === "going"
            ? " 出门这件事（以及" + dayWord(q) + "其他的安排）顺不顺，更多取决于你的计划和当天的情况。"
            : " 至于这件事本身会怎样，多半取决于你的安排和当时的条件。");
      }
      var evCard = mkCard(e0, "", "", true);
      evCard.core = shortOf(coreOf(e0));   // 牌面信息只给核心摘要，完整正逆位牌义放在可展开区
      return {
        intent: intent, compact: false,
        verdict: eOpen + eCardLine + eBody,
        cards: [evCard], synthesis: "", actions: [], actionsTitle: "", closing: ""
      };
    }

    /* 日常选择 / 时间安排 */
    if (intent === "daily" || intent === "timePlanning") {
      var r0 = results[0];
      var tg = T[r0.card.id] || {};
      var list = (r0.reversed ? tg.tr : tg.tu) || [];
      var t0 = TAG[list[0]] || TAG.simple;
      var t1 = TAG[list[1]] || t0;
      // 标签已按正逆位取（tu/tr）；正向场景句只在正位时使用，避免正逆位互相打架
      var sceneD = r0.reversed ? "" : sceneOf(r0, "daily");
      var outWord = ["shared", "new", "quick", "fresh", "hearty"].indexOf(list[0]) >= 0;
      var dailyV;
      if (/出门|出去走走|出去走走|出去/.test(q)) {
        var go = outWord ? "可以出门走走，比闷在家里强" : "今天更适合待在家附近，不必硬往外跑";
        dailyV = one(["要不要出门，牌给的是一个偏向：", "出门这事，牌的意思更偏向：", "关于出门，牌面的倾向是——"]) +
          go + "。" + (sceneD ? ("另外，" + sceneD + " ") : " ") + "这只是个参考，想不想动还是你自己说了算。";
      } else if (/休息还是|还是休息|要不要休息/.test(q)) {
        var pick = /comfort|light|solo|familiar/.test(list.join("|")) ? "先休息" : "先做一点正事，再把休息补上";
        dailyV = one(["休息还是做事，牌更偏向：", "两个选项里，牌更靠向：", "这张牌的意思偏向："]) +
          pick + "。" + t0.why + "。 别硬撑，也别躺着刷手机刷到更累，选一个做完不后悔的就行。";
      } else if (/(开始|尝试|试一下|试一试|迈|动手|做一件|新计划|新事情|新项目|开个头)/.test(q)) {
        // 问的是"要不要开个新头"：建议只给"先迈一小步"，并按这张牌偏稳/偏有劲调整力度
        var nwPace = /comfort|light|solo|familiar|plain|careful/.test(list.join("|"))
          ? "这张牌本身偏稳，所以别一上来就押大的"
          : "这张牌偏有劲，可以先动起来试试";
        dailyV = one([
          "想开始一件新的事，先把它当成一次小尝试，而不是一个要一次做对的决定。",
          "要不要开这个头，牌给的是状态参考，不是判决。"
        ]) + " 建议把它拆到最小：先做一次试水，做完再决定要不要继续。" + nwPace + "，先小到你不需要下决心。";
      } else {
        var what = /穿|衣服|搭配|打扮/.test(q) ? "wear"
          : /去哪|去哪儿|去哪里|上哪/.test(q) ? "place" : "act";
        var frames = [
          "我会偏向" + t0[what] + "，" + t1.note + "。",
          "往这个方向挑就行：" + t0[what] + "；" + t1.note + "。",
          "我的建议是" + t0[what] + "，" + t1.note + "。"
        ];
        dailyV = one(intent === "timePlanning" ? PLANNING_OPEN : DAILY_OPEN[what]) + " " + one(frames) + " " +
          (sceneD ? ("另外，" + sceneD) : (t0.why + "。")) + " " + DAILY_HONEST[what];
      }
      return {
        intent: intent, compact: false,
        verdict: dayAdjust(dailyV, q),
        cards: [mkCard(r0, "", "", false)], synthesis: "", actions: [], actionsTitle: "", closing: ""
      };
    }

    /* 消费：先给决策框架，再把牌义落到"这件东西"上（只取最相关的一小句，不整段照搬） */
    if (intent === "money") {
      var rm = results[0];
      var tend = lean(rm) >= 1 ? "从牌面看，更偏向「可以买」，但前提是它对你真的有用。"
        : lean(rm) <= -1 ? "从牌面看，更偏向先别急，这张牌不太支持现在下单。"
          : "牌面没有明确反对，也没有明确支持，关键看它是不是你真的用得上的。";
      var mFacet = facetOf(coreOf(rm), ["摇摆", "纠结", "选", "挑", "代价", "冲动", "后悔", "想要", "值", "犹豫", "够", "省", "花"]);
      var mBridge = one([
        "放到这件东西上，就是先分清你是真的需要它，还是在替某种心情买单。",
        "买东西时，这个提示更值得留意的，是你自己的真实需求，而不是当下那点冲动。",
        "把这点放进买东西里看，纠结往往不在东西本身，而在你想要的是什么。"
      ]);
      return {
        intent: intent, compact: false,
        verdict: tend + " 「" + rm.card.name + "·" + ori(rm) + "」更像是「" + noDot(mFacet) + "」——" + mBridge,
        cards: [mkCard(rm, "", "")], synthesis: "",
        actions: uniqCap(pickN(MONEY_CHECK, 2).concat(adviceList(rm, "money")), 3),
        actionsTitle: "买之前可以先想这几件事", closing: ""
      };
    }

    /* 关系 / 现实 / 开放 */
    var isLove = intent === "loveOther" || intent === "loveSelf" || intent === "loveFuture" ||
      intent === "loveAction" || intent === "loveConflict";
    var sceneKey = intent === "study" ? "study" : intent === "work" ? "work" : "";
    var cards = results.map(function (r, i) {
      var pos = slots[i] || "";
      var posLine = (results.length > 1 && POS_LINE[pos]) ? POS_LINE[pos] : "";
      // 单张关系牌：关系气质写进结论文，牌面信息不重复；三张阵：每张各带自己的关系气质
      var apply = isLove ? (results.length > 1 ? relOf(r) : "") : (sceneKey ? sceneOf(r, sceneKey) : "");
      return {
        id: r.card.id, pos: pos, name: r.card.name, en: r.card.en,
        ori: ori(r), core: posLine + coreOf(r), apply: apply
      };
    });

    var verdict = "";
    var keyUsedInVerdict = false;
    // 问"对方是不是在躲着我"这类回避问题：用专门的观察角度，而不是通用中性句
    var avoidQ = /(躲着我|躲我|在躲|回避|冷淡|疏远|不理我|不主动|冷落|态度冷)/.test(q);
    if (isLove) {
      var rel = relOf(results[0]) || shortOf(coreOf(results[0]));
      verdict = one((intent === "loveOther" && avoidQ) ? LOVE_FRAME_AVOID : LOVE_FRAME[intent]) + " ";
      if (intent === "loveOther") {
        var l0 = lean(results[0]);
        var leanPool = avoidQ ? OTHER_AVOID : OTHER_LEAN;
        verdict += one(l0 >= 1 ? leanPool.hi : l0 <= -1 ? leanPool.lo : leanPool.mid) + " ";
      } else if (intent === "loveFuture") {
        verdict += one(V.outcome[lvl]) + " ";
      }
      if (results.length === 1) {
        // 有些牌的关系素材讲的是"你自己这一侧"（如圣杯九逆位），这时如实说明，别硬说成对方的心意
        var relAboutOther = /(对方|他|她|回应|靠近|互相|双向|一边|配合|一起|谁)/.test(rel);
        var relAboutSelf = /(得到|愿望|开心|满足|自己|你|我|感受|想要|真正|怕)/.test(rel);
        if (intent === "loveOther" && relAboutSelf && !relAboutOther)
          verdict += "这张牌更多是在讲你这一侧的状态——" + noDot(rel) +
            "。 它回答不了对方心里怎么想，但提醒你先分清：你在意的是对方的回应，还是这段关系给你的感受。";
        else verdict += one(REL_LEAD) + rel + "。";
      }
      if (results.length > 1) {
        if (leans.every(function (x) { return x > 0; })) verdict += " 三张都偏正向，关系本身是往前的。";
        else if (leans.every(function (x) { return x < 0; })) verdict += " 三张都偏冷，眼下更像是往后退的阶段。";
        else verdict += " 三张之间的关系是有拉扯的：一边想往前，一边又退，这也是你反复的原因。";
      }
    } else {
      var whyQ = /(为什么|怎么会|为何|什么原因)/.test(q);
      var isDecide = /(要不要|该不该|应不应该|是否应该|值不值得|应该[^，。？?]{0,8}吗)/.test(q);
      var studyWhat = intent === "study" && /(复习什么|先学哪|学什么|看什么书|先看哪|从哪里开始|看哪一科)/.test(q);
      // 结论文里已经引用过具体牌义时，不再追加"依据是…"，避免同一句出现两次
      var coreQuoted = whyQ;
      if (studyWhat) {
        verdict = "具体复习什么只有你自己知道，牌给的是状态提示——" + noDot(sceneOf(results[0], "study")) + "。 顺着这个状态去安排，比纠结先看哪一科更实际。";
      } else if (whyQ) {
        verdict = one([
          "原因这块，牌面给的提示是——" + shortOf(coreOf(results[0])) + "。这不太像表面上的懒或运气问题，更像是有一层没处理掉的东西在拖着。",
          "想知道为什么，牌面的提示是这个——" + shortOf(coreOf(results[0])) + "。卡住你的多半不是能力，而是这层没理顺的东西。"
        ]);
      } else {
        if (intent === "open") {
          var o0 = results[0];
          var oFacet = facetOf(coreOf(o0), ["选", "想要", "在意", "方向", "开始", "停", "等", "怕", "承担", "看", "想", "值"]);
          var oRef = (M[o0.card.id] || {}).reflect || "";
          verdict = one([
            "这个问题没有单一答案，牌也不替你决定，它能做的是给一个想下去的角度。",
            "这类问题本来就开放，牌给不出结论，但能指出一个值得想的方向。"
          ]) + " 这次抽到「" + o0.card.name + "·" + ori(o0) + "」，它讲的是「" + noDot(oFacet) + "」。" +
            (oRef ? " 顺着它，先问自己一句：「" + oRef + "」" : "");
          coreQuoted = true;
        } else {
          var pool = isDecide ? V.decide : V.open;
          verdict = one(pool[lvl]);
        }
      }
      // 单张牌：用这张牌的关键条件收束判断，和"牌面信息"里的完整牌义互补，不重复同一句
      if (results.length === 1 && !coreQuoted) {
        var c0 = results[0];
        var kc = keyOf(c0);
        if (kc) {
          verdict += " " + one([
            "「" + c0.card.name + "·" + ori(c0) + "」在这里的关键是——" + noDot(kc) + "。",
            "落到这张「" + c0.card.name + "·" + ori(c0) + "」上看，重点在于" + noDot(kc) + "。"
          ]);
          keyUsedInVerdict = true;
        }
      }
      if (results.length > 1) {
        if (leans.every(function (x) { return x > 0; })) verdict += " 三张牌方向一致，都指向可以往前走。";
        else if (leans.every(function (x) { return x < 0; })) verdict += " 三张牌方向一致，都不太支持现在硬推。";
        else verdict += " 三张之间是有拉扯的，这也是你为什么难下决心。";
      }
      if (weak && lean(weak) < 0 && results.length < 3 && intent !== "open") {
        verdict += " 主要卡在「" + weak.card.name + "·" + ori(weak) + "」这里。";
      }
    }

    // 单张牌：整句已被结论引用过的，不在"牌面信息"里再显示一遍（局部同义提示保留）
    if (results.length === 1 && cards[0]) {
      var fullCore = noDot(cards[0].core), fullApply = noDot(cards[0].apply);
      if (fullCore.length > 6 && verdict.indexOf(fullCore) >= 0) cards[0].core = "";
      if (fullApply.length > 6 && verdict.indexOf(fullApply) >= 0) cards[0].apply = "";
    }

    var KEY_ACTION = {
      study: "这件事的关键在——{{K}}。",
      work: "这件事的关键在——{{K}}。",
      people: "先盯住这一点——{{K}}。"
    };
    var actions = [];
    if (isLove) {
      actions.push(one((intent === "loveOther" && avoidQ) ? AVOID_TAIL : LOVE_TAIL[intent]));
      var sc = sceneOf(results[0], "relation");
      if (sc) actions.push(sc);
    } else {
      if (intent !== "open") {
        if (key && KEY_ACTION[intent] && !keyUsedInVerdict) actions.push(fill(KEY_ACTION[intent], key));
        if (intent === "people") pickN(PEOPLE_POOL, 2).forEach(function (x) { actions.push(x); });
        results.forEach(function (r) {
          adviceList(r, intent).forEach(function (a) { actions.push(a); });
        });
      }
    }
    actions = uniqCap(actions, 3);

    var synthesis = results.length >= 3 ? buildSynthesis(results, leans, q) : "";
    var closing;
    if (intent === "open") {
      closing = "";   // 开放问题：不硬凑建议与收尾，交给牌面信息与完整牌义
    } else if (isLove) {
      closing = one(LOVE_CLOSINGS);
    } else {
      var lastR = results[results.length - 1];
      var lastReflect = lastR ? ((M[lastR.card.id] || {}).reflect || "") : "";
      closing = (lastReflect && Math.random() < 0.45) ? lastReflect : one(CLOSINGS);
    }
    // 去重：前文（结论/牌面信息/综合）已出现过的句子，建议区与收尾不再重复显示
    var shown = verdict + " " + cards.map(function (c) { return c.core + " " + c.apply; }).join(" ") + " " + synthesis;
    // 只按"真正的句子"去重：归一化后整句出现过，或前 14 字完全一致，才算重复
    var shownNorm = normText(shown);
    function isDup(x) {
      var n = normText(x);
      if (!n) return true;
      if (n.length >= 8 && shownNorm.indexOf(n) >= 0) return true;
      return n.length >= 14 && shownNorm.indexOf(n.slice(0, 14)) >= 0;
    }
    actions = actions.filter(function (a) { return !isDup(a); });
    if (isDup(closing)) closing = "";
    return {
      intent: intent, compact: false,
      verdict: verdict, cards: cards, synthesis: synthesis,
      actions: actions,
      actionsTitle: intent === "open" ? "这张牌自己的提醒" : one(["现实中可以怎么做", "接下来可以试着", "下一步可以这样走"]),
      closing: closing
    };
  }
  window.MoonveilReading = { detectIntent: detectIntent, compose: compose, buildSynthesis: buildSynthesis };
})();
