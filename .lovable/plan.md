

## 已完成事件编辑功能 — 实现计划

### 当前状况
- 已完成任务点击后无响应（`if (task.completed) return;`，第116行）
- `useTasks` 只有 `addTask` 和 `completeTask`，没有通用的 `updateTask`
- 完成记录包含：标题、分类、图标、时间、日期、截止日期、完成照片、完成随笔

### 实现方案

#### 1. `useTasks` 新增 `updateTask` 方法
- 支持更新任务的所有字段（标题、分类、图标、时间、日期、截止日期、完成照片、完成随笔）
- 调用 `supabase.from("tasks").update(...)` 同步数据库

#### 2. 新建 `EditTaskDialog` 组件
- 点击已完成任务时弹出编辑弹窗（复用 AddTaskDialog 的布局风格）
- 顶部展示当前完成照片（可更换/删除）和随笔（可编辑）
- 下方可编辑：标题、分类、图标、日期、时间、截止日期
- 底部按钮：「保存修改」+ 「删除任务」（带确认）
- 适配移动端（85vh、内部滚动、圆角弹窗）

#### 3. `useTasks` 新增 `deleteTask` 方法
- 编辑弹窗内提供删除功能，删除后从列表移除

#### 4. `HomePage` 修改
- 移除 `if (task.completed) return;` 的拦截
- 已完成任务点击 → 打开 `EditTaskDialog`
- 未完成任务点击 → 保持原有完成流程

### 交互流程

```text
点击已完成任务 → 打开 EditTaskDialog（预填当前数据）
  ├── 编辑任意字段 → 保存 → 更新数据库 + 刷新列表
  └── 删除 → 二次确认 → 删除数据库记录 + 移出列表
```

### 涉及文件
- `src/hooks/useTasks.ts` — 新增 `updateTask`、`deleteTask`
- `src/components/EditTaskDialog.tsx` — 新建
- `src/components/HomePage.tsx` — 已完成任务点击逻辑改为打开编辑弹窗

