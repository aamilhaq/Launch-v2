import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { ClipboardList, FileText, Loader2, Sparkles, Filter } from "lucide-react";
import { toast } from "sonner";
import { computeMatchScore, evaluateEligibility } from "@/lib/eligibility";

const STATUSES = ["applied", "under_review", "shortlisted", "interview_scheduled", "selected", "rejected"];
const STATUS_LABEL: Record<string, string> = {
  applied: "Applied", under_review: "Under Review", shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled", selected: "Selected", rejected: "Rejected",
};

type Row = {
  id: string;
  status: string;
  created_at: string;
  job_id: string;
  student_id: string;
  jobs: any;
  profiles: { full_name: string | null; email: string | null } | null;
  sp: any | null;
  matchScore: number;
  atsScore: number | null;
  resumeUrl: string | null;
};

const scoreBadge = (n: number) => {
  if (n >= 85) return "bg-accent/15 text-accent border-0";
  if (n >= 65) return "bg-primary/15 text-primary border-0";
  return "bg-muted text-muted-foreground border-0";
};

const CoordApplications = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: apps }, { data: js }, { data: sps }, { data: ats }] = await Promise.all([
      supabase.from("applications").select("*, jobs(*), profiles:student_id(full_name, email)").order("created_at", { ascending: false }),
      supabase.from("jobs").select("*"),
      supabase.from("student_profiles").select("*"),
      supabase.from("ats_reports").select("user_id, score, created_at").order("created_at", { ascending: false }),
    ]);

    const spMap = new Map<string, any>((sps || []).map((s: any) => [s.user_id, s]));
    const atsMap = new Map<string, number>();
    (ats || []).forEach((r: any) => { if (!atsMap.has(r.user_id)) atsMap.set(r.user_id, r.score); });

    const enriched: Row[] = (apps || []).map((a: any) => {
      const sp = spMap.get(a.student_id) || null;
      const elig = evaluateEligibility(a.jobs, sp);
      const atsScore = atsMap.get(a.student_id) ?? null;
      const extras = Math.max(0, ((sp?.skills?.length as number) || 0) - (a.jobs?.required_skills?.length || 0));
      const matchScore = computeMatchScore({ skillMatchPct: elig.skillMatchPct, atsScore, extraSkillsCount: extras });
      const resumeUrl = sp?.resume_url ?? null;
      return { ...a, sp, matchScore, atsScore, resumeUrl };
    });

    setRows(enriched);
    setJobs(js || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (r: Row, status: string) => {
    const { error } = await supabase.from("applications").update({ status: status as any }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await supabase.from("notifications").insert({
      user_id: r.student_id,
      title: `Application update: ${r.jobs?.title}`,
      body: `Your application status is now "${STATUS_LABEL[status] || status}".`,
      link: "/student/applications",
    });
    toast.success("Status updated & student notified");
    load();
  };

  const openResume = async (path: string | null) => {
    if (!path) return toast.error("No resume on file");
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) return toast.error("Could not open resume");
    window.open(data.signedUrl, "_blank");
  };

  const filtered = useMemo(() => {
    const list = jobFilter === "all" ? rows : rows.filter((r) => r.job_id === jobFilter);
    const job = jobs.find((j) => j.id === jobFilter);
    const rank = jobFilter !== "all" && job?.rank_by_match !== false;
    return rank ? [...list].sort((a, b) => b.matchScore - a.matchScore) : list;
  }, [rows, jobFilter, jobs]);

  const selectedJob = jobs.find((j) => j.id === jobFilter);

  const runAutoShortlist = async () => {
    if (!selectedJob?.auto_shortlist_top_n) return;
    setRunning(true);
    const ranked = [...rows.filter((r) => r.job_id === selectedJob.id)].sort((a, b) => b.matchScore - a.matchScore);
    const top = ranked.slice(0, selectedJob.auto_shortlist_top_n);
    let updated = 0;
    for (const r of top) {
      if (r.status === "shortlisted" || r.status === "interview_scheduled" || r.status === "selected") continue;
      const { error } = await supabase.from("applications").update({ status: "shortlisted" as any }).eq("id", r.id);
      if (!error) {
        await supabase.from("notifications").insert({
          user_id: r.student_id,
          title: `Shortlisted: ${selectedJob.title}`,
          body: `You've been shortlisted based on your match score.`,
          link: "/student/applications",
        });
        updated++;
      }
    }
    setRunning(false);
    toast.success(`Shortlisted ${updated} candidate${updated === 1 ? "" : "s"}`);
    load();
  };

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="Ranked by match score. Move candidates through the pipeline — students get notified automatically."
        action={
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="all">All jobs</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} — {j.company}</option>)}
            </select>
            {selectedJob?.auto_shortlist_top_n ? (
              <Button size="sm" onClick={runAutoShortlist} disabled={running} className="bg-grad-primary">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1.5" />Auto-shortlist top {selectedJob.auto_shortlist_top_n}</>}
              </Button>
            ) : null}
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No applications yet" />
      ) : (
        <Card className="shadow-elev border-border/60">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">CGPA</th>
                  {jobFilter === "all" && <th className="px-4 py-3">Role</th>}
                  <th className="px-4 py-3">Match</th>
                  <th className="px-4 py-3">ATS</th>
                  <th className="px-4 py-3">Resume</th>
                  <th className="px-4 py-3">Applied</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.profiles?.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.profiles?.email}</div>
                    </td>
                    <td className="px-4 py-3">{r.sp?.department || "—"}</td>
                    <td className="px-4 py-3">{r.sp?.cgpa ?? "—"}</td>
                    {jobFilter === "all" && (
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.jobs?.title}</div>
                        <div className="text-xs text-muted-foreground">{r.jobs?.company}</div>
                      </td>
                    )}
                    <td className="px-4 py-3"><Badge className={scoreBadge(r.matchScore)}>{r.matchScore}%</Badge></td>
                    <td className="px-4 py-3">{r.atsScore != null ? <Badge className={scoreBadge(r.atsScore)}>{r.atsScore}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3">
                      {r.resumeUrl ? (
                        <Button size="sm" variant="ghost" onClick={() => openResume(r.resumeUrl)}><FileText className="h-4 w-4 mr-1" />View</Button>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select value={r.status} onChange={(e) => updateStatus(r, e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm capitalize">
                        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default CoordApplications;
