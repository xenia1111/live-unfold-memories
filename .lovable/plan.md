

## Browser Notification Feature Plan

### Overview
Implement real browser notifications that fire when a task's scheduled time arrives. This uses the **Notification API** (works in all modern browsers) combined with an in-app timer system — no backend changes needed.

### How It Works

```text
App Mount → useTaskNotifications hook starts
  ├─ Request browser permission (if not yet granted)
  ├─ Every 60s, scan today's tasks
  │   └─ For tasks with time="HH:MM" or range start time:
  │       If current time matches (±1 min) AND not yet notified → fire Notification
  └─ Track notified task IDs in a Set to avoid duplicates
```

### Task Time Parsing
Tasks store time as one of four formats:
- `"不限"` / `"全天"` → no specific time, skip notification
- `"HH:MM"` (e.g. `"09:00"`) → notify at that exact time
- `"HH:MM-HH:MM"` (e.g. `"09:00-10:00"`) → notify at start time

### Implementation Steps

#### 1. Create `useTaskNotifications` hook
New file: `src/hooks/useTaskNotifications.ts`
- Accept `tasks: Task[]` as input
- On mount, call `Notification.requestPermission()` if setting is enabled
- Set up a `setInterval` (every 60s) that:
  - Filters today's incomplete tasks with a specific time
  - Compares task time to `new Date()` (hour + minute match)
  - Fires `new Notification(title, { body, icon })` for matching tasks
  - Tracks fired notifications in a `Set<string>` (task ID + date) to prevent repeats
- Reads `localStorage` notification enabled flag before firing
- Cleans up interval on unmount

#### 2. Integrate hook in `Index.tsx`
- Call `useTaskNotifications(tasks)` inside the `Index` component (after auth check)
- No UI changes needed — the hook runs silently in the background

#### 3. Update `NotificationSettingsPage.tsx`
- When user enables notifications, immediately request browser permission via `Notification.requestPermission()`
- Show permission status (granted/denied/default) as a subtitle
- Connect text to i18n system (replace hardcoded Chinese/English)

#### 4. Add i18n keys
- Add notification-related translation keys: permission status text, notification body template

### Files to Create/Modify
- **New**: `src/hooks/useTaskNotifications.ts`
- **Edit**: `src/pages/Index.tsx` — add hook call
- **Edit**: `src/components/NotificationSettingsPage.tsx` — request permission, show status
- **Edit**: `src/lib/i18n.tsx` — add notification translation keys

