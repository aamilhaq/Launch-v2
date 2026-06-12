import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import {
  Rocket, Sparkles, FileSearch, Target, Briefcase, GraduationCap,
  TrendingUp, Users, Building2, BarChart3, ShieldCheck, ArrowRight, CheckCircle2, Star,
} from "lucide-react";

const features = [
  { icon: FileSearch, title: "AI Resume Parsing", desc: "Upload your PDF — Launch extracts your skills, projects, and education in seconds." },
  { icon: Target, title: "ATS Score Checker", desc: "Match your resume against any job description and get instant, actionable feedback." },
  { icon: Briefcase, title: "Smart Job Matching", desc: "Eligibility engine compares CGPA, department, and skills before you apply." },
  { icon: GraduationCap, title: "Practice Quizzes", desc: "Sharpen aptitude and tech skills with coordinator-curated quiz sets." },
  { icon: BarChart3, title: "Placement Analytics", desc: "Coordinators see real-time placement rates, hiring trends, and department insights." },
  { icon: ShieldCheck, title: "Secure & Role-Based", desc: "Row-level security keeps student data private while giving PCs the controls they need." },
];

const stats = [
  { value: "12,000+", label: "Students placed" },
  { value: "850+", label: "Hiring partners" },
  { value: "96%", label: "Placement rate" },
  { value: "4.9/5", label: "User rating" },
];

const testimonials = [
  { name: "Aarav Mehta", role: "CSE, Class of 2025", quote: "Launch's ATS checker rewrote my resume strategy. I went from 0 callbacks to 6 in two weeks." },
  { name: "Dr. Priya Nair", role: "Placement Officer, BITS", quote: "We cut application-tracking overhead by 70%. The analytics dashboard is genuinely beautiful." },
  { name: "Karthik Rao", role: "ECE, Class of 2024", quote: "The eligibility engine saved me from wasting time on jobs I'd never qualify for." },
];

const faqs = [
  { q: "Is Launch free for students?", a: "Yes — students get full access including AI resume parsing, ATS checks, and unlimited applications." },
  { q: "How does the ATS checker work?", a: "We compare your resume against any job description using AI, scoring 0-100 and listing matching/missing skills with concrete recommendations." },
  { q: "Can coordinators bulk-upload quiz questions?", a: "Yes — upload a CSV of questions, options, and correct answers. Launch handles the rest." },
  { q: "Is my data secure?", a: "All resumes and personal data are protected by row-level security. Only you and authorized placement coordinators can see your profile." },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo className="h-7" />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#stats" className="text-muted-foreground hover:text-foreground">Impact</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground">Students</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-grad-primary shadow-elev">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-hero pt-32 pb-24">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered placement management
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.05] tracking-tight">
              Where careers <span className="text-gradient">launch</span> — not stall.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              The placement portal built for the AI era. Parse resumes, score against jobs, track applications, and manage your entire placement cycle in one beautifully crafted dashboard.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup"><Button size="lg" className="bg-grad-primary shadow-elev-lg h-12 px-7"><Rocket className="h-4 w-4 mr-2" /> Start free as a student</Button></Link>
              <Link to="/signup"><Button size="lg" variant="outline" className="h-12 px-7">I'm a coordinator <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Free for students</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> SOC-grade security</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-16 border-y border-border/60 bg-card">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
              <div className="text-4xl md:text-5xl font-display font-bold text-gradient">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Features</div>
            <h2 className="text-4xl md:text-5xl font-display font-bold">Everything placements need, finally in one place.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full bg-grad-card shadow-elev hover:shadow-elev-lg transition-shadow border-border/60">
                  <CardContent className="p-6">
                    <div className="h-11 w-11 rounded-xl bg-grad-primary text-primary-foreground flex items-center justify-center mb-4 shadow-glow">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 bg-muted/40">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Loved by campuses</div>
            <h2 className="text-4xl md:text-5xl font-display font-bold">A different kind of placement portal.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-card shadow-elev border-border/60">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4 text-warning">
                    {[...Array(5)].map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">"{t.quote}"</p>
                  <div className="mt-5 pt-4 border-t border-border/60">
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <div className="text-sm font-medium text-primary uppercase tracking-wider mb-3">FAQ</div>
            <h2 className="text-4xl md:text-5xl font-display font-bold">Questions, answered.</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`q${i}`} className="border border-border/60 rounded-xl px-5 bg-card shadow-sm">
                <AccordionTrigger className="font-display text-base hover:no-underline py-5">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="bg-grad-primary rounded-3xl p-12 md:p-16 text-center shadow-elev-lg relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white, transparent 40%), radial-gradient(circle at 80% 80%, white, transparent 40%)" }} />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground">Ready to launch your career?</h2>
              <p className="text-primary-foreground/80 mt-4 max-w-xl mx-auto">Join thousands of students and placement teams using Launch to make placements actually work.</p>
              <Link to="/signup" className="inline-block mt-8"><Button size="lg" variant="secondary" className="h-12 px-8">Create your free account <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo className="h-6" />
          <div>© {new Date().getFullYear()} Launch. Built for ambitious campuses.</div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
