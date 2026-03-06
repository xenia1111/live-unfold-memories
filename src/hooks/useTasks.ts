import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  time: string;
  icon: string;
  completed: boolean;
  date?: Date;
  category: string;
  coverImage?: string;
  completionPhoto?: string;
  completionNote?: string;
  deadline?: Date;
}

interface DbTask {
  id: string;
  title: string;
  time: string;
  icon: string;
  completed: boolean;
  date: string | null;
  category: string;
  cover_image: string | null;
  completion_photo: string | null;
  completion_note: string | null;
  deadline: string | null;
}

const dbToTask = (row: DbTask): Task => ({
  id: row.id,
  title: row.title,
  time: row.time,
  icon: row.icon,
  completed: row.completed,
  date: row.date ? new Date(row.date + "T00:00:00") : undefined,
  category: row.category,
  coverImage: row.cover_image || undefined,
  completionPhoto: row.completion_photo || undefined,
  completionNote: row.completion_note || undefined,
  deadline: row.deadline ? new Date(row.deadline + "T00:00:00") : undefined,
});

const formatDate = (d?: Date): string | null =>
  d ? d.toISOString().split("T")[0] : null;

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) { setTasks([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("加载任务失败");
      return;
    }
    setTasks((data as DbTask[]).map(dbToTask));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (task: {
    title: string; time: string; icon: string; category: string;
    date?: Date; coverImage?: string; deadline?: Date;
  }) => {
    if (!user) return;
    const row = {
      title: task.title,
      time: task.time,
      icon: task.icon,
      category: task.category,
      date: formatDate(task.date),
      cover_image: task.coverImage || null,
      deadline: formatDate(task.deadline),
      user_id: user.id,
    };
    const { data, error } = await supabase.from("tasks").insert(row).select().single();
    if (error) {
      toast.error("添加任务失败");
      return;
    }
    setTasks(prev => [...prev, dbToTask(data as DbTask)]);
  }, [user]);

  const completeTask = useCallback(async (id: string, photo?: string, note?: string) => {
    const { error } = await supabase.from("tasks").update({
      completed: true,
      completion_photo: photo || null,
      completion_note: note || null,
    }).eq("id", id);
    if (error) {
      toast.error("更新任务失败");
      return;
    }
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: true, completionPhoto: photo, completionNote: note } : t
    ));
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id'>>) => {
    const row: Record<string, any> = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.time !== undefined) row.time = updates.time;
    if (updates.icon !== undefined) row.icon = updates.icon;
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.date !== undefined) row.date = formatDate(updates.date);
    if (updates.deadline !== undefined) row.deadline = formatDate(updates.deadline);
    if (updates.coverImage !== undefined) row.cover_image = updates.coverImage || null;
    if (updates.completionPhoto !== undefined) row.completion_photo = updates.completionPhoto || null;
    if (updates.completionNote !== undefined) row.completion_note = updates.completionNote || null;
    if (updates.completed !== undefined) row.completed = updates.completed;

    const { error } = await supabase.from("tasks").update(row).eq("id", id);
    if (error) {
      toast.error("更新任务失败");
      return;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error("删除任务失败");
      return;
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  return { tasks, loading, addTask, completeTask, updateTask, deleteTask, setTasks };
}
