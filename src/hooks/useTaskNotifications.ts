import { useEffect, useRef } from "react";
import type { Task } from "@/hooks/useTasks";

const NOTIF_KEY = "app_notifications_enabled";
const INTERVAL_MS = 60_000;

/** Extract HH:MM from task time string. Returns null for "不限"/"全天" etc. */
function parseNotifyTime(time: string): { hour: number; minute: number } | null {
  // "HH:MM" or "HH:MM-HH:MM" → take first part
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) };
}

function isToday(d?: Date): boolean {
  if (!d) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function useTaskNotifications(tasks: Task[]) {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only run if notifications are enabled in settings
    if (localStorage.getItem(NOTIF_KEY) === "false") return;
    if (!("Notification" in window)) return;

    // Request permission on mount
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const check = () => {
      if (Notification.permission !== "granted") return;
      if (localStorage.getItem(NOTIF_KEY) === "false") return;

      const now = new Date();
      const nowH = now.getHours();
      const nowM = now.getMinutes();
      const todayKey = now.toISOString().split("T")[0];

      for (const task of tasks) {
        if (task.completed) continue;
        if (!isToday(task.date)) continue;

        const parsed = parseNotifyTime(task.time);
        if (!parsed) continue;

        if (parsed.hour === nowH && Math.abs(parsed.minute - nowM) <= 1) {
          const firedKey = `${task.id}_${todayKey}`;
          if (firedRef.current.has(firedKey)) continue;
          firedRef.current.add(firedKey);

          new Notification(task.title, {
            body: `⏰ ${task.time}`,
            icon: "/favicon.ico",
            tag: firedKey,
          });
        }
      }
    };

    // Check immediately, then every 60s
    check();
    const timer = setInterval(check, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [tasks]);
}
