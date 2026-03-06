import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StoryData {
  title: string;
  openingLine: string;
  summary: string;
  highlights: string[];
  mood: string;
  emoji: string;
}

export function useStoryNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("story_notes").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row: any) => { map[row.period_key] = row.note; });
        setNotes(map);
      }
    });
  }, [user]);

  const saveNote = useCallback(async (key: string, note: string) => {
    if (!user) return;
    setNotes(prev => ({ ...prev, [key]: note }));
    await supabase.from("story_notes").upsert(
      { period_key: key, note, user_id: user.id },
      { onConflict: "user_id,period_key" }
    );
  }, [user]);

  return { notes, saveNote };
}

export function useAiStories() {
  const { user } = useAuth();
  const [aiStories, setAiStories] = useState<Record<string, StoryData>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("ai_stories").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) {
        const map: Record<string, StoryData> = {};
        data.forEach((row: any) => { map[row.period_key] = row.story_data as StoryData; });
        setAiStories(map);
      }
    });
  }, [user]);

  const saveAiStory = useCallback(async (key: string, story: StoryData) => {
    if (!user) return;
    setAiStories(prev => ({ ...prev, [key]: story }));
    await supabase.from("ai_stories").upsert(
      { period_key: key, story_data: story as any, user_id: user.id },
      { onConflict: "user_id,period_key" }
    );
  }, [user]);

  return { aiStories, saveAiStory };
}
