import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui-bits";
import { PhoneInput } from "@/components/PhoneInput";
import { FieldError } from "@/components/FieldError";
import { toast } from "sonner";
import { Loader2, X, Sparkles } from "lucide-react";
import { isName, isCgpa, isGradYear, isLinkedIn, isGitHub, isPhoneForCountry, COUNTRY_CODES } from "@/lib/validators";

const splitPhone = (raw?: string | null): { code: string; digits: string } => {
  if (!raw) return { code: "+91", digits: "" };
  const m = raw.match(/^(\+\d{1,4})\s?(.*)$/);
  if (m && COUNTRY_CODES.find((c) => c.code === m[1])) return { code: m[1], digits: m[2].replace(/\D/g, "") };
  return { code: "+91", digits: raw.replace(/\D/g, "") };
};

const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [base, setBase] = useState<any>(null);
  const [code, setCode] = useState("+91");
  const [digits, setDigits] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      const sp = splitPhone(p?.phone);
      setCode(sp.code); setDigits(sp.digits);
    })();
  }, [user]);

  if (!profile || !base) return null;

  const skills: string[] = profile.skills || [];
  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    if (skills.some((s) => s.toLowerCase() === v.toLowerCase())) { setSkillInput(""); return; }
    setProfile({ ...profile, skills: [...skills, v] });
    setSkillInput("");
  };
  const removeSkill = (s: string) => setProfile({ ...profile, skills: skills.filter((x) => x !== s) });

  const save = async () => {
    if (!user) return;
    const errs: Record<string, string> = {};
    if (!isName(base.full_name || "")) errs.full_name = "Use letters, spaces, hyphens (2–60 chars)";
    if (profile.graduation_year && !isGradYear(Number(profile.graduation_year))) errs.graduation_year = "Invalid year";
    if (profile.cgpa !== null && profile.cgpa !== undefined && profile.cgpa !== "" && !isCgpa(Number(profile.cgpa))) errs.cgpa = "0–10";
    if (digits && !isPhoneForCountry(digits, code)) errs.phone = "Invalid phone";
    if (profile.linkedin_url && !isLinkedIn(profile.linkedin_url)) errs.linkedin_url = "Must be a linkedin.com URL";
    if (profile.github_url && !isGitHub(profile.github_url)) errs.github_url = "Must be a github.com URL";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    await supabase.from("profiles").update({ full_name: base.full_name }).eq("id", user.id);
    const { error } = await supabase.from("student_profiles").upsert({
      user_id: user.id,
      department: profile.department, graduation_year: profile.graduation_year,
      cgpa: profile.cgpa ? Number(profile.cgpa) : null, phone: digits ? `${code} ${digits}` : null,
      linkedin_url: profile.linkedin_url || null, github_url: profile.github_url || null,
      skills, onboarded: true,
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
          <div className="md:col-span-2">
            <Label>Full name *</Label>
            <Input value={base.full_name || ""} onChange={(e) => setBase({ ...base, full_name: e.target.value })} className="mt-1.5" aria-invalid={!!errors.full_name} />
            <FieldError msg={errors.full_name} />
          </div>
          <div><Label>Department</Label><Input value={profile.department || ""} onChange={(e) => setProfile({ ...profile, department: e.target.value })} className="mt-1.5" /></div>
          <div>
            <Label>Graduation year</Label>
            <Input type="number" value={profile.graduation_year || ""} onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value ? +e.target.value : null })} className="mt-1.5" aria-invalid={!!errors.graduation_year} />
            <FieldError msg={errors.graduation_year} />
          </div>
          <div>
            <Label>CGPA</Label>
            <Input type="number" step="0.01" min="0" max="10" value={profile.cgpa ?? ""} onChange={(e) => setProfile({ ...profile, cgpa: e.target.value })} className="mt-1.5" aria-invalid={!!errors.cgpa} />
            <FieldError msg={errors.cgpa} />
          </div>
          <div>
            <Label>Phone</Label>
            <PhoneInput code={code} digits={digits} onChange={(c, d) => { setCode(c); setDigits(d); }} error={errors.phone} />
          </div>
          <div>
            <Label>LinkedIn</Label>
            <Input value={profile.linkedin_url || ""} onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })} className="mt-1.5" aria-invalid={!!errors.linkedin_url} />
            <FieldError msg={errors.linkedin_url} />
          </div>
          <div>
            <Label>GitHub</Label>
            <Input value={profile.github_url || ""} onChange={(e) => setProfile({ ...profile, github_url: e.target.value })} className="mt-1.5" aria-invalid={!!errors.github_url} />
            <FieldError msg={errors.github_url} />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><Label>Skills</Label></div>
            <div className="mt-2 flex flex-wrap gap-2 min-h-[2.5rem] p-3 rounded-lg border border-border bg-muted/30">
              {skills.length === 0 && <span className="text-xs text-muted-foreground">No skills yet.</span>}
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="font-normal pl-2.5 pr-1 py-1 gap-1">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="hover:bg-background rounded p-0.5"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input placeholder="Add a skill" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
              <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Skills are auto-extracted from your resume. Edit anytime here.</p>
          </div>
          <div className="md:col-span-2"><Button onClick={save} disabled={loading} className="bg-grad-primary">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button></div>
        </CardContent>
      </Card>
    </>
  );
};

export default StudentProfile;
