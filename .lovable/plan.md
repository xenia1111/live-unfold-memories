

# 产品全景文档

---

## 一、产品定位与核心理念

**核心理念**：「把"想做的事"变成"会发生的事"，把"发生过的事"变成"能回忆的事"。」

这是一款面向个人生活管理的移动端 Web 应用，不是冷冰冰的效率工具，而是围绕 **规划 → 执行 → 记录 → 回忆** 的情感闭环，让用户感受到生活的充实感。

---

## 二、技术架构

| 层面 | 技术 |
|---|---|
| 框架 | React 18 + TypeScript + Vite |
| 路由 | React Router v6，只有一个路由 `/`，Tab 切换为组件级 |
| 样式 | Tailwind CSS + CSS 变量 + 自定义动画关键帧 |
| UI 组件库 | shadcn/ui（Dialog, Sheet, Popover, Tabs, Toast） |
| 状态管理 | React useState，状态提升到 `Index.tsx` |
| 数据查询 | TanStack React Query（已安装但尚未使用） |
| 后端 | Lovable Cloud（已连接），有一个 `generate-story` Edge Function |
| AI | Lovable AI Gateway → google/gemini-3-flash-preview |
| 数据持久化 | **尚未实现**，所有数据在内存中，刷新即丢失 |

### 应用入口链路

```text
main.tsx → App.tsx → BrowserRouter → Route "/" → Index.tsx
                                                    ├── HomePage
                                                    ├── CalendarPage
                                                    ├── StoryPage
                                                    ├── ProfilePage
                                                    ├── AddTaskDialog (浮动+按钮)
                                                    └── BottomNav (底部导航)
```

---

## 三、数据模型与状态流

### 3.1 核心数据结构：Task

```text
Task {
  id: string
  title: string          // 任务标题
  time: string           // "07:00"-"23:00" 或 "全天"
  icon: string           // coffee/dumbbell/book/music/heart/star
  completed: boolean
  date?: Date            // 有日期 = 具体计划，无日期 = 计划池
  category: string       // 运动/学习/社交/工作/健康/记录/娱乐
  coverImage?: string    // 创建时上传的封面（base64）
  completionPhoto?: string  // 完成时拍的照片（base64）
  deadline?: Date        // 截止日期
}
```

### 3.2 状态管理架构

```text
Index.tsx (单一数据源)
  ├── tasks: Task[]  ←  useState(generateMockTasks)
  ├── activeTab: string  ←  useState("home")
  │
  ├── handleAddTask()    ← AddTaskDialog 调用
  ├── handleTasksChange() ← HomePage 完成任务时调用
  │
  ├── → HomePage      (props: tasks, onTasksChange) ← 可读写
  ├── → CalendarPage   (props: tasks)               ← 只读
  ├── → StoryPage      (props: tasks)               ← 只读
  └── → ProfilePage    (无 props)                   ← 独立硬编码
```

首次加载时通过 `generateMockTasks()` 生成 13 条示例任务（含过去5天已完成 + 今天 + 未来 + 无日期）。

---

## 四、四个核心 Tab

### Tab 1：首页 (HomePage)

**职责**：聚焦「今天」，驱动用户行动。

| 区域 | 实现细节 |
|---|---|
| **问候语** | `getGreeting()` 按 6 个时段返回不同文案+emoji（夜深了🌙/早安🌅/上午好☀️/午安🍵/下午好🌤️/傍晚好🌇/晚安🌛） |
| **今日进度条** | `todayCompleted / todayTotal`，CSS `gradient-progress` 渐变填充，全部完成显示"🎉今天全部完成！太棒了" |
| **激励标签** | 🔥连续天数（硬编码5天）、⚡XP值（`allCompleted * 10`） |
| **今日任务列表** | 筛选 `isToday(t.date)` 的任务，未完成=空心圆+可点击，已完成=绿勾+中划线+淡化 |
| **即将到来** | 筛选 `isFuture(t.date)` 的前3条预览，点击标题行展开全屏 Sheet，内部按日期分组（明天/后天/具体日期） |
| **计划中** | 筛选 `!t.date && !t.completed` 的前2条预览，点击展开 Sheet，可直接打卡完成 |
| **空状态** | 🌿 "今天还没有安排" + 引导文案 |

**Deadline 机制**：
- `DeadlineTag` 组件计算 `differenceInCalendarDays`
- `days <= 0` → 红色"已到期" + AlertCircle 图标
- `days === 1` → "明天截止"
- `days <= 2` → 红色警示样式
- `days > 2` → 柔和色"还剩N天"

### Tab 2：日历/时间轴 (CalendarPage)

**职责**：回顾历史记录，构建时间线。

