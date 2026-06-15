import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Briefcase, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { DEPARTMENTS } from "@/lib/departments";

const blank = {
  company: "", title: "", description: "", location: "", ctc: "",
  required_skills: "", min_cgpa: "",
  eligible_departments: [] as string[],
  deadline: "", published: true,
  rank_by_match: true,
  auto_shortlist_enabled: false,
  auto_shortlist_top_n: "20",
};

const CoordJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [f, setF] = useState(blank);

  const load = async () => {
    const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    setJobs(data || []);
  };
  useEffect(() => { load(); }, []);

  const toggleDept = (d: string) => {
    setF((prev) => ({
      ...prev,
      eligible_departments: prev.eligible_departments.includes(d)
        ? prev.eligible_departments.filter((x) => x !== d)
        : [...prev.eligible_departments, d],
    }));
  };

  const openNew = () => { setEditingId(null); setF(blank); setOpen(true); };

  const openEdit = (j: any) => {
    setEditingId(j.id);
    setF({
      company: j.company || "",
      title: j.title || "",
      description: j.description || "",
      location: j.location || "",
      ctc: j.ctc || "",
      required_skills: (j.required_skills || []).join(", "),
      min_cgpa: j.min_cgpa != null ? String(j.min_cgpa) : "",
      eligible_departments: j.eligible_departments || [],
      deadline: j.deadline ? j.deadline.slice(0, 10) : "",
      published: !!j.published,
      rank_by_match: !!j.rank_by_match,
      auto_shortlist_enabled: !!j.auto_shortlist_top_n,
      auto_shortlist_top_n: j.auto_shortlist_top_n ? String(j.auto_shortlist_top_n) : "20",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!f.company || !f.title) return toast.error("Company and title required");
    const topN = f.auto_shortlist_enabled ? Math.max(1, parseInt(f.auto_shortlist_top_n || "0", 10) || 0) : null;
    const payload = {
      company: f.company, title: f.title, description: f.description,
      location: f.location, ctc: f.ctc,
      required_skills: f.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
      min_cgpa: f.min_cgpa ? Number(f.min_cgpa) : 0,
      eligible_departments: f.eligible_departments,
      deadline: f.deadline || null, published: f.published,
      rank_by_match: f.rank_by_match,
      auto_shortlist_top_n: topN,
    };
    const { error } = editingId
      ? await supabase.from("jobs").update(payload).eq("id", editingId)
      : await supabase.from("jobs").insert({ ...payload, created_by: user.id });
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Job updated" : "Job posted");
    setOpen(false); setEditingId(null); setF(blank); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    load();
  };

  return (
    <>
      <PageHeader title="Job postings" subtitle="Create and manage open roles for students."
        action={<Button className="bg-grad-primary" onClick={openNew}><Plus className="h-4 w-4 mr-2" />New job</Button>}
      />

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setF(blank); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit job" : "Post a new job"}</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Company</Label><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></div>
            <div><Label>Job title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Description</Label><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
            <div><Label>CTC</Label><Input placeholder="₹12 LPA" value={f.ctc} onChange={(e) => setF({ ...f, ctc: e.target.value })} /></div>
            <div><Label>Min CGPA</Label><Input type="number" step="0.1" value={f.min_cgpa} onChange={(e) => setF({ ...f, min_cgpa: e.target.value })} /></div>
            <div><Label>Deadline</Label><Input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Required skills (comma-separated)</Label><Input value={f.required_skills} onChange={(e) => setF({ ...f, required_skills: e.target.value })} /></div>
            <div className="md:col-span-2">
              <Label>Eligible departments</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 p-3 rounded-md border border-border">
                {DEPARTMENTS.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={f.eligible_departments.includes(d)} onCheckedChange={() => toggleDept(d)} />
                    {d}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave all unchecked to allow every department.</p>
            </div>

            <div className="md:col-span-2 rounded-md border border-border p-3 space-y-3">
              <div className="text-sm font-medium">Shortlisting</div>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Published (visible to students)</span>
                <Switch checked={f.published} onCheckedChange={(v) => setF({ ...f, published: v })} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Rank applicants by Match Score</span>
                <Switch checked={f.rank_by_match} onCheckedChange={(v) => setF({ ...f, rank_by_match: v })} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Auto-shortlist Top N candidates</span>
                <Switch checked={f.auto_shortlist_enabled} onCheckedChange={(v) => setF({ ...f, auto_shortlist_enabled: v })} />
              </label>
              {f.auto_shortlist_enabled && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Top</Label>
                  <Input type="number" min="1" className="w-24 h-9" value={f.auto_shortlist_top_n} onChange={(e) => setF({ ...f, auto_shortlist_top_n: e.target.value })} />
                  <span className="text-xs text-muted-foreground">applicants will be auto-shortlisted</span>
                </div>
              )}
            </div>

            <Button onClick={save} className="md:col-span-2 bg-grad-primary">
              {editingId ? "Save changes" : "Publish job"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  <span>CGPA ≥ {j.min_cgpa || 0}{j.auto_shortlist_top_n ? ` · Auto top ${j.auto_shortlist_top_n}` : ""}</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(j)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(j.id)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
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
