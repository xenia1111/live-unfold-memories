

## 实施方案 C：奶油焦糖 ☕

修改 `src/index.css` 中的 CSS 变量，将当前高饱和琥珀金替换为复古焦糖色系。

### 配色方案

```text
背景:  米色   hsl(38, 45%, 95%)
主色:  焦糖棕 hsl(25, 45%, 48%)
副色:  暖橘   hsl(18, 55%, 58%)
强调:  深可可 hsl(15, 30%, 32%)
卡片:  奶油色 hsl(40, 40%, 97%)
文字:  深棕   hsl(20, 20%, 15%)
边框:  浅驼   hsl(35, 20%, 84%)
柔光:  焦糖光 hsl(25, 45%, 48% / 0.15)
```

### 改动文件

**`src/index.css`** — 唯一需要改的文件：
- Light mode：所有 `--background`、`--primary`、`--secondary`、`--accent`、`--muted` 等变量换为焦糖色系 HSL 值
- Dark mode：对应的深色变量调整为深可可/深棕底色
- 自定义 token：`--warm-glow`、`--story-gradient`、`--progress-gradient`、`--card-shadow` 同步更新
- 动画关键帧：`breathe`、`glow-pulse`、`today-glow` 中的发光色从金色改为焦糖棕色调

不涉及组件代码、数据库或其他文件改动。

