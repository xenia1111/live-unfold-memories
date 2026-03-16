

## 垂直卡片轮播 — 完全重写滑动交互

### 核心思路

抛弃当前的"堆叠边缘 + 点击跳转"方案，改为**垂直全屏卡片轮播**：每个月份占满整个可用高度，上下滑动时带有平滑的 `translateY` 过渡动画，类似竖版轮播/小红书翻页。上下相邻月份的卡片边缘会微微露出，暗示可以继续滑动。

### 技术方案

**1. 布局：所有月份卡片纵向排列，用 `translateY` 控制位置**

- 外层容器 `overflow: hidden`，固定高度 `h-[calc(100vh-80px)]`
- 所有 12 个月份卡片都渲染，每个占满容器高度
- 通过一个 `translateY` 值控制整体偏移：`translateY = -(activeIndex * containerHeight) + dragOffset`
- 上下相邻卡片自然露出边缘（无需手动计算 peek）

**2. 触摸手势：实时拖拽 + 惯性翻页**

- `onTouchStart`：记录起始 Y 坐标
- `onTouchMove`：实时更新 `dragOffset` state，卡片跟手移动（无 transition）
- `onTouchEnd`：根据拖拽距离或速度决定翻到上/下一页还是回弹
  - 拖拽超过容器高度 20% → 翻页
  - 速度 > 0.3px/ms → 翻页
  - 否则 → 回弹到当前页
- 翻页/回弹时加 `transition: transform 0.4s ease-out`

**3. 回到本月按钮**

- 当 `activeIndex !== 0` 时，右上角显示浮动按钮 `← 三月`（动态显示当前月名称）
- 点击后 `activeIndex = 0`，带动画滚回

**4. 卡片内部滚动**

- 每张卡片内部仍可滚动（`overflow-y: auto`）
- 关键：当卡片内容滚动到顶部/底部边界时，才允许手势触发翻页
- 通过 `touchStart` 时记录 scrollTop，`touchMove` 时判断是否在边界来决定是内部滚动还是页面翻动

### 状态管理

```text
activeIndex: number        — 当前显示的月份索引
dragOffset: number         — 拖拽时的实时偏移（px）
isDragging: boolean        — 是否正在拖拽（控制 transition 开关）
canSwipe: boolean          — 内部滚动是否在边界（允许翻页）
```

### 视觉效果

- 卡片之间留 16px 间距，露出背景色作为分隔
- 当前卡片带 `rounded-3xl` 和阴影
- 拖拽时无 transition（跟手），松手后加 `0.4s ease-out` transition

### 改动文件

仅 `src/components/StoryPage.tsx`，完全重写 return 部分的布局和手势逻辑，保留 `renderMonthCard`、`buildFallback`、`generateAIStory` 等业务逻辑不变。

