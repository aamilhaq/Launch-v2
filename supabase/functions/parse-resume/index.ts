// Parses raw resume text with Lovable AI -> structured JSON
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'text required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const prompt = `Extract structured data from this resume. Return ONLY valid JSON with this shape:
{
  "name": string,
  "email": string | null,
  "phone": string | null,
  "skills": string[],
  "education": [{"degree": string, "institution": string, "year": string}],
  "projects": [{"name": string, "description": string, "tech": string[]}],
  "certifications": string[],
  "experience": [{"role": string, "company": string, "duration": string}]
}
Resume:
"""${text.slice(0, 12000)}"""`;

    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert resume parser. Return only valid JSON, no markdown fences.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: 'Rate limited. Try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (r.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: 'AI error', detail: t }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }

    return new Response(JSON.stringify({ parsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
