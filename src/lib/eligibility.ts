// Strict eligibility: CGPA, department, and ALL required skills must be satisfied.

export type EligibilityResult = {
  eligible: boolean;
  reasons: string[];
  matchedSkills: string[];
  missingSkills: string[];
  skillMatchPct: number; // 0-100
};

const norm = (s: string) => s.trim().toLowerCase();

export function evaluateEligibility(job: any, profile: any): EligibilityResult {
  const reasons: string[] = [];
  const required: string[] = Array.isArray(job?.required_skills) ? job.required_skills.filter(Boolean) : [];
  const have = new Set(((profile?.skills as string[]) || []).map(norm));
  const matchedSkills = required.filter((s) => have.has(norm(s)));
  const missingSkills = required.filter((s) => !have.has(norm(s)));
  const skillMatchPct = required.length === 0 ? 100 : Math.round((matchedSkills.length / required.length) * 100);

  if (!profile) {
    return { eligible: false, reasons: ["Complete your profile first."], matchedSkills, missingSkills, skillMatchPct };
  }

  if (job?.min_cgpa != null && Number(job.min_cgpa) > 0) {
    const cg = Number(profile.cgpa ?? 0);
    if (!profile.cgpa || cg < Number(job.min_cgpa)) {
      reasons.push(`Minimum CGPA requirement not met (need ≥ ${job.min_cgpa}).`);
    }
  }

  if (Array.isArray(job?.eligible_departments) && job.eligible_departments.length > 0) {
    if (!profile.department || !job.eligible_departments.includes(profile.department)) {
      reasons.push("Your department is not eligible.");
    }
  }

  if (missingSkills.length > 0) {
    reasons.push(`Missing required skills: ${missingSkills.join(", ")}.`);
  }

  return { eligible: reasons.length === 0, reasons, matchedSkills, missingSkills, skillMatchPct };
}

// Match score: blends skill match with ATS score and a small bonus for extra/certification skills.
export function computeMatchScore(opts: {
  skillMatchPct: number;
  atsScore?: number | null;
  extraSkillsCount?: number;
}): number {
  const ats = typeof opts.atsScore === "number" ? opts.atsScore : null;
  const extras = Math.min(opts.extraSkillsCount ?? 0, 10);
  const bonus = extras * 0.5; // up to +5
  const base = ats != null ? opts.skillMatchPct * 0.6 + ats * 0.4 : opts.skillMatchPct;
  return Math.max(0, Math.min(100, Math.round(base + bonus)));
}
