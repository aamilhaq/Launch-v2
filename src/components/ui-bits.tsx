import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export const PageHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-up">
    <div>
      <h1 className="text-3xl font-display font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-1.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const StatCard = ({ label, value, icon: Icon, accent = "primary" }: { label: string; value: ReactNode; icon: any; accent?: "primary" | "accent" | "warning" }) => (
  <Card className="bg-grad-card shadow-elev border-border/60">
    <CardContent className="p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white ${accent === "accent" ? "bg-grad-accent" : accent === "warning" ? "bg-warning" : "bg-grad-primary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-display font-bold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1.5">{label}</div>
      </div>
    </CardContent>
  </Card>
);

export const EmptyState = ({ icon: Icon, title, hint, action }: { icon: any; title: string; hint?: string; action?: ReactNode }) => (
  <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-xl bg-card/50">
    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="font-display font-semibold text-lg">{title}</h3>
    {hint && <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{hint}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
