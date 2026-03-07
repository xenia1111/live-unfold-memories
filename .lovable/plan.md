

## 计划：修复猫咪系统逻辑

### 问题总结

对比用户提供的背景对照表与当前代码 `CAT_BACKGROUNDS`：

| 用户等级 | 用户期望 | 代码等级 | 代码当前 | 匹配? |
|---------|---------|---------|---------|------|
| 1 | 草地晨露 🌿 | 0 | 草地 (grassland) | ✓ |
| 2 | 小花园 🌸 | 1 | **小屋 (cottage)** | ✗ 顺序反了 |
| 3 | 屋顶小镇 🏘️ | 2 | **花园 (garden)** | ✗ 顺序反了 |
| 4 | 森林山丘 🌲 | 3 | 森林 | ✓ |
| 5 | 云上山顶 ☁️ | 4 | 山顶 | ✓ |
| 6 | 海边悬崖黄昏 🌅 | 5 | **星空** | ✗ |
| 7 | 星云漂浮 🌌 | 6 | **宇宙** | ✗ |

等级1和2的背景顺序反了（花园应在小屋/小镇之前），等级5-6的名称和主题也不对。

### 改动计划

#### 1. 数据库迁移：`cat_profiles` 加 `cat_category` 字段
- 新增 `cat_category TEXT` 列，用于永久记录用户猫咪类别
- 首个任务创建时写入，之后不再变更

#### 2. 修复背景顺序 (`src/lib/catGrowth.ts`)
将 `CAT_BACKGROUNDS` 调整为：
- 0 → 草地晨露 (grassland)
- 1 → 小花园 (garden)
- 2 → 屋顶小镇 (cottage)
- 3 → 森林山丘
- 4 → 云上山顶
- 5 → 海边悬崖黄昏
- 6 → 星云漂浮

#### 3. 猫咪类型固定逻辑 (`src/components/CatPet.tsx`)
- 启动时从 `cat_profiles.cat_category` 读取固定类别
- 若为空且有任务，取第一个任务的 `category` 写入数据库并锁定
- 猫咪形象始终用该固定类别 + 当前等级选图
- 不再依赖 `getCatPersonality` 决定显示哪只猫

#### 4. 精简人格逻辑 (`src/lib/catPersonality.ts`)
- `getCatPersonality` 保留用于对话台词，不再驱动猫咪形象选择

### 涉及文件

| 文件 | 改动 |
|------|------|
| 数据库迁移 | `cat_profiles` 加 `cat_category` 列 |
| `src/lib/catGrowth.ts` | 修正 `CAT_BACKGROUNDS` 顺序和名称 |
| `src/components/CatPet.tsx` | 读取/写入固定 `cat_category`，用它选图 |

