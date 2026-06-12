import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui-bits";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [base, setBase] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: b }] = await Promise.all([
        supabase.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setProfile(p ?? {});
      setBase(b ?? {});
    })();
  }, [user]);

  if (!profile || !base) return null;

  const save = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from("profiles").update({ full_name: base.full_name }).eq("id", user.id);
    const { error } = await supabase.from("student_profiles").upsert({
      user_id: user.id,
      department: profile.department, graduation_year: profile.graduation_year,
      cgpa: profile.cgpa, phone: profile.phone, linkedin_url: profile.linkedin_url,
      github_url: profile.github_url, skills: profile.skills || [], onboarded: true,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  return (
    <>
      <PageHeader title="Your profile" subtitle="Keep this up to date — coordinators see it too." />
      <Card className="shadow-elev border-border/60 max-w-3xl">
        <CardContent className="p-6 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Label>Full name</Label><Input value={base.full_name || ""} onChange={(e) => setBase({ ...base, full_name: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Department</Label><Input value={profile.department || ""} onChange={(e) => setProfile({ ...profile, department: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Graduation year</Label><Input type="number" value={profile.graduation_year || ""} onChange={(e) => setProfile({ ...profile, graduation_year: +e.target.value })} className="mt-1.5" /></div>
          <div><Label>CGPA</Label><Input type="number" step="0.01" value={profile.cgpa || ""} onChange={(e) => setProfile({ ...profile, cgpa: +e.target.value })} className="mt-1.5" /></div>
          <div><Label>Phone</Label><Input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-1.5" /></div>
          <div><Label>LinkedIn</Label><Input value={profile.linkedin_url || ""} onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })} className="mt-1.5" /></div>
          <div><Label>GitHub</Label><Input value={profile.github_url || ""} onChange={(e) => setProfile({ ...profile, github_url: e.target.value })} className="mt-1.5" /></div>
          <div className="md:col-span-2">
            <Label>Skills (comma separated)</Label>
            <Input value={(profile.skills || []).join(", ")} onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} className="mt-1.5" />
          </div>
          <div className="md:col-span-2"><Button onClick={save} disabled={loading} className="bg-grad-primary">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button></div>
        </CardContent>
      </Card>
    </>
  );
};

export default StudentProfile;
