import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { ArrowRight, Zap, BarChart3, ShieldCheck, Sparkles, Calendar, Brain } from 'lucide-react'
import { AuthRedirectGuard } from '@/app/components/AuthRedirectGuard'
import { LandingThemeToggle } from '@/app/components/LandingThemeToggle'
import { getTranslations } from 'next-intl/server'

export default async function Home() {
  const session = await auth()
  if (session?.user?.id) redirect('/dashboard')
  
  const t = await getTranslations('HomePage')

  const features = [
    { icon: Brain,       title: t('features.aiCaption.title'),    desc: t('features.aiCaption.desc'),    color: 'from-[#7C3AED] to-[#9333EA]' },
    { icon: Calendar,    title: t('features.autoPost.title'),     desc: t('features.autoPost.desc'), color: 'from-[#EC4899] to-[#F43F5E]' },
    { icon: BarChart3,   title: t('features.analytics.title'),    desc: t('features.analytics.desc'),         color: 'from-[#F97316] to-[#EAB308]' },
    { icon: Zap,         title: t('features.workflow.title'),      desc: t('features.workflow.desc'),             color: 'from-[#7C3AED] to-[#EC4899]' },
    { icon: Sparkles,    title: t('features.projects.title'),    desc: t('features.projects.desc'), color: 'from-[#EC4899] to-[#F97316]' },
    { icon: ShieldCheck, title: t('features.api.title'),      desc: t('features.api.desc'),                   color: 'from-[#7C3AED] to-[#F97316]' },
  ]

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-purple-900/30 text-black dark:text-white transition-colors duration-300 relative overflow-hidden">

      <AuthRedirectGuard />

      {/* ── Header ── */}
      <header className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Image src="/images/gravia_mark.png" alt="Gravia" width={40} height={32} />
          <span>
            <Image src="/images/gravia_text.png" alt="Gravia" width={69} height={39} />
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/signin" className="text-xs sm:text-sm font-bold text-muted-text/80 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors hidden sm:block">
            {t('signIn')}
          </Link>
          <Link href="/signup"
            className="px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all"
            style={{background:'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)'}}>
            {t('startFree')}
          </Link>
          <LandingThemeToggle />
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center max-w-5xl mx-auto py-10 sm:py-16 md:py-20">

        {/* Large logo */}
        <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Image src="/images/logo-icon.png" alt="Gravia" width={200} height={180} className="mx-auto drop-shadow-xl w-[140px] h-[126px] sm:w-[200px] sm:h-[180px]" />
        </div>

        
        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black leading-[1.08] mb-4 sm:mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <span className="text-black dark:text-white">{t('heroTitle1')}</span><br />
          <span className="bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F97316] bg-clip-text text-transparent">
            {t('heroTitle2')}
          </span>
        </h1>

        <p className="text-sm sm:text-lg md:text-xl text-muted-text dark:text-slate-400 mb-8 sm:mb-12 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
          {t('heroDesc')}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-12 sm:mb-20 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
          <Link href="/signup"
            className="group w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            style={{background:'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)', boxShadow:'0 8px 32px rgba(124,58,237,0.25)'}}>
            {t('startFree')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/signin"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg text-center text-foreground/80 border-2 border-slate-200 bg-card dark:bg-transparent dark:text-slate-300 dark:border-slate-800 transition-all hover:border-purple-500 hover:text-purple-600 dark:hover:border-purple-500/50 dark:hover:text-white">
            {t('signIn')}
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-left w-full animate-in fade-in duration-1000 delay-500">
          {features.map((f) => (
            <div key={f.title}
              className="group rounded-2xl border bg-card border-slate-200 dark:bg-white/5 dark:border-white/10 p-6 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-xl transition-all duration-300">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-black dark:text-white text-sm mb-2">{f.title}</h3>
              <p className="text-muted-text dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="py-8 sm:py-10 border-t border-slate-200 dark:border-white/10 text-center transition-colors px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image src="/images/gravia_mark.png" alt="Gravia" width={24} height={24} className="rounded-lg" />
          <span>
            <Image src="/images/gravia_text.png" alt="Gravia" width={45} height={40} />
          </span>
        </div>
        <p className="text-xs font-semibold text-muted-text dark:text-slate-400">{t('footerDesc')}</p>
        <div className="flex justify-center gap-4 mt-3 mb-2">
          <Link href="/terms" className="text-xs font-medium text-muted-text hover:text-black dark:text-slate-500 dark:hover:text-white transition-colors">{t('terms')}</Link>
          <Link href="/privacy" className="text-xs font-medium text-muted-text hover:text-black dark:text-slate-500 dark:hover:text-white transition-colors">{t('privacy')}</Link>
          <Link href="/data-deletion" className="text-xs font-medium text-muted-text hover:text-black dark:text-slate-500 dark:hover:text-white transition-colors">{t('dataDeletion')}</Link>
        </div>
        <p className="text-xs text-muted-text dark:text-slate-500 mt-1">{t('copyright')}</p>
      </footer>
    </div>
  )
}
