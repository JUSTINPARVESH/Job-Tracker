/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { 
  Trash2, Plus, Briefcase, CheckCircle2, Clock, XCircle, Users, 
  Sparkles, Filter, Calendar, Info, Globe, ShieldCheck, ShieldAlert,
  FileText, Zap, Target, AlertCircle, ChevronDown, ChevronUp, ExternalLink
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
    color: 'text-indigo-600', 
    bg: 'bg-indigo-500/10', 
    border: 'border-indigo-100', 
    icon: Clock,
    suggestion: "Wait 3-5 days, then follow up with HR.",
    reminder: "Follow up in 3 days"
  },
  Interview: { 
    color: 'text-amber-600', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-100', 
    icon: Users,
    suggestion: "Prepare for technical and HR questions.",
    reminder: "Review company values"
  },
  Rejected: { 
    color: 'text-rose-600', 
    bg: 'bg-rose-500/10', 
    border: 'border-rose-100', 
    icon: XCircle,
    suggestion: "Analyze gaps and apply for similar roles.",
    reminder: "Update your portfolio"
  },
  Selected: { 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-100', 
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

  useEffect(() => {
    localStorage.setItem('pro-job-tracker-apps', JSON.stringify(jobs));
  }, [jobs]);

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
    <div className="min-h-screen pt-12 pb-24 px-4 md:px-8 selection:bg-indigo-500/30 relative">
      {/* Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] bg-cyan-500/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center p-4 mb-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-sm animate-float"
          >
            <Zap className="w-10 h-10 text-indigo-500 drop-shadow-sm" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 mb-4 leading-tight"
          >
            Smart AI <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">Job Tracker</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl mx-auto"
          >
            Precision tracking and AI-powered strategy for your next career move.
          </motion.p>
        </header>

        <motion.section
          layout
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[2rem] p-6 md:p-10 mb-12 relative overflow-hidden group shadow-md"
        >
          {/* Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <form onSubmit={handleAddJob} className="space-y-10 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-indigo-500">Application Info</h2>
                </div>
                
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Venture / Company</label>
                    <input
                      type="text"
                      placeholder="e.g. OpenAI"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="px-5 py-3.5 bg-[var(--input-bg)] border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Role</label>
                    <input
                      type="text"
                      placeholder="e.g. LLM Research Engineer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="px-5 py-3.5 bg-[var(--input-bg)] border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Pipeline Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Status)}
                        className="px-5 py-3.5 bg-[var(--input-bg)] border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 cursor-pointer"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Selected">Selected</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sourced From</label>
                      <input
                        type="text"
                        placeholder="Wellfound"
                        value={portal}
                        onChange={(e) => setPortal(e.target.value)}
                        className="px-5 py-3.5 bg-[var(--input-bg)] border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Company Nexus (URL)</label>
                    <div className="relative group">
                      <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="openai.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full pl-12 pr-5 py-3.5 bg-[var(--input-bg)] border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-cyan-600" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-cyan-600">Intelligence Matrix</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Job Description Core</label>
                    <textarea
                      placeholder="Input full JD for matching engine..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="px-5 py-4 bg-[var(--input-bg)] border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-bold text-slate-900 h-40 resize-none text-sm leading-relaxed placeholder:text-slate-400"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Resume Payload</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-black/10 rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-[var(--input-bg)] hover:bg-black/5 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-black/5 flex items-center justify-center group-hover:scale-105 transition-all">
                        <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-black text-slate-700 mb-1">
                          {resumeName || 'Upload Resume Context'}
                        </span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
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
              className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-md active:scale-[0.98] text-lg lg:text-xl"
            >
              <Zap className="w-6 h-6 stroke-[3px]" />
              Initialize Engine
            </button>
          </form>
        </motion.section>

        {/* Status Hub */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 px-4">
          <div className="flex items-center gap-3 bg-black/5 px-5 py-2.5 rounded-xl border border-black/5 backdrop-blur-md">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tracking Hub</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full sm:w-auto p-1">
            {['All', 'Applied', 'Interview', 'Rejected', 'Selected'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as FilterStatus)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap border-2 ${
                  filter === s 
                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm' 
                    : 'bg-black/5 border-black/5 text-slate-500 hover:text-indigo-600 hover:border-black/10'
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
                  <div className="bg-slate-200 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm ring-1 ring-black/5">
                    <Briefcase className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-slate-900 font-black text-2xl mb-2 tracking-tighter">Deck is Empty</h3>
                  <p className="text-slate-500 font-bold max-w-sm mx-auto px-6">
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
                const matchColor = job.analysis.matchPercentage >= 80 ? 'text-emerald-600' : job.analysis.matchPercentage >= 70 ? 'text-amber-600' : 'text-rose-600';
                const matchBg = job.analysis.matchPercentage >= 80 ? 'bg-emerald-500/10' : job.analysis.matchPercentage >= 70 ? 'bg-amber-500/10' : 'bg-rose-500/10';
                const matchBorder = job.analysis.matchPercentage >= 80 ? 'border-emerald-500/10' : job.analysis.matchPercentage >= 70 ? 'border-amber-500/10' : 'border-rose-500/10';
                
                return (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="group"
                  >
                    <div className="glass rounded-[2rem] p-6 md:p-8 shadow-md transition-all duration-300 hover:shadow-lg border-white/10 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-6 text-center sm:text-left">
                          <div className={`p-5 rounded-2xl ${config.bg} ${config.color} border border-black/5 shadow-sm group-hover:scale-105 transition-all duration-500`}>
                            <StatusIcon className="w-8 h-8 stroke-[2px]" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                              {job.website ? (
                                <a 
                                  href={job.website.startsWith('http') ? job.website : `https://${job.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group/link flex items-center gap-2 hover:text-indigo-600 transition-colors"
                                >
                                  <h3 className="font-black text-2xl text-slate-900 tracking-tight group-hover/link:text-indigo-600 transition-colors">{job.company}</h3>
                                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover/link:text-indigo-600 transition-colors" />
                                </a>
                              ) : (
                                <h3 className="font-black text-2xl text-slate-900 tracking-tight">{job.company}</h3>
                              )}
                              <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${config.bg} ${config.color} border-black/5`}>
                                {job.status}
                              </span>
                            </div>
                            <p className="text-slate-500 font-bold text-lg mb-4 tracking-tight">{job.role}</p>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                              <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-xl">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {job.date}
                              </span>
                              <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-xl">
                                <Globe className="w-3.5 h-3.5 text-cyan-600" /> {job.portal || 'Direct'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center sm:justify-end gap-5">
                          <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl ${matchBg} ${matchColor} border ${matchBorder} shadow-sm group-hover:shadow-md transition-all duration-500 relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                            <span className="text-3xl font-black relative z-10">{job.analysis.matchPercentage}%</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-60 relative z-10">Score</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => toggleDetails(job.id)}
                              className="p-4 bg-black/5 text-slate-500 hover:text-indigo-600 hover:bg-black/10 rounded-xl transition-all border border-black/5 shadow-sm"
                            >
                              {job.showDetails ? <ChevronUp className="w-6 h-6 stroke-[3px]" /> : <ChevronDown className="w-6 h-6 stroke-[3px]" />}
                            </button>
                            <button
                              onClick={() => deleteJob(job.id)}
                              className="p-4 bg-rose-500/5 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent shadow-sm"
                            >
                              <Trash2 className="w-6 h-6" />
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
                            className="mt-8 overflow-hidden"
                          >
                            <div className="pt-8 border-t border-black/5 grid grid-cols-1 lg:grid-cols-2 gap-10 relative">
                              <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Intelligence Synthesis
                                  </h4>
                                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${job.analysis.isLegit ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-600 border border-rose-500/10'}`}>
                                    {job.analysis.isLegit ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                    {job.analysis.isLegit ? 'Authentic' : 'Warning'}
                                  </div>
                                </div>

                                  <div className="space-y-4">
                                    <div className="p-6 bg-black/[0.02] rounded-2xl border border-black/5 relative overflow-hidden">
                                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                                      <p className="text-slate-600 font-bold leading-relaxed italic text-base">
                                        “{job.analysis.summary}”
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-black/[0.02] p-4 rounded-xl border border-black/5 shadow-sm">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Seniority</p>
                                        <p className="text-base font-black text-slate-700">{job.analysis.experience}</p>
                                      </div>
                                      <div className="bg-black/[0.02] p-4 rounded-xl border border-black/5 shadow-sm">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Format</p>
                                        <p className="text-base font-black text-slate-700">{job.analysis.jobType}</p>
                                      </div>
                                    </div>

                                    {job.description && (
                                      <div className="bg-black/[0.02] p-6 rounded-2xl border border-black/5 shadow-sm">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                          <FileText className="w-3.5 h-3.5 text-indigo-500" /> Preserved Context
                                        </p>
                                        <div className="max-h-36 overflow-y-auto pr-2 custom-scrollbar">
                                          <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap font-medium">
                                            {job.description}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                              </div>

                              <div className="space-y-8">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                                  <Target className="w-4 h-4" /> Competency Matrix
                                </h4>
                                
                                <div className="space-y-6">
                                  <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Target Skillsets</p>
                                    <div className="flex flex-wrap gap-2">
                                      {job.analysis.skills.map(skill => (
                                        <span key={skill} className="px-4 py-2 bg-indigo-500/5 text-indigo-600 rounded-xl text-[11px] font-black border border-indigo-500/10 shadow-sm transition-all hover:bg-indigo-500 hover:text-white">
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {job.analysis.missingSkills.length > 0 && (
                                    <div>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-500/60 mb-3 ml-1">Critical Deficits</p>
                                      <div className="flex flex-wrap gap-2">
                                        {job.analysis.missingSkills.map(skill => (
                                          <span key={skill} className="px-4 py-2 bg-rose-500/5 text-rose-600 rounded-xl text-[11px] font-black border border-rose-500/10">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 rounded-2xl shadow-md relative overflow-hidden group/card">
                                    <Sparkles className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 rotate-12 group-hover/card:rotate-45 transition-transform duration-1000" />
                                    <div className="relative z-10">
                                      <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-3">Strategic Recommendation</p>
                                      <p className="text-lg font-bold leading-tight mb-6">
                                        {job.analysis.suggestion}
                                      </p>
                                      <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl border border-white/10 backdrop-blur-md">
                                        <Clock className="w-5 h-5 text-indigo-100" />
                                        <div className="flex flex-col">
                                          <span className="text-[7px] font-black uppercase tracking-widest opacity-60">Follow-up Ritual</span>
                                          <span className="text-[10px] font-black text-white">{config.reminder}</span>
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
