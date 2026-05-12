import { useEffect, useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Bot, Bell, User, LogOut, Settings as SettingsIcon, Clock, Home, Mail, Menu, X } from 'lucide-react'
import { notificationApi } from '../../api/client'
import SupportModal from '../Common/SupportModal'

export default function DashboardNav() {
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showSupportModal, setShowSupportModal] = useState(false)
  
  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const path = useLocation().pathname
  const { avatar, role, name, email, logout, token } = useAuth()
  
  const fetchData = async () => {
    try {
      const [listRes, summaryRes] = await Promise.all([
        notificationApi.getmy({ PageSize: 5 }),
        notificationApi.getsummary()
      ])
      
      const apiNotifications = ((listRes as any)?.items || (listRes as any)?.data?.items || (listRes as any)?.data || listRes || []) as any[]
      const local = JSON.parse(localStorage.getItem('local_notifications') || '[]')
      const merged = [...local, ...apiNotifications].slice(0, 5)
      
      setNotifications(merged)
      
      // Use summary count if available, fallback to manual count
      const summaryCount = (summaryRes as any)?.unreadCount ?? (summaryRes as any)?.data?.unreadCount
      setUnreadCount(summaryCount ?? merged.filter((n: any) => !n.isRead).length)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    }
  }

  useEffect(() => {
    if (token) {
      fetchData()
      const interval = setInterval(fetchData, 60000)
      return () => clearInterval(interval)
    }
  }, [token])

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.putreadall()
      setNotifications(notifications.map((n: any) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.putread(id)
      setNotifications(notifications.map((n: any) => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount((prev: number) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  let navLinks: { name: string; path: string }[] = []
  if (role === 'Admin') {
    navLinks = [
      { name: 'Dashboard', path: '/admin' },
      { name: 'Users', path: '/admin/users' },
      { name: 'Campaigns', path: '/admin/campaigns' },
      { name: 'Categories', path: '/admin/categories' },
      { name: 'Financials', path: '/admin/financials' },
      { name: 'Complaints', path: '/admin/complaints' },
    ]
  } else if (role?.toLowerCase() === 'company') {
    navLinks = [
      { name: 'Dashboard', path: '/company' },
      { name: 'New Campaign', path: '/company/campaigns/new' },
      { name: 'Resolution Center', path: '/complaints' },
    ]
  } else {
    navLinks = [
      { name: 'Find Campaigns', path: '/campaigns' },
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'AI Tools', path: '/ai-tools' },
      { name: 'Messages', path: '/messages' },
      { name: 'Resolution Center', path: '/complaints' },
    ]
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 h-[72px] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center">
          {/* Logo & Mobile Toggle */}
          <div className="flex items-center gap-4 md:gap-12">
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Link to="/" className="flex items-center group">
                <img src="/favicon.png" alt="A" className="w-8 h-8 object-contain transition-transform group-hover:scale-110" style={{ mixBlendMode: 'multiply' }} />
                <span className="text-[20px] md:text-[22px] font-bold bg-gradient-to-r from-[#1E3A8A] to-[#10B981] bg-clip-text text-transparent tracking-tight -ml-1">ffilianze</span>
              </Link>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-[13px] font-medium transition-colors ${
                    path === link.path || (link.path !== '/admin' && path.startsWith(link.path))
                      ? 'text-slate-900'
                      : 'text-gray-400 hover:text-slate-600'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {role?.toLowerCase() === 'company' && (
              <Link
                to="/company"
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100"
                title="Go to Company Home"
              >
                <Home className="w-[18px] h-[18px]" />
                <span className="text-[13px] font-bold">Home</span>
              </Link>
            )}

            <div className="flex items-center gap-2">
              {token && (
                <>
                  {/* Support/Contact Button */}
                  <button 
                    onClick={() => setShowSupportModal(true)}
                    className="p-2.5 rounded-xl text-gray-400 hover:bg-slate-50 hover:text-slate-600 border border-transparent hover:border-slate-100 transition-all"
                    title="Contact Us"
                  >
                    <Mail className="w-[18px] h-[18px]" />
                  </button>

                  {/* AI Assistant Button (Marketer only) */}
                  {role === 'Marketer' && (
                    <Link 
                      to="/ai-assistant"
                      className={`p-2.5 rounded-xl transition-all ${
                        path === '/ai-assistant' 
                          ? 'bg-slate-100 text-slate-900' 
                          : 'text-gray-400 hover:bg-slate-50 hover:text-slate-600'
                      } border border-transparent hover:border-slate-100`}
                      title="AI Assistant"
                    >
                      <Bot className="w-[18px] h-[18px]" />
                    </Link>
                  )}

                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(!notifOpen)}
                      className={`p-2.5 rounded-xl transition-all ${
                        notifOpen 
                          ? 'bg-slate-100 text-slate-900' 
                          : 'text-gray-400 hover:bg-slate-50 hover:text-slate-600'
                      } border border-transparent hover:border-slate-100 relative`}
                    >
                      <Bell className="w-[18px] h-[18px]" />
                      {unreadCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 border-2 border-white rounded-full" />
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-5 py-2 mb-2 flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-sm">Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
                          {unreadCount > 0 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }}
                              className="text-[11px] text-[#1E3A8A] font-semibold hover:underline"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        <div className="max-h-[320px] overflow-y-auto px-2">
                          {notifications.length > 0 ? notifications.map((n, i) => (
                            <Link 
                              key={n.id || i} 
                              to="/notifications"
                              onClick={() => {
                                if (!n.isRead) handleMarkAsRead(n.id);
                                setNotifOpen(false);
                              }}
                              className={`w-full px-3 py-3 hover:bg-slate-50 rounded-xl transition-colors text-left flex gap-3 relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                            >
                              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${!n.isRead ? 'bg-[#1E3A8A]/10 text-[#1E3A8A]' : 'bg-slate-100 text-slate-400'}`}>
                                <Bell className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold text-slate-900 text-[12px] truncate ${!n.isRead ? 'pr-4' : ''}`}>{n.title}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message || n.desc}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'just now'}
                                  </p>
                                  {!n.isRead && <span className="w-1.5 h-1.5 bg-[#1E3A8A] rounded-full" />}
                                </div>
                              </div>
                            </Link>
                          )) : (
                            <div className="py-10 text-center">
                              <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                              <p className="text-[11px] text-gray-400 font-medium">No new notifications</p>
                            </div>
                          )}
                        </div>
                        <div className="px-2 pt-2 border-t border-gray-50 bg-slate-50/50">
                          <Link 
                            to="/notifications" 
                            onClick={() => setNotifOpen(false)}
                            className="w-full py-2.5 text-center text-[10px] font-black text-slate-400 hover:text-[#1E3A8A] block uppercase tracking-[0.2em] transition-all"
                          >
                            View all notifications
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Profile Menu */}
              <div className="relative ml-2" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-slate-100 transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {avatar ? <img src={avatar} alt="User" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                      <p className="text-[13px] font-bold text-slate-900 truncate">{name || email?.split('@')[0] || 'User Account'}</p>
                      <p className="text-[11px] text-gray-400 truncate">Affiliance Partner</p>
                    </div>
                    {role?.toLowerCase() !== 'admin' && (
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors">
                        <User className="w-4 h-4 text-gray-400" /> My Profile
                      </Link>
                    )}
                    <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors">
                      <SettingsIcon className="w-4 h-4 text-gray-400" /> Settings
                    </Link>
                    <div className="mt-1 pt-1 border-t border-slate-50">
                      <button 
                        type="button" 
                        onClick={() => { setUserMenuOpen(false); logout(); }} 
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Support Modal */}
      <SupportModal 
        isOpen={showSupportModal} 
        onClose={() => setShowSupportModal(false)} 
        onSuccess={(newNotif) => {
          setNotifications(prev => [newNotif, ...prev.slice(0, 4)])
          setUnreadCount(prev => prev + 1)
          setNotifOpen(true)
        }}
      />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 bg-white border-b border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-40">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-[14px] font-bold transition-colors ${
                  path === link.path
                    ? 'bg-slate-50 text-slate-900'
                    : 'text-gray-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
