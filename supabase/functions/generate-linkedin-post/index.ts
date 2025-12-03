import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postType, details } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompts: Record<string, string> = {
      hackathon: `You are a professional LinkedIn post writer specializing in hackathon achievements. Create engaging, professional posts that highlight:
- The hackathon name and achievement
- Key technical skills and technologies used
- Team collaboration and problem-solving
- Impact and learnings
Keep it authentic, humble, and inspiring. Use 1-2 relevant emojis. Length: 150-250 words.`,
      event: `You are a professional LinkedIn post writer for event participation. Create posts that showcase:
- Event name and key takeaways
- Networking and learning opportunities
- Skills developed or knowledge gained
- Gratitude to organizers and speakers
Keep it professional yet personal. Use 1-2 relevant emojis. Length: 150-250 words.`,
      project: `You are a professional LinkedIn post writer for technical projects. Create posts that highlight:
- Project overview and purpose
- Technical stack and innovations
- Challenges overcome and solutions
- Impact and future scope
Keep it technical but accessible. Use 1-2 relevant emojis. Length: 150-250 words.`,
      achievement: `You are a professional LinkedIn post writer for achievements and milestones. Create posts that convey:
- The achievement with context
- Journey and key learnings
- People who supported along the way
- Future aspirations
Keep it humble, grateful, and motivating. Use 1-2 relevant emojis. Length: 150-250 words.`
    };

    const systemPrompt = systemPrompts[postType] || systemPrompts.achievement;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a LinkedIn post with these details: ${details}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate post");
    }

    const data = await response.json();
    const generatedPost = data.choices[0]?.message?.content;

    if (!generatedPost) {
      throw new Error("No content generated");
    }

    return new Response(
      JSON.stringify({ post: generatedPost }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-linkedin-post:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
