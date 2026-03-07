

## UI升级计划：玻璃拟态 + 情绪化时间配色

### 设计理念

将整个应用从"扁平卡片风"升级为 **Glassmorphism（毛玻璃）+ 时间感知配色**，让界面随时间"活"起来，同时用半透明层次感营造 Vision Pro 般的质感。

### 核心改动

#### 1. 时间感知背景系统 (`src/components/TimeAwareBackground.tsx` — 新文件)

根据当前小时动态生成全屏渐变背景：

| 时段 | 色调 | 氛围 |
|------|------|------|
| 5-8点 | 柔粉 → 浅金 | 日出晨曦 |
| 8-12点 | 暖白 → 淡蓝 | 清晨明亮 |
| 12-14点 | 浅金 → 暖橙 | 午后温暖 |
| 14-18点 | 淡蓝 → 琥珀 | 下午黄金时段 |
| 18-21点 | 橙粉 → 紫蓝 | 日落魔法时刻 |
| 21-5点 | 深蓝 → 靛紫 | 夜晚星空 |

- 组件每分钟检测一次时段变化，渐变平滑过渡
- 作为全局背景层渲染在 `Index.tsx` 中

#### 2. 全局样式升级 (`src/index.css`)

新增玻璃拟态工具类：
- `.glass` — `backdrop-blur-xl bg-white/60 dark:bg-white/8 border border-white/20`
- `.glass-card` — 基于 `.glass` 加 `rounded-2xl shadow-lg shadow-black/5`
- `.glass-nav` — 底部导航专用，更重的 blur + 半透明

#### 3. 首页改造 (`src/components/HomePage.tsx`)

- **问候区域**：去掉纯色背景，文字直接浮在时间渐变上，加 `text-shadow` 增强可读性
- **进度条**：改用半透明玻璃容器 + 内发光进度填充
- **任务卡片**：`bg-card` → `glass-card`，半透明白底 + 模糊背景穿透
- **未完成任务**：边框改为 `border-white/30`，悬停时 `border-white/50` + 微光效果
- **已完成任务**：更低透明度 `bg-white/30`，对勾带柔和发光

#### 4. 底部导航升级 (`src/components/BottomNav.tsx`)

- 背景改为 `glass-nav`（`backdrop-blur-2xl bg-white/50`）
- 选中标签下方加发光点（当前小圆点加 `box-shadow` 扩散）
- 图标选中态加微光晕

#### 5. CatPet 区域优化 (`src/components/CatPet.tsx`)

- 信息标签（等级/天数/圆润度）改为毛玻璃胶囊 `backdrop-blur-md bg-white/25`
- 对话气泡改为玻璃拟态风格
- 猫粮进度条改用玻璃容器 + 内发光

#### 6. AddTaskDialog 升级 (`src/components/AddTaskDialog.tsx`)

- Dialog 背景改为毛玻璃 `backdrop-blur-2xl bg-card/80`
- 输入框改为玻璃态 `bg-white/40 backdrop-blur-sm`
- 分类/日期选择按钮改为半透明胶囊

#### 7. 其他页面统一风格

- **CalendarPage**: 月历卡片、事件列表改为玻璃卡片
- **StoryPage**: 故事卡片改为玻璃态，保留渐变点缀
- **ProfilePage**: 个人信息卡、菜单列表改为玻璃卡片
- **AuthPage**: 登录表单改为居中的大毛玻璃卡片

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/TimeAwareBackground.tsx` | 新建：时间感知渐变背景组件 |
| `src/index.css` | 新增 glass 工具类 |
| `src/pages/Index.tsx` | 包裹 TimeAwareBackground |
| `src/components/HomePage.tsx` | 卡片/进度条改为玻璃态 |
| `src/components/BottomNav.tsx` | 导航栏玻璃化 |
| `src/components/CatPet.tsx` | 标签/气泡玻璃化 |
| `src/components/AddTaskDialog.tsx` | 弹窗玻璃化 |
| `src/components/CalendarPage.tsx` | 卡片玻璃化 |
| `src/components/StoryPage.tsx` | 故事卡片玻璃化 |
| `src/components/ProfilePage.tsx` | 菜单卡片玻璃化 |
| `src/components/AuthPage.tsx` | 登录卡片玻璃化 |

不需要数据库改动，纯前端视觉升级。

