import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { GraduationCap, Clock, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Quizzes = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: qs }, { data: at }] = await Promise.all([
        supabase.from("quizzes").select("*").eq("published", true).order("created_at", { ascending: false }),
        supabase.from("quiz_attempts").select("*, quizzes(title)").eq("student_id", user.id).order("created_at", { ascending: false }),
      ]);
      setQuizzes(qs || []); setAttempts(at || []);
    })();
  }, [user]);

  return (
    <>
      <PageHeader title="Quizzes" subtitle="Practice and prove your readiness." />
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-display font-semibold mb-3">Available</h2>
          {quizzes.length === 0 ? <EmptyState icon={GraduationCap} title="No quizzes published" /> : (
            <div className="space-y-3">
              {quizzes.map((q) => (
                <Card key={q.id} className="shadow-elev border-border/60">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-display font-semibold">{q.title}</div>
                      {q.description && <div className="text-sm text-muted-foreground mt-0.5">{q.description}</div>}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2"><Clock className="h-3 w-3" />{q.duration_minutes} min</div>
                    </div>
                    <Button size="sm" onClick={() => nav(`/student/quizzes/${q.id}`)} className="bg-grad-primary">Take quiz</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="font-display font-semibold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" /> Your history</h2>
          {attempts.length === 0 ? <EmptyState icon={Trophy} title="No attempts yet" /> : (
            <div className="space-y-3">
              {attempts.map((a) => (
                <Card key={a.id} className="shadow-sm border-border/60">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.quizzes?.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                    <Badge className="bg-primary/15 text-primary border-0">{a.score}/{a.total}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Quizzes;
