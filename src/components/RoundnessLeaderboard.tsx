import { useState, useEffect, useMemo } from "react";
import { differenceInCalendarDays } from "date-fns";
import { Trophy, X, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface CatEntry {
  id: string;
  cat_name: string;
  born_at: string;
  completed_count: number;
  photo_count: number;
  client_id: string;
}

const ROUNDNESS_TITLES = [
  { min: 0,   label: "骨瘦如柴", emoji: "🦴" },
  { min: 0.3, label: "微微圆润", emoji: "🫧" },
  { min: 0.6, label: "小有肉感", emoji: "🍡" },
  { min: 1.0, label: "圆滚滚",   emoji: "🟠" },
  { min: 1.5, label: "弹弹球",   emoji: "⚽" },
  { min: 2.5, label: "圆到起飞", emoji: "🎈" },
  { min: 4.0, label: "宇宙级圆", emoji: "🪐" },
];

const getRoundnessTitle = (rate: number) => {
  let title = ROUNDNESS_TITLES[0];
  for (const t of ROUNDNESS_TITLES) {
    if (rate >= t.min) title = t;
  }
  return title;
};

const CAT_STAGES = [
  { min: 0,  emoji: "🥚" },
  { min: 1,  emoji: "🐣" },
  { min: 3,  emoji: "🐱" },
  { min: 8,  emoji: "😺" },
  { min: 15, emoji: "😸" },
  { min: 30, emoji: "😻" },
  { min: 50, emoji: "👑" },
];

const getCatEmoji = (count: number) => {
  let emoji = CAT_STAGES[0].emoji;
  for (const s of CAT_STAGES) {
    if (count >= s.min) emoji = s.emoji;
  }
  return emoji;
};

const RANK_MEDAL = [
  { bg: "bg-amber-400/15", border: "border-amber-400/30", text: "text-amber-600" },
  { bg: "bg-slate-300/15", border: "border-slate-400/30", text: "text-slate-500" },
  { bg: "bg-orange-300/15", border: "border-orange-400/30", text: "text-orange-600" },
];

interface RoundnessLeaderboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myClientId: string;
}

const RoundnessLeaderboard = ({ open, onOpenChange, myClientId }: RoundnessLeaderboardProps) => {
  const [entries, setEntries] = useState<CatEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("cat_profiles")
      .select("*")
      .order("completed_count", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) setEntries(data as CatEntry[]);
        setLoading(false);
      });
  }, [open]);

  const ranked = useMemo(() => {
    const now = new Date();
    return entries
      .map(e => {
        const aliveDays = Math.max(differenceInCalendarDays(now, new Date(e.born_at)), 1);
        const rate = e.completed_count / aliveDays;
        return { ...e, aliveDays, rate, roundness: getRoundnessTitle(rate) };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [entries]);

  const myRank = ranked.findIndex(r => r.client_id === myClientId) + 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0 pb-0">
        <SheetHeader className="px-5 pb-3 border-b border-border/50">
          <SheetTitle className="text-lg font-bold font-serif flex items-center gap-2">
            <Trophy size={18} className="text-primary" />
            圆润度全球排行榜
          </SheetTitle>
          {myRank > 0 && (
            <p className="text-xs text-muted-foreground">
              你的猫猫排名第 <span className="font-bold text-primary">{myRank}</span> 名，共 {ranked.length} 只猫
            </p>
          )}
        </SheetHeader>

        <div className="overflow-y-auto px-5 pt-4 pb-8 h-full">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-sm text-muted-foreground">加载排行榜中...</span>
            </div>
          ) : ranked.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🏜️</p>
              <p className="text-sm text-muted-foreground">还没有猫猫参加排名</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ranked.map((entry, index) => {
                const isMe = entry.client_id === myClientId;
                const medal = RANK_MEDAL[index] || null;
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all",
                      isMe
                        ? "bg-primary/8 border-primary/20 ring-1 ring-primary/10"
                        : medal
                        ? `${medal.bg} ${medal.border}`
                        : "bg-card/50 border-border/30"
                    )}
                  >
                    {/* 排名 */}
                    <div className="w-8 flex-shrink-0 text-center">
                      {index === 0 ? (
                        <Crown size={18} className="text-amber-500 mx-auto" />
                      ) : index <= 2 ? (
                        <Medal size={16} className={cn("mx-auto", medal?.text)} />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                      )}
                    </div>

                    {/* 猫咪头像 */}
                    <span className="text-2xl flex-shrink-0">{getCatEmoji(entry.completed_count)}</span>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.cat_name}
                          {isMe && <span className="text-[10px] text-primary ml-1">（我的）</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                        <span>{entry.aliveDays}天</span>
                        <span>·</span>
                        <span>{entry.completed_count}顿饭</span>
                        {entry.photo_count > 0 && (
                          <>
                            <span>·</span>
                            <span>{entry.photo_count}📸</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 圆润度 */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                      <span className="text-base">{entry.roundness.emoji}</span>
                      <span className="text-[9px] font-medium text-muted-foreground/70">
                        {entry.rate.toFixed(2)}/天
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RoundnessLeaderboard;
