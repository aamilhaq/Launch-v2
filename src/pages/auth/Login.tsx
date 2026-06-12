import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Login = () => {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    nav("/redirect");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <Logo className="h-8" />
        <div>
          <h2 className="text-4xl font-display font-bold leading-tight">"Launch turned placement season from chaos into a calm dashboard."</h2>
          <p className="mt-4 text-sidebar-foreground/70">— Placement Cell, Class of 2025</p>
        </div>
        <div className="text-sm text-sidebar-foreground/60">© Launch — Where careers launch.</div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/60 shadow-elev">
          <CardContent className="p-8">
            <div className="lg:hidden mb-6"><Logo /></div>
            <h1 className="text-3xl font-display font-bold">Welcome back</h1>
            <p className="text-muted-foreground mt-1.5">Sign in to your Launch account.</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-grad-primary h-11">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
              </Button>
            </form>
            <div className="mt-6 text-sm text-muted-foreground text-center">
              No account? <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
