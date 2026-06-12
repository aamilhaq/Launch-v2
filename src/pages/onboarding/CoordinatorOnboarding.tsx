import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const CoordinatorOnboarding = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ full_name: "", college: "", department: "", designation: "Placement Coordinator", phone: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    if (f.full_name) await supabase.from("profiles").update({ full_name: f.full_name }).eq("id", user.id);
    const { error } = await supabase.from("coordinator_profiles").upsert({
      user_id: user.id, college: f.college, department: f.department,
      designation: f.designation, phone: f.phone, onboarded: true,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome aboard!");
    nav("/coordinator");
  };

  return (
    <div className="min-h-screen bg-hero p-6 flex items-start justify-center py-12">
      <Card className="w-full max-w-xl shadow-elev-lg">
        <CardContent className="p-8">
          <Logo className="h-7" />
          <h1 className="text-3xl font-display font-bold mt-6">Coordinator setup</h1>
          <p className="text-muted-foreground mt-1.5">Just a few details about your role.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div><Label>Full name</Label><Input required className="mt-1.5" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
            <div><Label>College / Institution</Label><Input required className="mt-1.5" value={f.college} onChange={(e) => setF({ ...f, college: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Department</Label><Input className="mt-1.5" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /></div>
              <div><Label>Designation</Label><Input className="mt-1.5" value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} /></div>
            </div>
            <div><Label>Contact phone</Label><Input className="mt-1.5" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
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
