import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2, GraduationCap, Briefcase, CheckCircle2 } from "lucide-react";

type Role = "student" | "coordinator";

const Signup = () => {
  const nav = useNavigate();
  const [role, setRole] = useState<Role>("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.edu\.in$/i.test(email.trim())) {
      return toast.error("Please use your university email ending in .edu.in");
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — let's set up your profile.");
    nav("/redirect");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <Logo className="h-8" />
        <div className="space-y-5">
          <h2 className="text-4xl font-display font-bold leading-tight">Built for two sides of the placement journey.</h2>
          <ul className="space-y-3 text-sidebar-foreground/80">
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-accent mt-0.5" /> AI resume parsing & ATS checker for students</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-accent mt-0.5" /> Job, quiz & application management for coordinators</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-accent mt-0.5" /> Real-time analytics & secure role-based access</li>
          </ul>
        </div>
        <div className="text-sm text-sidebar-foreground/60">© Launch</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/60 shadow-elev">
          <CardContent className="p-8">
            <div className="lg:hidden mb-6"><Logo /></div>
            <h1 className="text-3xl font-display font-bold">Create your account</h1>
            <p className="text-muted-foreground mt-1.5">Choose your role to get started.</p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {([
                { v: "student", icon: GraduationCap, label: "Student" },
                { v: "coordinator", icon: Briefcase, label: "Coordinator" },
              ] as const).map((r) => (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => setRole(r.v)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${role === r.v ? "border-primary bg-primary/5 shadow-elev" : "border-border hover:border-primary/40"}`}
                >
                  <r.icon className={`h-5 w-5 mb-2 ${role === r.v ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="font-medium text-sm">{r.label}</div>
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-grad-primary h-11">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
              </Button>
            </form>
            <div className="mt-6 text-sm text-muted-foreground text-center">
              Already have one? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
