import { Link } from 'react-router-dom'
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Apple, 
  Play, 
  Mail, 
  Phone, 
  MapPin,
  Heart
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#1F5BA8] text-white pt-16 pb-12 w-full">
      <div className="max-w-[1500px] mx-auto px-8 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand & Social */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center group gap-0">
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
              {[
                { label: 'Home', to: '/' },
                { label: 'Find Campaigns', to: '/campaigns' },
                { label: 'Dashboard', to: '/profile' },
                { label: 'How it Works', to: '/#how-it-works' },
                { label: 'AI Assistant', to: '/ai-assistant' }
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-white/70 hover:text-white transition-colors text-[14px]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="text-[18px] font-bold mb-6">Resources</h4>
            <ul className="space-y-4">
              {[
                { label: 'Help Center', to: '/contact' },
                { label: 'Terms of Service', to: '/terms' },
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'Blog', to: '/blog' },
                { label: 'Contact Us', to: '/contact' }
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-white/70 hover:text-white transition-colors text-[14px]">
                    {link.label}
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
  )
}
