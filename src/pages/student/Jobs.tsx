import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Briefcase, Building2, CalendarClock, MapPin, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Job = any;

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: js }, { data: prof }, { data: apps }] = await Promise.all([
      supabase.from("jobs").select("*").eq("published", true).order("created_at", { ascending: false }),
      supabase.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("applications").select("job_id").eq("student_id", user.id),
    ]);
    setJobs(js || []); setProfile(prof); setAppliedIds(new Set((apps || []).map((a) => a.job_id)));
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const checkEligibility = (j: Job) => {
    if (!profile) return { eligible: false, reason: "Complete your profile first" };
    if (j.min_cgpa && (profile.cgpa || 0) < j.min_cgpa) return { eligible: false, reason: `Requires CGPA ≥ ${j.min_cgpa}` };
    if (j.eligible_departments?.length && !j.eligible_departments.includes(profile.department)) return { eligible: false, reason: `Limited to ${j.eligible_departments.join(", ")}` };
    if (j.required_skills?.length) {
      const have = new Set((profile.skills || []).map((s: string) => s.toLowerCase()));
      const missing = j.required_skills.filter((s: string) => !have.has(s.toLowerCase()));
      if (missing.length > j.required_skills.length / 2) return { eligible: false, reason: `Missing core skills: ${missing.slice(0, 3).join(", ")}` };
    }
    return { eligible: true, reason: "You meet all the criteria" };
  };

  const apply = async (j: Job) => {
    if (!user) return;
    const { error } = await supabase.from("applications").insert({ job_id: j.id, student_id: user.id });
    if (error) return toast.error(error.message);
    setAppliedIds(new Set([...appliedIds, j.id]));
    toast.success(`Applied to ${j.title}`);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <>
      <PageHeader title="Open positions" subtitle="Roles you're eligible to apply for, in real time." />
      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No open jobs" hint="Check back soon — your coordinator will post here." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((j) => {
            const e = checkEligibility(j);
            const applied = appliedIds.has(j.id);
            return (
              <Card key={j.id} className="shadow-elev border-border/60 hover:shadow-elev-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-display font-semibold text-lg">{j.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{j.company}</div>
                    </div>
                    <Badge className={e.eligible ? "bg-accent/15 text-accent border-0" : "bg-destructive/15 text-destructive border-0"}>
                      {e.eligible ? <><CheckCircle2 className="h-3 w-3 mr-1" />Eligible</> : <><XCircle className="h-3 w-3 mr-1" />Not eligible</>}
                    </Badge>
                  </div>
                  {j.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{j.description}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    {j.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
                    {j.ctc && <span>💰 {j.ctc}</span>}
                    {j.deadline && <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" />Apply by {new Date(j.deadline).toLocaleDateString()}</span>}
                  </div>
                  {j.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {j.required_skills.slice(0, 6).map((s: string) => <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>)}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{e.reason}</span>
                    <Button size="sm" onClick={() => apply(j)} disabled={!e.eligible || applied} className={!applied ? "bg-grad-primary" : ""}>
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
