/* =========================================================
   月隐 Tarot —— 数据文件
   包含：78 张塔罗牌数据 + 生日数字解读数据
   ========================================================= */

/* 每张牌的结构说明：
   id       —— 唯一标识（英文，方便查找）
   name     —— 中文牌名
   en       —— 英文牌名
   num      —— 展示用序号/点数
   group    —— 所属分组：major(大阿卡纳)、wands(权杖)、cups(圣杯)、swords(宝剑)、pentacles(星币)
   symbol   —— 牌面装饰符号
   upright  —— 正位含义
   reversed —— 逆位含义
   advice   —— 现实生活建议
*/

const TAROT_CARDS = [
  /* ---------- 大阿卡纳（22 张） ---------- */
  {
    id: "fool", name: "愚者", en: "The Fool", num: "0", group: "major", symbol: "☽",
    upright: "新的开始、纯真的冒险、不受束缚的自由。你正站在一段旅程的起点，带着好奇与勇气向前。",
    reversed: "冲动鲁莽、逃避责任、计划不周带来的风险。你可能忽略了现实的约束。",
    advice: "勇敢尝试，但也要为脚下的路多留一份准备；带着好奇出发，同时保持基本的谨慎。"
  },
  {
    id: "magician", name: "魔术师", en: "The Magician", num: "I", group: "major", symbol: "∞",
    upright: "行动力、创造力与资源整合。你拥有把想法变成现实的能力。",
    reversed: "缺乏方向、虚张声势、能力被浪费。你或许在空谈而没有落地。",
    advice: "把注意力集中在真正重要的事上，用行动证明自己，而不是只靠言语。"
  },
  {
    id: "high-priestess", name: "女祭司", en: "The High Priestess", num: "II", group: "major", symbol: "☾",
    upright: "直觉、内省与潜意识的智慧。答案藏在静默之中。",
    reversed: "忽视直觉、隐藏真相、情绪混乱。你可能忽略了内心的声音。",
    advice: "静下来倾听自己，相信内在的直觉，不必急着向外界寻求所有答案。"
  },
  {
    id: "empress", name: "皇后", en: "The Empress", num: "III", group: "major", symbol: "❀",
    upright: "丰盛、滋养、创造力与温柔的力量。生命正以慷慨的方式回报你。",
    reversed: "过度依赖、情绪化、创造力受阻。你可能把自己照顾得太少。",
    advice: "学会照顾自己，滋养内在与外在，让创造力自然流动。"
  },
  {
    id: "emperor", name: "皇帝", en: "The Emperor", num: "IV", group: "major", symbol: "♔",
    upright: "秩序、权威、稳定与掌控。用结构带来安全感。",
    reversed: "固执、专横、缺乏弹性。你或许把控制抓得太紧。",
    advice: "建立秩序的同时留一点弹性，权威真正的力量来自稳定而非压迫。"
  },
  {
    id: "hierophant", name: "教皇", en: "The Hierophant", num: "V", group: "major", symbol: "☨",
    upright: "传统、信念、学习与精神指引。遵循值得信赖的路径。",
    reversed: "僵化教条、盲目服从、打破常规。你可能被旧的规则束缚。",
    advice: "学习前人的智慧，但也要分辨什么真正适合自己。"
  },
  {
    id: "lovers", name: "恋人", en: "The Lovers", num: "VI", group: "major", symbol: "♡",
    upright: "爱与和谐、重要选择、价值观的契合。真诚的关系带来成长。",
    reversed: "失衡、难以抉择、价值冲突。你可能在重要选择前犹豫。",
    advice: "以真诚和一致性做选择，倾听内心真正的价值观。"
  },
  {
    id: "chariot", name: "战车", en: "The Chariot", num: "VII", group: "major", symbol: "✦",
    upright: "意志力、胜利、掌控方向。以决心克服障碍。",
    reversed: "失控、方向混乱、力量分散。你可能被情绪牵着走。",
    advice: "明确目标，稳住方向，用自律把力量集中到一处。"
  },
  {
    id: "strength", name: "力量", en: "Strength", num: "VIII", group: "major", symbol: "♌",
    upright: "温柔的力量、勇气、耐心。真正的强大来自内心的平静。",
    reversed: "自我怀疑、软弱、冲动。你可能低估了自己的韧性。",
    advice: "用温柔而非强硬去面对困难，耐心本身就是一种力量。"
  },
  {
    id: "hermit", name: "隐者", en: "The Hermit", num: "IX", group: "major", symbol: "☽",
    upright: "独处、内省、寻找内在答案。退后一步看得更清。",
    reversed: "孤立、逃避、拒绝帮助。你或许把自己关得太久。",
    advice: "给自己留出独处的时间，但不要拒绝值得信任的人靠近。"
  },
  {
    id: "wheel", name: "命运之轮", en: "Wheel of Fortune", num: "X", group: "major", symbol: "☸",
    upright: "转机、循环、命运的变化。局势正在朝新的方向转动。",
    reversed: "停滞、时运不济、抗拒改变。你可能被困在循环里。",
    advice: "接受变化，顺应时机，在转折中主动抓住机会。"
  },
  {
    id: "justice", name: "正义", en: "Justice", num: "XI", group: "major", symbol: "⚖",
    upright: "公平、真相、因果与责任。你的选择会得到相应的结果。",
    reversed: "不公、逃避责任、失衡。你可能在回避该承担的事。",
    advice: "诚实面对自己的选择，承担应有的责任，让天平回归平衡。"
  },
  {
    id: "hanged-man", name: "倒吊人", en: "The Hanged Man", num: "XII", group: "major", symbol: "⏚",
    upright: "换个角度、暂停、臣服与牺牲。放下以获得新的视角。",
    reversed: "无谓的牺牲、停滞、拒绝放手。你可能在僵持中消耗自己。",
    advice: "试着换个角度看问题，有时暂停和放手反而是前进的方式。"
  },
  {
    id: "death", name: "死神", en: "Death", num: "XIII", group: "major", symbol: "☠",
    upright: "结束、转化、新生。旧的篇章需要画上句点。",
    reversed: "抗拒结束、停滞、不愿放手。你可能害怕改变。",
    advice: "接受必要的结束，告别旧事物，才能为新的开始腾出空间。"
  },
  {
    id: "temperance", name: "节制", en: "Temperance", num: "XIV", group: "major", symbol: "♒",
    upright: "平衡、调和、耐心与适度。以平和的方式融合对立。",
    reversed: "失衡、过度、缺乏耐心。你可能走向了极端。",
    advice: "寻找中间地带，调整节奏，用耐心把不同部分调和起来。"
  },
  {
    id: "devil", name: "恶魔", en: "The Devil", num: "XV", group: "major", symbol: "♑",
    upright: "束缚、诱惑、成瘾或执念。你被某些东西困住。",
    reversed: "挣脱束缚、觉醒、重获自由。你开始看清枷锁。",
    advice: "辨认那些让你上瘾或束缚你的人事物，并有意识地松开它们。"
  },
  {
    id: "tower", name: "高塔", en: "The Tower", num: "XVI", group: "major", symbol: "♆",
    upright: "剧变、崩塌、真相揭露。旧有的结构被打破。",
    reversed: "避免的灾难、延迟的改变、内心动荡。你可能在勉强维持。",
    advice: "当旧结构崩塌，与其抗拒，不如在废墟中寻找重建的契机。"
  },
  {
    id: "star", name: "星星", en: "The Star", num: "XVII", group: "major", symbol: "✶",
    upright: "希望、疗愈、灵感与信念。暴风雨过后出现的光。",
    reversed: "失去信心、幻灭、疲惫。你可能暂时看不到希望。",
    advice: "保持信念，给自己疗愈的时间，重新连接内在的光。"
  },
  {
    id: "moon", name: "月亮", en: "The Moon", num: "XVIII", group: "major", symbol: "☾",
    upright: "潜意识、不安、幻象与模糊。很多事情尚未看清。",
    reversed: "迷雾散去、真相浮现、焦虑缓解。你逐渐看清现实。",
    advice: "在不确定中保持清醒，别被恐惧和想象放大问题，等迷雾散去再判断。"
  },
  {
    id: "sun", name: "太阳", en: "The Sun", num: "XIX", group: "major", symbol: "☀",
    upright: "喜悦、成功、活力与清晰。一切都明亮而温暖。",
    reversed: "暂时的低落、缺乏自信、被乌云遮住的光。",
    advice: "相信自己值得快乐，让积极与真诚照亮当下的路。"
  },
  {
    id: "judgement", name: "审判", en: "Judgement", num: "XX", group: "major", symbol: "♃",
    upright: "觉醒、回顾、召唤与重生。你听见内心的召唤。",
    reversed: "自我怀疑、逃避召唤、无法放下过去。",
    advice: "诚实地回顾过去，原谅自己，回应内心真正的召唤。"
  },
  {
    id: "world", name: "世界", en: "The World", num: "XXI", group: "major", symbol: "❂",
    upright: "完成、圆满、整合与成就。一个阶段圆满落幕。",
    reversed: "未完成、延迟、缺少收尾。你离圆满还差一步。",
    advice: "庆祝已经完成的，整理收尾，带着完整感迎接新周期。"
  },

  /* ---------- 权杖（Wands，火元素） ---------- */
  {
    id: "ace-wands", name: "权杖王牌", en: "Ace of Wands", num: "A", group: "wands", symbol: "♣",
    upright: "新的热情、创造力与行动的火种。一个充满活力的开始。",
    reversed: "热情消退、延迟、方向不明。动力被压抑。",
    advice: "点燃内在的火种，用一次具体行动开启新局面。"
  },
  {
    id: "two-wands", name: "权杖二", en: "Two of Wands", num: "2", group: "wands", symbol: "♣",
    upright: "规划未来、远见、选择与扩张。你站在抉择的关口。",
    reversed: "犹豫、缺乏远见、害怕迈出第一步。",
    advice: "眺望更远的目标，做出选择，然后迈出第一步。"
  },
  {
    id: "three-wands", name: "权杖三", en: "Three of Wands", num: "3", group: "wands", symbol: "♣",
    upright: "扩张、等待成果、合作与前瞻。努力正逐渐见效。",
    reversed: "计划受阻、等待落空、视野狭窄。",
    advice: "保持耐心，同时积极拓展合作，让计划走得更远。"
  },
  {
    id: "four-wands", name: "权杖四", en: "Four of Wands", num: "4", group: "wands", symbol: "♣",
    upright: "庆祝、稳定、和谐与阶段性的成果。",
    reversed: "不和谐、延迟、缺乏归属感。",
    advice: "为已取得的进展庆祝，珍惜身边的人与安稳。"
  },
  {
    id: "five-wands", name: "权杖五", en: "Five of Wands", num: "5", group: "wands", symbol: "♣",
    upright: "竞争、摩擦、意见分歧。多方力量在碰撞。",
    reversed: "冲突缓和、回避竞争、寻求和解。",
    advice: "把竞争转化为成长，学会在分歧中沟通与协作。"
  },
  {
    id: "six-wands", name: "权杖六", en: "Six of Wands", num: "6", group: "wands", symbol: "♣",
    upright: "胜利、认可、自信与公开的成就。",
    reversed: "失落、缺乏认可、自负。",
    advice: "坦然接受认可，同时保持谦逊，继续前行。"
  },
  {
    id: "seven-wands", name: "权杖七", en: "Seven of Wands", num: "7", group: "wands", symbol: "♣",
    upright: "坚守立场、防卫、面对挑战。你在捍卫自己的位置。",
    reversed: "疲惫、放弃、感到被围攻。",
    advice: "守住重要的底线，必要时寻求支持，不必独自硬扛。"
  },
  {
    id: "eight-wands", name: "权杖八", en: "Eight of Wands", num: "8", group: "wands", symbol: "♣",
    upright: "快速进展、信息、行动加速。事情开始流动起来。",
    reversed: "延误、混乱、节奏失控。",
    advice: "抓住势头快速推进，但也要留意细节，别让速度变成混乱。"
  },
  {
    id: "nine-wands", name: "权杖九", en: "Nine of Wands", num: "9", group: "wands", symbol: "♣",
    upright: "坚韧、坚持、最后的防线。你已接近终点。",
    reversed: "疲惫、防御过度、怀疑自己。",
    advice: "再坚持一下，你已经走了很远；适当休息再继续。"
  },
  {
    id: "ten-wands", name: "权杖十", en: "Ten of Wands", num: "10", group: "wands", symbol: "♣",
    upright: "负担沉重、责任过多、压力。你扛了太多。",
    reversed: "卸下负担、学会拒绝、寻求帮助。",
    advice: "分清轻重，把不必要的事放下，别一个人扛下全部。"
  },
  {
    id: "page-wands", name: "权杖侍从", en: "Page of Wands", num: "P", group: "wands", symbol: "♣",
    upright: "好奇、探索、新的灵感与消息。",
    reversed: "三分钟热度、方向散乱、缺乏行动。",
    advice: "拥抱好奇，但要把兴趣落实到持续的行动上。"
  },
  {
    id: "knight-wands", name: "权杖骑士", en: "Knight of Wands", num: "Kt", group: "wands", symbol: "♣",
    upright: "热情、冒险、冲动地追求目标。",
    reversed: "鲁莽、缺乏耐心、半途而废。",
    advice: "保持热情，同时为长远目标多留一点耐心和计划。"
  },
  {
    id: "queen-wands", name: "权杖王后", en: "Queen of Wands", num: "Q", group: "wands", symbol: "♣",
    upright: "自信、魅力、独立而温暖。",
    reversed: "嫉妒、缺乏安全感、过度强势。",
    advice: "相信自己的魅力，用温暖与自信去感染他人。"
  },
  {
    id: "king-wands", name: "权杖国王", en: "King of Wands", num: "K", group: "wands", symbol: "♣",
    upright: "领导力、远见、果敢的创造者。",
    reversed: "专断、冲动、滥用权力。",
    advice: "用愿景引领他人，也倾听团队的声音，别让果断变成独断。"
  },

  /* ---------- 圣杯（Cups，水元素） ---------- */
  {
    id: "ace-cups", name: "圣杯王牌", en: "Ace of Cups", num: "A", group: "cups", symbol: "♥",
    upright: "新的情感、爱的开始、直觉与慈悲。",
    reversed: "情感封闭、压抑、爱的阻滞。",
    advice: "打开心扉，允许爱与善意流动进来。"
  },
  {
    id: "two-cups", name: "圣杯二", en: "Two of Cups", num: "2", group: "cups", symbol: "♥",
    upright: "相互吸引、伙伴关系、情感的联结。",
    reversed: "关系失衡、误解、情感疏离。",
    advice: "真诚沟通，重视彼此的需求，让关系回归平衡。"
  },
  {
    id: "three-cups", name: "圣杯三", en: "Three of Cups", num: "3", group: "cups", symbol: "♥",
    upright: "友谊、欢庆、共同分享的喜悦。",
    reversed: "过度放纵、社交疲惫、关系中的摩擦。",
    advice: "享受相聚的快乐，也别忘了照顾自己真实的感受。"
  },
  {
    id: "four-cups", name: "圣杯四", en: "Four of Cups", num: "4", group: "cups", symbol: "♥",
    upright: "倦怠、沉思、对眼前机会视而不见。",
    reversed: "重新关注、接纳新机会、走出低落。",
    advice: "抬头看看身边被忽略的机会，主动回应世界的邀请。"
  },
  {
    id: "five-cups", name: "圣杯五", en: "Five of Cups", num: "5", group: "cups", symbol: "♥",
    upright: "失落、遗憾、只看见失去的部分。",
    reversed: "接受、宽恕、把目光转向希望。",
    advice: "允许自己悲伤，但也提醒自己：身边仍有值得珍惜的东西。"
  },
  {
    id: "six-cups", name: "圣杯六", en: "Six of Cups", num: "6", group: "cups", symbol: "♥",
    upright: "怀旧、纯真、回忆与善意。",
    reversed: "沉溺过去、难以成长、理想化。",
    advice: "珍惜美好的回忆，但别让过去阻碍你向前走。"
  },
  {
    id: "seven-cups", name: "圣杯七", en: "Seven of Cups", num: "7", group: "cups", symbol: "♥",
    upright: "幻想、选择过多、白日梦。",
    reversed: "看清现实、做出选择、清醒。",
    advice: "从众多幻想中辨认真正想要的，然后专注地做选择。"
  },
  {
    id: "eight-cups", name: "圣杯八", en: "Eight of Cups", num: "8", group: "cups", symbol: "♥",
    upright: "离开、追寻更深的意义、放下已不再适合的。",
    reversed: "犹豫不决、害怕离开、停滞。",
    advice: "勇敢放下不再滋养你的人或事，去寻找更深层的满足。"
  },
  {
    id: "nine-cups", name: "圣杯九", en: "Nine of Cups", num: "9", group: "cups", symbol: "♥",
    upright: "愿望实现、满足、享受成果。",
    reversed: "空洞的满足、过度自我、缺乏真正喜悦。",
    advice: "享受成果，同时问问自己：什么才是真正让你内心满足的。"
  },
  {
    id: "ten-cups", name: "圣杯十", en: "Ten of Cups", num: "10", group: "cups", symbol: "♥",
    upright: "圆满的幸福、和谐的家庭、情感的满足。",
    reversed: "家庭失和、理想破灭、幸福缺一角。",
    advice: "珍惜和谐的关系，用沟通与理解守护家的温暖。"
  },
  {
    id: "page-cups", name: "圣杯侍从", en: "Page of Cups", num: "P", group: "cups", symbol: "♥",
    upright: "敏感的直觉、创造性的情感、好消息。",
    reversed: "情绪化、不切实际、受伤。",
    advice: "相信直觉，也学会保护自己敏感的心。"
  },
  {
    id: "knight-cups", name: "圣杯骑士", en: "Knight of Cups", num: "Kt", group: "cups", symbol: "♥",
    upright: "浪漫、理想主义、追随内心的召唤。",
    reversed: "情绪起伏、空想、逃避现实。",
    advice: "怀抱理想，同时把浪漫落实到真实的行动中。"
  },
  {
    id: "queen-cups", name: "圣杯王后", en: "Queen of Cups", num: "Q", group: "cups", symbol: "♥",
    upright: "温柔、共情、直觉与情感的力量。",
    reversed: "情绪化、过度付出、界限模糊。",
    advice: "在照顾他人的同时守护自己的情绪边界。"
  },
  {
    id: "king-cups", name: "圣杯国王", en: "King of Cups", num: "K", group: "cups", symbol: "♥",
    upright: "情绪成熟、包容、稳定的支持者。",
    reversed: "情绪压抑、冷漠、操纵。",
    advice: "以成熟的方式面对情绪，成为自己和他人的稳定支柱。"
  },

  /* ---------- 宝剑（Swords，风元素） ---------- */
  {
    id: "ace-swords", name: "宝剑王牌", en: "Ace of Swords", num: "A", group: "swords", symbol: "♠",
    upright: "清晰、真相、突破性的想法。",
    reversed: "混乱、误解、缺乏方向。",
    advice: "用清晰的思考穿透迷雾，直面真相。"
  },
  {
    id: "two-swords", name: "宝剑二", en: "Two of Swords", num: "2", group: "swords", symbol: "♠",
    upright: "僵局、回避决定、内心权衡。",
    reversed: "做出决定、看清真相、打破僵局。",
    advice: "停止逃避，勇敢面对必须做出的选择。"
  },
  {
    id: "three-swords", name: "宝剑三", en: "Three of Swords", num: "3", group: "swords", symbol: "♠",
    upright: "心碎、悲伤、痛苦的真相。",
    reversed: "疗愈、释怀、从伤痛中恢复。",
    advice: "允许自己悲伤，给自己时间疗愈，不要压抑真实的感受。"
  },
  {
    id: "four-swords", name: "宝剑四", en: "Four of Swords", num: "4", group: "swords", symbol: "♠",
    upright: "休息、恢复、退居幕后。",
    reversed: "恢复行动、无法休息、焦虑。",
    advice: "给身心放个假，充分的休息是为了更好地出发。"
  },
  {
    id: "five-swords", name: "宝剑五", en: "Five of Swords", num: "5", group: "swords", symbol: "♠",
    upright: "冲突、胜负、代价高昂的胜利。",
    reversed: "和解、放下争执、接受损失。",
    advice: "分清什么值得争，有时体面的让步比输赢更重要。"
  },
  {
    id: "six-swords", name: "宝剑六", en: "Six of Swords", num: "6", group: "swords", symbol: "♠",
    upright: "过渡、疗愈、离开困境走向平静。",
    reversed: "无法放下、退回困境、过渡受阻。",
    advice: "允许自己慢慢离开痛苦的环境，向更平静的方向前行。"
  },
  {
    id: "seven-swords", name: "宝剑七", en: "Seven of Swords", num: "7", group: "swords", symbol: "♠",
    upright: "策略、隐瞒、独自行动。",
    reversed: "坦白、被揭穿、重新诚实。",
    advice: "审视自己的手段，诚实面对，别用隐瞒换取短期利益。"
  },
  {
    id: "eight-swords", name: "宝剑八", en: "Eight of Swords", num: "8", group: "swords", symbol: "♠",
    upright: "受限、自我束缚、无力感。",
    reversed: "挣脱限制、看清束缚、重获力量。",
    advice: "很多限制来自内心的恐惧，试着松开对自己的束缚。"
  },
  {
    id: "nine-swords", name: "宝剑九", en: "Nine of Swords", num: "9", group: "swords", symbol: "♠",
    upright: "焦虑、担忧、夜不能寐。",
    reversed: "放下焦虑、看到希望、接受帮助。",
    advice: "别独自承受焦虑，把担忧说出来，寻求支持。"
  },
  {
    id: "ten-swords", name: "宝剑十", en: "Ten of Swords", num: "10", group: "swords", symbol: "♠",
    upright: "终结、谷底、彻底的结束。",
    reversed: "触底反弹、恢复、新的希望。",
    advice: "最难的时刻往往意味着转机，触底之后，向上是唯一的方向。"
  },
  {
    id: "page-swords", name: "宝剑侍从", en: "Page of Swords", num: "P", group: "swords", symbol: "♠",
    upright: "好奇、警觉、学习与观察。",
    reversed: "轻率、言语伤人、缺乏深思。",
    advice: "保持好奇，但说话前多想一想，避免冲动伤人。"
  },
  {
    id: "knight-swords", name: "宝剑骑士", en: "Knight of Swords", num: "Kt", group: "swords", symbol: "♠",
    upright: "果断、迅捷、勇往直前。",
    reversed: "鲁莽、急躁、缺乏策略。",
    advice: "行动要快，但也要想清楚方向，别让冲动主导。"
  },
  {
    id: "queen-swords", name: "宝剑王后", en: "Queen of Swords", num: "Q", group: "swords", symbol: "♠",
    upright: "独立、清醒、理智与直率。",
    reversed: "冷漠、刻薄、过度理性。",
    advice: "用清醒和智慧沟通，同时保留一点温度。"
  },
  {
    id: "king-swords", name: "宝剑国王", en: "King of Swords", num: "K", group: "swords", symbol: "♠",
    upright: "公正、理性、清晰的判断。",
    reversed: "专横、冷漠、滥用理性。",
    advice: "以公正和逻辑做判断，也记得顾及他人的感受。"
  },

  /* ---------- 星币（Pentacles，土元素） ---------- */
  {
    id: "ace-pentacles", name: "星币王牌", en: "Ace of Pentacles", num: "A", group: "pentacles", symbol: "◆",
    upright: "新的机会、物质基础、务实的开始。",
    reversed: "错失机会、财务不稳、计划落空。",
    advice: "抓住眼前务实的机会，为未来打下扎实的基础。"
  },
  {
    id: "two-pentacles", name: "星币二", en: "Two of Pentacles", num: "2", group: "pentacles", symbol: "◆",
    upright: "平衡、灵活、处理多项事务。",
    reversed: "失衡、超负荷、难以兼顾。",
    advice: "学会分配精力，必要时简化，别让忙碌失去平衡。"
  },
  {
    id: "three-pentacles", name: "星币三", en: "Three of Pentacles", num: "3", group: "pentacles", symbol: "◆",
    upright: "合作、技艺、共同努力的成果。",
    reversed: "缺乏协作、质量下降、各自为政。",
    advice: "重视团队合作，发挥所长，共同打磨成果。"
  },
  {
    id: "four-pentacles", name: "星币四", en: "Four of Pentacles", num: "4", group: "pentacles", symbol: "◆",
    upright: "稳定、节俭、掌控资源。",
    reversed: "吝啬、执念、害怕失去。",
    advice: "珍惜资源是好事，但别让掌控变成紧抓不放。"
  },
  {
    id: "five-pentacles", name: "星币五", en: "Five of Pentacles", num: "5", group: "pentacles", symbol: "◆",
    upright: "困顿、缺乏、被忽视的艰难时刻。",
    reversed: "走出困境、获得帮助、希望回归。",
    advice: "在艰难时不要孤立自己，主动寻求帮助，处境会慢慢好转。"
  },
  {
    id: "six-pentacles", name: "星币六", en: "Six of Pentacles", num: "6", group: "pentacles", symbol: "◆",
    upright: "给予与接受、慷慨、资源流动。",
    reversed: "不平衡的给予、依赖、债务。",
    advice: "在付出与接受之间找到平衡，慷慨而不失界限。"
  },
  {
    id: "seven-pentacles", name: "星币七", en: "Seven of Pentacles", num: "7", group: "pentacles", symbol: "◆",
    upright: "耐心、评估、等待收获。",
    reversed: "焦虑、缺乏耐心、付出未见回报。",
    advice: "给努力一点时间，耐心评估进展，别急着放弃。"
  },
  {
    id: "eight-pentacles", name: "星币八", en: "Eight of Pentacles", num: "8", group: "pentacles", symbol: "◆",
    upright: "精进、专注、勤勉地打磨技艺。",
    reversed: "敷衍、缺乏热情、重复无意义。",
    advice: "专注于提升自己，把每一件小事做好，技艺会带来回报。"
  },
  {
    id: "nine-pentacles", name: "星币九", en: "Nine of Pentacles", num: "9", group: "pentacles", symbol: "◆",
    upright: "独立、自律、享受自己的成果。",
    reversed: "过度依赖、自我价值感低、享受不足。",
    advice: "肯定自己的努力与独立，允许自己享受生活。"
  },
  {
    id: "ten-pentacles", name: "星币十", en: "Ten of Pentacles", num: "10", group: "pentacles", symbol: "◆",
    upright: "富足、传承、家庭的稳定与长期成果。",
    reversed: "财务问题、家庭矛盾、传承受阻。",
    advice: "为长远做规划，重视家庭与传承，让成果延续下去。"
  },
  {
    id: "page-pentacles", name: "星币侍从", en: "Page of Pentacles", num: "P", group: "pentacles", symbol: "◆",
    upright: "学习、务实、脚踏实地的开始。",
    reversed: "拖延、缺乏专注、不切实际。",
    advice: "踏实学习，把目标拆成可行的小步骤，一步步实现。"
  },
  {
    id: "knight-pentacles", name: "星币骑士", en: "Knight of Pentacles", num: "Kt", group: "pentacles", symbol: "◆",
    upright: "可靠、勤奋、稳步前进。",
    reversed: "僵化、拖延、缺乏变化。",
    advice: "坚持与可靠是你的优势，但也给自己留一点调整的空间。"
  },
  {
    id: "queen-pentacles", name: "星币王后", en: "Queen of Pentacles", num: "Q", group: "pentacles", symbol: "◆",
    upright: "务实、滋养、把生活打理得井井有条。",
    reversed: "过度操劳、忽视自己、失衡。",
    advice: "在照顾他人和生活的同时，别忘了照顾自己。"
  },
  {
    id: "king-pentacles", name: "星币国王", en: "King of Pentacles", num: "K", group: "pentacles", symbol: "◆",
    upright: "富足、稳重、成功的经营者。",
    reversed: "固执、物质至上、缺乏远见。",
    advice: "用稳健经营财富，也把价值放在比金钱更丰富的地方。"
  }
];

