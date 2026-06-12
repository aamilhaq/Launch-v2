import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Users } from "lucide-react";

const Students = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select("*, profiles!inner(full_name, email)")
        .order("created_at", { ascending: false });
      setRows(data || []);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const t = q.toLowerCase();
    return !t || (r.profiles?.full_name || "").toLowerCase().includes(t) || (r.profiles?.email || "").toLowerCase().includes(t) || (r.department || "").toLowerCase().includes(t);
  });

  return (
    <>
      <PageHeader title="Students" subtitle={`${rows.length} registered students`}
        action={<Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />}
      />
      {filtered.length === 0 ? <EmptyState icon={Users} title="No students" /> : (
        <Card className="shadow-elev border-border/60">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Name</th><th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">CGPA</th><th className="px-5 py-3">Grad</th>
                  <th className="px-5 py-3">Top skills</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.user_id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-5 py-3"><div className="font-medium">{r.profiles?.full_name || "—"}</div><div className="text-xs text-muted-foreground">{r.profiles?.email}</div></td>
                    <td className="px-5 py-3">{r.department || "—"}</td>
                    <td className="px-5 py-3">{r.cgpa ?? "—"}</td>
                    <td className="px-5 py-3">{r.graduation_year ?? "—"}</td>
                    <td className="px-5 py-3"><div className="flex flex-wrap gap-1">{(r.skills || []).slice(0, 4).map((s: string) => <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default Students;
