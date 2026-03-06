

## 全面国际化（i18n）实施方案

### 目标
切换语言后，前端所有界面文字、弹窗提示、toast 消息全部切换为对应语言（中文、英语、法语、西班牙语、日语）。

### 需要修改的文件（共约 18 个）

**新建文件：**
- `src/lib/i18n.tsx` — i18n 上下文、翻译字典（5 种语言）、`useI18n()` hook

**修改文件：**
- `src/App.tsx` — 包裹 `I18nProvider`
- `src/components/BottomNav.tsx` — 导航标签（首页/日历/故事/我的）
- `src/components/HomePage.tsx` — 问候语、加载文本、分区标题、任务状态
- `src/components/AddTaskDialog.tsx` — 表单标签、分类名、语音提示
- `src/components/CalendarPage.tsx` — 时间轴标签、月份、日期格式
- `src/components/StoryPage.tsx` — 周期标签、按钮、空状态
- `src/components/ProfilePage.tsx` — 统计标签、菜单项
- `src/components/ProfileEditPage.tsx` — 字段标签、性别选项、地区名
- `src/components/GeneralSettingsPage.tsx` — 密码/语言/版本号
- `src/components/ProductIntroPage.tsx` — 介绍步骤
- `src/components/EditTaskDialog.tsx` — 编辑表单标签
- `src/components/CompletionPhotoDialog.tsx` — 完成弹窗文本
- `src/components/CatPet.tsx` — 猫咪状态、味道评论
- `src/components/GameStats.tsx` — 成就名称
- `src/components/CatRadarDialog.tsx` — 雷达图标签
- `src/components/CategoryStoryView.tsx` — 分类故事标签
- `src/components/RoundnessLeaderboard.tsx` — 排行榜标签
- `src/lib/catPersonality.ts` — 猫性格描述
- `src/lib/catGrowth.ts` — 成长阶段名称

### 技术方案

**1. i18n 系统架构（`src/lib/i18n.tsx`）**
- React Context + `useI18n()` hook
- `t(key)` 翻译函数，缺失时 fallback 到中文
- 语言状态持久化到 `localStorage`
- 导出 date-fns locale 对象（zhCN/enUS/fr/es/ja）用于日期格式化
- 翻译字典按 `Record<Language, Record<string, string>>` 组织

**2. 数据兼容性**
- 分类名（如"美食"、"学习"）在数据库中保持中文不变，仅翻译显示文本
- TimePicker 内部值保持中文常量，仅翻译 UI 显示
- 性别/地区存储值保持中文，通过映射表翻译显示

**3. 日期格式本地化**
- 中文: `M月d日 EEEE`
- 英语: `MMM d, EEEE`
- 法语/西班牙语/日语: 各自习惯格式
- 使用 date-fns 对应 locale

### 实施步骤

1. 创建 `src/lib/i18n.tsx`（翻译字典 + Context + Hook）
2. 在 `App.tsx` 中包裹 `I18nProvider`
3. 按批次更新所有组件，将硬编码中文替换为 `t('key')` 调用
4. 更新 `GeneralSettingsPage` 语言切换逻辑，使用 i18n context 而非直接写 localStorage

### 预估规模
- i18n.tsx 约 800-1000 行（5 种语言 × ~200 个翻译键）
- 每个组件改动量中等（替换字符串 + 导入 hook）