/* ---------- 分组的中文标签 ---------- */
const TAROT_GROUPS = {
  major: "大阿卡纳",
  wands: "权杖",
  cups: "圣杯",
  swords: "宝剑",
  pentacles: "星币"
};

/* ---------- 生日数字解读数据 ---------- */
const BIRTHDAY_MEANINGS = {
  1: {
    title: "生命数字 1 —— 独立与开创",
    meaning: "数字 1 象征独立、开创与领导力。你天生有开创精神和自我主张，喜欢走自己的路。",
    advice: "勇敢做自己，发挥主动性，同时学会与他人协作。"
  },
  2: {
    title: "生命数字 2 —— 合作与平衡",
    meaning: "数字 2 象征合作、平衡与敏感。你善于理解他人、协调关系，重视和谐。",
    advice: "发挥你的共情与协调力，同时也要学会坚定表达自己的需求。"
  },
  3: {
    title: "生命数字 3 —— 表达与创造",
    meaning: "数字 3 象征表达、创造与社交。你富有想象力和感染力，擅长用语言或艺术表达。",
    advice: "让创造力充分流动，同时把灵感落实到具体行动，避免流于表面。"
  },
  4: {
    title: "生命数字 4 —— 稳定与秩序",
    meaning: "数字 4 象征稳定、秩序与踏实。你重视安全感，做事认真可靠、有条理。",
    advice: "用你的踏实建立稳固基础，同时学会在稳定中留一点弹性，别被规则束缚。"
  },
  5: {
    title: "生命数字 5 —— 自由与变化",
    meaning: "数字 5 象征自由、变化与冒险。你渴望新鲜和多样，适应力强、充满活力。",
    advice: "拥抱变化、勇敢探索，同时学会专注，避免因过度自由而散乱。"
  },
  6: {
    title: "生命数字 6 —— 责任与爱",
    meaning: "数字 6 象征责任、关怀与和谐。你富有爱心和责任感，擅长照顾他人与家庭。",
    advice: "在付出爱的同时照顾自己，学会建立健康的界限，避免过度承担。"
  },
  7: {
    title: "生命数字 7 —— 内省与智慧",
    meaning: "数字 7 象征内省、智慧与精神探索。你喜欢思考本质，追求深层的真相。",
    advice: "珍惜你的深度和直觉，同时保持与外界连接，避免过度孤立。"
  },
  8: {
    title: "生命数字 8 —— 力量与成就",
    meaning: "数字 8 象征力量、成就与物质掌控。你有强大的执行力和事业心，追求成果。",
    advice: "发挥你的行动力与经营能力，同时平衡物质与精神，避免只看结果。"
  },
  9: {
    title: "生命数字 9 —— 人道与完成",
    meaning: "数字 9 象征人道、完成与博爱。你胸怀宽广、富有同理心，愿意为更大的意义付出。",
    advice: "用你的包容服务他人，同时学会放下已经完成的事，允许自己开始新的篇章。"
  },
  11: {
    title: "生命数字 11 —— 直觉与启示（主数）",
    meaning: "主数 11 象征直觉、灵感与精神启示。你有敏锐的洞察力和潜在的使命感。",
    advice: "信任你的直觉，把灵感转化为现实，同时注意情绪敏感带来的负担，照顾好内心。"
  },
  22: {
    title: "生命数字 22 —— 建造与实现（主数）",
    meaning: "主数 22 象征建造、远见与实现宏大目标。你拥有把梦想落地成现实的潜力。",
    advice: "用长远的眼光规划，把大目标拆成可行步骤，脚踏实地地实现你的愿景。"
  }
};
