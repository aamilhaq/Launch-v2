import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, Target, Briefcase, GraduationCap,
  BarChart3, Megaphone, Users, ClipboardList, LogOut, BellRing, UserCircle,
} from "lucide-react";

const studentNav = [
  { to: "/student", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/student/profile", icon: UserCircle, label: "Profile" },
  { to: "/student/ats", icon: Target, label: "ATS Checker" },
  { to: "/student/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/student/applications", icon: ClipboardList, label: "Applications" },
  { to: "/student/quizzes", icon: GraduationCap, label: "Quizzes" },
];

const coordNav = [
  { to: "/coordinator", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/coordinator/students", icon: Users, label: "Students" },
  { to: "/coordinator/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/coordinator/applications", icon: ClipboardList, label: "Applications" },
  { to: "/coordinator/quizzes", icon: GraduationCap, label: "Quizzes" },
  { to: "/coordinator/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/coordinator/analytics", icon: BarChart3, label: "Analytics" },
];

export const AppShell = ({ variant }: { variant: "student" | "coordinator" }) => {
  const { signOut, user } = useAuth();
  const nav = useNavigate();
  const items = variant === "student" ? studentNav : coordNav;

  return (
    <div className="min-h-screen flex w-full bg-muted/40">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-5 border-b border-sidebar-border">
          <Logo className="h-7" />
          <div className="mt-3 text-xs uppercase tracking-wider text-sidebar-foreground/60">
            {variant === "student" ? "Student Portal" : "Coordinator"}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={(it as any).end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow" : "hover:bg-sidebar-accent text-sidebar-foreground"
                }`
              }
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 text-xs text-sidebar-foreground/60 truncate">{user?.email}</div>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={async () => { await signOut(); nav("/"); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 bg-sidebar text-sidebar-foreground flex items-center justify-between px-4">
          <Logo className="h-6" />
          <Button variant="ghost" size="icon" onClick={async () => { await signOut(); nav("/"); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
