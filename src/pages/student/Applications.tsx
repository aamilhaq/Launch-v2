import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { ClipboardList, Check, X } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["applied", "under_review", "shortlisted", "interview_scheduled", "selected"];
const LABEL: Record<string, string> = {
  applied: "Applied", under_review: "Under Review", shortlisted: "Shortlisted",
  interview_scheduled: "Interview", selected: "Selected", rejected: "Rejected",
};
const WITHDRAWABLE = new Set(["applied", "under_review"]);

const Applications = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);

  const load = () => {
    if (!user) return;
    supabase.from("applications").select("*, jobs(title, company)").eq("student_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setApps(data || []));
  };
  useEffect(() => { load(); }, [user]);

  const withdraw = async (id: string, title?: string) => {
    if (!confirm(`Withdraw your application${title ? ` for ${title}` : ""}?`)) return;
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Application withdrawn");
    load();
  };

  return (
    <>
      <PageHeader title="Application tracker" subtitle="Follow each application through the placement pipeline." />
      {apps.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No applications yet" hint="Apply to a job to see it tracked here." />
      ) : (
        <div className="space-y-4">
          {apps.map((a) => {
            const rejected = a.status === "rejected";
            const idx = STEPS.indexOf(a.status);
            return (
              <Card key={a.id} className="shadow-elev border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
                    <div>
                      <h3 className="font-display font-semibold">{a.jobs?.title}</h3>
                      <div className="text-sm text-muted-foreground">{a.jobs?.company} · Applied {new Date(a.created_at).toLocaleDateString()}</div>
                    </div>
                    {WITHDRAWABLE.has(a.status) && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => withdraw(a.id, a.jobs?.title)}>
                        <X className="h-3.5 w-3.5 mr-1" /> Withdraw
                      </Button>
                    )}
                  </div>
                  {rejected ? (
                    <div className="text-sm font-medium text-destructive bg-destructive/10 px-3 py-2 rounded-md inline-block">Not selected</div>
                  ) : (
                    <div className="flex items-center justify-between gap-1">
                      {STEPS.map((step, i) => {
                        const reached = i <= idx;
                        return (
                          <div key={step} className="flex-1 flex items-center gap-1">
                            <div className="flex flex-col items-center gap-1.5 min-w-[60px]">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${reached ? "bg-grad-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"}`}>
                                {reached ? <Check className="h-4 w-4" /> : i + 1}
                              </div>
                              <span className={`text-[10px] uppercase tracking-wider text-center ${reached ? "text-foreground font-medium" : "text-muted-foreground"}`}>{LABEL[step]}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < idx ? "bg-primary" : "bg-border"}`} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Applications;
