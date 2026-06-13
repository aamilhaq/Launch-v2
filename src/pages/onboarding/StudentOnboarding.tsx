import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { PhoneInput } from "@/components/PhoneInput";
import { FieldError } from "@/components/FieldError";
import { extractPdfText } from "@/lib/pdf";
import { toast } from "sonner";
import { Loader2, Upload, Sparkles, X, FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import { isName, isCgpa, isGradYear, isLinkedIn, isGitHub, isPhoneForCountry, isUrl } from "@/lib/validators";

const DEPTS = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Electrical", "Chemical", "Other"];
const CURR_YEAR = new Date().getFullYear();

type Step = 1 | 2 | 3;

const StudentOnboarding = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Step 1 — basics
  const [full_name, setFullName] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [graduation_year, setGradYear] = useState<number>(CURR_YEAR + 1);
  const [cgpa, setCgpa] = useState<string>("");
  const [country, setCountry] = useState("+91");
  const [phone, setPhone] = useState("");
  const [linkedin_url, setLi] = useState("");
  const [github_url, setGh] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2 — resume
  const [parsing, setParsing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePath, setResumePath] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [parsedFull, setParsedFull] = useState<any>(null);

  // Step 3 — skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!isName(full_name)) e.full_name = "Use letters, spaces, hyphens (2–60 chars)";
    if (!DEPTS.includes(department)) e.department = "Pick a department";
    if (!isGradYear(Number(graduation_year))) e.graduation_year = `Year must be ${CURR_YEAR - 10}–${CURR_YEAR + 8}`;
    if (cgpa !== "" && !isCgpa(Number(cgpa))) e.cgpa = "CGPA must be between 0 and 10";
    if (!isPhoneForCountry(phone, country)) e.phone = "Enter a valid phone number";
    if (linkedin_url && !isLinkedIn(linkedin_url)) e.linkedin_url = "Must be a valid linkedin.com URL";
    if (github_url && !isGitHub(github_url)) e.github_url = "Must be a valid github.com URL";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next1 = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const uploadResume = async (file: File) => {
    if (!user) return;
    if (file.type !== "application/pdf") return toast.error("Please upload a PDF file");
    if (file.size > 10 * 1024 * 1024) return toast.error("PDF too large (max 10MB)");
    setParsing(true);
    try {
      let text = "";
      try { text = await extractPdfText(file); } catch { throw new Error("Could not read this PDF. It may be scanned or corrupted."); }
      if (!text.trim() || text.trim().length < 40) throw new Error("Couldn't extract text. Try a text-based PDF (not a scan).");

      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { data: parsed, error: aiErr } = await supabase.functions.invoke("parse-resume", { body: { text } });
      if (aiErr) throw aiErr;

      const detected: string[] = Array.isArray(parsed?.parsed?.skills) ? parsed.parsed.skills.filter(Boolean) : [];
      setResumeFile(file);
      setResumePath(path);
      setResumeText(text);
      setParsedFull(parsed?.parsed ?? null);
      setSkills(Array.from(new Set(detected.map((s: string) => s.trim()).filter(Boolean))));
      setStep(3);
      toast.success(`Detected ${detected.length} skills`);
    } catch (e: any) {
      toast.error(e.message || "Resume processing failed");
    } finally {
      setParsing(false);
    }
  };

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    if (skills.some((s) => s.toLowerCase() === v.toLowerCase())) { setSkillInput(""); return; }
    setSkills([...skills, v]);
    setSkillInput("");
  };

  const finish = async () => {
    if (!user || !resumePath) return;
    if (skills.length === 0) return toast.error("Add at least one skill");
    setSaving(true);
    try {
      await supabase.from("profiles").update({ full_name }).eq("id", user.id);

      const fullPhone = `${country} ${phone}`;
      const now = new Date().toISOString();
      const { error } = await supabase.from("student_profiles").upsert({
        user_id: user.id,
        department,
        graduation_year: Number(graduation_year),
        cgpa: cgpa ? Number(cgpa) : null,
        linkedin_url: linkedin_url || null,
        github_url: github_url || null,
        phone: fullPhone,
        skills,
        extracted_skills: skills,
        resume_url: resumePath,
        extraction_timestamp: now,
        resume_last_updated: now,
        onboarded: true,
      });
      if (error) throw error;

      // Deactivate old resumes, insert new
      await supabase.from("resumes").update({ is_active: false }).eq("user_id", user.id);
      await supabase.from("resumes").insert({
        user_id: user.id, file_path: resumePath, file_name: resumeFile!.name,
        raw_text: resumeText, parsed: parsedFull, is_active: true,
      });

      toast.success("Profile saved!");
      nav("/student");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero p-4 md:p-6 flex items-start justify-center py-8 md:py-12">
      <Card className="w-full max-w-2xl shadow-elev-lg">
        <CardContent className="p-6 md:p-8">
          <Logo className="h-7" />
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <Stepper n={1} active={step >= 1} done={step > 1} label="Basics" />
            <div className="h-px flex-1 bg-border" />
            <Stepper n={2} active={step >= 2} done={step > 2} label="Resume" />
            <div className="h-px flex-1 bg-border" />
            <Stepper n={3} active={step >= 3} done={false} label="Skills" />
          </div>

          {step === 1 && (
            <>
              <h1 className="text-2xl md:text-3xl font-display font-bold mt-6">Tell us about you</h1>
              <p className="text-muted-foreground mt-1.5 text-sm">Launch matches you to the right opportunities.</p>
              <form onSubmit={next1} className="mt-6 grid md:grid-cols-2 gap-4" noValidate>
                <div className="md:col-span-2">
                  <Label htmlFor="full_name">Full name *</Label>
                  <Input id="full_name" required value={full_name} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" aria-invalid={!!errors.full_name} />
                  <FieldError msg={errors.full_name} />
                </div>
                <div>
                  <Label>Department *</Label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {DEPTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="grad">Graduation year *</Label>
                  <Input id="grad" type="number" value={graduation_year} onChange={(e) => setGradYear(+e.target.value)} className="mt-1.5" aria-invalid={!!errors.graduation_year} />
                  <FieldError msg={errors.graduation_year} />
                </div>
                <div>
                  <Label htmlFor="cgpa">CGPA</Label>
                  <Input id="cgpa" type="number" step="0.01" max="10" min="0" placeholder="8.50" value={cgpa} onChange={(e) => setCgpa(e.target.value)} className="mt-1.5" aria-invalid={!!errors.cgpa} />
                  <FieldError msg={errors.cgpa} />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <PhoneInput code={country} digits={phone} onChange={(c, d) => { setCountry(c); setPhone(d); }} error={errors.phone} />
                </div>
                <div>
                  <Label htmlFor="li">LinkedIn URL</Label>
                  <Input id="li" placeholder="https://linkedin.com/in/…" value={linkedin_url} onChange={(e) => setLi(e.target.value)} className="mt-1.5" aria-invalid={!!errors.linkedin_url} />
                  <FieldError msg={errors.linkedin_url} />
                </div>
                <div>
                  <Label htmlFor="gh">GitHub URL</Label>
                  <Input id="gh" placeholder="https://github.com/…" value={github_url} onChange={(e) => setGh(e.target.value)} className="mt-1.5" aria-invalid={!!errors.github_url} />
                  <FieldError msg={errors.github_url} />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full bg-grad-primary h-11">
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl md:text-3xl font-display font-bold mt-6">Upload your resume</h1>
              <p className="text-muted-foreground mt-1.5 text-sm">We'll detect your skills automatically — no typing required.</p>
              <label className="block mt-6">
                <input type="file" accept="application/pdf" className="hidden" disabled={parsing}
                  onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0])} />
                <div className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${parsing ? "opacity-60 cursor-wait" : "hover:border-primary hover:bg-primary/5"}`}>
                  {parsing ? (
                    <div className="flex flex-col items-center gap-3 text-sm">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div className="font-medium">Parsing your resume…</div>
                      <div className="text-muted-foreground">Extracting text and detecting skills with AI.</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-sm">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><Upload className="h-6 w-6 text-primary" /></div>
                      <div className="font-medium">Click to upload your resume (PDF, max 10MB)</div>
                      <div className="text-muted-foreground">Text-based PDFs work best (not scans).</div>
                    </div>
                  )}
                </div>
              </label>
              <Button type="button" variant="ghost" className="mt-4" onClick={() => setStep(1)} disabled={parsing}>← Back</Button>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-2xl md:text-3xl font-display font-bold mt-6 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" /> Confirm your skills
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm">We detected these from <span className="font-medium">{resumeFile?.name}</span>. Edit before finishing.</p>

              <div className="mt-6 flex flex-wrap gap-2 min-h-[3rem] p-3 rounded-lg border border-border bg-muted/30">
                {skills.length === 0 && <span className="text-xs text-muted-foreground">No skills yet — add some below.</span>}
                {skills.map((s) => (
                  <Badge key={s} variant="secondary" className="font-normal pl-2.5 pr-1 py-1 gap-1">
                    {s}
                    <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="hover:bg-background rounded p-0.5" aria-label={`Remove ${s}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <Input placeholder="Add a skill (e.g. TypeScript)" value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={saving}>← Re-upload</Button>
                <Button type="button" onClick={finish} disabled={saving || skills.length === 0} className="bg-grad-primary flex-1 h-11">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Finish & go to dashboard</>}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Stepper = ({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`h-6 w-6 rounded-full text-[11px] font-semibold flex items-center justify-center ${done ? "bg-primary text-primary-foreground" : active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
      {done ? "✓" : n}
    </div>
    <span className={active ? "text-foreground font-medium" : ""}>{label}</span>
  </div>
);

export default StudentOnboarding;
