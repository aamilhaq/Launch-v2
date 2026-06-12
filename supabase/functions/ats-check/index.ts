// AI-powered ATS score: compares resume text vs job description
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { resumeText, jobDescription } = await req.json();
    if (!resumeText || !jobDescription) {
      return new Response(JSON.stringify({ error: 'resumeText and jobDescription required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const prompt = `Compare this RESUME against the JOB DESCRIPTION and return ONLY JSON:
{
  "score": number (0-100 ATS compatibility),
  "matching_skills": string[],
  "missing_skills": string[],
  "recommendations": string[] (3-5 actionable bullets)
}

RESUME:
"""${resumeText.slice(0, 10000)}"""

JOB DESCRIPTION:
"""${jobDescription.slice(0, 6000)}"""`;

    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an ATS resume analyzer. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: 'Rate limited.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (r.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: 'AI error', detail: t }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let report: any = { score: 0, matching_skills: [], missing_skills: [], recommendations: [] };
    try { report = { ...report, ...JSON.parse(content) }; } catch {}

    return new Response(JSON.stringify(report), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
