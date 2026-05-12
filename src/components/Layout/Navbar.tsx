import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Bell, LogOut, Settings as SettingsIcon, User, Menu, X, ChevronRight } from 'lucide-react'
import { notificationApi } from '../../api/client'
import { motion } from 'framer-motion'

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/#about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const { role, logout, token } = useAuth()
  
  const isAuthPage = ['/login', '/signup', '/admin/login'].includes(location.pathname)
  const isDashboard = !isAuthPage && (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/company') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/settings') || location.pathname.startsWith('/messages') || !!token)
  
  const roleLower = role?.toLowerCase()
  const dashboardPath = roleLower === 'admin' ? '/admin' : roleLower === 'company' ? '/company' : '/dashboard'

  useEffect(() => {
    if (token) {
      notificationApi.getsummary().then(res => {
        setUnreadCount(res?.data?.unreadCount || 0)
      }).catch(() => null)
    }
  }, [token])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        <div className="flex-1 flex justify-start items-center">
          <Link to="/" className="flex items-center group gap-0.5">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <img 
                src="/favicon.png" 
                alt="A" 
                className="w-10 h-10 object-contain transition-transform group-hover:scale-110" 
                style={{ mixBlendMode: 'darken' }} 
              />
            </motion.div>
            <motion.span 
              initial={{ width: 0, opacity: 0, x: -10 }}
              animate={{ width: "auto", opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="text-[26px] font-bold tracking-tight -ml-2 bg-gradient-to-r from-[#1E3A8A] to-[#10B981] bg-clip-text text-transparent overflow-hidden whitespace-nowrap"
            >
              ffilianze
            </motion.span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 justify-center items-center gap-8">
          {isDashboard ? (
            <div className="flex items-center gap-6">
              <Link 
                to={dashboardPath}
                className="text-sm font-semibold text-slate-600 hover:text-[#1E3A8A] transition-colors"
              >
                Dashboard
              </Link>
              {roleLower === 'affiliate' && (
                <Link 
                  to="/dashboard/campaigns"
                  className="text-sm font-semibold text-slate-600 hover:text-[#1E3A8A] transition-colors"
                >
                  Find Campaigns
                </Link>
              )}
            </div>
          ) : (
            publicLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-semibold text-slate-600 hover:text-[#1E3A8A] transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1E3A8A] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))
          )}
        </div>

        <div className="flex-1 flex justify-end items-center gap-4">
          {token ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/dashboard/notifications" 
                className="p-2 text-slate-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-full transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-full transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-bold text-slate-700 hover:text-[#1E3A8A] px-4 py-2 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-[#1E3A8A] text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-900/20 transition-all active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-xl animate-in slide-in-from-top duration-300">
          <div className="p-6 space-y-4">
            {(isDashboard ? [
              { to: dashboardPath, label: 'Dashboard' },
              ...(roleLower === 'affiliate' ? [{ to: '/dashboard/campaigns', label: 'Find Campaigns' }] : [])
            ] : publicLinks).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-4 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors group"
              >
                {link.label}
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
            ))}
            {!token && (
              <div className="pt-4 grid grid-cols-2 gap-4">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center p-4 rounded-xl font-bold text-slate-700 bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center p-4 rounded-xl font-bold text-white bg-[#1E3A8A]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
