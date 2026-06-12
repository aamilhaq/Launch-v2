import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatCard, EmptyState } from "@/components/ui-bits";
import { FileText, Briefcase, ClipboardList, GraduationCap, Megaphone, BellRing } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    if (!user) return;
    (async () => {
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
    })();
  }, [user]);

  const completion = (() => {
    if (!profile) return 0;
    const fields = ["department", "graduation_year", "cgpa", "phone", "linkedin_url", "github_url"];
    const filled = fields.filter((k) => !!profile[k]).length + (profile.skills?.length ? 1 : 0);
    return Math.round((filled / (fields.length + 1)) * 100);
  })();

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
        <Card className="lg:col-span-2 shadow-elev border-border/60">
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
