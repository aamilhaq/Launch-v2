// Redirects after auth based on role + onboarding state
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const RoleRedirect = () => {
  const { user, loading, refreshRole } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/login", { replace: true }); return; }

    let cancelled = false;
    (async () => {
      // Poll for role — handle_new_user trigger may commit a moment after signUp resolves
      let role: string | null = null;
      for (let i = 0; i < 8 && !cancelled; i++) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.role) { role = data.role; break; }
        await new Promise((r) => setTimeout(r, 400));
      }
      if (cancelled) return;
      await refreshRole();

      if (!role) { nav("/onboarding", { replace: true }); return; }
      if (role === "student") {
        const { data } = await supabase.from("student_profiles").select("onboarded").eq("user_id", user.id).maybeSingle();
        nav(data?.onboarded ? "/student" : "/onboarding/student", { replace: true });
      } else {
        const { data } = await supabase.from("coordinator_profiles").select("onboarded").eq("user_id", user.id).maybeSingle();
        nav(data?.onboarded ? "/coordinator" : "/onboarding/coordinator", { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [user, loading, nav, refreshRole]);

  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
};

export default RoleRedirect;
