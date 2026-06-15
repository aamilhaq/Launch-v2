import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui-bits";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";

const QuizTake = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: q }, { data: qs }] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", id).maybeSingle(),
        // correct_index is column-revoked for students — only fetch what the UI needs
        supabase.from("quiz_questions").select("id, quiz_id, question, options, position").eq("quiz_id", id).order("position"),
      ]);
      setQuiz(q); setQuestions(qs || []);
      if (q) setTimeLeft(q.duration_minutes * 60);
    })();
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const submit = async () => {
    if (!user || !quiz) return;
    setSubmitting(true);
    // Server-side grading — keeps correct answers hidden from the client.
    const { data, error } = await supabase.rpc("submit_quiz_attempt", {
      _quiz_id: quiz.id,
      _answers: answers as any,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    toast.success(`You scored ${row?.score ?? 0} / ${row?.total ?? questions.length}`);
    nav("/student/quizzes");
  };

  if (!quiz) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <>
      <PageHeader title={quiz.title} subtitle={quiz.description} action={
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-mono"><Clock className="h-4 w-4" />{mm}:{ss}</div>
      } />
      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} className="shadow-elev border-border/60">
            <CardContent className="p-6">
              <div className="font-medium mb-4"><span className="text-primary">Q{i + 1}.</span> {q.question}</div>
              <div className="space-y-2">
                {q.options.map((opt: string, idx: number) => (
                  <label key={idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === idx ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                    <input type="radio" name={q.id} checked={answers[q.id] === idx} onChange={() => setAnswers({ ...answers, [q.id]: idx })} className="accent-primary" />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <Button onClick={submit} disabled={submitting || Object.keys(answers).length !== questions.length} className="bg-grad-primary h-11 w-full md:w-auto px-8">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit quiz"}
        </Button>
      </div>
    </>
  );
};

export default QuizTake;
