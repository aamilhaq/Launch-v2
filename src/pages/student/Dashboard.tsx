import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatCard, EmptyState } from "@/components/ui-bits";
import { FileText, Briefcase, ClipboardList, GraduationCap, Megaphone, Upload, Sparkles, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { extractPdfText } from "@/lib/pdf";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
  applied: "bg-muted text-muted-foreground",
  under_review: "bg-warning/15 text-warning",
  shortlisted: "bg-primary/15 text-primary",
  interview_scheduled: "bg-primary/15 text-primary",
  selected: "bg-accent/15 text-accent",
  rejected: "bg-destructive/15 text-destructive",
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ apps: 0, quizzes: 0, jobs: 0 });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: prof }, { data: apps }, { count: quizCount }, { count: jobCount }, { data: ann }] = await Promise.all([
      supabase.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("applications").select("*, jobs(title, company)").eq("student_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("student_id", user.id),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("published", true),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3),
    ]);
    setProfile(prof);
    setRecentApps(apps || []);
    setStats({ apps: apps?.length || 0, quizzes: quizCount || 0, jobs: jobCount || 0 });
    setAnnouncements(ann || []);
  };
  useEffect(() => { load(); }, [user]);

  const completion = (() => {
    if (!profile) return 0;
    const fields = ["department", "graduation_year", "cgpa", "phone", "linkedin_url", "github_url", "resume_url"];
    const filled = fields.filter((k) => !!profile[k]).length + (profile.skills?.length ? 1 : 0);
    return Math.round((filled / (fields.length + 1)) * 100);
  })();

  const replaceResume = async (file: File) => {
    if (!user) return;
    if (file.type !== "application/pdf") return toast.error("Please upload a PDF file");
    if (file.size > 10 * 1024 * 1024) return toast.error("PDF too large (max 10MB)");
    setBusy(true);
    try {
      let text = "";
      try { text = await extractPdfText(file); } catch { throw new Error("Could not read this PDF. It may be scanned or corrupted."); }
      if (!text.trim() || text.trim().length < 40) throw new Error("Couldn't extract text. Try a text-based PDF.");

      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, file);
      if (upErr) throw upErr;

      const { data: parsed, error: aiErr } = await supabase.functions.invoke("parse-resume", { body: { text } });
      if (aiErr) throw aiErr;

      const detected: string[] = Array.isArray(parsed?.parsed?.skills) ? parsed.parsed.skills.filter(Boolean) : [];
      const now = new Date().toISOString();
      await supabase.from("student_profiles").update({
        resume_url: path, extracted_skills: detected, skills: detected,
        extraction_timestamp: now, resume_last_updated: now,
      }).eq("user_id", user.id);

      await supabase.from("resumes").update({ is_active: false }).eq("user_id", user.id);
      await supabase.from("resumes").insert({
        user_id: user.id, file_path: path, file_name: file.name,
        raw_text: text, parsed: parsed?.parsed ?? null, is_active: true,
      });

      toast.success(`Resume updated · ${detected.length} skills extracted`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Resume update failed");
    } finally {
      setBusy(false);
    }
  };

  const resumeName = profile?.resume_url ? String(profile.resume_url).split("/").pop()?.replace(/^\d+_/, "") : null;
  const displaySkills: string[] = profile?.skills?.length ? profile.skills : (profile?.extracted_skills || []);

  return (
    <>
      <PageHeader title="Welcome back 👋" subtitle="Your placement journey at a glance." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Open jobs" value={stats.jobs} icon={Briefcase} />
        <StatCard label="Applications" value={stats.apps} icon={ClipboardList} accent="accent" />
        <StatCard label="Quizzes taken" value={stats.quizzes} icon={GraduationCap} />
        <StatCard label="Profile" value={`${completion}%`} icon={FileText} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-elev border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h2 className="font-display font-semibold text-lg">Your resume</h2>
                </div>
                <label>
                  <input type="file" accept="application/pdf" className="hidden" disabled={busy}
                    onChange={(e) => e.target.files?.[0] && replaceResume(e.target.files[0])} />
                  <Button asChild size="sm" variant={profile?.resume_url ? "outline" : "default"}
                    className={profile?.resume_url ? "cursor-pointer" : "bg-grad-primary cursor-pointer"} disabled={busy}>
                    <span>
                      {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {profile?.resume_url ? "Replace" : "Upload PDF"}
                    </span>
                  </Button>
                </label>
              </div>

              {!profile?.resume_url ? (
                <EmptyState icon={FileText} title="No resume on file" hint="Upload a PDF — we'll extract your skills automatically." />
              ) : (
                <div className="rounded-lg border border-border/60 p-4 bg-muted/30">
                  <div className="font-medium truncate">{resumeName}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Updated {profile.resume_last_updated ? new Date(profile.resume_last_updated).toLocaleString() : "—"}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-display font-semibold text-sm">Extracted skills</h3>
                  {profile?.extraction_timestamp && (
                    <span className="text-xs text-muted-foreground">· {new Date(profile.extraction_timestamp).toLocaleDateString()}</span>
                  )}
                </div>
                {displaySkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Upload a resume to detect skills.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {displaySkills.map((s: string) => <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>)}
                  </div>
                )}
                <Link to="/student/profile" className="text-xs text-primary hover:underline mt-3 inline-block">Edit skills →</Link>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elev border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-lg">Recent applications</h2>
                <Link to="/student/applications" className="text-sm text-primary hover:underline">View all</Link>
              </div>
              {recentApps.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No applications yet" hint="Browse open roles and start applying." action={<Link to="/student/jobs"><Button className="bg-grad-primary">Browse jobs</Button></Link>} />
              ) : (
                <div className="space-y-3">
                  {recentApps.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/40">
                      <div>
                        <div className="font-medium">{a.jobs?.title}</div>
                        <div className="text-sm text-muted-foreground">{a.jobs?.company}</div>
                      </div>
                      <Badge className={STATUS_COLOR[a.status] + " border-0 capitalize"}>{String(a.status).replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-elev border-border/60">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-3">Profile completion</h3>
              <Progress value={completion} className="h-2.5" />
              <p className="text-sm text-muted-foreground mt-2">{completion}% complete</p>
              <Link to="/student/profile"><Button variant="outline" size="sm" className="mt-4 w-full">Complete profile</Button></Link>
            </CardContent>
          </Card>

          <Card className="shadow-elev border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3"><Megaphone className="h-4 w-4 text-primary" /><h3 className="font-display font-semibold">Announcements</h3></div>
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              ) : (
                <ul className="space-y-3">
                  {announcements.map((a) => (
                    <li key={a.id} className="text-sm">
                      <div className="font-medium">{a.title}</div>
                      <div className="text-muted-foreground line-clamp-2">{a.body}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
