import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Phone, Lock, Building2, Globe, Tag, Upload, Eye, EyeOff, MapPin, Shield, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { verifyNationalIDWithAI, type IDVerificationResult } from '../utils/aiService'
import { toast } from 'react-hot-toast'

import signupImg from "../assets/signup.jpg"

type AccountType = 'marketer' | 'company' | null

export default function Signup() {
  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState<AccountType>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    address: '',
    website: '',
    taxId: '',
    niche: '',
    industry: '',
  })
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [cvFileName, setCvFileName] = useState('')
  const [isAnalyzingID, setIsAnalyzingID] = useState(false)
  const [idAnalysis, setIdAnalysis] = useState<IDVerificationResult | null>(null)
  const [isAnalyzingCV, setIsAnalyzingCV] = useState(false)
  const [cvAnalysis, setCvAnalysis] = useState<any | null>(null)

  const cvRef = useRef<HTMLInputElement>(null)
  const nationalIdRef = useRef<HTMLInputElement>(null)
  const commercialRegisterRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  
  const { registerMarketer, registerCompany } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (accountType === 'marketer') {
        const nationalIdFile = nationalIdRef.current?.files?.[0]
        const cvFile = cvRef.current?.files?.[0]
        
        if (!nationalIdFile) {
          setError('Please upload your National ID for verification')
          setLoading(false)
          return
        }

        // Check ID Verification Result
        if (idAnalysis && !idAnalysis.isValid) {
          setError(`National ID Issue: ${idAnalysis.message}`)
          setLoading(false)
          return
        }

        const detectedIdName = (idAnalysis?.name || '').trim().toLowerCase().replace(/\s+/g, ' ')
        const detectedCvName = (cvAnalysis?.fullName || '').trim().toLowerCase().replace(/\s+/g, ' ')
        
        // 1. Check ID Readability and Name Match
        if (idAnalysis && idAnalysis.isValid) {
          const isUnreadable = 
            !detectedIdName || 
            detectedIdName === 'not readable' || 
            !idAnalysis.idNumber || 
            idAnalysis.idNumber.toLowerCase() === 'not readable'

          if (isUnreadable) {
            setError('ID Verification Failed: The photo is not clear enough to read your name or ID number. Please upload a high-resolution, clear photo of your ID.')
            setLoading(false)
            return
          }

          // Check if entered name is contained in or matches ID name
          const idNameParts = detectedIdName.split(' ')
          const fName = form.firstName.trim().toLowerCase()
          const lName = form.lastName.trim().toLowerCase()

          const hasFirstName = idNameParts.includes(fName)
          const hasLastName = idNameParts.includes(lName)

          if (!hasFirstName || !hasLastName) {
            setError(`Name Mismatch! Your form name (${form.firstName} ${form.lastName}) must match the name on your ID: "${idAnalysis.name}"`)
            setLoading(false)
            return
          }
        } else if (idAnalysis && !idAnalysis.isValid) {
           setError(`National ID Issue: ${idAnalysis.message}`)
           setLoading(false)
           return
        } else if (!idAnalysis) {
           setError('ID Verification in progress or failed. Please wait or try re-uploading your ID.')
           setLoading(false)
           return
        }

        // 2. Check CV Name Match (if CV exists)
        if (cvFile && cvAnalysis && cvAnalysis.fullName) {
          const cvNameParts = detectedCvName.split(' ')
          const fName = form.firstName.trim().toLowerCase()
          const lName = form.lastName.trim().toLowerCase()

          const hasFirstNameCV = cvNameParts.includes(fName)
          const hasLastNameCV = cvNameParts.includes(lName)

          if (!hasFirstNameCV || !hasLastNameCV) {
            setError(`CV Name Mismatch! The name on your CV ("${cvAnalysis.fullName}") does not match the name entered in the form.`)
            setLoading(false)
            return
          }
        }
        
        const fd = new FormData()
        fd.append('FirstName', form.firstName.trim())
        fd.append('LastName', form.lastName.trim())
        fd.append('FullName', `${form.firstName.trim()} ${form.lastName.trim()}`)
        fd.append('Email', form.email)
        fd.append('Password', form.password)
        fd.append('PhoneNumber', form.phone || '')
        fd.append('NationalIdImage', nationalIdFile)
        if (cvFile) fd.append('CVFile', cvFile)
        
        await registerMarketer(fd)
      } else {
        const commercialFile = commercialRegisterRef.current?.files?.[0]
        if (!commercialFile) {
          setError('Please upload Company Documents')
          setLoading(false)
          return
        }
        const fd = new FormData()
        fd.append('CompanyName', form.companyName)
        fd.append('Email', form.email)
        fd.append('Password', form.password)
        fd.append('Address', form.address)
        fd.append('PhoneNumber', form.phone || '')
        fd.append('CommercialRegisterFile', commercialFile)
        if (form.website) fd.append('Website', form.website)
        fd.append('TaxId', form.taxId || '000000000')
        const logoFile = logoRef.current?.files?.[0]
        if (logoFile) fd.append('LogoFile', logoFile)
        await registerCompany(fd)
      }
    } catch (err: any) {
      let msg = err instanceof Error ? err.message : 'Registration failed'
      // Try to extract detailed validation errors from API response
      if (err?.response?.data?.errors) {
        const errors = err.response.data.errors
        const details = Object.entries(errors).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`).join('. ')
        msg = details || msg
      } else if (err?.response?.data?.title) {
        msg = err.response.data.title
      }
      if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
        setError('API is not connected. Make sure the backend is running.')
      } else if (msg.toLowerCase().includes('failed to fetch')) {
        setError('Cannot reach API. Verify the backend is running on the correct port.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A] transition-all"
  const inputWithIconClass = inputClass + " pl-11"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5"

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 md:p-6 font-sans">
      
      <div className="w-full max-w-[1040px] min-h-[700px] bg-white rounded-[28px] shadow-2xl shadow-blue-900/10 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Panel — Blue Gradient with Features */}
        <div className="w-full md:w-[44%] relative flex items-center p-12 text-left overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src={signupImg} alt="Sign Up" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#1E3A8A]/85 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative z-10 text-white space-y-8">
            <h1 className="text-[36px] font-bold leading-tight">Join Affilianze<br />Today</h1>
            <p className="text-blue-100/70 text-[14px] font-medium max-w-[280px] leading-relaxed">
              Start your journey with AI-powered affiliate marketing
            </p>
            
            <div className="space-y-5 mt-8">
              {[
                { t: "AI-Powered Matching", d: "Find the perfect campaigns automatically" },
                { t: "Secure & Fast Payments", d: "Get paid on time, every time" },
                { t: "Real-Time Analytics", d: "Track your success with detailed insights" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FBBF24] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[14px]">{item.t}</h4>
                    <p className="text-[12px] text-blue-100/50">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel — Form Steps */}
        <div className="w-full md:w-[56%] flex flex-col p-8 md:px-12 md:py-8 bg-white relative">
          
          {/* Stepper */}
          <div className="flex items-center justify-center gap-0 mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${step >= 1 ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
              <span className={`text-[12px] font-medium ${step >= 1 ? 'text-slate-900' : 'text-gray-400'}`}>Type</span>
            </div>
            <div className={`w-16 h-[2px] mx-3 ${step >= 2 ? 'bg-[#1E3A8A]' : 'bg-gray-200'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${step >= 2 ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
              <span className={`text-[12px] font-medium ${step >= 2 ? 'text-slate-900' : 'text-gray-400'}`}>Details</span>
            </div>
          </div>

          {/* Step 1: Choose Account Type */}
          {step === 1 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-6">
                <h2 className="text-[28px] font-bold text-slate-900 mb-1">Create Account</h2>
                <p className="text-sm text-gray-400">Choose your account type to get started</p>
              </div>

              <div className="space-y-4 flex-1">
                <button 
                  type="button"
                  onClick={() => {
                    setAccountType('marketer');
                    setStep(2);
                  }}
                  className={`w-full p-5 rounded-2xl border-2 transition-all flex items-start gap-4 text-left group ${accountType === 'marketer' ? 'border-[#1E3A8A] bg-blue-50/30' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accountType === 'marketer' ? 'bg-[#1E3A8A]' : 'bg-slate-800'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[15px]">Marketer</h3>
                    <p className="text-[12px] text-gray-400 mb-2">Promote products and earn commissions</p>
                    <ul className="space-y-1">
                      <li className="text-[11px] text-gray-500 flex items-center gap-1.5"><span className="text-[#FBBF24] font-bold">✓</span> AI-powered campaign matching</li>
                      <li className="text-[11px] text-gray-500 flex items-center gap-1.5"><span className="text-[#FBBF24] font-bold">✓</span> Real-time analytics dashboard</li>
                    </ul>
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setAccountType('company');
                    setStep(2);
                  }}
                  className={`w-full p-5 rounded-2xl border-2 transition-all flex items-start gap-4 text-left group ${accountType === 'company' ? 'border-[#1E3A8A] bg-blue-50/30' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accountType === 'company' ? 'bg-[#1E3A8A]' : 'bg-slate-800'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[15px]">Company</h3>
                    <p className="text-[12px] text-gray-400 mb-2">Find quality marketers for your products</p>
                    <ul className="space-y-1">
                      <li className="text-[11px] text-gray-500 flex items-center gap-1.5"><span className="text-[#FBBF24] font-bold">✓</span> Connect with skilled marketers</li>
                      <li className="text-[11px] text-gray-500 flex items-center gap-1.5"><span className="text-[#FBBF24] font-bold">✓</span> Performance-based pricing</li>
                    </ul>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Your Details */}
          {step === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-5">
                <h2 className="text-[28px] font-bold text-slate-900 mb-1">Your Details</h2>
                <p className="text-sm text-gray-500">
                  Signing up as <span className="font-bold text-slate-900 capitalize">{accountType}</span>{' '}
                  <button type="button" onClick={() => setStep(1)} className="text-gray-400 underline hover:text-[#1E3A8A] transition-colors ml-1">
                    Change
                  </button>
                </p>
              </div>

              {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2.5 text-sm border border-red-100 mb-4">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                {/* First Name / Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input 
                      value={form.firstName} 
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })} 
                      className={inputClass} 
                      placeholder="John" 
                      required 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input 
                      value={form.lastName} 
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })} 
                      className={inputClass} 
                      placeholder="Doe" 
                      required 
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })} 
                      className={inputWithIconClass} 
                      placeholder="you@example.com" 
                      required 
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" 
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                      className={inputWithIconClass} 
                      placeholder="+1 (555) 000-0000" 
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={form.password} 
                      onChange={(e) => setForm({ ...form, password: e.target.value })} 
                      className={inputWithIconClass + " pr-11"} 
                      placeholder="••••••••" 
                      minLength={8} 
                      required 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Min. 8 characters</p>
                </div>

                {/* Conditional Fields */}
                {accountType === 'marketer' ? (
                  <>
                    {/* Company/Organization */}
                    <div>
                      <label className={labelClass}>Company/Organization</label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          value={form.companyName} 
                          onChange={(e) => setForm({ ...form, companyName: e.target.value })} 
                          className={inputWithIconClass} 
                          placeholder="Your company name" 
                        />
                      </div>
                    </div>

                    {/* Website (Optional) */}
                    <div>
                      <label className={labelClass}>Website (Optional)</label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="url" 
                          value={form.website} 
                          onChange={(e) => setForm({ ...form, website: e.target.value })} 
                          className={inputWithIconClass} 
                          placeholder="https://yourwebsite.com" 
                        />
                      </div>
                    </div>

                    {/* Your Niche */}
                    <div>
                      <label className={labelClass}>Your Niche *</label>
                      <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          value={form.niche} 
                          onChange={(e) => setForm({ ...form, niche: e.target.value })} 
                          className={inputWithIconClass} 
                          placeholder="e.g., Fashion, Technology" 
                          required
                        />
                      </div>
                    </div>

                    {/* Upload National ID & AI Verification */}
                    <div className="space-y-3">
                      <label className={labelClass}>Upload Your National ID *</label>
                      <div 
                        onClick={() => !isAnalyzingID && nationalIdRef.current?.click()} 
                        className={`border-2 border-dashed rounded-xl py-5 px-4 text-center cursor-pointer transition-all ${isAnalyzingID ? 'border-blue-200 bg-blue-50/50 cursor-wait' : 'border-gray-200 hover:border-[#1E3A8A]/30 hover:bg-blue-50/20'}`}
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          {isAnalyzingID ? (
                            <div className="flex items-center gap-2 text-[#1E3A8A] font-bold animate-pulse">
                              <Sparkles className="w-5 h-5" />
                              <span className="text-sm">AI is verifying your document...</span>
                            </div>
                          ) : (
                            <>
                              <Shield className={`w-6 h-6 ${fileName ? 'text-green-500' : 'text-gray-400'}`} />
                              <span className="text-sm text-gray-500 font-medium">
                                {fileName || 'Upload government ID (Front View)'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <input 
                        ref={nationalIdRef} 
                        type="file" 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setFileName(file.name)
                          
                          // AI Verification
                          setIsAnalyzingID(true)
                          setIdAnalysis(null)
                          try {
                            const result = await verifyNationalIDWithAI(file)
                            setIdAnalysis(result)
                            if (result.isValid && result.name.toLowerCase() !== 'not readable') {
                              toast.success('National ID verified successfully')
                            } else if (result.isValid && result.name.toLowerCase() === 'not readable') {
                              toast.error('Image is not clear enough. Please try a better photo.')
                            } else {
                              toast.error(result.message)
                            }
                          } catch (err: any) {
                            console.error('ID Analysis failed:', err)
                            const errMsg = err.message || String(err)
                            if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota')) {
                              toast.error('AI Limit reached. Please wait 15s.')
                            } else if (errMsg.toLowerCase().includes('cors') || errMsg.toLowerCase().includes('fetch')) {
                              toast.error('Security/Network block. Try a different browser or check keys.')
                            } else {
                              toast.error(`Verification error: ${errMsg.slice(0, 50)}...`)
                            }
                          } finally {
                            setIsAnalyzingID(false)
                          }
                        }}
                        required 
                      />
                      
                      {idAnalysis && (
                        <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
                          !idAnalysis.isValid ? 'bg-red-50 border-red-100' : 
                          (idAnalysis.name.toLowerCase() === 'not readable' ? 'bg-yellow-50 border-yellow-100' : 'bg-green-50 border-green-100')
                        }`}>
                          {!idAnalysis.isValid ? <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" /> : 
                           (idAnalysis.name.toLowerCase() === 'not readable' ? <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />)}
                          
                          <div className="flex-1">
                            <p className={`text-[13px] font-bold mb-1 ${
                              !idAnalysis.isValid ? 'text-red-800' : 
                              (idAnalysis.name.toLowerCase() === 'not readable' ? 'text-yellow-800' : 'text-green-800')
                            }`}>
                              {!idAnalysis.isValid ? 'Verification Issue' : 
                               (idAnalysis.name.toLowerCase() === 'not readable' ? 'Unclear Image' : 'Verification Success')}
                            </p>
                            <p className={`text-[12px] leading-relaxed mb-3 ${
                              !idAnalysis.isValid ? 'text-red-600' : 
                              (idAnalysis.name.toLowerCase() === 'not readable' ? 'text-yellow-700' : 'text-green-600')
                            }`}>
                              {idAnalysis.name.toLowerCase() === 'not readable' 
                                ? 'Please upload a clearer photo to complete your data.' 
                                : idAnalysis.message}
                            </p>
                            
                            {idAnalysis.isValid && idAnalysis.name && idAnalysis.name.toLowerCase() !== 'not readable' && (
                              <div className="mt-4 space-y-3 p-3 bg-white/50 rounded-lg border border-green-100/50">
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div className="text-green-800/60 font-medium">Detected Name:</div>
                                  <div className="text-green-900 font-bold">{idAnalysis.name}</div>
                                  
                                  {idAnalysis.idNumber && (
                                    <>
                                      <div className="text-green-800/60 font-medium">ID Number:</div>
                                      <div className="text-green-900 font-bold">{idAnalysis.idNumber}</div>
                                    </>
                                  )}
                                  
                                  {idAnalysis.address && (
                                    <>
                                      <div className="text-green-800/60 font-medium">Address:</div>
                                      <div className="text-green-900 font-bold line-clamp-1">{idAnalysis.address}</div>
                                    </>
                                  )}
                                </div>

                                <button 
                                  type="button"
                                  onClick={() => {
                                    const names = idAnalysis.name.split(' ')
                                    const firstName = names[0]
                                    const lastName = names.slice(1).join(' ')
                                    setForm(prev => ({ 
                                      ...prev, 
                                      firstName, 
                                      lastName,
                                      address: idAnalysis.address || prev.address 
                                    }))
                                    toast.success('Information applied successfully')
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white text-[12px] font-bold rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Complete Data from ID
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upload CV/Resume */}
                    <div>
                      <label className={labelClass}>Upload Your CV/Resume (Optional)</label>
                      <div 
                        onClick={() => cvRef.current?.click()} 
                        className="border-2 border-dashed border-gray-200 rounded-xl py-4 px-4 text-center cursor-pointer hover:border-[#1E3A8A]/30 hover:bg-blue-50/20 transition-all"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Upload className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {cvFileName || 'Upload CV (PDF, DOC)'}
                          </span>
                        </div>
                      </div>
                      <input 
                        ref={cvRef} 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setCvFileName(file.name)
                          
                          // Analyze CV
                          setIsAnalyzingCV(true)
                          try {
                            const { analyzeCVWithAI } = await import('../utils/aiService')
                            const result = await analyzeCVWithAI(file)
                            setCvAnalysis(result)
                            if (result.fullName) {
                              toast.success(`CV analyzed: Welcome ${result.fullName.split(' ')[0]}`)
                            }
                          } catch (err) {
                            console.error('CV Analysis failed:', err)
                          } finally {
                            setIsAnalyzingCV(false)
                          }
                        }}
                      />
                    </div>
                    
                    {cvAnalysis && (
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-blue-800">CV AI Analysis Complete</p>
                          <p className="text-[10px] text-blue-600">Extracted Name: {cvAnalysis.fullName || 'Not found'}</p>
                        </div>
                      </div>
                    )}

                    {isAnalyzingCV && (
                      <div className="p-3 bg-blue-50/30 border border-dashed border-blue-200 rounded-xl flex items-center gap-2 animate-pulse">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-[11px] text-blue-500 font-medium">AI is reading your CV...</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Company Name */}
                    <div>
                      <label className={labelClass}>Company Name *</label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          value={form.companyName} 
                          onChange={(e) => setForm({ ...form, companyName: e.target.value })} 
                          className={inputWithIconClass} 
                          placeholder="Your company name" 
                          required 
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className={labelClass}>Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          value={form.address} 
                          onChange={(e) => setForm({ ...form, address: e.target.value })} 
                          className={inputWithIconClass} 
                          placeholder="Company address" 
                          required 
                        />
                      </div>
                    </div>

                    {/* Website */}
                    <div>
                      <label className={labelClass}>Website *</label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="url" 
                          value={form.website} 
                          onChange={(e) => setForm({ ...form, website: e.target.value })} 
                          className={inputWithIconClass} 
                          placeholder="https://yourwebsite.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Industry */}
                    <div>
                      <label className={labelClass}>Industry *</label>
                      <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          value={form.industry} 
                          onChange={(e) => setForm({ ...form, industry: e.target.value })} 
                          className={inputWithIconClass} 
                          placeholder="e.g., E-commerce, Technology"
                          required
                        />
                      </div>
                    </div>

                    {/* Upload Company Documents */}
                    <div>
                      <label className={labelClass}>Upload Company Documents *</label>
                      <div 
                        onClick={() => commercialRegisterRef.current?.click()} 
                        className="border-2 border-dashed border-gray-200 rounded-lg py-4 px-4 text-center cursor-pointer hover:border-[#1E3A8A]/30 hover:bg-blue-50/20 transition-all"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Upload className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {fileName || 'Click to upload documents'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Business license, tax documents, etc. (PDF, DOC, Images)</p>
                      <input 
                        ref={commercialRegisterRef} 
                        type="file" 
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                        className="hidden"
                        onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                        required 
                      />
                      <input ref={logoRef} type="file" className="hidden" />
                    </div>
                  </>
                )}

                {/* Terms */}
                <div className="flex items-center justify-center gap-1 pt-1">
                  <input 
                    type="checkbox" 
                    checked={agree} 
                    onChange={(e) => setAgree(e.target.checked)} 
                    className="w-4 h-4 text-[#1E3A8A] rounded border-gray-300 focus:ring-[#1E3A8A]" 
                    required 
                  />
                  <span className="text-[12px] text-gray-500">
                    I agree to the <a href="#" className="text-[#1E3A8A] font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-[#1E3A8A] font-medium hover:underline">Privacy Policy</a>
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="py-3 rounded-xl bg-gray-100 text-slate-700 font-semibold text-sm hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading || !agree} 
                    className="py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-sm shadow-md shadow-blue-900/15 hover:bg-[#152C6E] disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-4 text-center border-t border-gray-50">
            <p className="text-[13px] text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#1E3A8A] font-bold hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}