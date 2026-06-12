import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const blank = { company: "", title: "", description: "", location: "", ctc: "", required_skills: "", min_cgpa: "", eligible_departments: "", deadline: "", published: true };

const CoordJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);

  const load = async () => {
    const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    setJobs(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!user) return;
    if (!f.company || !f.title) return toast.error("Company and title required");
    const { error } = await supabase.from("jobs").insert({
      created_by: user.id, company: f.company, title: f.title, description: f.description,
      location: f.location, ctc: f.ctc,
      required_skills: f.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
      min_cgpa: f.min_cgpa ? Number(f.min_cgpa) : 0,
      eligible_departments: f.eligible_departments.split(",").map((s) => s.trim()).filter(Boolean),
      deadline: f.deadline || null, published: f.published,
    });
    if (error) return toast.error(error.message);
    toast.success("Job posted");
    setOpen(false); setF(blank); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    load();
  };

  return (
    <>
      <PageHeader title="Job postings" subtitle="Create and manage open roles for students."
        action={<Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-grad-primary"><Plus className="h-4 w-4 mr-2" />New job</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Post a new job</DialogTitle></DialogHeader>
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label>Company</Label><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></div>
              <div><Label>Job title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Description</Label><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
              <div><Label>Location</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
              <div><Label>CTC</Label><Input placeholder="₹12 LPA" value={f.ctc} onChange={(e) => setF({ ...f, ctc: e.target.value })} /></div>
              <div><Label>Min CGPA</Label><Input type="number" step="0.1" value={f.min_cgpa} onChange={(e) => setF({ ...f, min_cgpa: e.target.value })} /></div>
              <div><Label>Deadline</Label><Input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Required skills (comma-separated)</Label><Input value={f.required_skills} onChange={(e) => setF({ ...f, required_skills: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Eligible departments (comma-separated)</Label><Input placeholder="Computer Science, IT" value={f.eligible_departments} onChange={(e) => setF({ ...f, eligible_departments: e.target.value })} /></div>
              <Button onClick={save} className="md:col-span-2 bg-grad-primary">Publish job</Button>
            </div>
          </DialogContent>
        </Dialog>}
      />
      {jobs.length === 0 ? <EmptyState icon={Briefcase} title="No jobs yet" hint="Click 'New job' to post the first one." /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <Card key={j.id} className="shadow-elev border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold">{j.title}</h3>
                    <div className="text-sm text-muted-foreground">{j.company} · {j.location || "—"}</div>
                  </div>
                  <Badge className={j.published ? "bg-accent/15 text-accent border-0" : "bg-muted text-muted-foreground border-0"}>{j.published ? "Published" : "Draft"}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">{(j.required_skills || []).slice(0, 5).map((s: string) => <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>)}</div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>CGPA ≥ {j.min_cgpa || 0}</span>
                  <Button size="sm" variant="ghost" onClick={() => remove(j.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default CoordJobs;
