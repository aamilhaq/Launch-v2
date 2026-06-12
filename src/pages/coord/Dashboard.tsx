import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { Users, Briefcase, ClipboardList, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const CoordDashboard = () => {
  const [stats, setStats] = useState({ students: 0, jobs: 0, apps: 0, placed: 0 });
  const [byStatus, setByStatus] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: s }, { count: j }, { data: apps }] = await Promise.all([
        supabase.from("student_profiles").select("user_id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("status"),
      ]);
      const all = apps || [];
      const placed = all.filter((a) => a.status === "selected").length;
      setStats({ students: s || 0, jobs: j || 0, apps: all.length, placed });
      const groups: Record<string, number> = {};
      all.forEach((a) => { groups[a.status] = (groups[a.status] || 0) + 1; });
      setByStatus(Object.entries(groups).map(([status, count]) => ({ status: status.replace(/_/g, " "), count })));
    })();
  }, []);

  return (
    <>
      <PageHeader title="Coordinator overview" subtitle="Placement pulse across your campus." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total students" value={stats.students} icon={Users} />
        <StatCard label="Active jobs" value={stats.jobs} icon={Briefcase} accent="accent" />
        <StatCard label="Applications" value={stats.apps} icon={ClipboardList} />
        <StatCard label="Selected" value={stats.placed} icon={TrendingUp} accent="warning" />
      </div>
      <Card className="shadow-elev border-border/60">
        <CardContent className="p-6">
          <h2 className="font-display font-semibold mb-4">Applications by status</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default CoordDashboard;
