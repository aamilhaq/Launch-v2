import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { extractPdfText } from "@/lib/pdf";
import { toast } from "sonner";
import { FileText, Upload, Sparkles, Loader2 } from "lucide-react";

const Resume = () => {
  const { user } = useAuth();
  const [resume, setResume] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("resumes").select("*").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false }).maybeSingle();
    setResume(data);
  };
  useEffect(() => { load(); }, [user]);

  const upload = async (file: File) => {
    if (!user) return;
    if (file.type !== "application/pdf") return toast.error("Please upload a PDF file");
    setBusy(true);
    try {
      toast.info("Extracting resume text…");
      const text = await extractPdfText(file);
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      toast.info("Parsing with AI…");
      const { data: parsed, error: aiErr } = await supabase.functions.invoke("parse-resume", { body: { text } });
      if (aiErr) throw aiErr;

      // mark old resumes inactive
      await supabase.from("resumes").update({ is_active: false }).eq("user_id", user.id);

      const { data: row, error: insErr } = await supabase.from("resumes").insert({
        user_id: user.id, file_path: path, file_name: file.name, raw_text: text, parsed: parsed?.parsed ?? null, is_active: true,
      }).select().single();
      if (insErr) throw insErr;

      // sync skills to student profile
      const skills = parsed?.parsed?.skills as string[] | undefined;
      if (skills?.length) {
        await supabase.from("student_profiles").update({ skills }).eq("user_id", user.id);
      }
      setResume(row);
      toast.success("Resume parsed!");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const p = resume?.parsed || {};

  return (
    <>
      <PageHeader title="Your resume"
        subtitle="Upload a PDF and Launch will extract your skills, projects and education with AI."
        action={
          <label>
            <input type="file" accept="application/pdf" className="hidden" disabled={busy}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Button asChild className="bg-grad-primary cursor-pointer" disabled={busy}>
              <span>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}{resume ? "Replace resume" : "Upload PDF"}</span>
            </Button>
          </label>
        }
      />

      {!resume ? (
        <EmptyState icon={FileText} title="No resume uploaded yet" hint="Drop a PDF to get an AI-parsed view of your skills, projects, and education." />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="shadow-elev border-border/60 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-primary mb-2"><FileText className="h-4 w-4" /><span className="text-xs uppercase tracking-wider font-semibold">Active resume</span></div>
              <div className="font-medium">{resume.file_name}</div>
              <div className="text-sm text-muted-foreground mt-1">Uploaded {new Date(resume.created_at).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="shadow-elev border-border/60 lg:col-span-2">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 text-primary"><Sparkles className="h-4 w-4" /><span className="text-xs uppercase tracking-wider font-semibold">AI-parsed</span></div>
              <Section title="Skills">
                <div className="flex flex-wrap gap-2">
                  {(p.skills || []).map((s: string) => <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>)}
                </div>
              </Section>
              <Section title="Education">
                {(p.education || []).map((ed: any, i: number) => (
                  <div key={i} className="text-sm"><span className="font-medium">{ed.degree}</span> · {ed.institution} {ed.year && <span className="text-muted-foreground">({ed.year})</span>}</div>
                ))}
              </Section>
              <Section title="Projects">
                {(p.projects || []).map((pr: any, i: number) => (
                  <div key={i} className="text-sm">
                    <div className="font-medium">{pr.name}</div>
                    <div className="text-muted-foreground">{pr.description}</div>
                    {pr.tech?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{pr.tech.map((t: string) => <Badge key={t} variant="outline" className="text-xs font-normal">{t}</Badge>)}</div>}
                  </div>
                ))}
              </Section>
              <Section title="Certifications">
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {(p.certifications || []).map((c: string, i: number) => <li key={i}>{c}</li>)}
                </ul>
              </Section>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="font-display font-semibold mb-2">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

export default Resume;
