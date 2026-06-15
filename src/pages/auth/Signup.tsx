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

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.edu\.in$/i.test(email.trim())) {
      return toast.error("Please use your university email ending in .edu.in");
    }
    if (password.length < 8) {
      return toast.error("Password must be at least 8 characters.");
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/redirect`,
        data: { full_name: fullName, role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    // If email confirmation is required, no session is returned.
    if (!data.session) {
      setPendingEmail(email.trim());
      return;
    }
    toast.success("Account created — let's set up your profile.");
    nav("/redirect");
  };

  if (pendingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border/60 shadow-elev">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold">Check your email</h1>
            <p className="text-muted-foreground mt-2">
              We sent a confirmation link to <span className="font-medium text-foreground">{pendingEmail}</span>.
              Click it to activate your account, then come back to sign in.
            </p>
            <Link to="/login" className="inline-block mt-6 text-primary font-medium hover:underline">
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <Label htmlFor="email">University email</Label>
                <Input id="email" type="email" required placeholder="you@college.edu.in" pattern="^[^\s@]+@[^\s@]+\.edu\.in$" title="Use your .edu.in university email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
                <p className="text-xs text-muted-foreground mt-1">Only university emails ending in <span className="font-medium">.edu.in</span> are allowed.</p>
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
                <p className="text-xs text-muted-foreground mt-1">Min 8 characters. Common/leaked passwords are blocked.</p>
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
