import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoryData {
  title: string;
  openingLine: string;
  summary: string;
  highlights: string[];
  mood: string;
  emoji: string;
}

export function useStoryNotes() {
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("story_notes").select("*").then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row: any) => { map[row.period_key] = row.note; });
        setNotes(map);
      }
    });
  }, []);

  const saveNote = useCallback(async (key: string, note: string) => {
    setNotes(prev => ({ ...prev, [key]: note }));
    await supabase.from("story_notes").upsert(
      { period_key: key, note },
      { onConflict: "period_key" }
    );
  }, []);

  return { notes, saveNote };
}

export function useAiStories() {
  const [aiStories, setAiStories] = useState<Record<string, StoryData>>({});

  useEffect(() => {
    supabase.from("ai_stories").select("*").then(({ data }) => {
      if (data) {
        const map: Record<string, StoryData> = {};
        data.forEach((row: any) => { map[row.period_key] = row.story_data as StoryData; });
        setAiStories(map);
      }
    });
  }, []);

  const saveAiStory = useCallback(async (key: string, story: StoryData) => {
    setAiStories(prev => ({ ...prev, [key]: story }));
    await supabase.from("ai_stories").upsert(
      { period_key: key, story_data: story as any },
      { onConflict: "period_key" }
    );
  }, []);

  return { aiStories, saveAiStory };
}
