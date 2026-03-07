

## 移除两个不符合 iOS 规范的标题元素

### 要移除的内容

1. **故事页顶部标题区** (`src/components/StoryPage.tsx` 第 175-181 行)
   - 📖 图标 + "回忆是最美的礼物" 副标题
   - "你的故事" 大标题
   - 整个 `animate-fade-in mb-4` 的 div 块移除

2. **首页日期行** (`src/components/HomePage.tsx` 第 168-170 行)
   - "3月5日 星期四" 的文字移除

### 改动范围

| 文件 | 操作 |
|------|------|
| `src/components/StoryPage.tsx` | 删除第 175-181 行的标题区块 |
| `src/components/HomePage.tsx` | 删除第 168-170 行的日期段落 |

两处都是纯删除，不影响其他功能。

