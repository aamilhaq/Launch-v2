// Fallback if signup metadata role wasn't set — let user pick
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { GraduationCap, Briefcase } from "lucide-react";
import { toast } from "sonner";

const PickRole = () => {
  const { user, refreshRole } = useAuth();
  const nav = useNavigate();

  const set = async (role: "student" | "coordinator") => {
    if (!user) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });
    if (error) return toast.error(error.message);
    await refreshRole();
    nav(role === "student" ? "/onboarding/student" : "/onboarding/coordinator");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-hero">
      <Card className="w-full max-w-lg shadow-elev-lg">
        <CardContent className="p-8 text-center">
          <Logo className="h-7 mx-auto" />
          <h1 className="text-3xl font-display font-bold mt-6">Choose your role</h1>
          <p className="text-muted-foreground mt-1.5">This determines your dashboard and permissions.</p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <button onClick={() => set("student")} className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all">
              <GraduationCap className="h-8 w-8 text-primary mx-auto mb-3" />
              <div className="font-display font-semibold">Student</div>
            </button>
            <button onClick={() => set("coordinator")} className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all">
              <Briefcase className="h-8 w-8 text-primary mx-auto mb-3" />
              <div className="font-display font-semibold">Coordinator</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickRole;
