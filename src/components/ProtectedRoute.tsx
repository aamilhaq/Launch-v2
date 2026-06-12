import { Navigate, useLocation } from "react-router-dom";
import { useAuth, Role } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children, requireRole }: { children: React.ReactNode; requireRole?: Role }) => {
  const { user, role, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (requireRole && role !== requireRole) {
    if (!role) return <Navigate to="/onboarding" replace />;
    return <Navigate to={role === "student" ? "/student" : "/coordinator"} replace />;
  }
  return <>{children}</>;
};
