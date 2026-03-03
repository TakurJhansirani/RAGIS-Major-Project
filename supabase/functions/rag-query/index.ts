import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    // mode: "query" (default) | "summarize" | "analyze"

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- RAG: Retrieve relevant context from the database ---
    const userMessage = messages[messages.length - 1]?.content || "";

    // Fetch recent incidents for context
    const { data: incidents } = await supabase
      .from("incidents")
      .select("id, title, severity, category, status, source_ip, target_ip, ai_summary, created_at, affected_assets, confidence_score, risk_score, is_false_positive")
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch resolved incidents for historical context
    const { data: resolved } = await supabase
      .from("resolved_incidents")
      .select("id, title, severity, category, root_cause, resolution, lessons_learned, ai_accuracy, ttr, ttd")
      .order("resolved_at", { ascending: false })
      .limit(10);

    // Fetch dashboard metrics
    const { data: metrics } = await supabase
      .from("dashboard_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    // Fetch attack chains if query mentions attacks/chains/mitre
    let attackContext = "";
    const attackKeywords = ["attack", "chain", "mitre", "lateral", "kill chain", "technique", "tactic"];
    if (attackKeywords.some((k) => userMessage.toLowerCase().includes(k))) {
      const { data: chains } = await supabase
        .from("attack_chains")
        .select("id, title, severity, threat, overall_confidence, incident_id")
        .order("created_at", { ascending: false })
        .limit(5);

      if (chains?.length) {
        const chainIds = chains.map((c) => c.id);
        const { data: steps } = await supabase
          .from("attack_chain_steps")
          .select("attack_chain_id, label, technique, mitre_id, detail, severity, confidence, step_order")
          .in("attack_chain_id", chainIds)
          .order("step_order", { ascending: true });

        attackContext = `\n\nATTACK CHAINS:\n${JSON.stringify(chains, null, 2)}\n\nATTACK STEPS:\n${JSON.stringify(steps, null, 2)}`;
      }
    }

    // Build RAG context
    const ragContext = `
CURRENT INCIDENTS (most recent):
${JSON.stringify(incidents || [], null, 2)}

RESOLVED INCIDENTS (historical knowledge):
${JSON.stringify(resolved || [], null, 2)}

DASHBOARD METRICS:
${JSON.stringify(metrics?.[0] || {}, null, 2)}
${attackContext}
`;

    // --- System prompts per mode ---
    const systemPrompts: Record<string, string> = {
      query: `You are RAGIS AI, an advanced Security Operations Center (SOC) assistant powered by a Retrieval-Augmented Generation (RAG) pipeline. You have access to real-time incident data, historical resolved incidents, and attack chain analysis.

Your capabilities:
- Analyze current and historical security incidents
- Identify threat patterns and correlations across incidents
- Provide MITRE ATT&CK technique mappings
- Assess risk scores and confidence levels
- Recommend remediation actions based on historical resolutions
- Detect false positives and alert fatigue patterns

Guidelines:
- Be precise and technical but accessible
- Reference specific incident IDs when relevant (e.g., INC-2024-XXXX)
- Highlight critical findings in bold
- Provide actionable recommendations
- Cite historical precedent from resolved incidents when applicable
- Use severity levels (Critical/High/Medium/Low) consistently

RETRIEVED CONTEXT:
${ragContext}`,

      summarize: `You are RAGIS AI's incident summarization engine. Generate concise, structured incident summaries that highlight:
1. What happened (attack vector, affected assets)
2. Impact assessment (severity, blast radius)
3. Current status and recommended next steps
4. Related historical incidents if any

Keep summaries under 200 words. Use technical SOC terminology.

INCIDENT DATA:
${ragContext}`,

      analyze: `You are RAGIS AI's threat analysis engine. Perform deep analysis including:
1. Root cause identification
2. Attack chain reconstruction (map to MITRE ATT&CK framework)
3. Indicator of Compromise (IOC) extraction
4. Lateral movement detection
5. Recommended containment and remediation steps
6. Confidence scoring for each finding

Be thorough but structured. Use headers and bullet points.

SECURITY DATA:
${ragContext}`,
    };

    const selectedMode = mode || "query";
    const systemPrompt = systemPrompts[selectedMode] || systemPrompts.query;

    // --- Call Lovable AI Gateway ---
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("rag-query error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
