import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import RoleRedirect from "./pages/RoleRedirect";
import PickRole from "./pages/onboarding/PickRole";
import StudentOnboarding from "./pages/onboarding/StudentOnboarding";
import CoordinatorOnboarding from "./pages/onboarding/CoordinatorOnboarding";
import NotFound from "./pages/NotFound";

// Student
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";

import ATS from "./pages/student/ATS";
import StudentJobs from "./pages/student/Jobs";
import StudentApplications from "./pages/student/Applications";
import StudentQuizzes from "./pages/student/Quizzes";
import QuizTake from "./pages/student/QuizTake";

// Coordinator
import CoordDashboard from "./pages/coord/Dashboard";
import CoordStudents from "./pages/coord/Students";
import CoordJobs from "./pages/coord/Jobs";
import CoordApplications from "./pages/coord/Applications";
import CoordQuizzes from "./pages/coord/Quizzes";
import CoordAnnouncements from "./pages/coord/Announcements";
import CoordAnalytics from "./pages/coord/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/redirect" element={<RoleRedirect />} />

            <Route path="/onboarding" element={<ProtectedRoute><PickRole /></ProtectedRoute>} />
            <Route path="/onboarding/student" element={<ProtectedRoute requireRole="student"><StudentOnboarding /></ProtectedRoute>} />
            <Route path="/onboarding/coordinator" element={<ProtectedRoute requireRole="coordinator"><CoordinatorOnboarding /></ProtectedRoute>} />

            <Route path="/student" element={<ProtectedRoute requireRole="student"><AppShell variant="student" /></ProtectedRoute>}>
              <Route index element={<StudentDashboard />} />
              <Route path="profile" element={<StudentProfile />} />
              
              <Route path="ats" element={<ATS />} />
              <Route path="jobs" element={<StudentJobs />} />
              <Route path="applications" element={<StudentApplications />} />
              <Route path="quizzes" element={<StudentQuizzes />} />
              <Route path="quizzes/:id" element={<QuizTake />} />
            </Route>

            <Route path="/coordinator" element={<ProtectedRoute requireRole="coordinator"><AppShell variant="coordinator" /></ProtectedRoute>}>
              <Route index element={<CoordDashboard />} />
              <Route path="students" element={<CoordStudents />} />
              <Route path="jobs" element={<CoordJobs />} />
              <Route path="applications" element={<CoordApplications />} />
              <Route path="quizzes" element={<CoordQuizzes />} />
              <Route path="announcements" element={<CoordAnnouncements />} />
              <Route path="analytics" element={<CoordAnalytics />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
