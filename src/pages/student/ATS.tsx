import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { toast } from "sonner";
import { Target, Loader2, CheckCircle2, XCircle, Lightbulb } from "lucide-react";

const ATS = () => {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [title, setTitle] = useState("");
  const [report, setReport] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: r } = await supabase.from("resumes").select("raw_text").eq("user_id", user.id).eq("is_active", true).maybeSingle();
      if (r?.raw_text) setResumeText(r.raw_text);
      const { data: h } = await supabase.from("ats_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
      setHistory(h || []);
    })();
  }, [user]);

  const run = async () => {
    if (!user) return;
    if (!resumeText.trim() || !jd.trim()) return toast.error("Resume text and job description are required");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ats-check", { body: { resumeText, jobDescription: jd } });
      if (error) throw error;
      setReport(data);
      await supabase.from("ats_reports").insert({
        user_id: user.id, job_title: title || null, job_description: jd, score: data.score || 0,
        matching_skills: data.matching_skills || [], missing_skills: data.missing_skills || [], recommendations: data.recommendations || [],
      });
      toast.success("Report ready!");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="ATS Score Checker" subtitle="See how your resume scores against any job description." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-elev border-border/60">
          <CardContent className="p-6 space-y-4">
            <div><Label>Job title (optional)</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" placeholder="Frontend Engineer @ Acme" /></div>
            <div><Label>Job description</Label><Textarea rows={8} value={jd} onChange={(e) => setJd(e.target.value)} className="mt-1.5" placeholder="Paste the full JD here…" /></div>
            <div>
              <Label>Your resume text {resumeText && <span className="text-xs text-accent ml-2">✓ loaded from active resume</span>}</Label>
              <Textarea rows={6} value={resumeText} onChange={(e) => setResumeText(e.target.value)} className="mt-1.5" placeholder="Paste resume text or upload one in Resume tab" />
            </div>
            <Button onClick={run} disabled={busy} className="bg-grad-primary">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />} Run ATS check
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-elev border-border/60">
          <CardContent className="p-6">
            {!report ? (
              <EmptyState icon={Target} title="No report yet" hint="Paste a JD and run a check to see your score." />
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="relative inline-flex items-center justify-center h-32 w-32 rounded-full bg-grad-primary text-primary-foreground shadow-glow">
                    <div className="text-4xl font-display font-bold">{report.score}<span className="text-xl">%</span></div>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground uppercase tracking-wider">ATS Match</div>
                </div>
                <div className="space-y-4">
                  <Block icon={CheckCircle2} title="Matching skills" tone="accent" items={report.matching_skills} />
                  <Block icon={XCircle} title="Missing skills" tone="destructive" items={report.missing_skills} />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2"><Lightbulb className="h-4 w-4 text-warning" /> Recommendations</div>
                    <ul className="text-sm space-y-1.5 list-disc pl-5 text-muted-foreground">
                      {(report.recommendations || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display font-semibold mb-3">Recent reports</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((h) => (
              <Card key={h.id} className="shadow-sm border-border/60"><CardContent className="p-4 flex items-center justify-between">
                <div><div className="font-medium text-sm">{h.job_title || "Untitled"}</div><div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</div></div>
                <div className="text-2xl font-display font-bold text-primary">{h.score}%</div>
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const Block = ({ icon: Icon, title, tone, items }: any) => (
  <div>
    <div className={`flex items-center gap-2 text-sm font-semibold mb-2 ${tone === "accent" ? "text-accent" : "text-destructive"}`}><Icon className="h-4 w-4" />{title}</div>
    <div className="flex flex-wrap gap-1.5">
      {(items || []).length === 0 ? <span className="text-xs text-muted-foreground">—</span> : items.map((s: string) => <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>)}
    </div>
  </div>
);

export default ATS;
