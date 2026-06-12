import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["applied", "under_review", "shortlisted", "interview_scheduled", "selected", "rejected"];

const CoordApplications = () => {
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("applications")
      .select("*, jobs(title, company), profiles:student_id(full_name, email)")
      .order("created_at", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("applications").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    load();
  };

  return (
    <>
      <PageHeader title="Applications" subtitle="Review and move applications through the pipeline." />
      {rows.length === 0 ? <EmptyState icon={ClipboardList} title="No applications yet" /> : (
        <Card className="shadow-elev border-border/60">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Student</th><th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Applied</th><th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-5 py-3"><div className="font-medium">{r.profiles?.full_name}</div><div className="text-xs text-muted-foreground">{r.profiles?.email}</div></td>
                    <td className="px-5 py-3"><div className="font-medium">{r.jobs?.title}</div><div className="text-xs text-muted-foreground">{r.jobs?.company}</div></td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm capitalize">
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    </td>
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

export default CoordApplications;