| 区域 | 实现细节 |
|---|---|
| **吸顶导航** | `fixed top-0`，毛玻璃 `backdrop-blur-xl`，含标题"时间轴"、MonthPicker、"今天"按钮 |
| **MonthPicker** | Popover 弹出，年份左右箭头切换，4×3 月份网格，有数据的月份底部有小圆点，当前月高亮 |
| **纵向时间轴** | 左侧 2px 渐变竖线 + 圆点节点，按月分组，每组显示月份+记录条数 |
| **事件卡片** | 日期(M/d 星期X) + 分类标签(颜色映射) + 标题 + PhotoGrid 图片宫格 |
| **今天标记** | `animate-breathe` 脉动 + 主色填充 + "今天"标签 + 高亮边框 |
| **数据来源** | 合并两部分：90天随机 Mock 事件（`generateMockEvents()`，60%概率生成，随机0-6张Unsplash图片）+ 用户通过首页完成的真实任务（按 `t.date <= new Date()` 过滤） |
| **滚动到月份** | `scrollIntoView({ behavior: "smooth" })` |

### Tab 3：故事 (StoryPage)

**职责**：叙事化总结，赋予生活意义感。

| 区域 | 实现细节 |
|---|---|
| **周期切换** | 4个 Tab：一周📅 / 一月🗓️ / 一季🍂 / 半年🌍 |
| **多周期回顾** | 周=3期(本周/上周/两周前)、月=3期、季=2期、半年=2期 |
| **数据计算** | `getPeriodRanges()` 计算时间区间 → 筛选区间内的 tasks → 计算完成率 → `buildFallback()` 生成基础总结 |
| **Fallback 总结** | 纯前端逻辑：按完成率分档（≥80%=高光时刻/≥50%=稳步前行/<50%=蓄势待发），统计分类完成数 |
| **AI 故事** | 点击"✨用AI生成有温度的故事" → 调用 `generate-story` Edge Function → Gemini 3 Flash 生成叙事JSON → 替换 Fallback |
| **AI Prompt 要点** | 第二人称"你"、温暖语气、不要罗列数据、从事件中提炼感受、150-250字、返回结构化JSON |
| **随笔** | 每张故事卡底部可编辑随笔区域（`notes` state），支持查看/编辑切换 |
| **分享** | 每张卡片底部"分享这段故事"按钮，组装文本 → `navigator.share` 或 clipboard fallback |
| **心情色** | 按完成率动态选择渐变色（≥80%=金色/≥60%=绿色/≥40%=珊瑚色/<40%=灰色） |

### Tab 4：个人主页 (ProfilePage)

**职责**：展示用户身份与设置入口。

| 区域 | 实现细节 |
|---|---|
| **头像** | 渐变圆形 `gradient-warm` + User 图标 |
| **用户信息** | 硬编码："探索者" + "让每一天都鲜活" |
| **统计** | 3列网格：完成计划 280 / 连续天数 23 / 生活指数 92（全部硬编码） |
| **设置菜单** | 4项：通知/隐私/外观/通用（全部 UI 占位，无功能） |
| **退出登录** | UI 占位按钮 |

---

## 五、任务全生命周期

### 5.1 创建任务 (AddTaskDialog)

浮动 `+` 按钮（右下角 `bottom-24 right-6`，带 `animate-breathe`），点击弹出 Dialog：

| 字段 | 选项 |
|---|---|
| 标题 | 文本输入，必填 |
| 封面图 | 可选，file input + base64 预览 |
| 日期 | 横向滑动：不定 / 今天 / 明天 / 未来7天 |
| 时间 | 仅选了日期时显示：07:00-23:00 每小时 + 全天 |
| 截止日期 | 无 / 3天后 / 5天后 / 7天后 / 14天后 / 30天后 |
| 图标 | 6种：咖啡/运动/阅读/音乐/生活/特别 |
| 分类 | 7种：运动/学习/社交/工作/健康/记录/娱乐 |

提交后 → `onAdd()` → `Index.tsx` 的 `handleAddTask()` 追加到 tasks 数组。

### 5.2 完成任务 (CompletionPhotoDialog)

点击未完成任务 → 弹出"记录生活时刻"对话框：

1. 随机展示一条温暖文案（6种，如"🌿记录这一刻 · 生活值得被好好感受"）
2. **随笔优先**：顶部 textarea，引导"此刻你在想什么？"
3. **配照片**：可选，点击虚线框选择图片
4. 两个按钮："直接完成"（跳过记录）/ "记录下来"（有内容时高亮+Sparkles图标）
5. 确认后 → 标记 `completed: true` → 保存 `completionPhoto` → 触发撒花 → 卡片播放 `animate-celebrate`

### 5.3 撒花动画 (ConfettiCanvas)

全屏 Canvas 覆盖层，80个粒子：
- 形状：circle / rect / star 随机
- 颜色：6色（金/绿/珊瑚/粉/蓝/黄）
- 物理：初速度向上 + 水平散射 → 重力下落 → 阻尼 → 旋转 → 透明度衰减
- 持续约 180 帧后自动清除

---

## 六、游戏化系统 (GameStats)

