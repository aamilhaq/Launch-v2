// Redirects after auth based on role + onboarding state
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const RoleRedirect = () => {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/login", { replace: true }); return; }
    (async () => {
      if (!role) { nav("/onboarding", { replace: true }); return; }
      if (role === "student") {
        const { data } = await supabase.from("student_profiles").select("onboarded").eq("user_id", user.id).maybeSingle();
        nav(data?.onboarded ? "/student" : "/onboarding/student", { replace: true });
      } else {
        const { data } = await supabase.from("coordinator_profiles").select("onboarded").eq("user_id", user.id).maybeSingle();
        nav(data?.onboarded ? "/coordinator" : "/onboarding/coordinator", { replace: true });
      }
    })();
  }, [user, role, loading, nav]);

  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
};

export default RoleRedirect;
