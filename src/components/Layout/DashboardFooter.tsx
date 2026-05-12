import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Search, 
  MessageSquare, 
  Bot, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Apple, 
  Play, 
  Mail, 
  Phone, 
  MapPin,
  Heart,
  FileText
} from 'lucide-react'

export default function DashboardFooter() {
  const path = useLocation().pathname

  const mobileNavLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Find', path: '/campaigns', icon: <Search className="w-5 h-5" /> },
    { name: 'Apps', path: '/applications', icon: <FileText className="w-5 h-5" /> },
    { name: 'Messages', path: '/messages', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'Assistant', path: '/ai-assistant', icon: <Bot className="w-5 h-5" /> },
  ]

  return (
    <>
      {/* Mobile Bottom Navigation (Hidden on Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-4 pb-safe-offset-2 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {mobileNavLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center gap-1 p-2 transition-all active:scale-90 ${
                path === link.path 
                  ? 'text-[#1E3A8A]' 
                  : 'text-gray-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${path === link.path ? 'bg-blue-50' : ''}`}>
                {link.icon}
              </div>
              <span className="text-[10px] font-bold tracking-tight">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Footer (Visible on all, styled according to screenshot) */}
      <footer className="mt-20 bg-[#1F5BA8] text-white pt-16 pb-12 md:pb-8 w-full">
        <div className="max-w-[1500px] mx-auto px-8 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* Column 1: Brand & Social */}
            <div className="space-y-6">
            <Link to="/" className="flex items-center group gap-0.5">
              <div 
                className="w-10 h-10 transition-transform group-hover:scale-110"
                style={{
                  backgroundImage: 'url(/favicon.png)',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundColor: '#1F5BA8',
                  backgroundBlendMode: 'multiply'
                }}
              />
              <span className="text-[26px] font-bold tracking-tight -ml-2 bg-gradient-to-r from-[#A7F3D0] to-[#10B981] bg-clip-text text-transparent">ffilianze</span>
            </Link>
              <p className="text-white/80 text-[14px] leading-relaxed max-w-[280px]">
                Connecting marketers and advertisers through intelligent AI-powered campaign matching.
              </p>
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <Icon className="w-5 h-5 text-white" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-[18px] font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4">
                {['Home', 'Find Campaigns', 'Dashboard', 'How it Works', 'AI Assistant'].map((link) => (
                  <li key={link}>
                    <Link to={link === 'Home' ? '/' : `/${link.toLowerCase().replace(/ /g, '-')}`} className="text-white/70 hover:text-white transition-colors text-[14px]">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h4 className="text-[18px] font-bold mb-6">Resources</h4>
              <ul className="space-y-4">
                {['Help Center', 'Terms of Service', 'Privacy Policy', 'Blog', 'Contact Us'].map((link) => (
                  <li key={link}>
                    <Link to={`/${link.toLowerCase().replace(/ /g, '-')}`} className="text-white/70 hover:text-white transition-colors text-[14px]">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Download & Contact */}
            <div className="space-y-8">
              <div>
                <h4 className="text-[18px] font-bold mb-6">Download App</h4>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/5 hover:bg-white/15 transition-all text-left group">
                    <Apple className="w-6 h-6" />
                    <div>
                      <p className="text-[10px] text-white/60 leading-none">Download on the</p>
                      <p className="text-[14px] font-bold">App Store</p>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/5 hover:bg-white/15 transition-all text-left group">
                    <Play className="w-6 h-6" />
                    <div>
                      <p className="text-[10px] text-white/60 leading-none">Get it on</p>
                      <p className="text-[14px] font-bold">Google Play</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-[14px]">
                <div className="flex items-center gap-3 text-white/80">
                  <Mail className="w-4 h-4" />
                  <span>info@affilianze.com</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Phone className="w-4 h-4" />
                  <span>+20 123 456 7890</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <MapPin className="w-4 h-4" />
                  <span>Cairo, Egypt</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Divider & Copyright */}
          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-[13px] text-white/60 font-medium">
              © {new Date().getFullYear()} Affilianze. All rights reserved. Made with <Heart className="inline-block w-3 h-3 text-red-500 fill-red-500 mx-1" /> in Egypt
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
