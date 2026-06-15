import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import {
  Briefcase, Building2, CalendarClock, MapPin, CheckCircle2, XCircle,
  Loader2, Search, Bookmark, BookmarkCheck,
} from "lucide-react";
import { toast } from "sonner";
import { evaluateEligibility } from "@/lib/eligibility";

type Job = any;

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: js }, { data: prof }, { data: apps }, { data: saved }] = await Promise.all([
      supabase.from("jobs").select("*").eq("published", true).order("created_at", { ascending: false }),
      supabase.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("applications").select("job_id").eq("student_id", user.id),
      supabase.from("saved_jobs").select("job_id").eq("student_id", user.id),
    ]);
    setJobs(js || []);
    setProfile(prof);
    setAppliedIds(new Set((apps || []).map((a) => a.job_id)));
    setSavedIds(new Set((saved || []).map((s: any) => s.job_id)));
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const apply = async (j: Job) => {
    if (!user) return;
    const { error } = await supabase.from("applications").insert({ job_id: j.id, student_id: user.id });
    if (error) return toast.error(error.message);
    setAppliedIds(new Set([...appliedIds, j.id]));
    toast.success(`Applied to ${j.title}`);
  };

  const toggleSave = async (j: Job) => {
    if (!user) return;
    if (savedIds.has(j.id)) {
      await supabase.from("saved_jobs").delete().eq("student_id", user.id).eq("job_id", j.id);
      const next = new Set(savedIds); next.delete(j.id); setSavedIds(next);
    } else {
      const { error } = await supabase.from("saved_jobs").insert({ student_id: user.id, job_id: j.id });
      if (error) return toast.error(error.message);
      setSavedIds(new Set([...savedIds, j.id]));
      toast.success("Saved for later");
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      if (savedOnly && !savedIds.has(j.id)) return false;
      if (eligibleOnly && !evaluateEligibility(j, profile).eligible) return false;
      if (!q) return true;
      const hay = [j.title, j.company, j.location, ...(j.required_skills || [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [jobs, profile, query, eligibleOnly, savedOnly, savedIds]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const daysUntil = (iso?: string | null) => {
    if (!iso) return null;
    return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <PageHeader title="Open positions" subtitle="Roles you're eligible to apply for, in real time." />

      <div className="mb-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by title, company, skill…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={eligibleOnly} onCheckedChange={setEligibleOnly} /> Eligible only
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={savedOnly} onCheckedChange={setSavedOnly} /> Saved
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs match" hint="Try adjusting your search or filters." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {visible.map((j) => {
            const e = evaluateEligibility(j, profile);
            const applied = appliedIds.has(j.id);
            const isSaved = savedIds.has(j.id);
            const days = daysUntil(j.deadline);
            const closingSoon = days !== null && days >= 0 && days <= 2;
            return (
              <Card key={j.id} className="shadow-elev border-border/60 hover:shadow-elev-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-display font-semibold text-lg">{j.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{j.company}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleSave(j)} aria-label={isSaved ? "Unsave" : "Save"}>
                        {isSaved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Badge className={e.eligible ? "bg-accent/15 text-accent border-0" : "bg-destructive/15 text-destructive border-0"}>
                        {e.eligible ? <><CheckCircle2 className="h-3 w-3 mr-1" />Eligible</> : <><XCircle className="h-3 w-3 mr-1" />Not eligible</>}
                      </Badge>
                    </div>
                  </div>
                  {j.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{j.description}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    {j.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
                    {j.ctc && <span>💰 {j.ctc}</span>}
                    {j.deadline && (
                      <span className={`flex items-center gap-1 ${closingSoon ? "text-destructive font-medium" : ""}`}>
                        <CalendarClock className="h-3 w-3" />
                        {closingSoon ? `Closes in ${days}d` : `Apply by ${new Date(j.deadline).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                  {j.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {j.required_skills.slice(0, 6).map((s: string) => <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>)}
                    </div>
                  )}

                  {!e.eligible && (
                    <ul className="mb-3 space-y-1">
                      {e.reasons.map((r, i) => (
                        <li key={i} className="text-xs text-destructive flex items-start gap-1.5">
                          <XCircle className="h-3 w-3 mt-0.5 shrink-0" />{r}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {e.eligible ? "You meet all the criteria" : `Skill match ${e.skillMatchPct}%`}
                    </span>
                    <Button size="sm" onClick={() => apply(j)} disabled={!e.eligible || applied} className={!applied && e.eligible ? "bg-grad-primary" : ""}>
                      {applied ? "Applied ✓" : "Apply"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Jobs;
