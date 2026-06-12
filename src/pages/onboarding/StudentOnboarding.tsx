import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DEPTS = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Electrical", "Chemical", "Other"];

const StudentOnboarding = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    full_name: "", department: "Computer Science", graduation_year: new Date().getFullYear() + 1,
    cgpa: "", skills: "", linkedin_url: "", github_url: "", phone: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    if (f.full_name) await supabase.from("profiles").update({ full_name: f.full_name }).eq("id", user.id);
    const { error } = await supabase.from("student_profiles").upsert({
      user_id: user.id,
      department: f.department,
      graduation_year: Number(f.graduation_year) || null,
      cgpa: f.cgpa ? Number(f.cgpa) : null,
      skills: f.skills.split(",").map((s) => s.trim()).filter(Boolean),
      linkedin_url: f.linkedin_url || null,
      github_url: f.github_url || null,
      phone: f.phone || null,
      onboarded: true,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved!");
    nav("/student");
  };

  return (
    <div className="min-h-screen bg-hero p-6 flex items-start justify-center py-12">
      <Card className="w-full max-w-2xl shadow-elev-lg">
        <CardContent className="p-8">
          <Logo className="h-7" />
          <h1 className="text-3xl font-display font-bold mt-6">Tell us about you</h1>
          <p className="text-muted-foreground mt-1.5">This helps Launch match you to the right opportunities.</p>
          <form onSubmit={submit} className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Full name</Label>
              <Input required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Department</Label>
              <select value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {DEPTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label>Graduation year</Label>
              <Input type="number" value={f.graduation_year} onChange={(e) => setF({ ...f, graduation_year: +e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>CGPA</Label>
              <Input type="number" step="0.01" max="10" placeholder="8.50" value={f.cgpa} onChange={(e) => setF({ ...f, cgpa: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="mt-1.5" />
            </div>
            <div className="md:col-span-2">
              <Label>Skills (comma-separated)</Label>
              <Input placeholder="React, Python, SQL, Machine Learning" value={f.skills} onChange={(e) => setF({ ...f, skills: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input value={f.linkedin_url} onChange={(e) => setF({ ...f, linkedin_url: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>GitHub URL</Label>
              <Input value={f.github_url} onChange={(e) => setF({ ...f, github_url: e.target.value })} className="mt-1.5" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full bg-grad-primary h-11">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to dashboard"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">You can upload your resume from the dashboard.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentOnboarding;
