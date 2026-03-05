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
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "缺少输入文本" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const categoryList = ["美食", "学习", "运动", "社交", "工作", "美景", "娱乐", "记录", "健康", "美丽"];
    const iconList = ["coffee", "dumbbell", "book", "music", "heart", "star"];

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
            {
              role: "system",
              content: `你是一个任务解析助手。用户会用自然语言描述一件想做的事，你需要将其解析为结构化任务数据。

请根据用户输入返回 JSON（不要 markdown 代码块）：
{
  "title": "简洁的任务标题（保留用户表达的核心意思）",
  "category": "从以下分类中选一个最合适的：${categoryList.join("、")}",
  "icon": "从以下图标中选一个最合适的：${iconList.join("、")}（coffee=咖啡/饮食, dumbbell=运动, book=阅读/学习, music=音乐/娱乐, heart=生活/社交, star=特别/其他）",
  "time": "时间信息，格式说明：如果提到具体时间点用 HH:MM（如 14:00），如果提到时间区间用 HH:MM-HH:MM（如 09:00-11:00），如果说全天用 '全天'，如果没提到时间用 '不限'",
  "dayOffset": "距今天的天数偏移：0=今天，1=明天，2=后天，null=未指定日期。如果说了'周X'请计算距今天的天数"
}

注意：
- title 要简洁但保留关键信息
- 如果用户说"下午三点"，time 应为 "15:00"
- 如果用户说"早上"但没具体时间，time 可以用 "09:00"
- 如果用户说"晚上"但没具体时间，time 可以用 "20:00"`,
            },
            { role: "user", content: text.trim() },
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
        return new Response(JSON.stringify({ error: "AI 额度已用完" }), {
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
    console.error("parse-voice-task error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
