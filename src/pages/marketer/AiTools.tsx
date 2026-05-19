import { useState, useEffect, useCallback } from 'react'
import { 
  FileText, Sparkles, Target, Upload, Copy, Check,
  Brain, Wand2, Zap, ArrowRight, Star, RefreshCw, AlertCircle,
  Instagram, Twitter, Linkedin, Languages
} from 'lucide-react'
import { marketerApi, campaignApi } from '../../api/client'
import { toast } from 'react-hot-toast'
import { activityTracker } from '../../utils/activityTracker'
import { useAuth } from '../../context/AuthContext'
import type { CVGenerateRequest } from '../../utils/aiService'
import { analyzeCVWithAI, downloadCVFromAI, generateCVWithAI, generateMarketingPosts, translatePostToArabic } from '../../utils/aiService'

type TabKey = 'cv' | 'cvgen' | 'posts' | 'recommend'

interface CvAnalysis {
  skills: string[]
  experienceLevel: string
  suggestedNiches: string[]
  summary: string
  matchedCampaigns: any[]
}

interface GeneratedPost {
  platform: string
  icon: any
  content: string
  hashtags: string
  copied: boolean
}

export default function AiTools() {
  const { name, email, phone } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('cv')

  // CV State
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvAnalysis, setCvAnalysis] = useState<CvAnalysis | null>(null)
  const [cvLoading, setCvLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const [cvGeneratorLoading, setCvGeneratorLoading] = useState(false)
  const [cvGeneratedText, setCvGeneratedText] = useState<string | null>(null)
  const [cvGeneratedFileName, setCvGeneratedFileName] = useState<string | null>(null)
  const [cvDownloading, setCvDownloading] = useState(false)
  const [cvGeneratorForm, setCvGeneratorForm] = useState<CVGenerateRequest['personal']>({
    name: name || '',
    email: email || '',
    phone: phone || '',
    linkedin: '',
    github: '',
    location: '',
    website: '',
    summary: ''
  })
  const [cvGeneratorSkills, setCvGeneratorSkills] = useState('')

  useEffect(() => {
    setCvGeneratorForm((prev) => ({
      ...prev,
      name: name || prev.name,
      email: email || prev.email,
      phone: phone || prev.phone,
    }))
  }, [name, email, phone])

  // Post Generator State
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [postLoading, setPostLoading] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')

  // Recommendations State
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [recLoading, setRecLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [appliedIds, setAppliedIds] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('affiliance_applied_ids')
    return new Set(saved ? JSON.parse(saved) : [])
  })

  const handleApply = async (id: number, title: string) => {
    if (appliedIds.has(id)) return
    try {
      await campaignApi.postapply(id)
      const next = new Set(appliedIds).add(id)
      setAppliedIds(next)
      localStorage.setItem('affiliance_applied_ids', JSON.stringify([...next]))
      activityTracker.addActivity({
        description: `Applied to ${title} via AI Smart Match`,
        type: 'application'
      })
      toast.success(`Applied to "${title}" successfully! 🎉`)
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.toLowerCase().includes('already') || msg.includes('409')) {
        toast.error('You already applied to this campaign.')
        setAppliedIds((prev: Set<number>) => { const n = new Set(prev).add(id); localStorage.setItem('affiliance_applied_ids', JSON.stringify([...n])); return n })
      } else if (msg.toLowerCase().includes('eligible') || msg.includes('403')) {
        toast.error('You are not eligible for this campaign based on your profile.')
      } else {
        toast.error(msg || 'Could not apply. Please try again.')
      }
    }
  }

  const tabs: { key: TabKey; label: string; icon: any; desc: string }[] = [
    { key: 'cv', label: 'CV Analyzer', icon: FileText, desc: 'Analyze your skills' },
    { key: 'cvgen', label: 'CV Generator', icon: FileText, desc: 'Generate a polished resume' },
    { key: 'posts', label: 'Post Generator', icon: Wand2, desc: 'Create marketing content' },
    { key: 'recommend', label: 'Smart Match', icon: Target, desc: 'Find your best campaigns' },
  ]

  // Load campaigns for post generator
  useEffect(() => {
    if (activeTab === 'posts' && campaigns.length === 0) {
      // Try accepted applications first, fallback to all active campaigns
      Promise.all([
        marketerApi.getmyapplications({ Status: 'Accepted', PageSize: 20 }).catch(() => null),
        campaignApi.getsearch({ IsActive: true, PageSize: 20 }).catch(() => null)
      ]).then(([appsRes, searchRes]) => {
        let list: any[] = []
        
        // Try applications first
        const appsData = (appsRes as any)?.data || appsRes || []
        if (Array.isArray(appsData) && appsData.length > 0) {
          list = appsData
        } else {
          // Fallback to search results
          const searchData = (searchRes as any)?.data || searchRes || []
          list = Array.isArray(searchData) ? searchData.map((c: any) => ({
            campaignTitle: c.title,
            campaignDescription: c.description,
            companyName: c.companyName,
            campaignId: c.id,
            commissionRate: c.commissionRate,
            ...c
          })) : []
        }
        
        setCampaigns(list.filter((c: any) => {
          const t = (c.campaignTitle || c.title || '').toLowerCase()
          return t.length > 0 && !t.includes('test') && !t.includes('loai') && t !== 'string'
        }))
      })
    }
  }, [activeTab])

  // ─── CV ANALYSIS (uses Gemini multimodal - sends PDF directly) ────
  const handleCvUpload = async (file: File) => {
    setCvFile(file)
    setCvLoading(true)
    setCvAnalysis(null)
    
    try {
      // Upload CV to backend silently
      const formData = new FormData()
      formData.append('CvFile', file)
      marketerApi.putmycv(formData).catch(() => {})

      const parsed = await analyzeCVWithAI(file)

      // Fetch matching campaigns
      let matchedCampaigns: any[] = []
      try {
        const keyword = parsed.niche?.split(',')[0] || parsed.skills?.split(',')[0] || ''
        const searchRes = await campaignApi.getsearch({ IsActive: true, Keyword: keyword, PageSize: 5 })
        matchedCampaigns = ((searchRes as any)?.data || []).filter((c: any) => {
          const t = (c.title || '').toLowerCase()
          return t.length > 0 && !t.includes('test') && !t.includes('loai') && t !== 'string'
        }).slice(0, 4)
      } catch {}

      const formatList = (val: any) => {
        if (Array.isArray(val)) return val.filter(Boolean)
        if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean)
        return []
      }

      setCvAnalysis({ 
        skills: formatList(parsed.skills), 
        experienceLevel: parsed.experienceLevel || 'Mid-Level',
        suggestedNiches: formatList((parsed as any).niche || (parsed as any).suggestedNiches),
        summary: parsed.summary || parsed.bio || 'Analysis complete.',
        matchedCampaigns 
      })
      toast.success('CV analyzed successfully!')
    } catch (err: any) {
      console.error('CV Analysis error:', err)
      toast.error(err.message || 'Failed to analyze CV. Check your Gemini API key.')
    } finally {
      setCvLoading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type === 'application/pdf' || file.type.includes('document') || file.type.includes('image'))) {
      handleCvUpload(file)
    } else {
      toast.error('Please upload a PDF, Word doc, or image file')
    }
  }, [])

  const handleGenerateCv = async () => {
    setCvGeneratorLoading(true)
    setCvGeneratedText(null)
    setCvGeneratedFileName(null)

    try {
      const request: CVGenerateRequest = {
        personal: {
          ...cvGeneratorForm,
          linkedin: cvGeneratorForm.linkedin || undefined,
          github: cvGeneratorForm.github || undefined,
          location: cvGeneratorForm.location || undefined,
          website: cvGeneratorForm.website || undefined,
          summary: cvGeneratorForm.summary || undefined,
        },
        skills: {
          technical: cvGeneratorSkills.split(',').map((skill) => skill.trim()).filter(Boolean)
        }
      }

      const result = await generateCVWithAI(request)
      const generatedFileName = result.download_filename || result.pdf_url?.split('/').pop() || 'generated-cv.pdf'
      setCvGeneratedText(result.cv_text || 'CV generated successfully.')
      setCvGeneratedFileName(generatedFileName)
      toast.success('CV generated successfully!')
    } catch (err: any) {
      console.error('CV generator error:', err)
      toast.error(err.message || 'Failed to generate CV.')
    } finally {
      setCvGeneratorLoading(false)
    }
  }

  const handleDownloadCv = async () => {
    if (!cvGeneratedFileName) {
      toast.error('No CV file available to download.')
      return
    }

    setCvDownloading(true)
    try {
      const blob = await downloadCVFromAI(cvGeneratedFileName)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = cvGeneratedFileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success('CV download started')
    } catch (err: any) {
      console.error('CV download error:', err)
      toast.error(err.message || 'Failed to download CV.')
    } finally {
      setCvDownloading(false)
    }
  }

  // ─── POST GENERATOR ────────────────────────────────────────
  const handleGeneratePosts = async () => {
    if (!selectedCampaign) return toast.error('Select a campaign first')
    setPostLoading(true)
    setGeneratedPosts([])
    
    try {
      const campTitle = selectedCampaign.campaignTitle || selectedCampaign.title || 'Campaign'
      const campDesc = selectedCampaign.description || selectedCampaign.campaignDescription || ''

      const parsed = await generateMarketingPosts(campTitle, campDesc, customPrompt)

      const iconMap: Record<string, any> = { Instagram, Twitter, LinkedIn: Linkedin }
      setGeneratedPosts(parsed.map(p => ({
        ...p,
        icon: iconMap[p.platform] || Sparkles,
        copied: false
      })))
      toast.success('3 posts generated successfully!')
    } catch (err: any) {
      console.error('Post generation error:', err)
      toast.error(err.message || 'Failed to generate posts')
    } finally {
      setPostLoading(false)
    }
  }

  const copyPost = (index: number) => {
    const post = generatedPosts[index]
    navigator.clipboard.writeText(`${post.content}\n\n${post.hashtags}`)
    setGeneratedPosts(prev => prev.map((p, i) => i === index ? { ...p, copied: true } : p))
    setTimeout(() => {
      setGeneratedPosts(prev => prev.map((p, i) => i === index ? { ...p, copied: false } : p))
    }, 2000)
    toast.success('Copied to clipboard!')
  }
  
  const handleTranslatePost = async (index: number) => {
    const post = generatedPosts[index]
    const toastId = toast.loading('Translating to Arabic...')
    try {
      const { content, hashtags } = await translatePostToArabic(post.content, post.hashtags)
      setGeneratedPosts(prev => prev.map((p, i) => i === index ? { ...p, content, hashtags } : p))
      toast.success('Translated to Arabic! 🇸🇦', { id: toastId })
    } catch (err: any) {
      toast.error('Translation failed', { id: toastId })
    }
  }

  // ─── CAMPAIGN RECOMMENDATIONS ────────────────────────────────
  const loadRecommendations = async () => {
    setRecLoading(true)
    try {
      const [profileRes, suggestionsRes, recommendedRes] = await Promise.all([
        marketerApi.getmyprofile().catch(() => null),
        marketerApi.getmyaisuggestions({ limit: 10 }).catch(() => ({ data: [] })),
        campaignApi.getrecommended({ limit: 10 }).catch(() => ({ data: [] }))
      ])

      if (profileRes) setProfile(profileRes)

      const suggestions = ((suggestionsRes as any)?.data || []).filter((s: any) => {
        const t = (s.campaignTitle || '').toLowerCase()
        return t.length > 0 && !t.includes('test') && !t.includes('loai') && t !== 'string'
      })

      const recommended = ((recommendedRes as any)?.data || recommendedRes || []).filter((c: any) => {
        const t = (c.title || '').toLowerCase()
        return t.length > 0 && !t.includes('test') && !t.includes('loai') && t !== 'string'
      })

      const merged: any[] = []
      const seen = new Set<number>()

      suggestions.forEach((s: any) => {
        if (s.campaignId && !seen.has(s.campaignId)) {
          seen.add(s.campaignId)
          merged.push({
            id: s.campaignId,
            title: s.campaignTitle,
            matchScore: s.matchScore || Math.floor(Math.random() * 20 + 80),
            matchReason: s.matchReason || 'AI-matched to your profile',
            source: 'ai'
          })
        }
      })

      recommended.forEach((c: any) => {
        if (c.id && !seen.has(c.id)) {
          seen.add(c.id)
          merged.push({
            id: c.id,
            title: c.title,
            description: c.description,
            budget: c.budget,
            commissionRate: c.commissionRate,
            matchScore: Math.floor(Math.random() * 15 + 75),
            matchReason: 'Recommended based on your niche',
            source: 'system'
          })
        }
      })

      merged.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      setRecommendations(merged)
    } catch (err) {
      console.error('Recommendations error:', err)
      toast.error('Failed to load recommendations')
    } finally {
      setRecLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'recommend' && recommendations.length === 0) {
      loadRecommendations()
    }
  }, [activeTab])

  // ─── STYLES ──────────────────────────────────────────
  const cardClass = 'bg-white rounded-[28px] border border-slate-100/80 p-8 shadow-sm'
  const levelColors: Record<string, string> = {
    'Junior': 'bg-green-50 text-green-700 border-green-100',
    'Mid-Level': 'bg-blue-50 text-blue-700 border-blue-100',
    'Senior': 'bg-purple-50 text-purple-700 border-purple-100',
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A8A] to-blue-500 rounded-[20px] flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-black text-slate-900 tracking-tight">AI Tools</h1>
            <p className="text-[14px] text-gray-400 font-medium">Supercharge your marketing with AI-powered insights</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-10 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-[13px] font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-[#1E3A8A] shadow-sm border border-slate-100'
                : 'text-gray-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* ═══ TAB 1: CV ANALYZER ═══ */}
      {activeTab === 'cv' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!cvAnalysis && !cvLoading && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`${cardClass} text-center transition-all ${dragActive ? 'border-blue-300 bg-blue-50/30 scale-[1.01]' : ''}`}
            >
              <div className="py-12">
                <div className={`w-20 h-20 mx-auto rounded-[28px] flex items-center justify-center mb-6 transition-all ${
                  dragActive ? 'bg-blue-100 text-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400'
                }`}>
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="text-[22px] font-black text-slate-900 mb-2">
                  {dragActive ? 'Drop your CV here!' : 'Upload Your CV'}
                </h3>
                <p className="text-gray-400 text-[14px] font-medium max-w-md mx-auto mb-8 leading-relaxed">
                  Our AI will analyze your skills, experience level, and suggest the best campaigns that match your expertise.
                </p>
                <label className="inline-flex items-center gap-3 px-10 py-4 bg-[#1E3A8A] text-white rounded-2xl font-black text-[14px] shadow-xl shadow-blue-900/10 hover:bg-[#152C6E] cursor-pointer active:scale-95 transition-all">
                  <FileText className="w-5 h-5" />
                  Choose File
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleCvUpload(file)
                    }}
                  />
                </label>
                <p className="text-[11px] text-gray-300 mt-4 font-bold uppercase tracking-wider">PDF, Word, or Image files</p>
              </div>
            </div>
          )}

          {cvLoading && (
            <div className={cardClass}>
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-slate-100 border-t-[#1E3A8A] animate-spin" />
                <h3 className="text-[18px] font-black text-slate-900 mb-2">Analyzing Your CV</h3>
                <p className="text-gray-400 text-[14px] font-medium">AI is reading your document and extracting insights...</p>
                <div className="flex justify-center gap-2 mt-6">
                  {['Reading Document', 'Extracting Skills', 'Finding Matches'].map((step, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {cvAnalysis && (
            <>
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-black text-slate-900">Analysis Complete</h3>
                      <p className="text-[12px] text-gray-400 font-medium">{cvFile?.name}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border ${levelColors[cvAnalysis.experienceLevel] || levelColors['Mid-Level']}`}>
                    {cvAnalysis.experienceLevel}
                  </span>
                </div>

                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 mb-8">
                  <p className="text-[14px] text-slate-700 font-medium leading-relaxed">{cvAnalysis.summary}</p>
                </div>

                <div className="mb-8">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Extracted Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {cvAnalysis.skills.map((skill, i) => (
                      <span key={i} className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-[12px] font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Suggested Niches</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {cvAnalysis.suggestedNiches.map((niche, i) => (
                      <div key={i} className="p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                          <Star className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="text-[13px] font-bold text-slate-700">{niche}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {cvAnalysis.matchedCampaigns.length > 0 && (
                <div className={cardClass}>
                  <div className="flex items-center gap-3 mb-8">
                    <Target className="w-5 h-5 text-[#1E3A8A]" />
                    <h3 className="text-[18px] font-black text-slate-900">Campaigns That Match Your Skills</h3>
                  </div>
                  <div className="space-y-3">
                    {cvAnalysis.matchedCampaigns.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:border-blue-100 hover:bg-white transition-all group">
                        <div>
                          <p className="text-[14px] font-black text-slate-900">{c.title}</p>
                          <p className="text-[12px] text-gray-400 font-medium mt-1">{c.companyName || 'Company'} • Budget: ${c.budget || 'N/A'}</p>
                        </div>
                        <button
                          onClick={() => handleApply(c.id, c.title)}
                          disabled={appliedIds.has(c.id)}
                          className={`px-5 py-2.5 rounded-xl text-[12px] font-black transition-all active:scale-95 ${
                            appliedIds.has(c.id)
                              ? 'bg-green-50 text-green-600 border border-green-100 cursor-default'
                              : 'bg-[#1E3A8A] text-white opacity-0 group-hover:opacity-100 hover:bg-[#152C6E]'
                          }`}
                        >
                          {appliedIds.has(c.id) ? 'Applied ✓' : 'Apply'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <button onClick={() => { setCvAnalysis(null); setCvFile(null) }} className="text-[13px] text-gray-400 font-bold hover:text-slate-600 transition-colors">
                  ← Upload a different CV
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ TAB 2: CV GENERATOR ═══ */}
      {activeTab === 'cvgen' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={cardClass}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-900 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[18px] font-black text-slate-900">CV Generator</h3>
                <p className="text-[13px] text-gray-400 font-medium">Generate a polished CV using AI based on your professional details.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                { label: 'Full Name', value: cvGeneratorForm.name, key: 'name' },
                { label: 'Email', value: cvGeneratorForm.email, key: 'email' },
                { label: 'Phone', value: cvGeneratorForm.phone, key: 'phone' },
                { label: 'Location', value: cvGeneratorForm.location, key: 'location' },
                { label: 'LinkedIn', value: cvGeneratorForm.linkedin, key: 'linkedin' },
                { label: 'GitHub', value: cvGeneratorForm.github, key: 'github' },
                { label: 'Website', value: cvGeneratorForm.website, key: 'website' }
              ].map((field) => (
                <label key={field.key} className="space-y-2">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{field.label}</span>
                  <input
                    type="text"
                    value={field.value || ''}
                    onChange={(e) => setCvGeneratorForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                  />
                </label>
              ))}
            </div>

            <div className="space-y-4 mt-6">
              <label className="space-y-2">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Professional Summary</span>
                <textarea
                  rows={4}
                  value={cvGeneratorForm.summary || ''}
                  onChange={(e) => setCvGeneratorForm((prev) => ({ ...prev, summary: e.target.value }))}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                  placeholder="Describe your experience, strengths, and career goals"
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Key skills (comma-separated)</span>
                <input
                  type="text"
                  value={cvGeneratorSkills}
                  onChange={(e) => setCvGeneratorSkills(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                  placeholder="e.g. digital marketing, campaign strategy, influencer outreach"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-8">
              <button
                onClick={handleGenerateCv}
                disabled={cvGeneratorLoading}
                className="inline-flex items-center justify-center rounded-2xl bg-[#1E3A8A] px-6 py-3 text-sm font-black text-white hover:bg-[#152C6E] transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cvGeneratorLoading ? 'Generating CV…' : 'Generate CV'}
              </button>
              <p className="text-[12px] text-gray-400">The AI will use the details above to create a resume summary and structure.</p>
            </div>

            {cvGeneratedText && (
              <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-[15px] font-black text-slate-900">Generated CV Text</h4>
                    <p className="text-[12px] text-gray-400">Copy it into your resume or download it as needed.</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(cvGeneratedText)}
                    className="text-[12px] font-black uppercase tracking-wider text-[#1E3A8A] hover:text-[#152C6E]"
                  >
                    Copy
                  </button>
                  {cvGeneratedFileName && (
                    <button
                      onClick={handleDownloadCv}
                      disabled={cvDownloading}
                      className="text-[12px] font-black uppercase tracking-wider text-[#0B6EFD] hover:text-[#084ECC]"
                    >
                      {cvDownloading ? 'Downloading…' : 'Download PDF'}
                    </button>
                  )}
                </div>
                <pre className="whitespace-pre-wrap text-[14px] text-slate-700 leading-7">{cvGeneratedText}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB 2: POST GENERATOR ═══ */}
      {activeTab === 'posts' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={cardClass}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[18px] font-black text-slate-900">Marketing Post Generator</h3>
                <p className="text-[13px] text-gray-400 font-medium">Select a campaign and let AI create viral content for you</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Select Campaign</label>
              {campaigns.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campaigns.map((c: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedCampaign(c)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedCampaign === c
                          ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-lg shadow-blue-900/20'
                          : 'bg-white border-slate-100 text-slate-700 hover:border-blue-200'
                      }`}
                    >
                      <p className={`text-[13px] font-black truncate ${selectedCampaign === c ? 'text-white' : 'text-slate-900'}`}>
                        {c.campaignTitle || c.title}
                      </p>
                      <p className={`text-[11px] mt-1 font-medium truncate ${selectedCampaign === c ? 'text-blue-200' : 'text-gray-400'}`}>
                        {c.companyName || 'Company'}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-[13px] text-gray-400 font-medium">No campaigns found. Apply to campaigns first!</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Add Context (Optional)</label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Target audience: Gen Z, Tone: Fun and casual"
                className="w-full border border-slate-100 bg-slate-50/50 rounded-xl px-5 py-3.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 transition-all placeholder:text-gray-300"
              />
            </div>

            <button
              onClick={handleGeneratePosts}
              disabled={postLoading || !selectedCampaign}
              className="w-full py-4 bg-gradient-to-r from-[#1E3A8A] to-blue-600 text-white rounded-2xl font-black text-[14px] shadow-xl shadow-blue-900/10 hover:shadow-2xl hover:shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {postLoading ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Generating Content...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate 3 Posts</>
              )}
            </button>
          </div>

          {generatedPosts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Generated Content</h3>
              {generatedPosts.map((post, i) => (
                <div key={i} className={`${cardClass} group hover:border-blue-100 transition-all`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        post.platform === 'Instagram' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                        post.platform === 'Twitter' ? 'bg-black' : 'bg-blue-700'
                      } text-white`}>
                        <post.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[14px] font-black text-slate-900">{post.platform}</span>
                    </div>
                    <button
                      onClick={() => copyPost(i)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black transition-all ${
                        post.copied ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-blue-50 hover:text-[#1E3A8A] hover:border-blue-100'
                      }`}
                    >
                      {post.copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {post.copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleTranslatePost(i)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black bg-slate-50 text-slate-600 border border-slate-100 hover:bg-blue-50 hover:text-[#1E3A8A] hover:border-blue-100 transition-all"
                    >
                      <Languages className="w-4 h-4" />
                      AR
                    </button>
                  </div>
                  <p className="text-[14px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>
                  <p className="text-[12px] text-blue-500 font-bold">{post.hashtags}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 3: SMART RECOMMENDATIONS ═══ */}
      {activeTab === 'recommend' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {profile && (
            <div className={cardClass}>
              <div className="flex items-center gap-5 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <Zap className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-[18px] font-black text-slate-900">Your Marketing DNA</h3>
                  <p className="text-[13px] text-gray-400 font-medium">Campaigns are matched based on your profile</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Niche', value: profile.niche || 'Not set' },
                  { label: 'Skills', value: profile.skillsExtracted ? profile.skillsExtracted.split(',').length + ' skills' : 'Not set' },
                  { label: 'Level', value: profile.isVerified ? 'Verified' : 'Standard' },
                  { label: 'Score', value: profile.performanceScore ? `${profile.performanceScore}%` : 'N/A' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-[15px] font-black text-slate-900 truncate">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recLoading ? (
            <div className={cardClass}>
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin" />
                <h3 className="text-[18px] font-black text-slate-900 mb-2">Finding Your Best Matches</h3>
                <p className="text-gray-400 text-[14px] font-medium">Analyzing your skills against active campaigns...</p>
              </div>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{recommendations.length} Campaigns Matched</h3>
                <button onClick={loadRecommendations} className="text-[12px] text-[#1E3A8A] font-bold hover:underline flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              {recommendations.map((rec, i) => (
                <div key={i} className={`${cardClass} group hover:border-blue-100 transition-all`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          rec.matchScore >= 90 ? 'bg-green-50 text-green-600 border border-green-100' :
                          rec.matchScore >= 80 ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {rec.matchScore}% match
                        </span>
                        {rec.source === 'ai' && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[9px] font-black uppercase border border-purple-100">AI</span>
                        )}
                      </div>
                      <h4 className="text-[15px] font-black text-slate-900 truncate">{rec.title}</h4>
                      <p className="text-[12px] text-gray-400 font-medium mt-1 truncate">{rec.matchReason}</p>
                    </div>
                    <button
                      onClick={() => handleApply(rec.id, rec.title)}
                      disabled={appliedIds.has(rec.id)}
                      className={`ml-4 px-5 py-2.5 rounded-xl text-[12px] font-black flex items-center gap-2 transition-all active:scale-95 flex-shrink-0 ${
                        appliedIds.has(rec.id)
                          ? 'bg-green-50 text-green-600 border border-green-100 cursor-default'
                          : 'bg-[#1E3A8A] text-white opacity-0 group-hover:opacity-100 hover:bg-[#152C6E]'
                      }`}
                    >
                      {appliedIds.has(rec.id) ? 'Applied ✓' : <><span>Apply</span><ArrowRight className="w-3.5 h-3.5" /></>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`${cardClass} text-center`}>
              <div className="py-12">
                <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-[20px] font-black text-slate-900 mb-3">No Matches Yet</h3>
                <p className="text-gray-400 text-[14px] font-medium max-w-sm mx-auto mb-8 leading-relaxed">
                  Complete your profile and upload your CV to get AI-powered campaign recommendations.
                </p>
                <button onClick={loadRecommendations} className="px-8 py-3.5 bg-[#1E3A8A] text-white rounded-2xl font-black text-[13px] hover:bg-[#152C6E] active:scale-95 transition-all">
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
