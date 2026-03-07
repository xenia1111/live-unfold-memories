// 标题关键词 → 类别自动匹配

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  美食: ["吃", "喝", "做饭", "烹饪", "咖啡", "奶茶", "餐厅", "火锅", "烧烤", "甜品", "蛋糕", "面包", "早餐", "午餐", "晚餐", "外卖", "下午茶", "brunch", "cook", "eat", "food", "dinner", "lunch", "breakfast", "cafe", "restaurant", "pizza", "sushi", "ramen", "noodle", "rice", "soup", "salad", "drink", "tea", "beer", "wine", "cocktail", "bar", "小吃", "夜宵", "点心", "饺子", "包子", "粥", "煮", "炒", "烤", "炸", "蒸"],
  学习: ["读书", "看书", "学习", "复习", "考试", "课程", "英语", "数学", "编程", "写作", "笔记", "背单词", "论文", "作业", "培训", "讲座", "study", "read", "learn", "exam", "course", "book", "library", "write", "code", "practice", "tutorial", "homework", "research"],
  运动: ["跑步", "健身", "游泳", "瑜伽", "打球", "骑车", "散步", "走路", "爬山", "登山", "徒步", "篮球", "足球", "羽毛球", "乒乓", "网球", "滑雪", "冲浪", "拳击", "举铁", "拉伸", "run", "gym", "swim", "yoga", "hike", "bike", "walk", "exercise", "workout", "sport", "tennis", "basketball", "football"],
  社交: ["聚餐", "约会", "见面", "朋友", "聚会", "拜访", "派对", "生日", "婚礼", "饭局", "团建", "叙旧", "认识", "social", "meet", "party", "date", "friend", "visit", "gathering", "reunion", "wedding", "birthday"],
  工作: ["开会", "汇报", "项目", "加班", "邮件", "客户", "面试", "上班", "出差", "会议", "报告", "方案", "提案", "PPT", "合同", "签约", "work", "meeting", "office", "email", "project", "deadline", "interview", "presentation", "report", "client"],
  美景: ["旅行", "出游", "拍照", "风景", "公园", "爬山", "看海", "日出", "日落", "赏花", "看展", "博物馆", "古镇", "景点", "露营", "野餐", "travel", "trip", "photo", "park", "beach", "sunset", "sunrise", "museum", "camp", "explore", "scenery", "view", "mountain", "lake", "sea", "ocean"],
  娱乐: ["电影", "游戏", "音乐", "演出", "KTV", "剧", "综艺", "追剧", "看剧", "动漫", "漫画", "音乐会", "演唱会", "话剧", "展览", "逛街", "购物", "movie", "game", "music", "show", "concert", "drama", "anime", "shop", "shopping", "play", "fun", "entertainment", "Netflix", "YouTube"],
  健康: ["体检", "吃药", "早睡", "冥想", "看医生", "睡觉", "休息", "喝水", "养生", "按摩", "泡脚", "护眼", "戒糖", "减肥", "称重", "打疫苗", "中医", "health", "sleep", "rest", "meditate", "doctor", "medicine", "water", "diet", "relax", "massage", "vitamin", "stretch"],
  美丽: ["护肤", "化妆", "美甲", "发型", "穿搭", "面膜", "防晒", "美容", "洗脸", "保湿", "理发", "染发", "做指甲", "搭配", "skincare", "makeup", "nail", "hair", "fashion", "style", "beauty", "mask", "sunscreen"],
};

const CATEGORY_ICON: Record<string, string> = {
  美食: "coffee",
  学习: "book",
  运动: "dumbbell",
  社交: "heart",
  工作: "star",
  美景: "star",
  娱乐: "music",
  健康: "heart",
  美丽: "star",
  记录: "star",
};

export function autoCategory(title: string): { category: string; icon: string } {
  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return { category, icon: CATEGORY_ICON[category] || "star" };
    }
  }
  return { category: "记录", icon: "star" };
}
