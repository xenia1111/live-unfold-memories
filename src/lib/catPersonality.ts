import type { Task } from "@/hooks/useTasks";

/* ── 人格定义 ── */
export interface CatPersonality {
  emoji: string;
  label: string;
  desc: string;
  category: string;
  idleLines: string[];
}

const CAT_PERSONALITIES: Record<string, CatPersonality> = {
  "学习": {
    emoji: "📚", label: "书虫猫", desc: "最近吃学习味的比较多，感觉自己变聪明了喵",
    category: "学习",
    idleLines: [
      "今天不学习吗？猫猫的脑子要生锈了...",
      "书的味道最香了，快去翻两页喵～",
      "猫猫在啃一本《量子力学》...嚼不动...",
    ],
  },
  "运动": {
    emoji: "💪", label: "健身猫", desc: "吃太多运动味的，猫猫感觉自己有腹肌了",
    category: "运动",
    idleLines: [
      "来！跟猫做俯卧撑！一二三四！",
      "今天不运动？猫猫的肌肉要萎缩了喵...",
      "猫猫在举哑铃...其实是举小鱼干🐟",
    ],
  },
  "社交": {
    emoji: "💬", label: "社牛猫", desc: "社交味吃多了，猫猫变得超级能聊",
    category: "社交",
    idleLines: [
      "好无聊啊好无聊啊好无聊啊有人聊天吗喵喵喵",
      "猫猫想找隔壁的猫串门，但是不敢...",
      "你今天跟几个人说话了？猫猫要统计！📊",
    ],
  },
  "工作": {
    emoji: "💼", label: "卷王猫", desc: "工作味太重了，猫猫都学会用Excel了",
    category: "工作",
    idleLines: [
      "KPI完成了吗？猫猫帮你催一下...",
      "猫猫在写PPT...第47页了...",
      "下班了吗？没下班就继续卷！喵！",
    ],
  },
  "健康": {
    emoji: "🧘", label: "佛系猫", desc: "养生味的吃太多，猫猫开始打坐了",
    category: "健康",
    idleLines: [
      "深呼吸...吸...呼...猫猫在冥想中...",
      "今天喝了8杯水了吗？猫猫帮你数🥛",
      "早睡早起，猫猫9点就要关灯了喵～",
    ],
  },
  "记录": {
    emoji: "✍️", label: "日记猫", desc: "文字味的最好吃，猫猫都开始写诗了",
    category: "记录",
    idleLines: [
      "今天发生了什么？猫猫想听你讲故事～",
      "猫猫在写日记：今天主人又没喂我...",
      "笔的味道，墨的香气，猫猫是文艺猫🖋️",
    ],
  },
  "娱乐": {
    emoji: "🎮", label: "玩咖猫", desc: "快乐味吃太多，猫猫变成派对动物了",
    category: "娱乐",
    idleLines: [
      "今天玩什么？猫猫已经热好身了！🕹️",
      "无聊...猫猫自己玩毛线球去了...",
      "快乐是第一生产力！猫猫说的！",
    ],
  },
};

const DEFAULT_PERSONALITY: CatPersonality = {
  emoji: "🐱", label: "杂食猫", desc: "什么都吃，来者不拒",
  category: "",
  idleLines: [
    "喵...猫猫饿了...快去做点什么喂猫猫吧～",
    "（打哈欠）什么时候开饭呀...",
    "猫猫蹲在碗旁边等了好久了喵～",
    "...zZZ...（等待投喂中）",
  ],
};

export function getCatPersonality(tasks: Task[]): CatPersonality {
  const completed = tasks.filter(t => t.completed);
  const total = completed.length;
  if (total < 3) return DEFAULT_PERSONALITY;

  const counts: Record<string, number> = {};
  for (const t of completed) {
    counts[t.category] = (counts[t.category] || 0) + 1;
  }

  let topCategory = "";
  let topCount = 0;
  for (const [cat, count] of Object.entries(counts)) {
    if (count > topCount) { topCount = count; topCategory = cat; }
  }

  if (topCount >= 3 && topCount / total >= 0.3 && CAT_PERSONALITIES[topCategory]) {
    return CAT_PERSONALITIES[topCategory];
  }

  return DEFAULT_PERSONALITY;
}
