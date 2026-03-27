/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { 
  Trash2, Plus, Briefcase, CheckCircle2, Clock, XCircle, Users, 
  Sparkles, Filter, Calendar, Info, Globe, ShieldCheck, ShieldAlert,
  FileText, Zap, Target, AlertCircle, ChevronDown, ChevronUp, ExternalLink,
  Moon, Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Status = 'Applied' | 'Interview' | 'Rejected' | 'Selected';
type FilterStatus = 'All' | Status;

interface AIAnalysis {
  skills: string[];
  experience: string;
  jobType: string;
  summary: string;
  matchPercentage: number;
  missingSkills: string[];
  suggestion: string;
  isLegit: boolean;
  legitReason: string;
}

interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: Status;
  date: string;
  portal: string;
  website: string;
  description: string;
  resumeName: string;
  analysis: AIAnalysis;
  showDetails?: boolean;
}

const SKILLS_DB = [
  'React', 'JavaScript', 'TypeScript', 'Python', 'Node', 'Java', 'C++', 'SQL', 
  'AWS', 'Docker', 'Kubernetes', 'Figma', 'Tailwind', 'CSS', 'HTML', 'Angular',
  'Vue', 'Next.js', 'Express', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL'
];

const JOB_TYPES = ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps', 'Data Science', 'UI/UX'];
const EXP_LEVELS = ['Fresher', 'Junior (1-3 years)', 'Mid-level (3-5 years)', 'Senior (5+ years)', 'Lead'];

const STATUS_CONFIG = {
  Applied: { 
    color: 'text-indigo-600 dark:text-indigo-400', 
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', 
    border: 'border-indigo-100 dark:border-indigo-500/20', 
    icon: Clock,
    suggestion: "Wait 3-5 days, then follow up with HR.",
    reminder: "Follow up in 3 days"
  },
  Interview: { 
    color: 'text-amber-600 dark:text-amber-400', 
    bg: 'bg-amber-500/10 dark:bg-amber-500/20', 
    border: 'border-amber-100 dark:border-amber-500/20', 
    icon: Users,
    suggestion: "Prepare for technical and HR questions.",
    reminder: "Review company values"
  },
  Rejected: { 
    color: 'text-rose-600 dark:text-rose-400', 
    bg: 'bg-rose-500/10 dark:bg-rose-500/20', 
    border: 'border-rose-100 dark:border-rose-500/20', 
    icon: XCircle,
    suggestion: "Analyze gaps and apply for similar roles.",
    reminder: "Update your portfolio"
  },
  Selected: { 
    color: 'text-emerald-600 dark:text-emerald-400', 
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', 
    border: 'border-emerald-100 dark:border-emerald-500/20', 
    icon: CheckCircle2,
    suggestion: "Prepare documents and onboarding steps.",
    reminder: "Check your email for offer details"
  },
};

