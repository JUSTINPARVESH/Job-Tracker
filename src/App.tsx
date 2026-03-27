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
    color: 'text-blue-600', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    icon: Clock,
    suggestion: "Wait 3-5 days, then follow up with HR.",
    reminder: "Follow up in 3 days"
  },
  Interview: { 
    color: 'text-orange-600', 
    bg: 'bg-orange-50', 
    border: 'border-orange-200', 
    icon: Users,
    suggestion: "Prepare for technical and HR questions.",
    reminder: "Review company values"
  },
  Rejected: { 
    color: 'text-red-600', 
    bg: 'bg-red-50', 
    border: 'border-red-200', 
    icon: XCircle,
    suggestion: "Analyze gaps and apply for similar roles.",
    reminder: "Update your portfolio"
  },
  Selected: { 
    color: 'text-green-600', 
    bg: 'bg-green-50', 
    border: 'border-green-200', 
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
    
    // Extract Skills
    const foundSkills = SKILLS_DB.filter(skill => jdLower.includes(skill.toLowerCase()));
    const resumeSkills = SKILLS_DB.filter(skill => resumeLower.includes(skill.toLowerCase()));
    
    // Experience Level
    let exp = 'Fresher';
    if (jdLower.includes('senior') || jdLower.includes('5+ years') || jdLower.includes('lead')) exp = 'Senior (5+ years)';
    else if (jdLower.includes('mid') || jdLower.includes('3-5 years')) exp = 'Mid-level (3-5 years)';
    else if (jdLower.includes('junior') || jdLower.includes('1-3 years')) exp = 'Junior (1-3 years)';

    // Job Type
    let type = 'Full Stack';
    const foundTypes = JOB_TYPES.filter(t => jdLower.includes(t.toLowerCase()));
    if (foundTypes.length > 0) type = foundTypes[0];

    // Match Percentage (Realistic 60-85% range)
    const missingSkills = foundSkills.filter(s => !resumeSkills.includes(s));
    let matchPercentage = 0;
    if (foundSkills.length > 0) {
      const baseMatch = (foundSkills.length - missingSkills.length) / foundSkills.length;
      // Map 0-1 match to 60-85% range
      matchPercentage = Math.round(60 + (baseMatch * 25));
    } else {
      matchPercentage = resume.length > 50 ? 60 : 0; 
    }

    // Suggestions
    let suggestion = "You are a good fit!";
    if (matchPercentage < 65) suggestion = "Low match. Try tailoring your resume for this role.";
    else if (matchPercentage < 80) suggestion = `Average match. Consider adding ${missingSkills.slice(0, 2).join(' and ')} to your resume.`;

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
      id: crypto.randomUUID(),
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
    <div className="min-h-screen bg-[#f4f4f4] font-sans text-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-2"
          >
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-xl shadow-indigo-100">
              <Zap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Smart AI Job Tracker <span className="text-indigo-600">Pro</span>
            </h1>
          </motion.div>
          <p className="text-slate-500 font-medium text-lg">Your intelligent assistant for career growth</p>
        </header>

        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 p-10 mb-12"
        >
          <form onSubmit={handleAddJob} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Basic Information
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 ml-1">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Google"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 ml-1">Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Frontend Developer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 ml-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Status)}
                        className="px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Selected">Selected</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 ml-1">Job Portal</label>
                      <input
                        type="text"
                        placeholder="e.g. LinkedIn"
                        value={portal}
                        onChange={(e) => setPortal(e.target.value)}
                        className="px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 ml-1">Company Website</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="text"
                        placeholder="https://company.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis Inputs */}
              <div className="space-y-6">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Analysis Inputs
                </h2>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 ml-1">Job Description</label>
                  <textarea
                    placeholder="Paste the job description here for AI analysis..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium h-32 resize-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 ml-1">Resume (PDF/DOC/TXT)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group"
                  >
                    <FileText className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-sm font-bold text-slate-500">
                      {resumeName || 'Click to upload resume'}
                    </span>
                    {resumeName ? (
                      <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Resume uploaded successfully ✅</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">No file selected</p>
                    )}
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

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-2xl shadow-indigo-200 active:scale-[0.99] text-lg"
            >
              <Plus className="w-6 h-6" />
              Analyze & Add Application
            </button>
          </form>
        </motion.section>

        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-3 text-slate-400">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-black uppercase tracking-widest">Filter</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['All', 'Applied', 'Interview', 'Rejected', 'Selected'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as FilterStatus)}
                className={`px-6 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap border-2 ${
                  filter === s 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {filteredJobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 bg-white/40 rounded-[3rem] border-4 border-dashed border-white"
              >
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-100">
                  <Briefcase className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold text-xl italic">
                  No applications yet. Start tracking your job journey 🚀
                </p>
              </motion.div>
            ) : (
              filteredJobs.map((job) => {
                const config = STATUS_CONFIG[job.status];
                const StatusIcon = config.icon;
                const matchColor = job.analysis.matchPercentage >= 80 ? 'text-green-500' : job.analysis.matchPercentage >= 65 ? 'text-yellow-500' : 'text-red-500';
                const matchBg = job.analysis.matchPercentage >= 80 ? 'bg-green-50' : job.analysis.matchPercentage >= 65 ? 'bg-yellow-50' : 'bg-red-50';
                
                return (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group"
                  >
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className={`p-5 rounded-[1.5rem] ${config.bg} ${config.color} shadow-inner transition-transform duration-300 group-hover:scale-105`}>
                            <StatusIcon className="w-8 h-8" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1.5">
                              <h3 className="font-black text-2xl text-slate-800 leading-tight">{job.company}</h3>
                              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border h-6 ${config.bg} ${config.color} ${config.border}`}>
                                {job.status}
                              </span>
                            </div>
                            <p className="text-slate-500 font-bold text-lg">{job.role}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> {job.date}
                              </span>
                              <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5" /> {job.portal || 'Direct'}
                              </span>
                              {job.website && (
                                <a 
                                  href={job.website.startsWith('http') ? job.website : `https://${job.website}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 hover:underline decoration-indigo-200 underline-offset-4 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> WEBSITE
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className={`flex flex-col items-center px-6 py-3 rounded-2xl ${matchBg} ${matchColor} border border-current/10`}>
                            <span className="text-2xl font-black">{job.analysis.matchPercentage}%</span>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Match</span>
                          </div>
                          <button
                            onClick={() => toggleDetails(job.id)}
                            className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                          >
                            {job.showDetails ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                          </button>
                          <button
                            onClick={() => deleteJob(job.id)}
                            className="p-4 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {job.showDetails && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-8 pt-8 border-t border-slate-100 overflow-hidden"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* AI Analysis Section */}
                              <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> AI Analysis Result
                                  </h4>
                                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${job.analysis.isLegit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {job.analysis.isLegit ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                    {job.analysis.isLegit ? 'Verified' : 'Suspicious'}
                                  </div>
                                </div>

                                <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                                  <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-indigo-400 mt-0.5" />
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                      "{job.analysis.summary}"
                                    </p>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Experience</p>
                                      <p className="text-sm font-black text-slate-700">{job.analysis.experience}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Job Type</p>
                                      <p className="text-sm font-black text-slate-700">{job.analysis.jobType}</p>
                                    </div>
                                  </div>

                                  {!job.analysis.isLegit && (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
                                      <AlertCircle className="w-5 h-5" />
                                      <p className="text-xs font-bold">Warning: {job.analysis.legitReason}. Verify before applying.</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Resume Match Section */}
                              <div className="space-y-6">
                                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                                  <Target className="w-4 h-4" /> Resume Match & Skills
                                </h4>
                                
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Required Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                      {job.analysis.skills.map(skill => (
                                        <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">
                                          {skill}
                                        </span>
                                      ))}
                                      {job.analysis.skills.length === 0 && <span className="text-xs text-slate-400 italic">No specific skills detected</span>}
                                    </div>
                                  </div>

                                  {job.analysis.missingSkills.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2 ml-1">Missing from Resume</p>
                                      <div className="flex flex-wrap gap-2">
                                        {job.analysis.missingSkills.map(skill => (
                                          <span key={skill} className="px-3 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-bold border border-red-100">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="bg-indigo-600 text-white p-6 rounded-[1.5rem] shadow-lg shadow-indigo-100 relative overflow-hidden">
                                    <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12" />
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">AI Suggestion</p>
                                    <p className="text-sm font-bold leading-relaxed relative z-10">
                                      {job.analysis.suggestion}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5 opacity-70" />
                                      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Reminder: {config.reminder}</span>
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
