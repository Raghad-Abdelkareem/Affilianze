import heroImg from "../assets/undefined 1.png";
import { Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Target,
  Zap,
  TrendingUp,
  Puzzle,
  BarChart3,
  Shield,
  Headphones,
  Building2,
  Rocket,
  Check,
  Star,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

// --- Animation Variants ---
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}
const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
}
const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
}
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

// --- Data ---
const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '$2M+', label: 'Earned in Commissions' },
  { value: '500+', label: 'Active Campaigns' },
  { value: '98%', label: 'Satisfaction Rate' },
]

const steps = [
  { icon: Sparkles, title: 'Create Profile', desc: 'Sign up and detail your expertise or brand goals.' },
  { icon: Target, title: 'AI Matchmaking', desc: 'Our AI finds the perfect campaign or marketer for you.' },
  { icon: Zap, title: 'Launch Campaign', desc: 'Collaborate and launch your marketing efforts instantly.' },
  { icon: TrendingUp, title: 'Track & Earn', desc: 'Monitor real-time results and receive quick payouts.' },
]

const features = [
  { icon: Puzzle, title: 'Smart AI Matching', desc: 'Stop guessing. Our advanced AI connects the right products with the right audience creators.' },
  { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track every click, lead, and sale through our transparent, up-to-the-minute dashboard.' },
  { icon: Shield, title: 'Secure Payments', desc: 'Guaranteed payouts and automated commission splitting. Never worry about missed payments.' },
  { icon: Building2, title: 'Verified Network', desc: 'Work confidently with high-quality, verified brands and professional marketers from around the globe.' },
  { icon: Rocket, title: 'Fast Campaign Setup', desc: 'Launch and scale your affiliate marketing campaigns in minutes with our intuitive campaign tools.' },
  { icon: Headphones, title: '24/7 Expert Support', desc: 'Our dedicated success team is always online to help you maximize your campaign performance and ROI.' },
]

const aboutCards = [
  { title: 'Our Mission', desc: 'To democratize affiliate marketing by using artificial intelligence to forge profitable, transparent, and long-lasting partnerships.', bg: 'bg-[#1E3A8A]', text: 'text-white' },
  { title: 'Why Affilianze?', desc: 'We recognized the friction in traditional affiliate networks—slow payments, poor tracking, and bad matching. Affilianze is the modern solution.', bg: 'bg-white border border-gray-100 shadow-sm', text: 'text-slate-900' },
  { title: 'For Advertisers', desc: 'Stop burning budget on mismatched audiences. Pay only for real results driven by vetted, passionate marketers.', bg: 'bg-white border border-gray-100 shadow-sm', text: 'text-slate-900' },
  { title: 'For Marketers', desc: 'Find products your audience actually wants. Enjoy higher conversion rates and faster payouts.', bg: 'bg-[#FBBF24]', text: 'text-slate-900' },
]

const marketerBenefits = [
  'Access to **AI-matched campaigns** tailored to your profile',
  '**Real-time analytics** to track your performance',
  '**Secure and timely payments** with multiple options',
  '**Expert support** available 24/7',
  '**Free to join** — no hidden fees',
]

const advertiserBenefits = [
  'Reach **verified marketers** in your niche',
  '**AI-powered matching** finds the best promoters',
  '**Detailed campaign analytics** and reports',
  '**Budget control** with flexible commission types',
  '**Fast campaign setup** and management tools',
]

const testimonials = [
  { name: 'Sara Ahmed', initials: 'SA', role: 'Digital Marketer', text: 'Affilianze has transformed how I find campaigns. The AI matching is incredibly accurate!', rating: 5 },
  { name: 'Mohammed Ali', initials: 'MA', role: 'E-commerce Owner', text: 'Finding reliable marketers used to be a challenge. Affilianze made it effortless.', rating: 5 },
  { name: 'Fatima Hassan', initials: 'FH', role: 'Content Creator', text: 'The platform is intuitive and the support team is always helpful. Highly recommended!', rating: 5 },
]

const faqs = [
  { q: 'How does the AI matching work?', a: 'Our AI analyzes your profile, skills, and performance history to match you with the most relevant campaigns. The more you use the platform, the better the recommendations become.' },
  { q: 'When do I get paid?', a: 'Payments are processed monthly once you reach the minimum threshold of $50. You can choose from multiple withdrawal methods including bank transfer and e-wallets.' },
  { q: 'Is there a fee to join?', a: 'Joining Affilianze is completely free for both marketers and advertisers. We only take a small platform fee from completed transactions.' },
  { q: 'How do I track my performance?', a: 'Our real-time analytics dashboard provides detailed insights into clicks, conversions, earnings, and more. You can also export reports for your records.' },
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // const scrollToSection = (id: string) => {
  //   const element = document.getElementById(id)
  //   if (element) element.scrollIntoView({ behavior: 'smooth' })
  // }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Hero Section */}
      <section id="hero" className="pt-[140px] pb-16 px-6 text-center">
        <motion.div 
          initial="hidden" animate="visible" variants={staggerContainer}
          className="max-w-[900px] mx-auto"
        >
          <motion.h1 variants={fadeUp} className="text-[34px] sm:text-[44px] md:text-[62px] leading-[1.1] md:leading-[1.08] font-extrabold tracking-tight text-slate-900">
            Link ideas with funding and <br className="hidden md:block" /> earn the {' '}
            <span className="relative inline-block z-10">
              smart way.
              <span className="absolute -bottom-1 left-0 w-full h-[6px] bg-[#FBBF24] rounded-sm"></span>
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-7 text-[15px] sm:text-[17px] text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
            Affilianze bridges marketers and advertisers with AI-driven affiliate marketing.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-9">
            <Link to="/signup" className="bg-[#1E3A8A] text-white px-9 py-3.5 rounded-full font-bold text-[15px] shadow-lg shadow-blue-900/15 inline-block hover:bg-[#152C6E] hover:-translate-y-0.5 transition-all">
              Get Started
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-14 flex justify-center">
            <img 
              src={heroImg} 
              alt="Affilianze Hero" 
              className="w-full max-w-[820px] h-auto drop-shadow-xl rounded-2xl" 
            />
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="max-w-5xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-gray-100 pt-14"
        >
          {stats.map((s) => (
            <motion.div variants={fadeUp} key={s.label}>
              <p className="text-[38px] md:text-[46px] font-extrabold text-[#1E3A8A] leading-none">{s.value}</p>
              <p className="text-gray-500 text-[12px] font-bold uppercase tracking-[0.15em] mt-3">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-[#F9FAFB] text-center">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-[30px] md:text-[36px] font-extrabold text-slate-900"
        >How It Works</motion.h2>
        <p className="text-gray-400 mt-3 font-bold uppercase tracking-[0.18em] text-[11px]">GET STARTED IN MINUTES WITH OUR SIMPLE PROCESS</p>
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="max-w-6xl mx-auto px-6 mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 relative"
        >
          {steps.map(({ icon: Icon, title, desc }, index) => (
            <motion.div variants={fadeUp} key={title} className="flex flex-col items-center relative z-10">
              <div className="relative mb-6">
                <div className="w-[76px] h-[76px] bg-[#FBBF24] rounded-full flex items-center justify-center shadow-md">
                  <Icon className="w-8 h-8 text-slate-900" strokeWidth={2} />
                </div>
                <div className="absolute -top-1 -right-1 w-[30px] h-[30px] bg-[#1E3A8A] text-white rounded-full flex items-center justify-center text-[12px] font-bold border-[3px] border-white shadow-sm">
                  {index + 1}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-[16px]">{title}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed max-w-[200px]">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Why Choose */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[30px] md:text-[36px] font-extrabold text-slate-900 mb-4 flex items-center justify-center gap-2">
            Why Choose <div className="flex items-center gap-1.5"><img src="/favicon.png" alt="A" className="w-10 h-10 object-contain mix-blend-multiply" /><span>ffilianze?</span></div>
          </motion.h2>
          <p className="text-gray-500 text-[15px] mb-14 max-w-xl mx-auto">Everything you need to succeed in affiliate marketing, all in one platform.</p>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid md:grid-cols-3 gap-7 text-left"
          >
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div variants={fadeUp} key={title} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-[52px] h-[52px] bg-[#1E3A8A] rounded-xl flex items-center justify-center mb-6 text-white">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[18px] text-slate-900 mb-3">{title}</h3>
                <p className="text-gray-500 text-[14px] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Affilianze */}
      <section id="about" className="py-20 bg-[#F9FAFB] px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[30px] md:text-[36px] font-extrabold text-slate-900 mb-4 flex items-center justify-center gap-2">
            About <div className="flex items-center gap-1.5"><img src="/favicon.png" alt="A" className="w-10 h-10 object-contain mix-blend-multiply" /><span>ffilianze</span></div>
          </h2>
          <p className="text-gray-500 text-[15px] mb-14 max-w-xl mx-auto">Learn more about our platform and what drives us forward.</p>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6 text-left"
          >
            {aboutCards.map((c) => (
              <motion.div variants={fadeUp} key={c.title} className={`${c.bg} ${c.text} p-10 rounded-2xl`}>
                <h3 className="text-[22px] font-bold mb-3">{c.title}</h3>
                <p className="text-[15px] leading-relaxed opacity-90">{c.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* For Marketers / For Advertisers */}
      <section className="py-20 bg-[#1E3A8A] px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Marketers */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeLeft}
            className="bg-white rounded-3xl p-10"
          >
            <h3 className="text-[24px] font-extrabold text-slate-900 mb-2">For Marketers</h3>
            <p className="text-gray-500 text-[14px] mb-6">Join our network and start earning with AI-matched campaigns.</p>
            <ul className="space-y-4">
              {marketerBenefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FBBF24] mt-0.5 flex-shrink-0" strokeWidth={3} />
                  <span className="text-[14px] text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(b.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')) }} />
                </li>
              ))}
            </ul>
            <Link to="/signup" className="mt-8 inline-block bg-[#1E3A8A] text-white px-8 py-3 rounded-full font-semibold text-[14px] hover:bg-[#152C6E] hover:scale-105 transition-all">
              Sign Up as Marketer
            </Link>
          </motion.div>
          {/* Advertisers */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeRight}
            className="bg-white rounded-3xl p-10"
          >
            <h3 className="text-[24px] font-extrabold text-slate-900 mb-2">For Advertisers</h3>
            <p className="text-gray-500 text-[14px] mb-6">Promote your products with top-performing marketers.</p>
            <ul className="space-y-4">
              {advertiserBenefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FBBF24] mt-0.5 flex-shrink-0" strokeWidth={3} />
                  <span className="text-[14px] text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(b.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')) }} />
                </li>
              ))}
            </ul>
            <Link to="/signup" className="mt-8 inline-block bg-[#1E3A8A] text-white px-8 py-3 rounded-full font-semibold text-[14px] hover:bg-[#152C6E] hover:scale-105 transition-all">
              Sign Up as Advertiser
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white px-6 text-center">
        <h2 className="text-[30px] md:text-[36px] font-extrabold text-slate-900 mb-4">What Our Users Say</h2>
        <p className="text-gray-500 text-[15px] mb-14 max-w-xl mx-auto">Don't just take our word for it — hear from the people who use Affilianze every day.</p>
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="max-w-6xl mx-auto grid md:grid-cols-3 gap-7"
        >
          {testimonials.map((t) => (
            <motion.div variants={fadeUp} key={t.name} className="bg-white border border-gray-100 rounded-2xl p-8 text-left shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-[#FBBF24] fill-[#FBBF24]" />
                ))}
              </div>
              <p className="text-[14px] text-gray-600 leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[13px] font-bold">{t.initials}</div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">{t.name}</p>
                  <p className="text-[12px] text-gray-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#F9FAFB] px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[30px] md:text-[36px] font-extrabold text-slate-900 text-center mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-500 text-[15px] text-center mb-12">Everything you need to know about Affilianze.</p>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="space-y-3"
          >
            {faqs.map((faq, i) => (
              <motion.div variants={fadeUp} key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="text-[15px] font-bold text-slate-900">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-6 pb-5 -mt-1"
                  >
                    <p className="text-[14px] text-gray-500 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 bg-[#1E3A8A] text-white text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto px-6"
        >
          <h2 className="text-[38px] md:text-[48px] font-extrabold mb-5 tracking-tight leading-tight">Ready to Start Earning?</h2>
          <p className="text-blue-100/70 mb-10 text-[17px] font-medium">Join thousands of successful users on Affilianze today</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup" className="bg-[#FBBF24] text-slate-900 px-10 py-4 rounded-full font-bold text-[16px] hover:bg-yellow-300 hover:scale-105 transition-all shadow-lg shadow-yellow-900/20">Sign Up for Free</Link>
            <Link to="/contact" className="bg-transparent border-2 border-white/30 text-white px-10 py-4 rounded-full font-bold text-[16px] hover:bg-white/10 hover:scale-105 transition-all">Contact Sales</Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}