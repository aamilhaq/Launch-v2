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
import { GraduationCap, Plus, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type QDraft = { question: string; options: string[]; correct_index: number };

const CoordQuizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [duration, setDuration] = useState(15);
  const [questions, setQuestions] = useState<QDraft[]>([{ question: "", options: ["", "", "", ""], correct_index: 0 }]);

  const load = async () => {
    const { data } = await supabase.from("quizzes").select("*, quiz_questions(count)").order("created_at", { ascending: false });
    setQuizzes(data || []);
  };
  useEffect(() => { load(); }, []);

  const addQ = () => setQuestions([...questions, { question: "", options: ["", "", "", ""], correct_index: 0 }]);

  const onCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    // expected header: question,option1,option2,option3,option4,correct_index(1-4)
    const start = /question/i.test(lines[0]) ? 1 : 0;
    const parsed: QDraft[] = [];
    for (let i = start; i < lines.length; i++) {
      const cells = lines[i].split(",").map((c) => c.trim());
      if (cells.length < 6) continue;
      parsed.push({ question: cells[0], options: cells.slice(1, 5), correct_index: Math.max(0, Math.min(3, Number(cells[5]) - 1)) });
    }
    if (parsed.length === 0) return toast.error("No valid rows found");
    setQuestions(parsed);
    toast.success(`Loaded ${parsed.length} questions from CSV`);
  };

  const save = async () => {
    if (!user) return;
    if (!title) return toast.error("Title required");
    const valid = questions.filter((q) => q.question && q.options.every((o) => o));
    if (valid.length === 0) return toast.error("Add at least one complete question");
    const { data: quiz, error } = await supabase.from("quizzes").insert({
      created_by: user.id, title, description: desc, duration_minutes: duration, published: true,
    }).select().single();
    if (error) return toast.error(error.message);
    const rows = valid.map((q, i) => ({ quiz_id: quiz.id, question: q.question, options: q.options, correct_index: q.correct_index, position: i }));
    const { error: qErr } = await supabase.from("quiz_questions").insert(rows);
    if (qErr) return toast.error(qErr.message);
    toast.success("Quiz published");
    setOpen(false); setTitle(""); setDesc(""); setDuration(15);
    setQuestions([{ question: "", options: ["", "", "", ""], correct_index: 0 }]);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this quiz?")) return;
    await supabase.from("quizzes").delete().eq("id", id);
    load();
  };

  return (
    <>
      <PageHeader title="Quizzes" subtitle="Build practice quizzes manually or import from CSV."
        action={<Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-grad-primary"><Plus className="h-4 w-4 mr-2" />New quiz</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create a quiz</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div><Label>Duration (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(+e.target.value)} /></div>
                <div className="md:col-span-3"><Label>Description</Label><Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm font-display font-semibold">Questions</div>
                <div className="flex gap-2">
                  <label>
                    <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && onCSV(e.target.files[0])} />
                    <Button asChild variant="outline" size="sm"><span className="cursor-pointer"><Upload className="h-3.5 w-3.5 mr-1" />Upload CSV</span></Button>
                  </label>
                  <Button onClick={addQ} variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground -mt-2">CSV format: question,option1,option2,option3,option4,correct (1-4)</div>

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <Card key={i} className="border-border/60">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Q{i + 1}</Badge>
                        <Input placeholder="Question" value={q.question} onChange={(e) => { const c = [...questions]; c[i].question = e.target.value; setQuestions(c); }} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <input type="radio" name={`c${i}`} checked={q.correct_index === j} onChange={() => { const c = [...questions]; c[i].correct_index = j; setQuestions(c); }} className="accent-primary" />
                            <Input placeholder={`Option ${j + 1}`} value={opt} onChange={(e) => { const c = [...questions]; c[i].options[j] = e.target.value; setQuestions(c); }} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button onClick={save} className="w-full bg-grad-primary">Publish quiz</Button>
            </div>
          </DialogContent>
        </Dialog>}
      />

      {quizzes.length === 0 ? <EmptyState icon={GraduationCap} title="No quizzes yet" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((q) => (
            <Card key={q.id} className="shadow-elev border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold">{q.title}</h3>
                    <div className="text-sm text-muted-foreground mt-0.5">{q.quiz_questions?.[0]?.count ?? 0} questions · {q.duration_minutes} min</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default CoordQuizzes;