export default function App() {
  const [jobs, setJobs] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem('pro-job-tracker-apps');
    return saved ? JSON.parse(saved) : [];
  });

  // Form States
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<Status>('Applied');
  const [portal, setPortal] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeName, setResumeName] = useState('');
  
  const [filter, setFilter] = useState<FilterStatus>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pro-job-tracker-theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });

  useEffect(() => {
    localStorage.setItem('pro-job-tracker-apps', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pro-job-tracker-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pro-job-tracker-theme', 'light');
    }
  }, [darkMode]);

  const validateWebsite = (url: string) => {
    if (!url) return { isLegit: true, reason: "No website provided" };
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const isHttps = parsed.protocol === 'https:';
      const hasSuspiciousChars = /[0-9]{5,}|-.*-.*-/.test(parsed.hostname);
      const isCommonSpam = /free|gift|win|prize|click/.test(parsed.hostname.toLowerCase());
      
      if (!isHttps) return { isLegit: false, reason: "Insecure connection (HTTP)" };
      if (hasSuspiciousChars || isCommonSpam) return { isLegit: false, reason: "Suspicious domain pattern" };
      
      return { isLegit: true, reason: "Domain appears legitimate" };
    } catch {
      return { isLegit: false, reason: "Invalid URL format" };
    }
  };

  const analyzeJob = (jd: string, resume: string) => {
    const jdLower = jd.toLowerCase();
    const resumeLower = resume.toLowerCase();
    
    // Robust Skill Extraction
    const extractSkills = (text: string) => {
      return SKILLS_DB.filter(skill => {
        // Use word boundaries to avoid Java matching JavaScript, etc.
        // For special chars like C++, we stick to basic includes but with word surrounding
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const hasSpecial = /[+#.]/.test(skill);
        
        if (hasSpecial) {
           return text.toLowerCase().includes(skill.toLowerCase());
        }
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(text);
      });
    };

    const foundSkills = extractSkills(jdLower);
    const resumeSkills = extractSkills(resumeLower);
    
    // Experience Level
    let exp = EXP_LEVELS[0]; // Fresher
    if (jdLower.includes('senior') || jdLower.includes('5+ years') || jdLower.includes('lead')) exp = EXP_LEVELS[3];
    else if (jdLower.includes('mid') || jdLower.includes('3-5 years')) exp = EXP_LEVELS[2];
    else if (jdLower.includes('junior') || jdLower.includes('1-3 years')) exp = EXP_LEVELS[1];

    // Job Type
    let type = 'Full Stack';
    const foundTypes = JOB_TYPES.filter(t => jdLower.includes(t.toLowerCase()));
    if (foundTypes.length > 0) type = foundTypes[0];

    // Match Percentage (Realistic 60-85% range)
    const missingSkills = foundSkills.filter(s => !resumeSkills.includes(s));
    let matchPercentage = 0;
    if (foundSkills.length > 0) {
      const baseMatch = (foundSkills.length - missingSkills.length) / foundSkills.length;
      // Map 0-1 match to 65-98% range for realistic feel
      matchPercentage = Math.round(65 + (baseMatch * 33));
    } else {
      matchPercentage = resume.length > 50 ? 60 : 0; 
    }

    // Suggestions
    let suggestion = "You are a great fit for this role!";
    if (matchPercentage < 65) suggestion = "Low match. Highlighting missing core skills and tailoring your experience section could improve your odds.";
    else if (matchPercentage < 80) {
      const skillsToMention = missingSkills.slice(0, 2);
      suggestion = skillsToMention.length > 0
        ? `Average match. Consider mentioning ${skillsToMention.join(' and ')} in your summary or experience section.`
        : "Average match. Consider adding more detail to your company-specific impact on the resume.";
    }

    const summary = `This is a ${type} position at ${company || 'the company'} requiring ${foundSkills.slice(0, 3).join(', ')} skills.`;

    return {
      skills: foundSkills,
      experience: exp,
      jobType: type,
      summary,
      matchPercentage,
      missingSkills,
      suggestion,
    };
  };

  const handleAddJob = (e: FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    const { isLegit, reason } = validateWebsite(website);
    const analysisData = analyzeJob(description, resumeText);

    const newJob: JobApplication = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 9),
      company: company.trim(),
      role: role.trim(),
      status,
      date: new Date().toLocaleDateString(),
      portal,
      website,
      description,
      resumeName: resumeName || 'No resume uploaded',
      analysis: {
        ...analysisData,
        isLegit,
        legitReason: reason
      },
      showDetails: false
    };

    setJobs([newJob, ...jobs]);
    
    // Reset Form
    setCompany('');
    setRole('');
    setStatus('Applied');
    setPortal('');
    setWebsite('');
    setDescription('');
    setResumeText('');
    setResumeName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeText(event.target?.result as string || '');
      };
      reader.readAsText(file);
    } else {
      setResumeName('');
      setResumeText('');
    }
  };

  const deleteJob = (id: string) => {
    setJobs(jobs.filter(job => job.id !== id));
  };

  const toggleDetails = (id: string) => {
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, showDetails: !job.showDetails } : job
    ));
  };

  const filteredJobs = filter === 'All' 
    ? jobs 
    : jobs.filter(job => job.status === filter);

  return (
    <div className="min-h-screen pt-12 pb-24 px-4 md:px-8 selection:bg-indigo-500/30 selection:text-white relative transition-colors duration-400">
      {/* Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/15 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] bg-cyan-500/10 dark:bg-cyan-500/15 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <div className="max-w-5xl mx-auto">
        <nav className="flex justify-end mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)}
            className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-xl shadow-xl text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all"
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </motion.button>
        </nav>

        <header className="text-center mb-20 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center p-5 mb-8 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] animate-float"
          >
            <Zap className="w-12 h-12 text-indigo-500 dark:text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 leading-tight"
          >
            Smart AI <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400">Job Tracker</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 font-medium text-xl leading-relaxed max-w-2xl mx-auto"
          >
            Precision tracking and AI-powered strategy for your next career move.
          </motion.p>
        </header>

        <motion.section
          layout
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[3rem] p-8 md:p-12 mb-20 relative overflow-hidden group"
        >
          {/* Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <form onSubmit={handleAddJob} className="space-y-12 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-base font-black uppercase tracking-widest text-indigo-400">Application Info</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Venture / Company</label>
                    <input
                      type="text"
                      placeholder="e.g. OpenAI"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="px-6 py-4 bg-[var(--input-bg)] border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Target Role</label>
                    <input
                      type="text"
                      placeholder="e.g. LLM Research Engineer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="px-6 py-4 bg-[var(--input-bg)] border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Pipeline Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Status)}
                        className="px-6 py-4 bg-[var(--input-bg)] border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 dark:text-white cursor-pointer shadow-inner"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Selected">Selected</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Sourced From</label>
                      <input
                        type="text"
                        placeholder="Wellfound"
                        value={portal}
                        onChange={(e) => setPortal(e.target.value)}
                        className="px-6 py-4 bg-[var(--input-bg)] border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Company Nexus (URL)</label>
                    <div className="relative group">
                      <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="text"
                        placeholder="openai.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-[var(--input-bg)] border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h2 className="text-base font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Intelligence Matrix</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Job Description Core</label>
                    <textarea
                      placeholder="Input full JD for matching engine..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="px-6 py-5 bg-[var(--input-bg)] border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 dark:text-white h-44 resize-none text-sm leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Resume Payload</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-black/10 dark:border-white/5 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 bg-[var(--input-bg)] hover:bg-black/5 dark:hover:bg-white/5 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white/60 dark:bg-slate-800 border border-black/5 dark:border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-500">
                        <FileText className="w-7 h-7 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-black text-slate-700 dark:text-slate-200 mb-1">
                          {resumeName || 'Upload Resume Context'}
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                          {resumeName ? 'Payload Active ✅' : 'Analyze PDF/TXT profiles'}
                        </p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept=".pdf,.doc,.docx,.txt"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white font-black py-6 rounded-[2rem] transition-all shadow-[0_20px_40px_-15px_rgba(79,70,229,0.4)] active:scale-[0.98] text-xl"
            >
              <Zap className="w-7 h-7 stroke-[3px]" />
              Initialize Engine
            </button>
          </form>
        </motion.section>

        {/* Status Hub */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-16 px-4">
          <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 px-6 py-3 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-md">
            <Filter className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Tracking Hub</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar w-full sm:w-auto p-1">
            {['All', 'Applied', 'Interview', 'Rejected', 'Selected'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as FilterStatus)}
                className={`px-7 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap border-2 ${
                  filter === s 
                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' 
                    : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-500 hover:text-indigo-600 dark:hover:text-slate-300 hover:border-black/10 dark:hover:border-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          <AnimatePresence mode="popLayout">
            {filteredJobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-32 glass rounded-[4rem] border-2 border-dashed border-white/5 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                <div className="relative z-10">
                  <div className="bg-slate-200 dark:bg-slate-800/60 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(99,102,241,0.15)] ring-1 ring-black/5 dark:ring-white/10">
                    <Briefcase className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-slate-900 dark:text-white font-black text-3xl mb-3 tracking-tighter">Deck is Empty</h3>
                  <p className="text-slate-500 dark:text-slate-500 font-bold max-w-sm mx-auto px-6">
                    {filter === 'All' 
                      ? "Ready to scale? Initialize your first career thread above." 
                      : `No active signals for "${filter}" detected.`}
                  </p>
                </div>
              </motion.div>
            ) : (
              filteredJobs.map((job) => {
                const config = STATUS_CONFIG[job.status];
                const StatusIcon = config.icon;
                const matchColor = job.analysis.matchPercentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' : job.analysis.matchPercentage >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
                const matchBg = job.analysis.matchPercentage >= 80 ? 'bg-emerald-500/10' : job.analysis.matchPercentage >= 70 ? 'bg-amber-500/10' : 'bg-rose-500/10';
                const matchBorder = job.analysis.matchPercentage >= 80 ? 'border-emerald-500/20' : job.analysis.matchPercentage >= 70 ? 'border-amber-500/20' : 'border-rose-500/20';
                
                return (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group"
                  >
                    <div className="glass rounded-[3rem] p-8 md:p-10 shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10 border-white/5 ring-1 ring-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
                        <div className="flex items-start lg:items-center gap-8">
                          <div className={`p-6 rounded-[2rem] ${config.bg} ${config.color} border border-black/5 dark:border-white/5 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                            <StatusIcon className="w-10 h-10 stroke-[2px]" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-4 mb-3">
                              <h3 className="font-black text-3xl text-slate-900 dark:text-white tracking-tight">{job.company}</h3>
                              <span className={`inline-flex items-center justify-center px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-2xl ${config.bg} ${config.color} border-black/5 dark:border-white/10`}>
                                {job.status}
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-xl mb-6 tracking-tight">{job.role}</p>
                            <div className="flex flex-wrap items-center gap-6">
                              <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-2xl">
                                <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> {job.date}
                              </span>
                              <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-2xl">
                                <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> {job.portal || 'Direct'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 self-end lg:self-auto">
                          <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-[2.5rem] ${matchBg} ${matchColor} border-2 ${matchBorder} shadow-[0_0_30px_rgba(0,0,0,0.2)] group-hover:shadow-indigo-500/20 transition-all duration-500 relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            <span className="text-4xl font-black relative z-10">{job.analysis.matchPercentage}%</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 relative z-10">Score</span>
                          </div>
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => toggleDetails(job.id)}
                              className="p-5 bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl transition-all border border-black/5 dark:border-white/10 shadow-xl"
                            >
                              {job.showDetails ? <ChevronUp className="w-7 h-7 stroke-[3px]" /> : <ChevronDown className="w-7 h-7 stroke-[3px]" />}
                            </button>
                            <button
                              onClick={() => deleteJob(job.id)}
                              className="p-5 bg-rose-500/5 text-rose-500/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
                            >
                              <Trash2 className="w-7 h-7" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {job.showDetails && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-12 overflow-hidden"
                          >
                            <div className="pt-12 border-t-2 border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-12 relative">
                              <div className="space-y-10">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 flex items-center gap-3">
                                    <Sparkles className="w-5 h-5" /> Intelligence Synthesis
                                  </h4>
                                  <div className={`flex items-center gap-3 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${job.analysis.isLegit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                    {job.analysis.isLegit ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                    {job.analysis.isLegit ? 'Authentic' : 'Warning'}
                                  </div>
                                </div>

                                  <div className="space-y-6">
                                    <div className="p-8 bg-black/5 dark:bg-white/5 rounded-[2.5rem] border border-black/5 dark:border-white/5 relative overflow-hidden">
                                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                                      <p className="text-slate-600 dark:text-slate-300 font-bold leading-relaxed italic text-lg">
                                        “{job.analysis.summary}”
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                      <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-inner">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Seniority</p>
                                        <p className="text-lg font-black text-slate-700 dark:text-slate-200">{job.analysis.experience}</p>
                                      </div>
                                      <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-inner">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Format</p>
                                        <p className="text-lg font-black text-slate-700 dark:text-slate-200">{job.analysis.jobType}</p>
                                      </div>
                                    </div>

                                    {job.description && (
                                      <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-2xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-3">
                                          <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Preserved Context
                                        </p>
                                        <div className="max-h-40 overflow-y-auto pr-3 custom-scrollbar">
                                          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                                            {job.description}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                              </div>

                              <div className="space-y-10">
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 flex items-center gap-3">
                                  <Target className="w-5 h-5" /> Competency Matrix
                                </h4>
                                
                                <div className="space-y-8">
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 ml-1">Target Skillsets</p>
                                    <div className="flex flex-wrap gap-3">
                                      {job.analysis.skills.map(skill => (
                                        <span key={skill} className="px-5 py-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-2xl text-[12px] font-black border border-indigo-500/20 shadow-xl transition-all hover:bg-indigo-500 hover:text-white">
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {job.analysis.missingSkills.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 mb-4 ml-1">Critical Deficits</p>
                                      <div className="flex flex-wrap gap-3">
                                        {job.analysis.missingSkills.map(skill => (
                                          <span key={skill} className="px-5 py-2.5 bg-rose-500/10 text-rose-400 rounded-2xl text-[12px] font-black border border-rose-500/20">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-slate-900 text-white p-10 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(79,70,229,0.5)] relative overflow-hidden group/card ring-1 ring-white/20">
                                    <Sparkles className="absolute -right-10 -bottom-10 w-48 h-48 text-white/10 rotate-12 group-hover/card:rotate-45 transition-transform duration-1000" />
                                    <div className="relative z-10">
                                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-4">Strategic Recommendation</p>
                                      <p className="text-xl font-bold leading-tight mb-8">
                                        {job.analysis.suggestion}
                                      </p>
                                      <div className="flex items-center gap-4 bg-white/10 px-5 py-4 rounded-2xl border border-white/10 backdrop-blur-md">
                                        <Clock className="w-6 h-6 text-indigo-300" />
                                        <div className="flex flex-col">
                                          <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Follow-up Ritual</span>
                                          <span className="text-xs font-black text-white">{config.reminder}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
