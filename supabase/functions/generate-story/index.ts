import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tasks, periodLabel, timeRange } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build task summary for the AI
    const completed = tasks.filter((t: any) => t.completed);
    const incomplete = tasks.filter((t: any) => !t.completed);
    const total = tasks.length;
    const completedCount = completed.length;

    const catCount: Record<string, number> = {};
    completed.forEach((t: any) => {
      catCount[t.category] = (catCount[t.category] || 0) + 1;
    });

    const overdueTasks = incomplete.filter((t: any) => t.deadline && new Date(t.deadline) < new Date());
    const urgentTasks = incomplete.filter((t: any) => {
      if (!t.deadline) return false;
      const days = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86400000);
      return days > 0 && days <= 3;
    });

    const taskContext = `
时间周期：${periodLabel}（${timeRange}）
总计划数：${total}
已完成：${completedCount}
完成率：${total > 0 ? Math.round(completedCount / total * 100) : 0}%

已完成的计划：
${completed.map((t: any) => `- ${t.title}（${t.category}）`).join("\n") || "无"}

未完成的计划：
${incomplete.map((t: any) => `- ${t.title}（${t.category}）${t.deadline ? `，截止：${t.deadline}` : ""}`).join("\n") || "无"}

分类统计：
${Object.entries(catCount).map(([cat, count]) => `- ${cat}：${count}项`).join("\n") || "无"}

已超期任务：${overdueTasks.map((t: any) => t.title).join("、") || "无"}
即将到期任务：${urgentTasks.map((t: any) => t.title).join("、") || "无"}
`;

    const systemPrompt = `你是一个温暖、有洞察力的生活记录助手。你的任务是根据用户的生活计划完成情况，写一段有温度、有感受的故事总结。

要求：
1. 用第二人称"你"来写，语气温暖亲切，像一个了解你的老朋友在跟你聊天
2. 不要简单罗列数据，要从事件中提炼出感受、洞察和成长
3. 如果有运动相关，可以提到身体的感受变化
4. 如果有学习相关，可以提到思维的成长
5. 如果有社交相关，可以提到人与人之间的温暖
6. 如果完成率高，给予真诚的肯定（不要过度夸张）
7. 如果完成率低，给予温柔的鼓励，不要说教
8. 如果有超期任务，温和地提醒，给出建议
9. 整体字数控制在 150-250 字
10. 让人读完后有分享的欲望

请返回如下 JSON 格式（不要包含 markdown 代码块标记）：
{
  "title": "4-8字的故事标题，要有文学感",
  "openingLine": "一句引言，15-25字，要能触动人心",
  "summary": "故事正文，150-250字",
  "highlights": ["亮点1（带emoji前缀）", "亮点2", "亮点3"],
  "mood": "2个字的心情词",
  "emoji": "一个最能代表这段时间的emoji"
}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: taskContext },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度已用完，请充值" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse JSON from AI response, handle possible markdown wrapping
    let parsed;
    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-story error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
