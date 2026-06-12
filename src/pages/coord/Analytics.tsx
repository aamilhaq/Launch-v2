import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { TrendingUp, Users, Briefcase, GraduationCap } from "lucide-react";

const COLORS = ["hsl(248 70% 45%)", "hsl(258 80% 62%)", "hsl(158 70% 42%)", "hsl(38 92% 50%)", "hsl(0 80% 56%)"];

const Analytics = () => {
  const [byDept, setByDept] = useState<any[]>([]);
  const [byCompany, setByCompany] = useState<any[]>([]);
  const [quizPerf, setQuizPerf] = useState<any[]>([]);
  const [stats, setStats] = useState({ rate: 0, students: 0, jobs: 0, attempts: 0 });

  useEffect(() => {
    (async () => {
      const [{ data: students }, { data: apps }, { count: jc }, { data: attempts }] = await Promise.all([
        supabase.from("student_profiles").select("department"),
        supabase.from("applications").select("status, jobs(company)"),
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("quiz_attempts").select("score, total, quizzes(title)"),
      ]);

      const placedByDept: Record<string, number> = {};
      // Count placed students by department isn't directly available; approximate from applications selected
      const selectedApps = (apps || []).filter((a: any) => a.status === "selected");
      const totalStudents = students?.length || 0;
      const rate = totalStudents ? Math.round((selectedApps.length / totalStudents) * 100) : 0;
      setStats({ rate, students: totalStudents, jobs: jc || 0, attempts: attempts?.length || 0 });

      const dCount: Record<string, number> = {};
      (students || []).forEach((s: any) => { dCount[s.department || "Other"] = (dCount[s.department || "Other"] || 0) + 1; });
      setByDept(Object.entries(dCount).map(([name, value]) => ({ name, value })));

      const cCount: Record<string, number> = {};
      selectedApps.forEach((a: any) => { const c = a.jobs?.company || "—"; cCount[c] = (cCount[c] || 0) + 1; });
      setByCompany(Object.entries(cCount).map(([company, hires]) => ({ company, hires })));

      const qMap: Record<string, { total: number; sum: number; count: number }> = {};
      (attempts || []).forEach((a: any) => {
        const t = a.quizzes?.title || "Untitled";
        qMap[t] = qMap[t] || { total: 0, sum: 0, count: 0 };
        qMap[t].sum += a.score; qMap[t].total += a.total; qMap[t].count++;
      });
      setQuizPerf(Object.entries(qMap).map(([title, v]) => ({ title, avg: v.total ? Math.round((v.sum / v.total) * 100) : 0 })));
    })();
  }, []);

  return (
    <>
      <PageHeader title="Analytics" subtitle="Placement insights and trends." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Placement rate" value={`${stats.rate}%`} icon={TrendingUp} accent="accent" />
        <StatCard label="Students" value={stats.students} icon={Users} />
        <StatCard label="Jobs posted" value={stats.jobs} icon={Briefcase} />
        <StatCard label="Quiz attempts" value={stats.attempts} icon={GraduationCap} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-elev border-border/60"><CardContent className="p-6">
          <h2 className="font-display font-semibold mb-4">Students by department</h2>
          <div className="h-72"><ResponsiveContainer>
            <PieChart>
              <Pie data={byDept} dataKey="value" nameKey="name" outerRadius={90} label>
                {byDept.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer></div>
        </CardContent></Card>

        <Card className="shadow-elev border-border/60"><CardContent className="p-6">
          <h2 className="font-display font-semibold mb-4">Hires by company</h2>
          {byCompany.length === 0 ? <p className="text-sm text-muted-foreground">No selections yet.</p> : (
            <div className="h-72"><ResponsiveContainer>
              <BarChart data={byCompany}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="company" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="hires" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          )}
        </CardContent></Card>

        <Card className="shadow-elev border-border/60 lg:col-span-2"><CardContent className="p-6">
          <h2 className="font-display font-semibold mb-4">Average quiz performance (%)</h2>
          {quizPerf.length === 0 ? <p className="text-sm text-muted-foreground">No attempts yet.</p> : (
            <div className="h-72"><ResponsiveContainer>
              <BarChart data={quizPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          )}
        </CardContent></Card>
      </div>
    </>
  );
};

export default Analytics;