**注意：该组件已实现但当前未被任何页面引用。**

| 机制 | 规则 |
|---|---|
| **XP** | 每完成1个任务 = 10 XP |
| **等级** | 7级阶梯：🌱小种子(0XP) → 🌿小树苗(100) → 🌸小花朵(250) → 🌳大树(500) → 🏡花园(1000) → 🌲森林(2000) → ✨传说(5000) |
| **连续天数** | 传入 `streak` prop，首页硬编码为 5 |
| **成就徽章** | 5种：👣迈出第一步(1任务) / 🎯五连发(5) / 💪行动达人(10) / 🔥三连击(连续3天) / ⭐一周之星(连续7天) |
| **未解锁提示** | 显示前2个未解锁成就的描述 + 🔒 |

首页中的激励标签（🔥连续天数、⚡XP）是独立实现的，并非引用 GameStats 组件。

---

## 七、视觉设计系统

### 7.1 配色体系（CSS 变量）

| Token | Light 模式 | Dark 模式 | 用途 |
|---|---|---|---|
| Primary | hsl(36, 80%, 50%) 暖金色 | hsl(36, 80%, 55%) | 主操作、进度条、强调 |
| Secondary | hsl(150, 25%, 45%) 森林绿 | hsl(150, 25%, 40%) | 已完成状态、辅助 |
| Accent | hsl(20, 60%, 55%) 珊瑚色 | hsl(20, 60%, 50%) | 警告、连续天数 |

### 7.2 字体

- 正文：Noto Sans SC（无衬线，中文）
- 标题（h1-h3）：Playfair Display（衬线体，英文/数字）

### 7.3 动画清单

| 类名 | 效果 | 用途 |
|---|---|---|
| `animate-fade-in` | Tailwind 内置淡入 | 页面元素入场 |
| `animate-slide-up` | Tailwind 内置上滑 | 故事卡片入场 |
| `animate-float` | 上下浮动 3s 循环 | 等级 emoji |
| `animate-breathe` | 发光脉动 3s 循环 | 今天时间点、+按钮 |
| `animate-celebrate` | 弹跳旋转 0.6s | 任务完成时卡片 |
| `animate-pulse-warm` | 透明度脉动 2s | 连续天数火焰图标 |
| `animate-bounce-in` | 缩放弹入 0.5s | 庆祝弹窗图标 |
| `animate-shimmer` | 横向光泽扫过 | 加载占位 |
| `animate-glow-pulse` | 发光脉动 2s | 特殊强调 |

### 7.4 图片宫格 (PhotoGrid)

微信朋友圈风格：
- 1张：16:10 宽幅
- 2张：2列正方形
- 3张：首张宽幅 + 下方2列
- 4张：2×2
- 5-9张：3列网格
- >9张：第9格显示 `+N` 遮罩

---

## 八、后端服务

### 8.1 Edge Function: generate-story

- **触发**：故事页点击"用AI生成有温度的故事"
- **输入**：`{ tasks, periodLabel, timeRange }`
- **处理**：整理任务统计（完成率、分类分布、超期任务） → 构建 Prompt → 调用 Lovable AI Gateway (Gemini 3 Flash)
- **输出**：结构化 JSON `{ title, openingLine, summary, highlights[], mood, emoji }`
- **错误处理**：429=频率限制、402=额度用尽、解析失败=降级到 Fallback

### 8.2 数据库

**当前无任何数据库表。** 已批准的持久化方案计划创建 3 张表（tasks、story_notes、ai_stories），但尚未执行。

---

## 九、底部导航 (BottomNav)

固定底部 `fixed bottom-0`，毛玻璃效果 `backdrop-blur-xl`：

| Tab | 图标 | 标签 | 组件 |
|---|---|---|---|
| home | Home | 首页 | HomePage |
| calendar | CalendarDays | 日历 | CalendarPage |
| story | BookOpen | 故事 | StoryPage |
| profile | User | 我的 | ProfilePage |

选中态：主色文字 + 粗线条 + 放大5% + 底部小圆点指示器。

---

## 十、当前已知限制

1. **无数据持久化**：刷新即丢失所有数据（任务、随笔、AI故事），无 localStorage 也无数据库
2. **GameStats 组件孤立**：已实现完整的等级/成就系统，但未被 ProfilePage 或任何页面引用
3. **ProfilePage 全硬编码**：统计数据(280/23/92)与实际任务完成无关
4. **连续天数硬编码**：首页显示"5天连续"是固定值，未根据实际完成记录计算
5. **无用户认证**：退出登录按钮为占位
6. **设置页无功能**：4个设置菜单项均无实际逻辑
7. **日历页 Mock 数据**：90天随机事件在每次组件挂载时重新生成，与用户行为无关
8. **随笔未持久化**：故事页和完成任务时的随笔都只存在内存中
9. **分享仅纯文本**：无图片卡片生成能力

