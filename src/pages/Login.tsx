import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield } from 'lucide-react'

import loginImg from "../assets/login.jpg"
import mailIcon from "../assets/mail.png"
import passIcon from "../assets/password.png"
import googleIcon from "../assets/google.png"
import fbIcon from "../assets/facebook.png"

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user')
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, remember, loginType)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-0 md:p-6 font-sans">
      <div className="w-full max-w-[1000px] min-h-screen md:min-h-[660px] bg-white md:rounded-[32px] shadow-2xl shadow-blue-900/10 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/2 relative flex items-center justify-center p-8 md:p-12 text-center overflow-hidden min-h-[240px] md:min-h-0">
          <div className="absolute inset-0 z-0">
            <img src={loginImg} alt="Login Background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#1E3A8A]/85 backdrop-blur-[2px]"></div>
          </div>
          <div className="relative z-10 px-4">
            <h1 className="text-white text-center leading-tight">
              <span className="text-2xl md:text-3xl lg:text-4xl font-black block">
                <span className="opacity-90">Welcome Back to </span>
                <span className="bg-gradient-to-r from-[#A7F3D0] to-[#10B981] bg-clip-text text-transparent">Affilianze</span>
              </span>
            </h1>
            <p className="mt-6 text-sm text-blue-100/80 font-medium leading-relaxed max-w-[280px] mx-auto text-center">
              Continue your journey to successful affiliate marketing partnerships
            </p>

          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col p-8 md:p-12 bg-white">
          
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-[#1E3A8A] transition-colors gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              BACK TO HOME
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-[#1f2b3d] mb-2">{loginType === 'user' ? 'Log In' : 'Admin Access'}</h2>
            <p className="text-[13px] text-gray-400 font-semibold">{loginType === 'user' ? 'Enter your credentials to access your account' : 'Secure platform management portal'}</p>
          </div>

          <div className="flex p-1.5 bg-gray-50/80 rounded-2xl mb-8 border border-gray-100/80">
             <button
                type="button"
                onClick={() => {
                  setLoginType('user')
                  setEmail('')
                  setPassword('')
                }}
                className={`flex-1 py-3 text-[13px] font-black rounded-xl transition-all ${loginType === 'user' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}`}
             >
                Regular User
             </button>
             <button
                type="button"
                onClick={() => {
                  setLoginType('admin')
                  setEmail('')
                  setPassword('')
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-black rounded-xl transition-all ${loginType === 'admin' ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}`}
             >
                <Shield className="w-4 h-4" /> Administrator
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
              <div className="rounded-xl bg-red-50 text-red-600 px-4 py-3 text-xs font-bold border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pr-3 border-r border-gray-100">
                  <img src={mailIcon} className="w-5 h-5 opacity-40" alt="mail" />
                </div>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-14 py-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A] outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pr-3 border-r border-gray-100">
                  <img src={passIcon} className="w-5 h-5 opacity-40" alt="pass" />
                </div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-14 py-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A] outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#1E3A8A] focus:ring-0" />
                <span className="ml-2 text-xs font-bold text-gray-400 group-hover:text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-xs font-bold text-[#1E3A8A] hover:underline">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-[#1E3A8A] text-white font-black text-sm shadow-xl shadow-blue-100/50 hover:bg-[#152C6E] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                loginType === 'admin' ? <><Shield className="w-4 h-4" /> Log In as Admin</> : 'LOG IN'
              )}
            </button>

            {loginType === 'user' && (
              <div className="animate-in fade-in duration-300">
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 bg-white px-4">Or continue with</div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button type="button" className="py-3 rounded-xl border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all text-xs font-bold text-gray-700">
                    <img src={googleIcon} className="w-4 h-4" alt="Google" /> Google
                  </button>
                  <button type="button" className="py-3 rounded-xl border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all text-xs font-bold text-gray-700">
                    <img src={fbIcon} className="w-4 h-4" alt="Facebook" /> Facebook
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-8 md:mt-auto pt-6 md:pt-10 text-center pb-8 md:pb-0">
            <p className="text-[14px] md:text-[15px] font-medium text-[#4b5563]">
              Don't have an account? <Link to="/signup" className="text-[#1E3A8A] font-bold hover:underline">Sign up for free</Link>
            </p>
            <p className="mt-4 text-[12px] md:text-[13px] text-gray-500">
              By continuing, you agree to our <Link to="/terms" className="text-[#1E3A8A] hover:underline">Terms</Link> and <Link to="/privacy" className="text-[#1E3A8A] hover:underline">Privacy Policy</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}