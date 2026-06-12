import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Announcements = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", body: "" });

  const load = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!user || !f.title || !f.body) return toast.error("Title and body required");
    const { error } = await supabase.from("announcements").insert({ created_by: user.id, ...f });
    if (error) return toast.error(error.message);
    setOpen(false); setF({ title: "", body: "" }); load();
    toast.success("Announcement posted");
  };

  const remove = async (id: string) => { await supabase.from("announcements").delete().eq("id", id); load(); };

  return (
    <>
      <PageHeader title="Announcements" subtitle="Broadcast updates to all students."
        action={<Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-grad-primary"><Plus className="h-4 w-4 mr-2" />New</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Post announcement</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
              <div><Label>Message</Label><Textarea rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
              <Button onClick={create} className="w-full bg-grad-primary">Post</Button>
            </div>
          </DialogContent>
        </Dialog>}
      />
      {rows.length === 0 ? <EmptyState icon={Megaphone} title="No announcements yet" /> : (
        <div className="space-y-3">
          {rows.map((a) => (
            <Card key={a.id} className="shadow-elev border-border/60"><CardContent className="p-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold">{a.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                <div className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent></Card>
          ))}
        </div>
      )}
    </>
  );
};

export default Announcements;
