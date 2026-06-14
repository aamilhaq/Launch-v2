import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { PhoneInput } from "@/components/PhoneInput";
import { FieldError } from "@/components/FieldError";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { isName, isPhoneForCountry } from "@/lib/validators";
import { DEPARTMENTS } from "@/lib/departments";

const CoordinatorOnboarding = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [full_name, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [designation, setDesignation] = useState("Placement Coordinator");
  const [country, setCountry] = useState("+91");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const errs: Record<string, string> = {};
    if (!isName(full_name)) errs.full_name = "Use letters, spaces, hyphens (2–60 chars)";
    if (college.trim().length < 2) errs.college = "Required";
    if (!isPhoneForCountry(phone, country)) errs.phone = "Enter a valid phone number";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    await supabase.from("profiles").update({ full_name }).eq("id", user.id);
    const { error } = await supabase.from("coordinator_profiles").upsert({
      user_id: user.id, college, department, designation,
      phone: `${country} ${phone}`, onboarded: true,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome aboard!");
    nav("/coordinator");
  };

  return (
    <div className="min-h-screen bg-hero p-4 md:p-6 flex items-start justify-center py-8 md:py-12">
      <Card className="w-full max-w-xl shadow-elev-lg">
        <CardContent className="p-6 md:p-8">
          <Logo className="h-7" />
          <h1 className="text-2xl md:text-3xl font-display font-bold mt-6">Coordinator setup</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Just a few details about your role.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div>
              <Label>Full name *</Label>
              <Input className="mt-1.5" value={full_name} onChange={(e) => setFullName(e.target.value)} aria-invalid={!!errors.full_name} />
              <FieldError msg={errors.full_name} />
            </div>
            <div>
              <Label>College / Institution *</Label>
              <Input className="mt-1.5" value={college} onChange={(e) => setCollege(e.target.value)} aria-invalid={!!errors.college} />
              <FieldError msg={errors.college} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Department</Label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div><Label>Designation</Label><Input className="mt-1.5" value={designation} onChange={(e) => setDesignation(e.target.value)} /></div>
            </div>
            <div>
              <Label>Contact phone *</Label>
              <PhoneInput code={country} digits={phone} onChange={(c, d) => { setCountry(c); setPhone(d); }} error={errors.phone} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-grad-primary h-11">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go to dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoordinatorOnboarding;
